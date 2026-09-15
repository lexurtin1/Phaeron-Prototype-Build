# thinking-orbs (Libraries.dev)

Vendored build of [`thinking-orbs`](https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/thinking-orbs) from [Jakubantalik/Libraries.dev](https://github.com/Jakubantalik/Libraries.dev).

- Upstream commit: see `.libraries-dev-commit`
- Why vendor: the GitHub package path has no published `dist/`; npm registry `thinking-orbs` is the same library, but this pins the exact Libraries.dev build used in Pulse.

Refresh:

```bash
git clone --depth 1 https://github.com/Jakubantalik/Libraries.dev.git /tmp/Libraries.dev
cd /tmp/Libraries.dev/packages/thinking-orbs && npm install && npm run build
# copy dist/ + package.json metadata into this folder
```
