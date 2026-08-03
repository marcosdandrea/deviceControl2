# AGENTS.md

Guidance for AI agents working in this repository. Read this before making changes.

## What this project is

**Device Control 2** (`devicecontrol`) — a show-control / automation platform built by Proyecciones Digitales. It runs **Routines** made of **Tasks**, which are gated by **Triggers** (cron, TCP, UDP, API, on-start, on-routine-event) and **Conditions** (day/time window, ping, PJLink power state, TCP/UDP answer), and which execute **Jobs** (send Art-Net/DMX, send serial, send TCP/UDP, send PJLink, send mail, wake-on-LAN, wait, etc.). Think of it as software for driving AV/show hardware (projectors, DMX fixtures, serial devices) on a schedule or in reaction to events.

It ships three ways:
- **Desktop app** (Electron, Mac/Windows/Linux) — `dist:mac` / `dist:win` / `dist:linux`.
- **Raspberry Pi appliance** — headless Node process + Chromium kiosk, provisioned by the scripts in `rpiAppliance/` (see `rpiAppliance/README.md`). Built via `dist:raspberry`.
- **Headless webpack bundle** — a self-contained Node bundle (`dist:webpack`) served over HTTP, distributed as GitHub pre-releases/releases (`pre:webpack` / `pub:webpack`). This is what the Raspberry Pi appliance and other headless installs pull down as updates.

In every mode the same Electron **main process** boots an Express + Socket.IO server (`ServerManager`) that serves the React UI and talks to it over `ipcServices` (main channel) using socket events defined in `src/common/events` and `src/common/commands`. GUI mode additionally opens Electron `BrowserWindow`s pointed at that same server. This dual GUI/headless architecture is central — don't assume `electron` APIs are available in code reachable from headless mode.

## Repo layout

```
src/
  app/main.ts              Electron/Node entry point (branches on --headless)
  app/src/
    controllers/           e.g. Timeout
    domain/
      entities/            Core domain model: routine, task, trigger/types/*, condition/types/*, job/types/*, project, context, app
      useCases/             app, project, routine, context, windowManager (splash/main window, preload, menu)
    services/
      artnet/               DMX/Art-Net output
      cryptography/          project file encryption (ENCRYPTION_PASSWORD)
      eventManager/
      fileSystem/            project (.dc2) load/save
      hardwareManagement/    screen (backlight/brightness), net (Linux network config), etc.
      ipcServices/           socket.io handlers exposed to the renderer (app/executions/hardware/localization/network/projects/routine/system/tasks/update .services.ts)
      licensing/
      logCleanup/
      server/                ServerManager (Express + Socket.IO), one instance per named server ("main" on 8080, "general" on 4546)
      systemSettings/
      update/                checks GitHub releases for updates (headless/webpack builds)
      windowManager/
    utils/
  common/                   Shared between main process and renderer (import via @common)
    commands/                socket command name constants, grouped by domain
    events/                  socket/event name constants, grouped by domain
    i18n/
    theme/                   shared color tokens
    types/                   shared TypeScript types (routine, task, trigger, condition, job, project, network, wifi, sound, execution, ...)
  ui/                        React 19 renderer (Vite)
    components/              generic reusable components (FloatingWindow, SettingRow, SettingsSection, ...)
    contexts/                React contexts (e.g. SoundContextProvider)
    hooks/
    helpers/
    views/
      Builder/                routine/task visual editor (main authoring UI)
      Control/                runtime control surface (operators trigger/observe routines)
      Executions/             execution history/monitoring
      Terminal/               log/console panel
      Configuration/          current settings UI (project/hardware/software) — see gotcha below
      ConfigurationLegacy/    superseded settings UI, mid-migration — being phased out in favor of Configuration
      NotAllowed/
    theme.css                 shared dark-theme CSS custom properties (--app-background, --component-background, --text, ...)
rpiAppliance/                Raspberry Pi appliance provisioning: numbered shell scripts (00-99) run in order by run-all.sh, plus systemd/X11 kiosk templates
scripts/                     dist-webpack.mjs, publish-webpack-release.js, publish-webpack-prerelease.js
```

## Path aliases

Two separate alias sets exist because the main process and the renderer are compiled by different toolchains (`tsconfig-electron.json` + webpack for main, `tsconfig-vite.json` + Vite for renderer). Both always support `@common/*` and `@src/*` (→ `src/app/src/*`).

| Alias | Resolves to | Available in |
|---|---|---|
| `@common/*` | `src/common/*` | both |
| `@src/*` | `src/app/src/*` | both |
| `@domain/*`, `@services/*`, `@entities/*`, `@useCases/*`, `@utils/*`, `@root/*` | under `src/app/src/*` / repo root | main process only |
| `@components/*`, `@hooks/*`, `@views/*`, `@contexts/*`, `@assets/*`, `@helpers/*`, `@stores/*`, `@ipc/*` | under `src/ui/*` | renderer only |

