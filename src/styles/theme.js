export function initializeTheme() {
  let theme = 'light'

  try {
    const savedTheme = localStorage.getItem('ft_theme')

    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme = savedTheme
    }
  } catch {
    // Use the light theme if storage is unavailable.
  }

  document.documentElement.dataset.theme = theme
}
