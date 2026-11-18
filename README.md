# Ha Trung Kien — Personal Portfolio

Static HTML5, compiled Tailwind CSS and vanilla JavaScript. No backend, runtime framework, external fonts or CDN scripts. The build produces the homepage, three complete technical case studies, local architecture SVGs, a CV download and a 404 page.

## Local development

Use Node.js 22.13+ and npm:

```sh
npm ci
npm run build
npm run check
npm run preview
```

Open `http://127.0.0.1:4321`. Rebuild after changing content, templates, CSS or JavaScript. `dist/` is the complete deployable output.

In the current Windows workspace, you can also run `./portfolio-site/Start-Preview.ps1` from the parent directory. It uses Node on your PATH or the existing temporary portable runtime. Stop the preview with Ctrl+C.

When this folder remains inside the CV workspace, `npm run build` automatically syncs the three case studies from `../portfolio-content.md`, the approved diagrams from `../portfolio-assets/diagrams/`, and the current `../CV_Updated.pdf`. It never copies `CV_Evidence/` or private repository snapshots. The CV is copied byte-for-byte, including its current editorial state; update the root CV through its documented A4 pipeline before replacing it.

When published as a standalone repository, the build uses the committed `content/projects.json` and `public/assets/` copies. These keep the site independent of the CV workspace.

## Structure

```text
content/projects.json       Public case-study content
src/styles.css             Theme tokens and responsive styles
src/app.js                 Theme preference and technology filters
scripts/build.mjs          Static page generation and local assets
scripts/sync-content.mjs   Controlled workspace content/CV sync
scripts/check.mjs          Link, content-integrity and publishing checks
scripts/serve.mjs          Local static preview server
public/assets/             Approved diagrams, favicon and CV
qa/browser.mjs            Chromium interaction/accessibility checks
.github/workflows/deploy.yml
```

## Content integrity

- Unverified metrics are displayed as status badges; raw editorial placeholders are not rendered.
- AIC211 presents the author-confirmed corrected grouped evaluation (18 November 2026): 99.18% accuracy/macro F1, 99.52% BEC recall, 0.10% benign-to-BEC FPR (3/3,000), 9,497 test emails from 63,305 emails, and 16 pytest tests. It retains uncalibrated-SVM, English-only-regex and unmeasured cross-source limitations.
- IAM302t links to the official public repository IAM302t-Group6-Byteplot, while retaining the distinction between audit records, variants and independent parents. Private research inputs remain outside the publishing bundle.
- MiniEcommerce counts 14 test functions, not 14 newly passing cases; its link points to the canonical team repository.
- The Forensics & tools category describes verified static inspection/research tooling, without inventing incident-response experience.
- Internal evidence links become plain text in public case studies. Build checks reject evidence paths and unexpected source files from `dist/`.

## Browser verification

```sh
npm run test:ui
```

The browser check starts its own temporary local HTTP server, uses an installed Chrome via `CHROME_PATH` (Windows default is detected), runs interactions and axe-core in both themes, and saves results/screenshots under `qa/artifacts/`. It does not download a browser or submit any data. Set `CHROME_PATH` to your installed Chrome binary on other platforms.

## GitHub Pages deployment

The intended repository is **`Kin-jong-un2657.github.io`**. Put the **contents of this `portfolio-site` folder at that repository's root**, including `.github/`, `package.json`, `package-lock.json`, `content/` and `public/`. Do not push the entire parent CV workspace.

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. The workflow builds/checks on push to `main` or manual dispatch, uploads only `dist/`, and deploys through the `github-pages` environment. It follows the [official custom-workflow structure](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The workflow deploys the public portfolio at [kin-jong-un2657.github.io](https://kin-jong-un2657.github.io/). Only this standalone website repository is published; the parent CV workspace remains outside its Git boundary.

## Design and review

See [the design contract](docs/design-contract.md). The implementation applies `frontend-design`, `ui-ux-pro-max` and the [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines). Manrope is self-hosted under its included SIL Open Font License. Diagrams retain the approved research architecture and use local SVG files.
