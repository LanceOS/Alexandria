// Apply the saved palette before the page paints, including on a cold load.
(() => {
  let theme;
  try { theme = localStorage.getItem('alexandria.theme'); } catch { /* Storage is optional. */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1b1b1d' : '#f8f7f4');
})();
