(function () {
  "use strict";

  const STORAGE_KEY = "pantry-chef-items-v1";
  const CATEGORIES = ["pantry", "freezer", "grocery"];

  /** @type {{id: string, name: string, category: string}[]} */
  let items = loadItems();
  let activeCategory = "pantry";

  const form = document.getElementById("add-item-form");
  const nameInput = document.getElementById("item-name");
  const categorySelect = document.getElementById("item-category");
  const itemListEl = document.getElementById("item-list");
  const emptyStateEl = document.getElementById("empty-state");
  const totalCountEl = document.getElementById("total-count");
  const tabs = document.querySelectorAll(".tab");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const generateBtn = document.getElementById("generate-btn");
  const strictToggle = document.getElementById("strict-toggle");
  const resultsEl = document.getElementById("recipe-results");

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function normalize(str) {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function addItem(name, category) {
    const clean = normalize(name);
    if (!clean) return;
    const exists = items.some(
      (it) => it.category === category && normalize(it.name) === clean
    );
    if (exists) return;
    items.push({ id: crypto.randomUUID(), name: clean, category });
    saveItems();
    render();
  }

  function removeItem(id) {
    items = items.filter((it) => it.id !== id);
    saveItems();
    render();
  }

  function clearAll() {
    if (items.length === 0) return;
    if (!confirm("Remove all items from every list? This can't be undone.")) return;
    items = [];
    saveItems();
    render();
    resultsEl.innerHTML = '<p class="placeholder">Add some items and click <strong>Find recipes</strong> to see what you can cook.</p>';
  }

  function render() {
    CATEGORIES.forEach((cat) => {
      const count = items.filter((it) => it.category === cat).length;
      document.getElementById("count-" + cat).textContent = String(count);
    });

    const visible = items.filter((it) => it.category === activeCategory);
    itemListEl.innerHTML = "";
    visible
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((it) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = it.name;
        const btn = document.createElement("button");
        btn.className = "item-remove";
        btn.setAttribute("aria-label", "Remove " + it.name);
        btn.textContent = "×";
        btn.addEventListener("click", () => removeItem(it.id));
        li.appendChild(span);
        li.appendChild(btn);
        itemListEl.appendChild(li);
      });

    emptyStateEl.style.display = visible.length === 0 ? "block" : "none";
    totalCountEl.textContent = items.length + " item" + (items.length === 1 ? "" : "s") + " total";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(nameInput.value, categorySelect.value);
    nameInput.value = "";
    nameInput.focus();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      activeCategory = tab.dataset.category;
      render();
    });
  });

  clearAllBtn.addEventListener("click", clearAll);

  // ---- Recipe matching ----

  function ingredientMatches(itemName, recipeIngredient) {
    const a = normalize(itemName);
    const b = normalize(recipeIngredient);
    return a === b || a.includes(b) || b.includes(a);
  }

  function scoreRecipe(recipe, haveItems) {
    const haveNames = haveItems.map((it) => it.name);
    let matched = [];
    let missing = [];

    recipe.ingredients.forEach((ing) => {
      const isStaple = PANTRY_STAPLES.some((s) => normalize(s) === normalize(ing));
      const found = haveNames.some((h) => ingredientMatches(h, ing));
      if (found || isStaple) {
        matched.push({ name: ing, assumed: !found && isStaple });
      } else {
        missing.push(ing);
      }
    });

    return {
      recipe,
      matched,
      missing,
      total: recipe.ingredients.length,
      matchedCount: matched.length,
      ratio: matched.length / recipe.ingredients.length
    };
  }

  function generateRecipes() {
    if (items.length === 0) {
      resultsEl.innerHTML = '<p class="placeholder">Add some items first, then click <strong>Find recipes</strong>.</p>';
      return;
    }

    const strict = strictToggle.checked;
    let scored = RECIPES.map((r) => scoreRecipe(r, items));

    scored = scored.filter((s) => s.matchedCount > 0 && (strict ? s.missing.length === 0 : true));
    scored.sort((a, b) => b.ratio - a.ratio || b.matchedCount - a.matchedCount);

    if (scored.length === 0) {
      resultsEl.innerHTML = strict
        ? '<p class="placeholder">No recipes match everything you have yet. Try unchecking &ldquo;only fully makeable&rdquo; or add a few more items.</p>'
        : '<p class="placeholder">No matches yet &mdash; try adding more pantry staples like rice, pasta, onion, or garlic.</p>';
      return;
    }

    resultsEl.innerHTML = "";
    scored.slice(0, 20).forEach((s) => resultsEl.appendChild(renderRecipeCard(s)));
  }

  function renderRecipeCard(s) {
    const card = document.createElement("article");
    card.className = "recipe-card";

    const isFull = s.missing.length === 0;
    const pct = Math.round(s.ratio * 100);

    card.innerHTML = `
      <div class="recipe-card__head">
        <h3>${escapeHtml(s.recipe.name)}</h3>
        <span class="recipe-card__match ${isFull ? "full" : "partial"}">
          ${isFull ? "You have everything" : pct + "% match"}
        </span>
      </div>
      <p class="recipe-card__meta">${escapeHtml(s.recipe.time)} &middot; serves ${s.recipe.servings} &middot; ${s.recipe.tags.map(escapeHtml).join(", ")}</p>
      <div class="recipe-card__ingredients"></div>
      <details>
        <summary>View instructions</summary>
        <ol></ol>
      </details>
    `;

    const ingredientsEl = card.querySelector(".recipe-card__ingredients");
    s.matched.forEach((m) => {
      const pill = document.createElement("span");
      pill.className = "pill have";
      pill.textContent = m.name + (m.assumed ? " (staple)" : "");
      ingredientsEl.appendChild(pill);
    });
    s.missing.forEach((name) => {
      const pill = document.createElement("span");
      pill.className = "pill missing";
      pill.textContent = name;
      ingredientsEl.appendChild(pill);
    });

    const ol = card.querySelector("ol");
    s.recipe.instructions.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      ol.appendChild(li);
    });

    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  generateBtn.addEventListener("click", generateRecipes);
  strictToggle.addEventListener("change", () => {
    if (resultsEl.querySelector(".recipe-card") || resultsEl.querySelector(".placeholder")) {
      generateRecipes();
    }
  });

  render();
})();
