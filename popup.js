// SYNC: CATEGORIES must match content.js — update both files together
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
  promotedJobs: {
    id: "promotedJobs",
    label: "Promoted Jobs",
    description: "Sponsored job listings on the Jobs page",
    defaultEnabled: false,
  },
};

const masterToggle = document.getElementById("master-toggle");
const countEl = document.getElementById("count");
const categoriesList = document.getElementById("categories-list");

function buildCategoryRows(categories) {
  for (const cat of Object.values(CATEGORIES)) {
    const enabled =
      cat.id in categories ? categories[cat.id] : cat.defaultEnabled !== false;

    const row = document.createElement("div");
    row.className = "category-row";
    row.dataset.category = cat.id;

    const info = document.createElement("div");
    info.className = "category-info";

    const labelEl = document.createElement("div");
    labelEl.className = "category-label";
    labelEl.textContent = cat.label;

    const descEl = document.createElement("div");
    descEl.className = "category-description";
    descEl.textContent = cat.description;

    info.appendChild(labelEl);
    info.appendChild(descEl);

    const toggle = document.createElement("label");
    toggle.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.category = cat.id;
    input.checked = enabled;

    const slider = document.createElement("span");
    slider.className = "slider";

    toggle.appendChild(input);
    toggle.appendChild(slider);

    row.appendChild(info);
    row.appendChild(toggle);

    categoriesList.appendChild(row);
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
