// Runs before first paint so the stored colour scheme never flashes.
// Loaded as a classic (render-blocking) script from index.html, which keeps the
// production CSP free of 'unsafe-inline' for scripts.
;(function () {
  try {
    var stored = localStorage.getItem('pixelkit.theme')
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    var theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  } catch {
    // Private mode or blocked storage: fall back to the light theme.
    document.documentElement.setAttribute('data-theme', 'light')
  }
})()
