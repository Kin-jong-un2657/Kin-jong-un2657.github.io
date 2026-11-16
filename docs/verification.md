# Local verification — 16 November 2026

The Stage 2 static build passed locally using Node.js 22.23.5 and installed Google Chrome on Windows. These results describe the local verification before deployment.

| Check | Result |
| --- | --- |
| Static generation | Homepage, three case studies and a 404 page built successfully |
| Local links and assets | 89 local references resolved, including fragment targets |
| Publishing output | 17 files; no private evidence, source snapshots or node_modules |
| CV | Download returns HTTP 200 with application/pdf; identical to the current workspace PDF |
| Responsive layout | 24 checks passed: both themes, 320–1440px, landscape and 200% root text size |
| Accessibility | 16 axe-core audits, no detected violations after corrections |
| Browser console | No console errors or uncaught page errors recorded |
| Local resource requests | No HTTP failures recorded |
| Technology filtering | Filter results, URL state, Back navigation and reload passed |
| Theme preference | Both modes, reload persistence and blocked-storage fallback passed |
| Keyboard | Skip link, visible focus and Enter activation passed |
| Architecture diagrams | Local SVGs loaded on all three case pages; full-size links resolve |
| Public GitHub links | Both repositories and all three linked contribution commits resolved through the GitHub connector |

Machine-readable results and screenshots are available locally in `qa/artifacts/` after `npm run test:ui`. They are excluded from Git and the publishing artifact. The automated audits supplement visual review; they are not a claim of complete accessibility certification or cross-browser coverage.

## Interface guideline review

Reviewed against the current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), with the requested personal-portfolio voice and verified research content retained.

```text
src/styles.css:48 - corrected: navigation wraps at enlarged text sizes; 200% check passes.
scripts/build.mjs:94 - corrected: scrollable tables have distinct accessible names.
src/app.js:1 - pass: guarded theme preference, reduced motion and URL-backed filters.
scripts/build.mjs:45 - pass: skip link, semantic controls and labelled icons.
```

## Deployment boundary

The GitHub Actions workflow is prepared for a standalone `Kin-jong-un2657.github.io` repository, with the contents of `portfolio-site/` at the repository root. It deploys only `dist/` on push to `main` after building and checking. GitHub Pages must use GitHub Actions as its source.

Local checks alone do not establish remote deployment success; verify the GitHub Actions run and production URL after pushing. AIC211's metrics remain pending, and the downloadable CV is the original current PDF, including its editorial state.
