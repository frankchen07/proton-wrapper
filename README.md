# ProtonFlow

Gmail shortcuts for ProtonMail. Because you shouldn't have to relearn muscle memory to use a more private email.


## Why

ProtonMail has never shipped standard keyboard shortcuts. They have their own, but they're nothing like Gmail's — and if you've used Gmail for years, the context switching is a constant paper cut. ProtonFlow maps Gmail's shortcuts onto ProtonMail's UI so you can navigate, archive, delete, reply, and compose without touching the mouse.

## Problems Solved

- **Navigation**: `j` / `k` to move between messages, `x` to select
- **Focus loss**: ProtonMail drops keyboard focus when you close a message. ProtonFlow detects this and restores cursor position automatically (Focus Persistence Engine).
- **Archive and delete**: `e` to archive, `Shift+3` to delete — same as Gmail
- **Thread actions**: `r` reply, `a` reply all, `f` forward, `s` star
- **Read state**: `Shift+I` mark read, `Shift+U` mark unread
- **Labels**: `l` to open the label dialog
- **Compose / search**: `c` to compose, `/` to focus search

The biggest one is focus loss. ProtonMail has a known issue where returning from a thread drops your keyboard position in the list. Everything else is muscle memory — this one is a blocker.

## Local Installation (Sideloaded)

For personal use or development. Requires Node.js 18+ and Git.

```bash
git clone https://github.com/frankchen07/proton-wrapper.git
cd proton-wrapper
npm install
npm run build
```

Then load in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

Works in Chrome, Brave, and Edge.

After any code change, run `npm run build` and click the reload icon next to ProtonFlow in `chrome://extensions`.

## Chrome Extension Store

> Not yet on the Chrome Web Store. Coming soon.

Once published, install directly from the store — no build step, automatic updates. In the meantime, use the local installation instructions above.

## Security Concerns

- Does **not** read your emails.
- Does **not** store personal or sensitive information. Storage only contains settings (keybindings, toggle states) and health check booleans — all on-device, nothing leaves your browser.
- Does **not** make any network calls. All communication is Chrome's internal extension IPC.
- Pure DOM automation. It clicks buttons, dispatches mouse events, and calls `.focus()` on your behalf to mimic Gmail shortcuts.
- Runs in Chrome's **isolated world** — the content script shares the DOM but has no access to ProtonMail's JavaScript context, memory, or encryption keys.
- Source is fully open. Read it: [`src/content/`](src/content/)

---

# Deprecated: ViolentMonkey Userscript

is protonmail ever going to fix their shortcuts issue and make it standard like gmail?

probably not, so i just vibecoded a wrapper to do it myself

### Installation Instructions

1. Use Brave browser
2. Get the ViolentMonkey extension:
   `https://violentmonkey.github.io/` and
   `https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag`
3. Create a new script in the extension, name it whatever you want
4. Copy the code from `.deprecated.user.js` in this repo over to the script in the extension
5. Hit save
6. Refresh your ProtonMail window
7. `j`, `k`, `x`, `Shift+3`, `Shift+I`, `Shift+U`, `l` — standard Gmail shortcuts to make your day

enjoy

if there's bugs, sorry, comment or make a pull request and i'll look at it
