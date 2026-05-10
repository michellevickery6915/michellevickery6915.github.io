'use strict';

const TYRE_IDS = ['fl', 'fr', 'rl', 'rr'];

const BLE_PROFILES = {
  tpms_ble: {
    services: [0x180a, 'fbb0', '00001816-0000-1000-8000-00805f9b34fb'],
    name_filter: ['TPMS', 'Tyre', 'Tire', 'TP', 'ZEEPIN', 'FOBO'],
    char_uuid: '0000fbb2-0000-1000-8000-00805f9b34fb',
  },
  obd2: {
    services: ['fff0', '18f0', '0000fff0-0000-1000-8000-00805f9b34fb'],
    name_filter: ['OBD', 'ELM', 'OBDII', 'VEEPEAK', 'KONNWEI'],
    char_uuid: '0000fff1-0000-1000-8000-00805f9b34fb',
  },
};

const UNIT_FACTOR = { psi: 1, bar: 0.0689476, kpa: 6.89476 };
const UNIT_LABEL  = { psi: 'PSI', bar: 'BAR', kpa: 'kPa' };
const THRESHOLD = { low: 26, critical: 20, high: 44 };

const state = {
  tyres: {
    fl: { pressure: null, temp: null, updated: null },
    fr: { pressure: null, temp: null, updated: null },
    rl: { pressure: null, temp: null, updated: null },
    rr: { pressure: null, temp: null, updated: null },
  },
  target: 32,
  unit: 'psi',
  selected: null,
  demo: false,
  demoInterval: null,
  btDevice: null,
  btChar: null,
  protocol: 'tpms_ble',
};

