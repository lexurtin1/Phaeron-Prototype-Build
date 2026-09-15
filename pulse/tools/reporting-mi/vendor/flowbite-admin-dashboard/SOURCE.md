# flowbite-admin-dashboard (Themesberg)

Vendored copy of [themesberg/flowbite-admin-dashboard](https://github.com/themesberg/flowbite-admin-dashboard) (MIT).

- Upstream commit: see `.upstream-commit` (`229df7ff25808ab2bbda65f03f2397a05f7b4288`)
- Used as the UI template for Phaeron Pulse **Reporting and MI**
- Runtime assets are built into `../../dist/` (`app.css`, `app.bundle.js`) so Pulse does not need Hugo at serve time

## Refresh

```bash
cd pulse/tools/reporting-mi/vendor
rm -rf flowbite-admin-dashboard
git clone --depth 1 https://github.com/themesberg/flowbite-admin-dashboard.git flowbite-admin-dashboard
cd flowbite-admin-dashboard
git rev-parse HEAD > .upstream-commit
npm install
# Phaeron primary colours + @source for ../../../*.html live in src/style.css
NODE_ENV=production npx webpack --mode=production
cp static/app.css ../../dist/
cp node_modules/apexcharts/dist/apexcharts.min.js ../../dist/
cp node_modules/flowbite/dist/flowbite.min.js ../../dist/
rm -rf .git node_modules
```

Hugo is optional (`npm run build` needs Hugo for full static site export). Pulse serves webpack CSS plus standalone Flowbite + ApexCharts from `../../dist/` (avoids the vendor `app.bundle.js` chart auto-init conflicting with Phaeron charts).