When adding an alias, update it in **both** `tsconfig-electron.json`/`tsconfig-vite.json` (type-checking) and the matching build config (`vite.config.ts` for renderer; webpack/esbuild config for main) or imports will resolve for `tsc` but fail at bundle time.

## Commands

```
npm run dev              # Vite dev server + Electron, GUI mode, hot reload
npm run dev:headless     # Vite dev server + Node main process, headless mode
npm run test:unit        # vitest src --reporter verbose
npm run build:vite       # renderer production build → dist-react
npm run build:electron   # main process build → dist-electron
npm run dist:mac|win|linux|raspberry   # version bump + full electron-builder desktop/appliance build
npm run dist:webpack     # version bump + headless webpack bundle → dist/webpack
npm run pre:webpack "<title>"   # dist:webpack + zip + gh release create --prerelease (interactive changelog prompt on stdin)
npm run pub:webpack             # equivalent for a full (non-pre) release
```

`pre:webpack`/`pub:webpack` bump `package.json`'s version, build from the **current working tree** (uncommitted changes included), and publish a real GitHub release via `gh` — a hard-to-reverse, externally-visible action. Confirm with the user before running these if there are unrelated pending changes in the working tree, and make sure `gh` is authenticated.

## Known gotchas

- **`antd`'s `<App>` wrapper has no height styling.** `App` (from `import { App } from "antd"`) renders a plain `<div>` with only `color/fontSize/lineHeight/fontFamily` applied (see `node_modules/antd/es/app/App.js` and `style/index.js`). Any ancestor chain relying on `height: 100%` breaks at that div unless you pass `style={{ height: "100%" }}` explicitly to `<App>` (done in `src/ui/views/Configuration/index.tsx`). Watch for this pattern anywhere else `<App>` wraps a full-height layout.
- **`Configuration` vs `ConfigurationLegacy`**: `src/ui/views/Configuration` is the current, actively-developed settings UI (visually unified design, opened via `FloatingWindow` from `OpenConfigButton`). `ConfigurationLegacy` is the old implementation, kept around mid-migration — many of its files are literal `git mv`s from the old `Configuration` tree. Don't add new features to `ConfigurationLegacy`; it's expected to be deleted once the migration finishes.
- **`FloatingWindow`** (`src/ui/components/FloatingWindow`) is the shared draggable/resizable panel chrome used by Configuration, Terminal, Executions, and the Control preview. Its outer `.panel` uses CSS `resize: both` + `overflow: auto` and clamps to `window.innerWidth/innerHeight` on mount and on window resize. Content placed inside it must fill height via `100%` chains (see gotcha above) rather than fixed pixel heights, since the panel itself can be resized by the user.
- Two visually-similar but distinct dark backgrounds are in play: `var(--app-background)` (`#242424`, from `src/ui/theme.css`, used by generic chrome like `FloatingWindow`) and the hardcoded `#1c1c1e` used specifically by `Configuration`'s own panel/tabs. If you add new Configuration-adjacent chrome, prefer reusing `#1c1c1e` (or lift it to a shared var) rather than introducing a third shade.
- Env var reference lives in `.env-ref` (documented, no real secrets) — copy relevant entries to `.env` (gitignored, has real secrets) rather than guessing values. Includes routine/task defaults, encryption password, GitHub PAT for the update service, SMTP config, and network fallback settings for Linux appliances.
- `rpiAppliance/scripts/` are numbered and order-dependent (`00-common.sh` sourced by the rest, `run-all.sh` drives them 00→99); don't reorder or renumber without checking `run-all.sh`.
- **`rpiAppliance/scripts/` fixes don't reach already-provisioned devices.** These scripts only run during initial SD-card provisioning. Fixing one in the repo (e.g. a boot script, a sudoers file) does nothing for a device that was set up before the fix — the app's own OTA updater (`pub:webpack`/`pre:webpack` → `installUpdate`) only touches its own install directory (`main.js`, chunk files, `dist-react`, `resources`), never `/etc`, `/usr/local/bin`, systemd units, or other system-level files. After fixing a provisioning script, you must manually reapply the underlying artifact (the installed script/unit/sudoers file) to any device that already ran the old version, or the bug resurfaces on next reboot with no code-level trace of why.
- **Screen backlight (`src/app/src/services/hardwareManagement/screen`) is sysfs-driven, not `pinctrl`-driven.** GPIO18 is wired as the PWM backlight pin (`dtoverlay=pwm-backlight,pin=18,func=2,pwm_2` on Chipsee CM5 hardware); the app controls brightness by writing `0`-`max_brightness` to `/sys/class/backlight/pwm-backlight/brightness`. **Never call `pinctrl set 18 ...` on this pin** — even a one-off "force it on" command yanks it out of its PWM alt-function into plain GPIO mode. Once that happens, sysfs writes keep "succeeding" (no error, no exception) but have zero physical effect on the backlight, which is a confusing silent failure. Recovery: `pinctrl set 18 a3` restores the PWM function. `ScreenController.ensureBacklightPinMode()` runs this defensively once at app startup as a safety net, but anything else on the box that still shells out to `pinctrl` (an old provisioning script, a manual fix applied outside the app) will re-break it.
- **Webpack code-splitting vs the OTA updater.** `webpack.headless.config.cjs` (ts-loader + `webpack-obfuscator`, no explicit `splitChunks` config) still emits a separate numbered chunk file (`NNN.main.js`) for every module reached via dynamic `import()` — main.ts itself uses this pattern heavily (`ScreenController`, `NetworkManager`, `update` service, `windowManager`, ...). `src/app/src/services/update/index.ts`'s install/backup/rollback logic must sync those chunk files too (matched via a `/^\d+\.main\.js$/` pattern alongside `main.js`), not just the fixed `main.js`/`dist-react`/`resources` trio — otherwise a lazily-imported module can silently stay on old code after a successful-looking update, surfacing as an obfuscated `X is not a function` at the call site with no obvious link back to "stale chunk." If you add a new top-level dynamically-imported module, this sync logic already covers it (it's pattern-based, not an allowlist) — just keep it that way if `copyItems` is ever refactored.
- **Don't `grep` the obfuscated headless bundle to check whether a fix landed.** `webpack-obfuscator`'s `stringArray`/`identifierNamesGenerator: 'mangled'` settings rewrite `obj.methodName()` into `obj[decode(0x1a2b)]()`-style computed lookups, so a method or string literal you just added usually won't appear as plain text in `dist/webpack/*.js` even when it's genuinely there (and its absence doesn't prove it's missing either). To verify server-side behavior on a real deployed build, exercise it directly — e.g. a throwaway `socket.io-client` script hitting the relevant command — rather than grepping the bundle.
- **Network interface (DHCP/static) config in `src/ui/views/Configuration/Views/HardwareConfiguration/Views/InterfaceConfiguration/`** has bitten two ways so far — watch for the same shape of bug elsewhere in this component tree:
  - `context/index.tsx`'s `isValidIpWithCidr` used to *require* a `/cidr` suffix to consider an IP valid. The backend (`net.linux.ts`/`net.mac.ts`/`net.win.ts`) reports the DHCP-obtained address as a bare IP with no CIDR suffix. Net effect: flipping the "Usar DHCP" switch off inherited the correct DHCP IP into the static fields, but it immediately rendered with a red/invalid border because the bare IP failed the CIDR check — forcing the user to retype a value that was already correct. Fixed by making the `/cidr` suffix optional in that validator (a bare valid IP now passes; a suffix, when present, is still range-checked 0–32).
  - `components/InterfaceSettings/index.tsx`'s `handleApplyChanges`, in the "switching to DHCP" branch, used to call `popupWindow.close()` **before** showing the `confirm()` dialog and before calling `updateNetworkConfiguration`. Since `FloatingWindow`'s `onClose` unmounts the whole `Configuration` tree (all local state, including this context, goes with it), the panel visually vanished the instant the user clicked "Aplicar Cambios" — regardless of whether they went on to confirm or cancel the browser `confirm()`, and before the config change had even been dispatched. Fixed by moving the confirm dialog first (so Cancel truly cancels and nothing closes), then dispatching `updateNetworkConfiguration`, and only then closing the popup. General lesson: in any "confirm → mutate → close popup" flow here, closing must be the *last* step, strictly after a positive confirmation — never before/alongside the confirm dialog.
