# OpenChatCut Local Customizations Ledger (`plodandponder/OpenChatCut`)

This document tracks every feature hidden, changed, hardened, or configured compared to upstream `0xsline/OpenChatCut`, along with exact instructions to restore any removed/hidden UI element later.

---

## 1. Hidden UI Prompts (Reversible via `src/featureFlags.ts`)

Both prompts below are gated behind boolean flags in [`src/featureFlags.ts`](src/featureFlags.ts) rather than deleted. The underlying **Settings** dialog (top-right gear icon) remains 100% functional at all times.

| Feature / Prompt | Current State | Location | Why Hidden | How to Restore |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard "Configure a model to start using the Agent" banner** | Hidden (`false`) | [`src/featureFlags.ts`](src/featureFlags.ts)<br>[`src/components/dashboard/DashboardViews.tsx`](src/components/dashboard/DashboardViews.tsx) | Antigravity controls OpenChatCut externally via MCP, so no in-app LLM API key is needed. | Set `showDashboardModelSetupBanner: true` in `src/featureFlags.ts` and rebuild desktop app. |
| **Editor Sidebar "These capabilities are not configured..." warning banner** | Hidden (`false`) | [`src/featureFlags.ts`](src/featureFlags.ts)<br>[`src/components/chat/ChatPanelView.tsx`](src/components/chat/ChatPanelView.tsx) | Paid cloud generators (Image/Voice/Video/Music/SFX) are unused when editing locally with Antigravity MCP + local Whisper. | Set `showChatCapabilityGapBanner: true` in `src/featureFlags.ts` and rebuild desktop app. |

### How to Rebuild After Flipping Any Flag
```powershell
cd C:\Users\Chand\OpenChatCut
npm run build
npm run desktop:build:main
$env:CC_EB_TARGET = 'win32-x64'
npx electron-builder --config config/electron-builder.config.mjs --win dir --x64 --publish never "-c.compression=normal"
```
*(Close `OpenChatCut.exe` before running `electron-builder` so the packaged `.exe` can be overwritten cleanly.)*

---

## 2. Stability & Workflow Fixes

| Change | Commit | Files | Details |
| :--- | :--- | :--- | :--- |
| **Offline MCP / CLI session lease heartbeat** | `cb82f5d2` | [`server/external-agent/offline-runtime.ts`](server/external-agent/offline-runtime.ts) | Added a 25-second `setInterval` heartbeat that renews the 90-second project ownership lease during long offline operations (such as bulk importing/normalizing 60+ video clips). Cleared cleanly on `dispose()`. |
| **Prevent preview playback starvation on large timelines** | — | [`src/media/clipPreview.ts`](src/media/clipPreview.ts)<br>[`src/media/MediaPoolCard.tsx`](src/media/MediaPoolCard.tsx) | Added a 2-slot concurrency limit on `/api/waveform` + `/api/filmstrip` requests and `loading="lazy"` on Media Pool poster images so opening 60+ clip projects never saturates Chromium's 6-connection HTTP/1.1 pool and starves live `<Player>` playback. |

---

## 3. Security Hardening (Upstream Best Practices)

| Change | Commit | Files | Details |
| :--- | :--- | :--- | :--- |
| **Motion-graphics AST sandbox hardening** | `2104173a` | [`src/template-host.ts`](src/template-host.ts) | Added Babel AST verification (`assertSafeAstNode`) blocking prototype-chain and dynamic computed property escapes (`__proto__`, `constructor`, `Reflect`, `Proxy`, `openChatCutDesktop`). Verified against all 211 built-in templates. |
| **Electron OS renderer sandboxing** | `2104173a` | [`desktop/main.ts`](desktop/main.ts) | Enabled `sandbox: true` on renderer BrowserWindows. |
| **Loopback dev server & proxy auth** | `2104173a` | [`config/vite.config.ts`](config/vite.config.ts) | Bound dev server to `127.0.0.1` and enforced proxy authentication. |
| **HTTP security headers** | `2104173a` | [`server/plugins/cross-origin-isolation.ts`](server/plugins/cross-origin-isolation.ts) | Added `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`. |
| **HTTPS plugin thumbnail validation** | `2104173a` | [`src/plugins/validate.ts`](src/plugins/validate.ts) | Enforced HTTPS for external plugin thumbnail URLs. |
| **Normalized npm registry URLs** | `2104173a` | [`package-lock.json`](package-lock.json) | Normalized lockfile URLs to official `registry.npmjs.org`. |

---

## 4. Local Machine Configuration (Not Committed to Git)

These settings live locally on this Windows machine outside version control:

- **Desktop App `.env.local`** (`C:\Users\Chand\AppData\Roaming\OpenChatCut\.env.local`):
  - `PREFERRED_TRANSCRIPTION_PROVIDER=local`
  - `LOCAL_ASR_MODEL=base`
- **Repo CLI `.env.local`** (`C:\Users\Chand\OpenChatCut\.env.local`):
  - `MEDIA_DIR=C:\Users\Chand\AppData\Roaming\OpenChatCut\public\media\uploads` (keeps `occ` CLI imports synced with the packaged desktop app).
- **Installed Local AI Model Packs** (`C:\Users\Chand\.openchatcut\asr-models`, SHA-256 verified):
  - `rhythm-lite` (`musetric/beat-this-onnx`, 79.5 MB)
  - `music-semantics-lite` (`Xenova/clap-htsat-unfused`, 32.7 MB)
  - Whisper Base GGML (`ggml-base-q5_1.bin`, 56.9 MB)
- **Antigravity MCP Integration**:
  - Endpoint: `http://127.0.0.1:5199/api/external-mcp/mcp` (token in `C:\Users\Chand\.openchatcut\mcp-token`)
  - Registered in `C:\Users\Chand\.gemini\config\mcp_config.json` and `C:\Users\Chand\.gemini\antigravity\mcp_config.json` (44 tools).
