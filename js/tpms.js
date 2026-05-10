'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYRE_IDS = ['fl', 'fr', 'rl', 'rr'];

// Known BLE TPMS service/characteristic UUIDs (various manufacturers)
const BLE_PROFILES = {
  tpms_ble: {
    services: [
      0x180a, // Device Information
      'fbb0', // Common generic TPMS
      '00001816-0000-1000-8000-00805f9b34fb', // Cycling Speed (some sensors)
    ],
    name_filter: ['TPMS', 'Tyre', 'Tire', 'TP', 'ZEEPIN', 'FOBO'],
    char_uuid: '0000fbb2-0000-1000-8000-00805f9b34fb',
  },
  obd2: {
    services: ['fff0', '18f0', '0000fff0-0000-1000-8000-00805f9b34fb'],
    name_filter: ['OBD', 'ELM', 'OBDII', 'VEEPEAK', 'KONNWEI'],
    char_uuid: '0000fff1-0000-1000-8000-00805f9b34fb',
  },
};

// PSI conversion factors
const UNIT_FACTOR = { psi: 1, bar: 0.0689476, kpa: 6.89476 };
const UNIT_LABEL  = { psi: 'PSI', bar: 'BAR', kpa: 'kPa' };

// Pressure thresholds (PSI)
const THRESHOLD = { low: 26, critical: 20, high: 44 };

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  tyres: {
    fl: { pressure: null, temp: null, updated: null },
    fr: { pressure: null, temp: null, updated: null },
    rl: { pressure: null, temp: null, updated: null },
    rr: { pressure: null, temp: null, updated: null },
  },
  target: 32,       // PSI
  unit: 'psi',
  selected: null,
  demo: false,
  demoInterval: null,
  btDevice: null,
  btChar: null,
  protocol: 'tpms_ble',
  customServiceUuid: '',
  customCharUuid: '',
};

// ── Gauge Drawing ─────────────────────────────────────────────────────────────

