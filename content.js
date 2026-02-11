(() => {
  "use strict";

  // --- Category Definitions ---

  const CATEGORIES = {
    promotedPosts: {
      id: "promotedPosts",
      label: "Promoted Posts",
      description: "Sponsored content in your feed",
      defaultEnabled: true,
      type: "dynamic",
    },
    suggestedPosts: {
      id: "suggestedPosts",
      label: "Suggested Posts",
      description: "Posts LinkedIn thinks you might like",
      defaultEnabled: true,
      type: "dynamic",
    },
    followRecommendations: {
      id: "followRecommendations",
      label: "Follow Suggestions",
      description: "People and companies to follow",
      defaultEnabled: true,
      type: "dynamic",
    },
    learningPromos: {
      id: "learningPromos",
      label: "LinkedIn Learning",
      description: "Course and learning promotions",
      defaultEnabled: true,
      type: "dynamic",
    },
    promotedMessages: {
      id: "promotedMessages",
      label: "Promoted Messages",
      description: "Sponsored messages in inbox",
      defaultEnabled: true,
      type: "dynamic",
    },
    newsAndGames: {
      id: "newsAndGames",
      label: "News & Games",
      description: "LinkedIn News and Today's Puzzle",
      defaultEnabled: true,
      type: "dynamic",
    },
    sidebarAds: {
      id: "sidebarAds",
      label: "Sidebar Ads",
      description: "Ad banners and sponsored sidebar content",
      defaultEnabled: true,
      type: "css",
    },
    premiumUpsells: {
      id: "premiumUpsells",
      label: "Premium Upsells",
      description: "Try Premium and upgrade prompts",
      defaultEnabled: true,
      type: "css",
    },
  };

  // --- Locale Labels ---

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

  const SUGGESTED_LABELS = [
    "suggested",
    "voorgesteld",
    "suggéré",
    "sugerido",
  ];

  const PROMOTED_MSG_LABELS = [
    "linkedin offer",
    "linkedin-aanbieding",
    "offre linkedin",
    "oferta de linkedin",
    "linkedin-angebot",
    "sponsored",
    "gesponsord",
    "sponsorisé",
  ];

  // --- CSS Rules for CSS-type categories ---

  const CSS_RULES = {
    sidebarAds: `
      .ad-banner-container,
      .ad-banner,
      .ads-container,
      #topTextAd,
      .right-rail-upsell,
      .right-rail-sponsored,
      .msg-sponsored-content,
      .sponsored-message-indicator,
      #pymk-container,
      aside[data-view-name="feed-right-rail"] .feed-follows-module,
      #jobsForYou,
      #companiesForYou,
      #groupsForYou,
      .learning-top-course-card,
      .feed-shared-learning-card {
        display: none !important;
      }
    `,
    premiumUpsells: `
      .premium-upsell-link,
      .nav-item__try-premium,
      .premium-upsell,
      .artdeco-card .premium-upsell-link,
      .upsell,
      .wvmp-upsell,
      #insights-upsell,
      a[href*="premium/products"],
      a[href*="/ads/"],
      a[href*="/ad/start/"],
      a[href*="linkedin.com/advertising"] {
        display: none !important;
      }
    `,
  };

  // --- State ---

  let masterEnabled = true;
  let categorySettings = {};
  let blockedCount = 0;

  // --- Feed Post Helpers ---

  const FEED_POST_SELECTORS = [
    ".feed-shared-update-v2",
    ".occludable-update",
    '[data-urn^="urn:li:activity"]',
  ];

  function isPromotedText(text) {
    return PROMOTED_LABELS.includes(text.trim().toLowerCase());
  }

  function isSuggestedText(text) {
    return SUGGESTED_LABELS.includes(text.trim().toLowerCase());
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
    if (el && !el.classList.contains("linkedin-clean-feed-hidden")) {
      el.classList.add("linkedin-clean-feed-hidden");
      blockedCount++;
      chrome.storage.local.set({ blockedCount });
    }
  }

  function showElement(el) {
    if (el && el.classList.contains("linkedin-clean-feed-hidden")) {
      el.classList.remove("linkedin-clean-feed-hidden");
    }
  }

  // --- Category Scan Functions ---

  function scanPromotedPosts(root) {
    // Via sub-description text
    const subDescriptions = root.querySelectorAll(
      ".feed-shared-actor__sub-description, .update-components-actor__sub-description"
    );
    for (const desc of subDescriptions) {
      if (isPromotedText(desc.textContent || "")) {
        const post = findFeedPostParent(desc);
        if (post) hideElement(post);
      }
    }

    // Via visually hidden spans
    const hiddenSpans = root.querySelectorAll(
      'span.visually-hidden, span[aria-hidden="false"]'
    );
    for (const span of hiddenSpans) {
      if (isPromotedText(span.textContent || "")) {
        const post = findFeedPostParent(span);
        if (post) hideElement(post);
      }
    }
  }

  function scanSuggestedPosts(root) {
    const allSpans = root.querySelectorAll("span");
    for (const span of allSpans) {
      if (isSuggestedText(span.textContent || "")) {
        const parent = span.closest(
          ".feed-shared-actor__sub-description, .update-components-actor__sub-description, .feed-shared-header"
        );
        if (parent) {
          const post = findFeedPostParent(span);
          if (post) hideElement(post);
        }
      }
    }
  }

  function scanFollowRecommendations(root) {
    const followModules = root.querySelectorAll(
      '.feed-follows-module, [data-view-name="feed-follows-module"], .people-follow-recommend'
    );
    for (const mod of followModules) {
      hideElement(mod);
    }

    // "Add to your feed" suggestions
    const addToFeed = root.querySelectorAll(
      '.feed-shared-news-module, [data-view-name="feed-news-module"]'
    );
    for (const mod of addToFeed) {
      if (
        mod.textContent &&
        /add to your feed|toevoegen aan je feed/i.test(mod.textContent)
      ) {
        hideElement(mod);
      }
    }
  }

  function scanLearningPromos(root) {
    const learningCards = root.querySelectorAll(
      ".feed-shared-learning-card, .learning-top-course-card"
    );
    for (const card of learningCards) {
      const post = findFeedPostParent(card) || card;
      hideElement(post);
    }
  }

  function scanPromotedMessages(root) {
    const msgPills = root.querySelectorAll(".msg-conversation-card__pill");
    for (const pill of msgPills) {
      const text = (pill.textContent || "").trim().toLowerCase();
      if (PROMOTED_MSG_LABELS.includes(text)) {
        const listItem = pill.closest("li.msg-conversation-listitem");
        if (listItem) {
          hideElement(listItem);
          continue;
        }
        const overlayItem = pill.closest(
          ".msg-overlay-list-bubble__convo-item--v2, .msg-overlay-list-bubble__convo-item"
        );
        if (overlayItem) {
          hideElement(overlayItem);
          continue;
        }
        const overlayCard = pill.closest(
          ".msg-overlay-list-bubble__convo-card-container--v2, .msg-overlay-list-bubble__convo-card-container"
        );
        if (overlayCard) hideElement(overlayCard);
      }
    }
  }

  function scanNewsAndGames(root) {
    // LinkedIn News module
    const newsModules = root.querySelectorAll(
      '.news-module, [data-view-name="news-module"], aside[aria-label="LinkedIn News"], #feed-news-module'
    );
    for (const mod of newsModules) {
      hideElement(mod);
    }

    // Games / Today's Puzzle module
    const gamesModules = root.querySelectorAll(
      '.games-module, [data-view-name="games-module"], .games-entrypoints-module__subheader'
    );
    for (const mod of gamesModules) {
      const card = mod.closest("section.artdeco-card") || mod;
      hideElement(card);
    }

    // Text-based fallback for right rail cards
    const rightRailCards = root.querySelectorAll(
      "aside .artdeco-card, .scaffold-layout__aside .artdeco-card"
    );
    for (const card of rightRailCards) {
      const text = card.textContent || "";
      if (/linkedin news|today's puzzle|play games/i.test(text)) {
        hideElement(card);
      }
    }
  }

  // --- Dynamic CSS Injection ---

  function applyCSS(categoryId, enabled) {
    const styleId = "linkedin-clean-feed-css-" + categoryId;
    let styleTag = document.getElementById(styleId);

    if (enabled && !styleTag && CSS_RULES[categoryId]) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.textContent = CSS_RULES[categoryId];
      (document.head || document.documentElement).appendChild(styleTag);
    } else if (!enabled && styleTag) {
      styleTag.remove();
    }
  }

  // --- Master Scan ---

  const DYNAMIC_SCANNERS = {
    promotedPosts: scanPromotedPosts,
    suggestedPosts: scanSuggestedPosts,
    followRecommendations: scanFollowRecommendations,
    learningPromos: scanLearningPromos,
    promotedMessages: scanPromotedMessages,
    newsAndGames: scanNewsAndGames,
  };

  function scanForAds(root) {
    if (!masterEnabled) return;

    for (const [catId, scanFn] of Object.entries(DYNAMIC_SCANNERS)) {
      if (categorySettings[catId] !== false) {
        scanFn(root);
      }
    }
  }

  function showAllHidden() {
    const hidden = document.querySelectorAll(".linkedin-clean-feed-hidden");
    for (const el of hidden) {
      showElement(el);
    }
  }

  function applyCSSCategories() {
    for (const catId of Object.keys(CSS_RULES)) {
      applyCSS(catId, masterEnabled && categorySettings[catId] !== false);
    }
  }

  // --- Debounced Scan ---

  let scanTimeout = null;
  function debouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => scanForAds(document.body), 100);
  }

  // --- MutationObserver ---

  const observer = new MutationObserver((mutations) => {
    if (!masterEnabled) return;

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

  // --- Storage Migration ---

  function getDefaultCategories() {
    const defaults = {};
    for (const cat of Object.values(CATEGORIES)) {
      defaults[cat.id] = cat.defaultEnabled;
    }
    return defaults;
  }

  function migrateAndInit(callback) {
    chrome.storage.sync.get(["masterEnabled", "categories"], (sync) => {
      if (sync.categories) {
        // Already migrated — use sync settings
        masterEnabled = sync.masterEnabled !== false;
        categorySettings = sync.categories;
        chrome.storage.local.get(["blockedCount"], (local) => {
          blockedCount = local.blockedCount || 0;
          callback();
        });
      } else {
        // First install or migration from v1.x
        chrome.storage.local.get(["enabled", "blockedCount"], (local) => {
          masterEnabled = local.enabled !== false;
          categorySettings = getDefaultCategories();
          blockedCount = local.blockedCount || 0;

          chrome.storage.sync.set({
            masterEnabled,
            categories: categorySettings,
          });
          callback();
        });
      }
    });
  }

  // --- Initialize ---

  function init() {
    migrateAndInit(() => {
      // Apply CSS categories immediately
      applyCSSCategories();

      if (masterEnabled) {
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

    // Listen for setting changes from popup
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;

      if (changes.masterEnabled) {
        masterEnabled = changes.masterEnabled.newValue;
        if (masterEnabled) {
          applyCSSCategories();
          scanForAds(document.body);
        } else {
          showAllHidden();
          applyCSSCategories();
        }
      }

      if (changes.categories) {
        categorySettings = changes.categories.newValue;
        applyCSSCategories();
        if (masterEnabled) {
          scanForAds(document.body);
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
