(() => {
  "use strict";

  // Multi-language "Promoted" labels
  const PROMOTED_LABELS = [
    "promoted",
    "gesponsord",
    "sponsorisé",
    "promocionado",
    "gesponsert",
    "promosso",
    "promovido",
    "プロモーション",
    "推广",
  ];

  const SUGGESTED_LABELS = ["suggested", "voorgesteld", "suggéré", "sugerido"];

  let enabled = true;
  let blockedCount = 0;

  // Feed post container selectors (try multiple, LinkedIn changes these)
  const FEED_POST_SELECTORS = [
    ".feed-shared-update-v2",
    ".occludable-update",
    '[data-urn^="urn:li:activity"]',
  ];

  function isPromotedText(text) {
    const lower = text.trim().toLowerCase();
    return PROMOTED_LABELS.includes(lower);
  }

  function isSuggestedText(text) {
    const lower = text.trim().toLowerCase();
    return SUGGESTED_LABELS.includes(lower);
  }

  function findFeedPostParent(el) {
    let current = el;
    while (current && current !== document.body) {
      for (const selector of FEED_POST_SELECTORS) {
        if (current.matches(selector)) return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function hideElement(el) {
    if (el && !el.classList.contains("linkedin-ad-blocker-hidden")) {
      el.classList.add("linkedin-ad-blocker-hidden");
      blockedCount++;
      chrome.storage.local.set({ blockedCount });
    }
  }

  function showElement(el) {
    if (el && el.classList.contains("linkedin-ad-blocker-hidden")) {
      el.classList.remove("linkedin-ad-blocker-hidden");
    }
  }

  function scanForAds(root) {
    if (!enabled) return;

    // 1. Find promoted posts via sub-description text
    const subDescriptions = root.querySelectorAll(
      ".feed-shared-actor__sub-description, .update-components-actor__sub-description"
    );
    for (const desc of subDescriptions) {
      const text = desc.textContent || "";
      if (isPromotedText(text)) {
        const post = findFeedPostParent(desc);
        if (post) hideElement(post);
      }
    }

    // 2. Find promoted posts via visually hidden "Promoted" spans
    const hiddenSpans = root.querySelectorAll(
      'span.visually-hidden, span[aria-hidden="false"]'
    );
    for (const span of hiddenSpans) {
      const text = span.textContent || "";
      if (isPromotedText(text)) {
        const post = findFeedPostParent(span);
        if (post) hideElement(post);
      }
    }

    // 3. Find "Suggested" posts
    const allSpans = root.querySelectorAll("span");
    for (const span of allSpans) {
      const text = span.textContent || "";
      if (isSuggestedText(text)) {
        // Check if it's a feed label (not just any span with that text)
        const parent = span.closest(
          ".feed-shared-actor__sub-description, .update-components-actor__sub-description, .feed-shared-header"
        );
        if (parent) {
          const post = findFeedPostParent(span);
          if (post) hideElement(post);
        }
      }
    }

    // 4. Find "Follow" recommendation cards in feed
    const followModules = root.querySelectorAll(
      '.feed-follows-module, [data-view-name="feed-follows-module"], .people-follow-recommend'
    );
    for (const mod of followModules) {
      hideElement(mod);
    }

    // 5. LinkedIn Learning promos in feed
    const learningCards = root.querySelectorAll(
      ".feed-shared-learning-card, .learning-top-course-card"
    );
    for (const card of learningCards) {
      const post = findFeedPostParent(card) || card;
      hideElement(post);
    }

    // 6. "Add to your feed" suggestions
    const addToFeed = root.querySelectorAll(
      '.feed-shared-news-module, [data-view-name="feed-news-module"]'
    );
    for (const mod of addToFeed) {
      // Only hide if it contains "Add to your feed" type content
      if (
        mod.textContent &&
        /add to your feed|toevoegen aan je feed/i.test(mod.textContent)
      ) {
        hideElement(mod);
      }
    }
  }

  function showAllHidden() {
    const hidden = document.querySelectorAll(".linkedin-ad-blocker-hidden");
    for (const el of hidden) {
      showElement(el);
    }
  }

  // Debounced scan
  let scanTimeout = null;
  function debouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => scanForAds(document.body), 100);
  }

  // MutationObserver
  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;

    let hasNewNodes = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasNewNodes = true;
        break;
      }
    }

    if (hasNewNodes) {
      debouncedScan();
    }
  });

  // Initialize
  function init() {
    chrome.storage.local.get(["enabled", "blockedCount"], (result) => {
      enabled = result.enabled !== false; // default: true
      blockedCount = result.blockedCount || 0;

      if (enabled) {
        // Initial scan once DOM is ready
        if (
          document.readyState === "complete" ||
          document.readyState === "interactive"
        ) {
          scanForAds(document.body);
        } else {
          document.addEventListener("DOMContentLoaded", () =>
            scanForAds(document.body)
          );
        }
      }

      // Start observing
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });
    });

    // Listen for toggle changes from popup
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled) {
        enabled = changes.enabled.newValue;
        if (enabled) {
          scanForAds(document.body);
        } else {
          showAllHidden();
        }
      }
    });
  }

  // Wait for body to exist
  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
