const toggle = document.getElementById("toggle");
const countEl = document.getElementById("count");

// Load current state
chrome.storage.local.get(["enabled", "blockedCount"], (result) => {
  toggle.checked = result.enabled !== false;
  countEl.textContent = result.blockedCount || 0;
});

// Toggle handler
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});

// Live-update counter
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedCount) {
    countEl.textContent = changes.blockedCount.newValue || 0;
  }
});
