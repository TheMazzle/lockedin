(() => {
  "use strict";

  // --- Category Definitions ---
  // SYNC: CATEGORIES must match popup.js — update both files together

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
      type: "both",
    },
    learningPromos: {
      id: "learningPromos",
      label: "LinkedIn Learning",
      description: "Course and learning promotions",
      defaultEnabled: true,
      type: "both",
    },
    promotedMessages: {
      id: "promotedMessages",
      label: "Promoted Messages",
      description: "Sponsored messages in inbox",
      defaultEnabled: true,
      type: "both",
    },
    newsAndGames: {
      id: "newsAndGames",
      label: "News & Games",
      description: "LinkedIn News and Today's Puzzle",
      defaultEnabled: true,
      type: "both",
    },
    promotedJobs: {
      id: "promotedJobs",
      label: "Promoted Jobs",
      description: "Sponsored job listings on the Jobs page",
      defaultEnabled: false,
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
      type: "both",
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
      #jobsForYou,
      #companiesForYou,
      #groupsForYou,
      iframe[width="300"][height="250"],
      :has(> iframe[width="300"][height="250"]) {
        display: none !important;
      }
    `,
    followRecommendations: `
      #pymk-container,
      aside[data-view-name="feed-right-rail"] .feed-follows-module {
        display: none !important;
      }
    `,
    learningPromos: `
      .learning-top-course-card,
      .feed-shared-learning-card {
        display: none !important;
      }
    `,
    promotedMessages: `
      .msg-sponsored-content,
      .sponsored-message-indicator {
        display: none !important;
      }
    `,
    newsAndGames: `
      .games-module,
      .games-entrypoint,
      [data-view-name="games-module"],
      .news-module,
      [data-view-name="news-module"],
      #feed-news-module {
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
      a[href*="/premium/"],
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
  let blockedCountDirty = false;
  let flushTimeout = null;

  // --- Feed Post Helpers ---

  const FEED_POST_SELECTORS = [
    ".feed-shared-update-v2",
    ".occludable-update",
    '[data-urn^="urn:li:activity"]',
  ];

  function isPromotedText(text) {
    const normalized = text.trim().toLowerCase();
    return PROMOTED_LABELS.some((label) => normalized === label || normalized.endsWith("\n" + label) || normalized.endsWith(" · " + label));
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
    if (el && !el.classList.contains("lockedin-hidden")) {
      el.classList.add("lockedin-hidden");
      blockedCount++;
      blockedCountDirty = true;
    }
  }

  function flushBlockedCount() {
    if (blockedCountDirty) {
      chrome.storage.local.set({ blockedCount });
      blockedCountDirty = false;
    }
  }

  function scheduleFlush() {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushBlockedCount, 2000);
  }

  function showElement(el) {
    if (el && el.classList.contains("lockedin-hidden")) {
      el.classList.remove("lockedin-hidden");
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

    // Text-based fallback: scan all spans inside feed posts for promoted labels
    const feedSpans = root.querySelectorAll(
      '.feed-shared-update-v2 span, .occludable-update span, [data-urn^="urn:li:activity"] span'
    );
    for (const span of feedSpans) {
      const text = (span.textContent || "").trim().toLowerCase();
      if (PROMOTED_LABELS.includes(text)) {
        const post = findFeedPostParent(span);
        if (post) hideElement(post);
      }
    }
  }

  function scanSuggestedPosts(root) {
    const allSpans = root.querySelectorAll(
      '.feed-shared-update-v2 span, .occludable-update span, [data-urn^="urn:li:activity"] span'
    );
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

    // Text-based fallback for feed posts with obfuscated classes
    const feedItems = root.querySelectorAll(
      '.feed-shared-update-v2, .occludable-update, [data-urn^="urn:li:activity"]'
    );
    for (const item of feedItems) {
      const text = item.textContent || "";
      if (/popular course on linkedin learning|populaire cursus op linkedin learning|cours populaire sur linkedin learning|beliebter kurs auf linkedin learning|curso popular en linkedin learning/i.test(text)) {
        hideElement(item);
      }
    }

    // Right-rail learning cards
    const rightRailCards = root.querySelectorAll(
      "aside .artdeco-card, .scaffold-layout__aside .artdeco-card"
    );
    for (const card of rightRailCards) {
      const text = card.textContent || "";
      if (/popular course on linkedin learning|populaire cursus op linkedin learning|view course for free|bekijk cursus gratis/i.test(text)) {
        hideElement(card);
      }
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
      '.games-module, [data-view-name="games-module"], .games-entrypoints-module__subheader, .games-entrypoint'
    );
    for (const mod of gamesModules) {
      const card = mod.closest(".artdeco-card") || mod;
      hideElement(card);
    }

    // Text-based fallback for right rail cards (EN + NL)
    const rightRailCards = root.querySelectorAll(
      "aside .artdeco-card, .scaffold-layout__aside .artdeco-card"
    );
    for (const card of rightRailCards) {
      const text = card.textContent || "";
      if (/linkedin news|today's puzzle|play games|puzzel van vandaag|speel games/i.test(text)) {
        hideElement(card);
      }
    }

    // Text-based fallback for non-feed pages (obfuscated CSS classes)
    const sections = root.querySelectorAll("section");
    for (const section of sections) {
      const text = section.textContent || "";
      if (
        text.length < 500 &&
        /30 second break|today's puzzle|play games|puzzel van vandaag|speel games/i.test(
          text
        )
      ) {
        hideElement(section);
      }
    }
  }

  function scanPromotedJobs(root) {
    // Jobs page: "Promoted" appears as plain text with obfuscated classes
    // Walk up from text node to find the job card link
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim().toLowerCase();
      if (text === "promoted" || text === "gesponsord") {
        let el = walker.currentNode.parentElement;
        // Skip if this is a feed post (handled by scanPromotedPosts)
        if (findFeedPostParent(el)) continue;
        for (let i = 0; i < 10 && el && el !== document.body; i++) {
          if (el.tagName === "A" && el.href && el.href.includes("/jobs/view/")) {
            hideElement(el);
            break;
          }
          el = el.parentElement;
        }
      }
    }
  }

  function scanPremiumUpsells(root) {
    // Text-based detection for premium upsells on non-feed pages
    const sections = root.querySelectorAll("section");
    for (const section of sections) {
      const text = section.textContent || "";
      if (
        text.length < 500 &&
        /apply smarter|1-month free trial|probeer premium|try premium for free/i.test(
          text
        )
      ) {
        hideElement(section);
      }
    }
  }

  // --- Dynamic CSS Injection ---

  function applyCSS(categoryId, enabled) {
    const styleId = "lockedin-css-" + categoryId;
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
    promotedJobs: scanPromotedJobs,
    premiumUpsells: scanPremiumUpsells,
  };

  function isCategoryEnabled(catId) {
    if (catId in categorySettings) return categorySettings[catId] !== false;
    const cat = CATEGORIES[catId];
    return cat ? cat.defaultEnabled !== false : true;
  }

  function scanForAds(root) {
    if (!masterEnabled) return;

    for (const [catId, scanFn] of Object.entries(DYNAMIC_SCANNERS)) {
      if (isCategoryEnabled(catId)) {
        scanFn(root);
      }
    }
    scheduleFlush();
  }

  function showAllHidden() {
    const hidden = document.querySelectorAll(".lockedin-hidden");
    for (const el of hidden) {
      showElement(el);
    }
  }

  function applyCSSCategories() {
    for (const catId of Object.keys(CSS_RULES)) {
      applyCSS(catId, masterEnabled && isCategoryEnabled(catId));
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

  // --- Shadow DOM Observer (Messaging Overlay) ---

  let shadowObserverAttached = false;

  function observeShadowMessaging() {
    if (shadowObserverAttached) return;

    const shadowHost = document.querySelector(".theme--light");
    if (!shadowHost || !shadowHost.shadowRoot) {
      // Shadow root not ready yet — poll for it
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        const host = document.querySelector(".theme--light");
        if (host && host.shadowRoot) {
          attachShadowObserver(host.shadowRoot);
          clearInterval(poll);
        }
        if (attempts >= 30) clearInterval(poll); // Stop after 30s
      }, 1000);
      return;
    }

    attachShadowObserver(shadowHost.shadowRoot);
  }

  function attachShadowObserver(shadowRoot) {
    if (shadowObserverAttached) return;
    shadowObserverAttached = true;

    const shadowObserver = new MutationObserver(() => {
      if (!masterEnabled || categorySettings.promotedMessages === false) return;
      scanPromotedMessages(shadowRoot);
      scheduleFlush();
    });

    shadowObserver.observe(shadowRoot, {
      childList: true,
      subtree: true,
    });

    // Initial scan
    if (masterEnabled && categorySettings.promotedMessages !== false) {
      scanPromotedMessages(shadowRoot);
    }
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

      // Start observing main DOM
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Observe shadow DOM for messaging overlay (promoted messages)
      observeShadowMessaging();
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
        showAllHidden();
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