- **A project loaded into memory (`Project` singleton) is not automatically synced across multiple connected sessions.** Each connected socket.io client (e.g. the kiosk's own `/control` page and someone's `/builder` session open elsewhere) fetches `project` once via `project:getCurrent` and then keeps its own in-memory copy; nothing pushes updates to *other* sessions unless the specific setter you're touching explicitly broadcasts. The pattern (see `Project.setNetworkConfiguration`/`setScreenAutoOffTimeMs`/`setMaxBrightness`) is: setter calls `this.dispatchEvent(someProjectEvent, payload)` → `Project`'s `onAny(broadcastToClients)` hook (registered in `loadProject`, **not** `createNewProject` — still a gap) fans it out over the socket → the renderer needs an explicit listener (see `ProjectSyncListener.tsx`, mounted once in `App.tsx`) that applies the payload via `ProjectContext`'s `syncProject` (not `setProject`, which would wrongly flag local unsaved changes). Adding a new project-level setting that should apply live everywhere needs all three pieces, or a session other than the one that made the change (most importantly the kiosk itself) silently keeps running on stale settings until it reloads.

## Testing

`vitest` (`npm run test:unit`) covers domain entities under `src/app/src/domain/entities/**/*.test.ts` — triggers, conditions, jobs (sendArtnet/sendTCP/sendUDP/wait), routine, presetFactory, and the `server` service. There is no renderer/UI test suite; verify UI changes by running the app (`npm run dev`) and exercising the feature, per the `verify` skill.
