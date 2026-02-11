// Category definitions (must match content.js)
const CATEGORIES = {
  promotedPosts: {
    id: "promotedPosts",
    label: "Promoted Posts",
    description: "Sponsored content in your feed",
    defaultEnabled: true,
  },
  suggestedPosts: {
    id: "suggestedPosts",
    label: "Suggested Posts",
    description: "Posts LinkedIn thinks you might like",
    defaultEnabled: true,
  },
  followRecommendations: {
    id: "followRecommendations",
    label: "Follow Suggestions",
    description: "People and companies to follow",
    defaultEnabled: true,
  },
  learningPromos: {
    id: "learningPromos",
    label: "LinkedIn Learning",
    description: "Course and learning promotions",
    defaultEnabled: true,
  },
  promotedMessages: {
    id: "promotedMessages",
    label: "Promoted Messages",
    description: "Sponsored messages in inbox",
    defaultEnabled: true,
  },
  newsAndGames: {
    id: "newsAndGames",
    label: "News & Games",
    description: "LinkedIn News and Today's Puzzle",
    defaultEnabled: true,
  },
  sidebarAds: {
    id: "sidebarAds",
    label: "Sidebar Ads",
    description: "Ad banners and sponsored sidebar content",
    defaultEnabled: true,
  },
  premiumUpsells: {
    id: "premiumUpsells",
    label: "Premium Upsells",
    description: "Try Premium and upgrade prompts",
    defaultEnabled: true,
  },
};

const masterToggle = document.getElementById("master-toggle");
const countEl = document.getElementById("count");
const categoriesList = document.getElementById("categories-list");

let categoryToggles = {};

function buildCategoryRows(categories) {
  for (const cat of Object.values(CATEGORIES)) {
    const enabled = categories[cat.id] !== false;

    const row = document.createElement("div");
    row.className = "category-row";
    row.dataset.category = cat.id;

    row.innerHTML = `
      <div class="category-info">
        <div class="category-label">${cat.label}</div>
        <div class="category-description">${cat.description}</div>
      </div>
      <label class="toggle">
        <input type="checkbox" data-category="${cat.id}" ${enabled ? "checked" : ""}>
        <span class="slider"></span>
      </label>
    `;

    categoriesList.appendChild(row);
    categoryToggles[cat.id] = row.querySelector("input");
  }
}

function updateCategoryRowsState(masterOn) {
  const rows = categoriesList.querySelectorAll(".category-row");
  for (const row of rows) {
    row.classList.toggle("disabled", !masterOn);
  }
}

// Load settings
chrome.storage.sync.get(["masterEnabled", "categories"], (sync) => {
  const masterOn = sync.masterEnabled !== false;
  masterToggle.checked = masterOn;

  const categories = sync.categories || {};
  buildCategoryRows(categories);
  updateCategoryRowsState(masterOn);
});

chrome.storage.local.get(["blockedCount"], (local) => {
  countEl.textContent = local.blockedCount || 0;
});

// Master toggle
masterToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ masterEnabled: masterToggle.checked });
  updateCategoryRowsState(masterToggle.checked);
});

// Category toggles
categoriesList.addEventListener("change", (e) => {
  if (e.target.dataset.category) {
    chrome.storage.sync.get(["categories"], (result) => {
      const categories = result.categories || {};
      categories[e.target.dataset.category] = e.target.checked;
      chrome.storage.sync.set({ categories });
    });
  }
});

// Live-update counter
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedCount) {
    countEl.textContent = changes.blockedCount.newValue || 0;
  }
});
