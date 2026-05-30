# Smart TV / 10-foot UI conventions snippet

Copy the section below into `.ai/CONVENTIONS.md` after "Architecture" if your project
targets TV / 10-foot experiences (LightningJS, Tizen, Run3TV, WebOS, Vizio, older Chromium
engines, remote-control navigation).

Edit platform names to match the actual TV runtimes you target.

---

## LightningJS / Smart TV

- Be conservative with modern browser APIs.
- Avoid heavy DOM assumptions unless the project is actually DOM-based.
- Respect focus management and remote-control navigation patterns.
- Consider memory pressure, startup time, image loading, and older web engines.
- Do not use flexbox or CSS grid for TV-targeted UI unless explicitly approved.
- Prefer layouts that remain stable on constrained TV browsers and remote-control
  navigation.
- Ensure interactive UI has visible focus states and predictable directional navigation.
- Consider Samsung Tizen lifecycle and TV iframe behavior when changing runtime flows.
- Consult your platform-abstraction layer (PAL) source before changing TV platform
  assumptions.
