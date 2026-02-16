# LockedIn

Re-focus LinkedIn: block ads and clean your feed. A Chrome/Brave extension with per-category controls.

## What it blocks

| Category | What gets hidden |
|----------|-----------------|
| Promoted Posts | Sponsored content in your feed (9 languages) |
| Suggested Posts | Posts LinkedIn thinks you might like |
| Follow Suggestions | "People you may know" and follow recommendations |
| LinkedIn Learning | Course and learning promotions |
| Promoted Messages | Sponsored messages in inbox and overlay |
| News & Games | LinkedIn News module and Today's Puzzle |
| Sidebar Ads | Ad banners, sponsored sidebar content |
| Premium Upsells | "Try Premium" prompts and upgrade links |

Each category can be toggled independently.

## Install

### From Chrome Web Store
*Coming soon*

### Manual (developer mode)
1. Clone this repo: `git clone https://github.com/TheMazzle/lockedin.git`
2. Open `chrome://extensions/` (or `brave://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

## How it works

Two-layer approach for instant, flicker-free blocking:

1. **CSS rules** — Injected at `document_start` before the page renders. Hides elements with stable CSS selectors (sidebar ads, premium upsells).
2. **Content script** — Uses a MutationObserver to detect dynamically loaded content like promoted posts (identified by locale-matched text labels) and messaging spam.

## Customize

Click the extension icon to open the popup:
- **Master toggle** turns all blocking on/off
- **Per-category toggles** let you choose exactly what to block
- Your preferences sync across devices via Chrome Sync

## Privacy

This extension does not collect, store, or transmit any personal data. See [PRIVACY.md](PRIVACY.md) for details.

## License

MIT