function drawGauge(id, pressure, target) {
  const canvas = document.getElementById(`gauge-${id}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, r = W * 0.42;
  const startAngle = Math.PI * 0.75, endAngle = Math.PI * 2.25;
  const range = endAngle - startAngle;

  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();

  if (pressure !== null) {
    const frac = Math.min(1, Math.max(0, pressure / 60));
    const colour = pressureColour(pressure, target);
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + frac * range);
    ctx.strokeStyle = colour; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
    ctx.shadowBlur = 12; ctx.shadowColor = colour;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + frac * range);
    ctx.strokeStyle = colour; ctx.lineWidth = 10; ctx.stroke();
    ctx.shadowBlur = 0;
    const tf = Math.min(1, target / 60);
    const ta = startAngle + tf * range;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ta) * (r - 10), cy + Math.sin(ta) * (r - 10));
    ctx.lineTo(cx + Math.cos(ta) * (r + 2),  cy + Math.sin(ta) * (r + 2));
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
  }
}

function pressureColour(psi, target) {
  if (psi <= THRESHOLD.critical) return '#f87171';
  if (psi <= THRESHOLD.low)      return '#fbbf24';
  if (psi >= THRESHOLD.high)     return '#f87171';
  if (Math.abs(psi - target) <= 2) return '#4ade80';
  return '#38bdf8';
}

function pressureStatus(psi) {
  if (psi === null)              return 'standby';
  if (psi <= THRESHOLD.critical) return 'danger';
  if (psi <= THRESHOLD.low)      return 'warn';
  if (psi >= THRESHOLD.high)     return 'danger';
  return 'ok';
}

function formatPressure(psi) {
  if (psi === null) return '--';
  const v = psi * UNIT_FACTOR[state.unit];
  return state.unit === 'psi' ? Math.round(v) : v.toFixed(2);
}

function updateUI() {
  let worstStatus = 'standby', sum = 0, count = 0;
  const alerts = [];

  TYRE_IDS.forEach(id => {
    const t = state.tyres[id];
    const psi = t.pressure;
    const status = pressureStatus(psi);
    const display = formatPressure(psi);
    const unitLabel = UNIT_LABEL[state.unit];

    const bp = document.getElementById(`bp-${id}`);
    const badge = document.getElementById(`badge-${id}`);
    if (bp) bp.textContent = display;
    if (badge) {
      badge.className = 'tyre-badge ' + (status !== 'standby' ? status : '');
      if (state.selected === id) badge.classList.add('selected');
    }

    const card = document.getElementById(`card-${id}`);
    const ind  = document.getElementById(`ind-${id}`);
    if (card) {
      card.className = 'tyre-card ' + (status !== 'standby' ? status : '');
      if (state.selected === id) card.classList.add('selected');
    }
    if (ind) ind.className = 'tyre-indicator ' + (status !== 'standby' ? status : '');

    const gv = document.getElementById(`gv-${id}`);
    const gu = document.getElementById(`gu-${id}`);
    if (gv) { gv.textContent = display; gv.style.color = psi !== null ? pressureColour(psi, state.target) : '#8b949e'; }
    if (gu) gu.textContent = unitLabel;

    drawGauge(id, psi, state.target);

    const tempEl = document.getElementById(`temp-${id}`);
    const tsEl   = document.getElementById(`ts-${id}`);
    if (tempEl) tempEl.textContent = t.temp !== null ? `${Math.round(t.temp * 10) / 10}°C` : '--°C';
    if (tsEl)   tsEl.textContent   = t.updated ? formatTime(t.updated) : '--';

    if (psi !== null) { sum += psi; count++; }

    if (status === 'danger') worstStatus = 'danger';
    else if (status === 'warn' && worstStatus !== 'danger') worstStatus = 'warn';
    else if (status === 'ok'  && worstStatus === 'standby') worstStatus = 'ok';

    if (status === 'danger') alerts.push(`${id.toUpperCase()}: ${psi <= THRESHOLD.critical ? 'CRITICAL LOW' : 'OVER'} pressure (${display} ${unitLabel})`);
    else if (status === 'warn') alerts.push(`${id.toUpperCase()}: Low pressure warning (${display} ${unitLabel})`);
  });

  const avgEl = document.getElementById('avgPressure');
  if (avgEl) avgEl.innerHTML = count ? `${formatPressure(sum / count)} <small>${UNIT_LABEL[state.unit]}</small>` : `-- <small>${UNIT_LABEL[state.unit]}</small>`;

  const sysEl = document.getElementById('systemStatus');
  if (sysEl) {
    const map = { standby: ['STANDBY', ''], ok: ['OK', 'status-ok'], warn: ['CAUTION', 'status-warn'], danger: ['ALERT', 'status-danger'] };
    const [label, cls] = map[worstStatus];
    sysEl.textContent = label;
    sysEl.className = 'stat-value ' + cls;
  }

  const banner = document.getElementById('alertBanner');
  if (alerts.length && banner) {
    const msg = document.getElementById('alertMessage');
    if (msg) msg.textContent = alerts.join(' | ');
    banner.style.display = 'flex';
    banner.className = worstStatus === 'danger' ? 'alert-banner' : 'alert-banner warning';
  } else if (banner) {
    banner.style.display = 'none';
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function log(msg, type = 'info') {
  const logEl = document.getElementById('eventLog');
  if (!logEl) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${formatTime(new Date())}] ${msg}`;
  logEl.appendChild(entry);
  while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
}

const DEMO_BASE = { fl: 32, fr: 31, rl: 30, rr: 32 };
const DEMO_TEMP = { fl: 22, fr: 23, rl: 21, rr: 22 };

function startDemo() {
  TYRE_IDS.forEach(id => {
    state.tyres[id].pressure = DEMO_BASE[id] + (Math.random() - 0.5) * 2;
    state.tyres[id].temp     = DEMO_TEMP[id] + Math.random() * 3;
    state.tyres[id].updated  = new Date();
  });
  state.demoInterval = setInterval(() => {
    TYRE_IDS.forEach(id => {
      state.tyres[id].pressure = Math.max(5, Math.min(55, state.tyres[id].pressure + (Math.random() - 0.505) * 0.15));
      state.tyres[id].temp     = Math.max(10, Math.min(80, state.tyres[id].temp + (Math.random() - 0.5) * 0.5));
      state.tyres[id].updated  = new Date();
    });
    updateUI();
  }, 1500);
  updateUI();
  log('Demo mode active — simulating live tyre sensor data', 'bt');
}

function stopDemo() {
  if (state.demoInterval) { clearInterval(state.demoInterval); state.demoInterval = null; }
  TYRE_IDS.forEach(id => { state.tyres[id].pressure = null; state.tyres[id].temp = null; state.tyres[id].updated = null; });
  updateUI();
  log('Demo mode stopped', 'info');
}

async function connectBluetooth() {
  if (!navigator.bluetooth) {
    log('Web Bluetooth not supported. Use Chrome or Edge.', 'danger');
    document.getElementById('scanStatus').textContent = 'Web Bluetooth not supported. Use Chrome or Edge.';
    return;
  }
  const profile = state.protocol === 'custom' ? null : BLE_PROFILES[state.protocol];
  const scanStatus = document.getElementById('scanStatus');
  scanStatus.textContent = 'Opening device picker…';
  try {
    setConnectionState('connecting');
    const filters = [];
    const optionalServices = [];
    if (profile) {
      profile.name_filter.forEach(n => filters.push({ namePrefix: n }));
      profile.services.forEach(s => optionalServices.push(s));
    } else {
      const svc = document.getElementById('customServiceUuid').value.trim();
      if (svc) { filters.push({ services: [svc] }); optionalServices.push(svc); }
    }
    const device = await navigator.bluetooth.requestDevice({
      filters: filters.length ? filters : [{ namePrefix: 'TPMS' }, { namePrefix: 'Tire' }, { namePrefix: 'Tyre' }],
      optionalServices,
    });
    state.btDevice = device;
    device.addEventListener('gattserverdisconnected', onDisconnected);
    scanStatus.textContent = `Connecting to ${device.name || 'device'}…`;
    log(`Connecting to: ${device.name || device.id}`, 'bt');
    const server = await device.gatt.connect();
    log('GATT connected', 'bt');
    const charUuid = state.protocol === 'custom'
      ? document.getElementById('customCharUuid').value.trim()
      : profile.char_uuid;
    let char = null;
    const serviceList = profile ? profile.services : [document.getElementById('customServiceUuid').value.trim()];
    for (const svcUuid of serviceList) {
      try { const svc = await server.getPrimaryService(svcUuid); char = await svc.getCharacteristic(charUuid); break; } catch (_) {}
    }
    if (!char) {
      log('Enumerating all services…', 'bt');
      const services = await server.getPrimaryServices();
      for (const svc of services) {
        try { const chars = await svc.getCharacteristics(); if (chars.length) { char = chars[0]; break; } } catch (_) {}
      }
    }
    if (!char) throw new Error('No readable characteristic found');
    state.btChar = char;
    char.addEventListener('characteristicvaluechanged', onCharValue);
    await char.startNotifications();
    setConnectionState('connected', device.name || device.id);
    scanStatus.textContent = `Connected to ${device.name || device.id}`;
    log(`Connected — characteristic ${char.uuid}`, 'bt');
    closeBtModal();
  } catch (err) {
    setConnectionState('disconnected');
    const msg = err.message || String(err);
    scanStatus.textContent = `Failed: ${msg}`;
    log(`Bluetooth error: ${msg}`, 'danger');
  }
}

function onCharValue(event) {
  const value = event.target.value;
  try {
    const parsed = parseTPMSPacket(value);
    if (parsed) {
      parsed.forEach(({ id, pressure, temp }) => {
        if (!TYRE_IDS.includes(id)) return;
        state.tyres[id].pressure = pressure;
        state.tyres[id].temp     = temp;
        state.tyres[id].updated  = new Date();
      });
      updateUI();
    }
  } catch (e) { log(`Parse error: ${e.message}`, 'warning'); }
}

function parseTPMSPacket(dv) {
  const len = dv.byteLength;
  if (len < 4) return null;
  if (len >= 32) {
    const labels = ['fl', 'fr', 'rl', 'rr'];
    return labels.map((id, i) => ({
      id,
      pressure: (dv.getUint32(i * 8 + 2, false) / 1000) * 0.14504,
      temp: dv.getInt16(i * 8 + 6, false) / 10,
    }));
  }
  if (len >= 8) {
    const wheelId = dv.getUint8(1) & 0x03;
    return [{ id: ['fl','fr','rl','rr'][wheelId], pressure: dv.getUint16(2, false) * 0.1450377, temp: dv.getInt8(4) }];
  }
  return null;
}

function onDisconnected() {
  state.btChar = null; state.btDevice = null;
  setConnectionState('disconnected');
  log('Bluetooth device disconnected', 'warning');
  updateUI();
}

async function disconnectBluetooth() {
  if (state.btDevice?.gatt.connected) state.btDevice.gatt.disconnect();
  onDisconnected();
}

function setConnectionState(s, deviceName = '') {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const btn  = document.getElementById('bluetoothBtn');
  if (dot)  dot.className  = `status-dot ${s}`;
  const labels = { disconnected: 'Disconnected', connecting: 'Connecting…', connected: `Connected: ${deviceName}`, demo: 'Demo Mode' };
  if (text) text.textContent = labels[s] || s;
  if (btn)  btn.textContent  = s === 'connected' ? 'Disconnect' : 'Connect';
}

const tpms = {
  toggleBluetooth() {
    if (state.btDevice?.gatt.connected) disconnectBluetooth();
    else openBtModal();
  },
  toggleDemo() {
    if (state.demo) {
      state.demo = false;
      stopDemo();
      setConnectionState('disconnected');
      document.getElementById('demoBtn').classList.remove('active');
    } else {
      if (state.btDevice?.gatt.connected) disconnectBluetooth();
      state.demo = true;
      setConnectionState('demo');
      document.getElementById('demoBtn').classList.add('active');
      startDemo();
    }
  },
  selectTyre(id) { state.selected = state.selected === id ? null : id; updateUI(); },
  setTarget(val) {
    const v = parseFloat(val);
    if (!isNaN(v) && v > 0) { state.target = v; updateUI(); log(`Target pressure set to ${v} PSI`, 'info'); }
  },
  setUnit(unit) {
    state.unit = unit;
    ['psi', 'bar', 'kpa'].forEach(u => {
      const btn = document.getElementById(`unit${u.charAt(0).toUpperCase() + u.slice(1)}`);
      if (btn) btn.className = 'unit-btn' + (u === unit ? ' active' : '');
    });
    updateUI();
  },
  setProtocol(val) {
    state.protocol = val;
    const row = document.getElementById('customUuidRow');
    if (row) row.style.display = val === 'custom' ? 'block' : 'none';
  },
  startBluetoothScan() { connectBluetooth(); },
  closeBtModal() { closeBtModal(); },
  clearLog() { const el = document.getElementById('eventLog'); if (el) el.innerHTML = ''; },
};

function openBtModal()  { document.getElementById('btModal').style.display = 'flex'; }
function closeBtModal() { document.getElementById('btModal').style.display = 'none'; }

document.getElementById('btModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeBtModal(); });

updateUI();
log(`TPMS Dashboard v1.0 ready | ${navigator.bluetooth ? 'Web Bluetooth supported' : 'Web Bluetooth not available — use Demo Mode'}`, 'info');