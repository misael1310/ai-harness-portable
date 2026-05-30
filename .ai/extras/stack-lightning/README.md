# LightningJS / Smart TV extra

Opt-in bundle for projects targeting LightningJS, Tizen, WebOS, Vizio, Run3TV,
or other TV / 10-foot / older-Chromium runtimes.

## Contents

| File | Purpose |
|---|---|
| `smart-tv.md` | Convention snippet — copy into `.ai/CONVENTIONS.md` after "Architecture" |
| `lightning-sdk-patterns.md` | Reference doc for `@lightningjs/sdk` built-ins (`Log`, `Registry`, etc.) — link from `CONVENTIONS.md` Logging / LightningJS sections |
| `lightningJs/registry.md` | Deep-dive on the SDK Registry API (timers, intervals, listeners) |

## How to adopt

1. Copy the relevant docs into `.ai/docs/`:

   ```bash
   cp .ai/extras/stack-lightning/lightning-sdk-patterns.md .ai/docs/
   cp -r .ai/extras/stack-lightning/lightningJs .ai/docs/
   ```

2. Open `smart-tv.md`. Copy the convention bullets into `.ai/CONVENTIONS.md`,
   after the "Architecture" section and before "Plans Convention".

3. Add a pointer to `lightning-sdk-patterns.md` from `CONVENTIONS.md` Logging
   section and from the new "LightningJS / Smart TV" section you added in
   step 2.

4. Verify the result stays under the ~200-line adherence threshold per
   `.ai/extras/conventions/README.md`. Split into a sibling file with a
   delegating pointer if you blow past it.

5. Run `/harness-check` to confirm everything still loads.

## Why opt-in

LightningJS / Smart TV is a narrow runtime target. Shipping the convention
inline in the default `CONVENTIONS.md` would bloat the boot context for the
majority of projects that target standard web / mobile / backend runtimes.
The bundle is here, fully written, ready to copy in two commands when needed.