function drawGauge(id, pressure, target, unit) {
  const canvas = document.getElementById(`gauge-${id}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r = W * 0.42;
  const startAngle = Math.PI * 0.75;
  const endAngle   = Math.PI * 2.25;
  const range      = endAngle - startAngle;

  ctx.clearRect(0, 0, W, H);

  // Track background
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  if (pressure !== null) {
    const maxPsi = 60;
    const frac = Math.min(1, Math.max(0, pressure / maxPsi));
    const colour = pressureColour(pressure, target);

    // Filled arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + frac * range);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = colour;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + frac * range);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Target tick
    const targetFrac  = Math.min(1, target / maxPsi);
    const tickAngle   = startAngle + targetFrac * range;
    const tickInner   = r - 10;
    const tickOuter   = r + 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(tickAngle) * tickInner, cy + Math.sin(tickAngle) * tickInner);
    ctx.lineTo(cx + Math.cos(tickAngle) * tickOuter, cy + Math.sin(tickAngle) * tickOuter);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
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
  if (psi === null)               return 'standby';
  if (psi <= THRESHOLD.critical)  return 'danger';
  if (psi <= THRESHOLD.low)       return 'warn';
  if (psi >= THRESHOLD.high)      return 'danger';
  return 'ok';
}

// ── UI Update ─────────────────────────────────────────────────────────────────

function convertPressure(psi) {
  return psi === null ? null : psi * UNIT_FACTOR[state.unit];
}

function formatPressure(psi) {
  const v = convertPressure(psi);
  if (v === null) return '--';
  return state.unit === 'psi' ? Math.round(v) : v.toFixed(2);
}

function updateUI() {
  let worstStatus = 'standby';
  let sum = 0, count = 0;
  const alerts = [];

  TYRE_IDS.forEach(id => {
    const t = state.tyres[id];
    const psi = t.pressure;
    const status = pressureStatus(psi);
    const display = formatPressure(psi);
    const unitLabel = UNIT_LABEL[state.unit];

    // Badge
    const badge = document.getElementById(`badge-${id}`);
    const bp    = document.getElementById(`bp-${id}`);
    if (badge && bp) {
      bp.textContent = display;
      badge.className = 'tyre-badge ' + (status !== 'standby' ? status : '');
      if (state.selected === id) badge.classList.add('selected');
    }

    // Card
    const card = document.getElementById(`card-${id}`);
    const ind  = document.getElementById(`ind-${id}`);
    if (card) {
      card.className = 'tyre-card ' + (status !== 'standby' ? status : '');
      if (state.selected === id) card.classList.add('selected');
    }
    if (ind) ind.className = 'tyre-indicator ' + (status !== 'standby' ? status : '');

    // Gauge value + unit
    const gv = document.getElementById(`gv-${id}`);
    const gu = document.getElementById(`gu-${id}`);
    if (gv) gv.textContent = display;
    if (gu) { gu.textContent = unitLabel; gv.style.color = psi !== null ? pressureColour(psi, state.target) : '#8b949e'; }

    // Gauge canvas
    drawGauge(id, psi, state.target, state.unit);

    // Temp & timestamp
    const tempEl = document.getElementById(`temp-${id}`);
    const tsEl   = document.getElementById(`ts-${id}`);
    if (tempEl) tempEl.textContent = t.temp !== null ? `${t.temp}°C` : '--°C';
    if (tsEl)   tsEl.textContent   = t.updated ? formatTime(t.updated) : '--';

    // Accumulate avg
    if (psi !== null) { sum += psi; count++; }

    // Worst status
    if (status === 'danger') worstStatus = 'danger';
    else if (status === 'warn' && worstStatus !== 'danger') worstStatus = 'warn';
    else if (status === 'ok'  && worstStatus === 'standby') worstStatus = 'ok';

    // Alerts
    if (status === 'danger') alerts.push(`${id.toUpperCase()}: ${psi <= THRESHOLD.critical ? 'CRITICAL LOW' : 'OVER'} pressure (${display} ${unitLabel})`);
    else if (status === 'warn') alerts.push(`${id.toUpperCase()}: Low pressure warning (${display} ${unitLabel})`);
  });

  // Avg pressure
  const avgEl = document.getElementById('avgPressure');
  if (avgEl) {
    if (count) {
      const avgPsi = sum / count;
      avgEl.innerHTML = `${formatPressure(avgPsi)} <small>${UNIT_LABEL[state.unit]}</small>`;
    } else {
      avgEl.innerHTML = `-- <small>${UNIT_LABEL[state.unit]}</small>`;
    }
  }

  // System status
  const sysEl = document.getElementById('systemStatus');
  if (sysEl) {
    const map = { standby: ['STANDBY', ''], ok: ['OK', 'status-ok'], warn: ['CAUTION', 'status-warn'], danger: ['ALERT', 'status-danger'] };
    const [label, cls] = map[worstStatus];
    sysEl.textContent = label;
    sysEl.className = 'stat-value ' + cls;
  }

  // Alert banner
  const banner = document.getElementById('alertBanner');
  if (alerts.length && banner) {
    const msg = document.getElementById('alertMessage');
    if (msg) msg.textContent = alerts.join(' | ');
    banner.style.display = 'flex';
    banner.className = worstStatus === 'danger' ? 'alert-banner' : 'alert-banner warning';
  } else if (banner && !alerts.length) {
    banner.style.display = 'none';
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Log ───────────────────────────────────────────────────────────────────────

function log(msg, type = 'info') {
  const logEl = document.getElementById('eventLog');
  if (!logEl) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${formatTime(new Date())}] ${msg}`;
  logEl.appendChild(entry);
  // keep max 200 entries
  while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
}

// ── Demo Mode ─────────────────────────────────────────────────────────────────

const DEMO_BASE = { fl: 32, fr: 31, rl: 30, rr: 32 };
const DEMO_TEMP = { fl: 22, fr: 23, rl: 21, rr: 22 };

function startDemo() {
  // Seed initial values
  TYRE_IDS.forEach(id => {
    state.tyres[id].pressure = DEMO_BASE[id] + (Math.random() - 0.5) * 2;
    state.tyres[id].temp     = DEMO_TEMP[id] + Math.random() * 3;
    state.tyres[id].updated  = new Date();
  });

  state.demoInterval = setInterval(() => {
    TYRE_IDS.forEach(id => {
      // Slowly drift pressure, with small noise
      const drift = (Math.random() - 0.505) * 0.15;
      state.tyres[id].pressure = Math.max(5, Math.min(55, state.tyres[id].pressure + drift));
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

// ── Bluetooth ─────────────────────────────────────────────────────────────────

async function connectBluetooth() {
  if (!navigator.bluetooth) {
    log('Web Bluetooth not supported in this browser. Use Chrome/Edge.', 'danger');
    document.getElementById('scanStatus').textContent = 'Web Bluetooth not supported. Use Chrome or Edge.';
    return;
  }

  const profile = state.protocol === 'custom' ? null : BLE_PROFILES[state.protocol];
  const scanStatus = document.getElementById('scanStatus');
  scanStatus.textContent = 'Opening device picker…';

  try {
    setConnectionState('connecting');

    // Build requestDevice options
    const filters = [];
    const optionalServices = [];

    if (profile) {
      profile.name_filter.forEach(name => filters.push({ namePrefix: name }));
      profile.services.forEach(s => {
        optionalServices.push(typeof s === 'number' ? s : s);
      });
    } else {
      // Custom UUID
      const svc = document.getElementById('customServiceUuid').value.trim();
      if (svc) {
        filters.push({ services: [svc] });
        optionalServices.push(svc);
      }
    }

    // Accept any device name containing common TPMS keywords
    const requestOptions = {
      filters: filters.length ? filters : [{ namePrefix: 'TPMS' }, { namePrefix: 'Tire' }, { namePrefix: 'Tyre' }],
      optionalServices,
    };

    log('Requesting Bluetooth device…', 'bt');
    const device = await navigator.bluetooth.requestDevice(requestOptions);
    state.btDevice = device;

    device.addEventListener('gattserverdisconnected', onDisconnected);

    scanStatus.textContent = `Connecting to ${device.name || 'device'}…`;
    log(`Connecting to: ${device.name || device.id}`, 'bt');

    const server = await device.gatt.connect();
    log('GATT connected', 'bt');

    const charUuid = state.protocol === 'custom'
      ? document.getElementById('customCharUuid').value.trim()
      : profile.char_uuid;

    // Try known service UUIDs
    let char = null;
    const serviceList = profile ? profile.services : [document.getElementById('customServiceUuid').value.trim()];

    for (const svcUuid of serviceList) {
      try {
        const svc = await server.getPrimaryService(svcUuid);
        char = await svc.getCharacteristic(charUuid);
        break;
      } catch (_) { /* try next */ }
    }

    if (!char) {
      // Fallback: enumerate all services
      log('Enumerating all services…', 'bt');
      const services = await server.getPrimaryServices();
      for (const svc of services) {
        try {
          const chars = await svc.getCharacteristics();
          if (chars.length) { char = chars[0]; break; }
        } catch (_) { /* skip */ }
      }
    }

    if (!char) throw new Error('No readable characteristic found');

    state.btChar = char;
    char.addEventListener('characteristicvaluechanged', onCharValue);
    await char.startNotifications();

    setConnectionState('connected', device.name || device.id);
    scanStatus.textContent = `Connected to ${device.name || device.id}`;
    log(`Connected & notifications active — characteristic ${char.uuid}`, 'bt');
    closeBtModal();

  } catch (err) {
    setConnectionState('disconnected');
    const msg = err.message || String(err);
    scanStatus.textContent = `Failed: ${msg}`;
    log(`Bluetooth error: ${msg}`, 'danger');
  }
}

function onCharValue(event) {
  const value = event.target.value; // DataView
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
  } catch (e) {
    log(`Parse error: ${e.message}`, 'warning');
  }
}

// Generic TPMS BLE packet parser.
// Packet layout varies — this covers common 8-byte formats.
function parseTPMSPacket(dv) {
  const len = dv.byteLength;
  if (len < 4) return null;

  const results = [];

  // Format A: 4 wheels × 8 bytes = 32 bytes (some generic sensors)
  if (len >= 32) {
    const labels = ['fl', 'fr', 'rl', 'rr'];
    for (let i = 0; i < 4; i++) {
      const off = i * 8;
      const rawPressure = dv.getUint32(off + 2, false) / 1000; // kPa → kPa
      const psi         = rawPressure * 0.14504;
      const tempRaw     = dv.getInt16(off + 6, false) / 10;
      results.push({ id: labels[i], pressure: psi, temp: tempRaw });
    }
    return results;
  }

  // Format B: single wheel packet, wheel ID in byte 1
  if (len >= 8) {
    const wheelId = dv.getUint8(1) & 0x03;
    const labels  = ['fl', 'fr', 'rl', 'rr'];
    const rawPressure = dv.getUint16(2, false);
    const psi = rawPressure * 0.1450377; // kPa * 10 to PSI
    const temp = dv.getInt8(4);
    results.push({ id: labels[wheelId], pressure: psi, temp });
    return results;
  }

  return null;
}

function onDisconnected() {
  state.btChar  = null;
  state.btDevice = null;
  setConnectionState('disconnected');
  log('Bluetooth device disconnected', 'warning');
  updateUI();
}

async function disconnectBluetooth() {
  if (state.btDevice && state.btDevice.gatt.connected) {
    state.btDevice.gatt.disconnect();
  }
  onDisconnected();
}

// ── Connection State ──────────────────────────────────────────────────────────

function setConnectionState(s, deviceName = '') {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const btn  = document.getElementById('bluetoothBtn');
  dot.className  = `status-dot ${s}`;
  const labels   = { disconnected: 'Disconnected', connecting: 'Connecting…', connected: `Connected: ${deviceName}`, demo: 'Demo Mode' };
  if (text) text.textContent = labels[s] || s;
  if (btn)  btn.textContent  = s === 'connected' ? 'Disconnect' : 'Connect';
}

// ── Public API (called from HTML) ─────────────────────────────────────────────

const tpms = {
  toggleBluetooth() {
    if (state.btDevice && state.btDevice.gatt.connected) {
      disconnectBluetooth();
    } else {
      openBtModal();
    }
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

  selectTyre(id) {
    state.selected = state.selected === id ? null : id;
    updateUI();
  },

  setTarget(val) {
    const v = parseFloat(val);
    if (!isNaN(v) && v > 0) {
      state.target = v;
      updateUI();
      log(`Target pressure set to ${v} PSI`, 'info');
    }
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
    const customRow = document.getElementById('customUuidRow');
    if (customRow) customRow.style.display = val === 'custom' ? 'block' : 'none';
  },

  startBluetoothScan() { connectBluetooth(); },

  closeBtModal() { closeBtModal(); },

  clearLog() {
    const logEl = document.getElementById('eventLog');
    if (logEl) logEl.innerHTML = '';
  },
};

function openBtModal()  { document.getElementById('btModal').style.display = 'flex'; }
function closeBtModal() { document.getElementById('btModal').style.display = 'none'; }

// Close modal on overlay click
document.getElementById('btModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeBtModal();
});

// ── Init ──────────────────────────────────────────────────────────────────────

updateUI();
log(`TPMS Dashboard v1.0 ready | ${navigator.bluetooth ? 'Web Bluetooth supported' : 'Web Bluetooth not available — use Demo Mode'}`, 'info');
