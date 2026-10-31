# Security policy

## Reporting a vulnerability

Open a private security advisory on GitHub
(<https://github.com/iiiiiiiiiiiiiKK/pixelkit/security/advisories/new>) or contact
the maintainer on X: <https://x.com/0xkillcoin>.

Please include reproduction steps and the browser version. Do not open a public
issue for anything that could put users at risk before a fix is available.

## Threat model

PixelKit is a static, client-side application with no backend, no accounts and no
persistence of user content. The realistic attack surface is therefore small:

| Risk | Mitigation |
| --- | --- |
| Exfiltration of user images | There is no server and no network call in the processing path. A strict CSP limits scripts and connections to the same origin. |
| Malicious image triggering a decoder bug | Decoding is delegated to the browser (`createImageBitmap`); PixelKit adds size limits (60 MB per file, 200 MP decoded, 100 MP per output) to avoid memory exhaustion. |
| Stored XSS through file names | File names are rendered as React text nodes only, never as HTML. Archive entry names are sanitised before they reach the ZIP builder. |
| Supply-chain compromise | Three runtime dependencies: `react`, `react-dom`, `fflate` (all MIT). No post-install scripts, no analytics, no remote assets at runtime. |
| Tampering with the hosted bundle | GitHub Pages serves the repository content over HTTPS; the build is reproducible via `npm ci && npm run build`. |

## Out of scope

- The hosting platform seeing IP addresses and user agents of page requests.
- Browser-level vulnerabilities in image decoders.
- Denial of service against your own machine by opening an enormous file locally.

## Supported versions

The deployed site always tracks `main`. Security fixes are shipped as commits to
`main`; there are no versioned releases to backport to.
