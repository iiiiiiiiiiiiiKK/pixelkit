# Contributing to PixelKit

Thanks for taking a look. PixelKit is deliberately small: one static bundle, no
server, no database. Please keep it that way.

## Ground rules

1. **No network calls with user data.** PixelKit's promise is that images never
   leave the device. A pull request that uploads a file, adds analytics, an ads
   SDK, a remote font or an icon CDN will be rejected.
2. **No fake features.** If a button cannot do the thing, it should not exist.
   No placeholder data, no rounded-up claims in the UI copy.
3. **Honest messaging.** PNG is lossless, JPEG has no alpha channel, a file can
   get bigger after re-encoding. The UI must say so rather than hide it.
4. **Every user-visible string goes through `src/i18n/dict.ts`**, in English and
   Simplified Chinese. The `zh` object is type-checked against `en`, so a missing
   translation fails `npm run typecheck`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5180
npm run check      # lint + typecheck + unit tests + production build
npm run test:e2e   # Playwright, needs `npx playwright install chromium webkit`
```

## Project layout

```
src/
  engine/        pure image pipeline: format sniffing, geometry, worker, ZIP
  workspace/     queue state, tool settings, crop maths, tool panels
  components/    design-system primitives and layout chrome
  pages/         home, workspace, guide, privacy
  i18n/          dictionaries and provider
tests/
  unit/          Vitest, no DOM required
  e2e/           Playwright, real Chromium + real WebKit (iPhone viewport)
```

Rules of thumb:

- Anything that touches pixels or bytes belongs in `src/engine/` and must stay
  free of React.
- Pure maths (geometry, renaming, crop rectangles) must have unit tests.
- Anything the user can click must have an end-to-end test in `tests/e2e/`.

## Pull requests

- Keep diffs focused; unrelated reformatting makes review harder.
- Run `npm run check` and `npm run test:e2e` before opening the PR.
- Describe *what changed and why*, and mention any behaviour that is intentionally
  limited (for example "Safari cannot encode AVIF, so the option is hidden").
- Screenshots help for UI changes. Use the real app, not mockups.

## Reporting bugs

Open an issue with: the browser and version, the file type and size that failed,
what you expected, what happened, and any console output. Please do not attach
private photos — a synthetic image that reproduces the problem is enough.

## License

By contributing you agree that your work is released under the MIT License.
