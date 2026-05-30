# LightningJS SDK Patterns

Reference for `@lightningjs/sdk` built-ins. Prefer these over raw browser APIs:
they integrate with the SDK lifecycle, prevent memory leaks, and are gated by
configuration so production behavior can differ from dev.

Linked from `.ai/CONVENTIONS.md` (Logging + LightningJS sections).

---

## Log — gated logger (replaces `console.*`)

```ts
import { Log } from '@lightningjs/sdk'

Log.info(...)   // green badge
Log.debug(...)  // gray badge
Log.warn(...)   // orange badge
Log.error(...)  // red badge
```

### Gating

Honors `platformSettings.log` in `settings.json`:

```json
{
  "platformSettings": {
    "log": true,
    "esEnv": "es5"
  }
}
```

- `log: true` → calls forward to `console.{info,debug,warn,error}` with a styled prefix.
- `log: false` → calls are no-ops. Use this for production builds to mute all output.

### Why prefer `Log` over `console.*`

- Single switch silences everything in production.
- Consistent styled prefix makes call sites scannable in DevTools.
- Consistent across the project; aids cross-repo reading when sibling repos also adopt it.

### Argument shape

`Log.<level>('label', ...rest)` — first string arg becomes the badge label. Single-arg form
defaults the label to the level name. Don't template identity (`playerId`, `sessionId`,
tokens) into the message — production muting is not a security boundary.

---

## Registry — auto-cleanup proxy for timers, intervals, listeners

```ts
import { Registry } from '@lightningjs/sdk'

const id = Registry.setTimeout(() => { ... }, 5000)
Registry.clearTimeout(id)

const intId = Registry.setInterval(() => { ... }, 1000)
Registry.clearInterval(intId)

Registry.addEventListener(target, 'click', handler)
Registry.removeEventListener(target, 'click', handler)

Registry.clear()       // clearTimeouts + clearIntervals + removeEventListeners
```

The SDK calls `Registry.clear()` automatically when the app closes, freeing every
registered resource. Raw `window.setTimeout` / `window.addEventListener` calls are NOT
tracked and leak across hot reloads or app teardown.

### Type pattern for stored handles

```ts
private _timer: ReturnType<typeof Registry.setTimeout> | null = null
```

Survives SDK return-type changes and stays consistent regardless of the underlying timer implementation.

### Gotcha: `Registry.clearTimeout` is intolerant of expired IDs

Unlike `window.clearTimeout` (silently no-ops on unknown IDs), `Registry.clearTimeout`
logs `Log.error('Clear Timeout', 'ID X not found')` if the ID is not in its internal
tracking array.

The internal wrapper auto-removes the ID from tracking **when the timer fires**:

```js
// from @lightningjs/sdk/src/Registry/index.js
setTimeout(cb, timeout, ...params) {
    const timeoutId = setTimeout(() => {
        registry.timeouts = registry.timeouts.filter(id => id !== timeoutId)  // ← auto-de-register
        cb.apply(null, params)
    }, timeout, params)
    registry.timeouts.push(timeoutId)
    return timeoutId
}
```

**Symptom:** Inside a fired timer callback, you keep the ID in your own field. Later
code (e.g. a shared "resolve flow" helper) calls `Registry.clearTimeout(thatId)` →
spurious error in the console.

**Fix:** Null your local handle inside the timer callback before calling any downstream
cleanup chain.

```ts
private _onAdRequestTimeout(): void {
    if (this._adFlowResolved) return
    this._adRequestTimeoutId = null    // ← timer fired; mark as no-longer-tracked
    this._continueToGameLaunch()       // downstream _clearAdRequestTimeout short-circuits on null
}

private _clearAdRequestTimeout(): void {
    if (this._adRequestTimeoutId === null) return    // null guard avoids the Registry error
    Registry.clearTimeout(this._adRequestTimeoutId)
    this._adRequestTimeoutId = null
}
```

The null guard at the top of `_clearAdRequestTimeout` is what makes the post-fire path
safe; the null assignment inside the fired callback is what triggers that guard.

### When `addEventListener` should go through Registry

- Component-scoped listeners that should die with the component.
- Listeners added inside `_init`/`_attach`/`_active` lifecycles.
- Anything you'd otherwise need a manual `_detach` to remove.

For module-level listeners that intentionally outlive component teardown, raw
`window.addEventListener` is acceptable — but document why in a one-line comment.

---

## Other SDK built-ins worth knowing

| Built-in | Use instead of | Notes |
|---|---|---|
| `Storage` | `localStorage` | Pluggable backend; works in restricted Smart TV runtimes |
| `Settings.get('platform', 'log')` | reading config JSON manually | Honors merged `appSettings` + `platformSettings` from `settings.json` |
| `Img` | manual `<img>` preloading | Honors cache + texture upload semantics |
| `Router` | hash-route plumbing | Owns history, deep-link, and back-stack |
| `Events` | global event bus | Decouples cross-component pub/sub |
| `Utils.asset(path)` | hardcoded `./static/...` | Honors the configured asset path |

Confirm signatures and gotchas via Context7 or the in-repo `node_modules/@lightningjs/sdk/src`
source before adopting; the SDK has evolved across versions.

---

## See also

- `.ai/docs/registry.md` — SDK-supplied Registry reference (full API).
- `.ai/CONVENTIONS.md` — Logging section + optional LightningJS / Smart TV section from
  `.ai/extras/conventions/smart-tv.md` (the rules that point here).
