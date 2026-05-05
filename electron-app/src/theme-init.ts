(() => {
  const prefix = window.hudhud?.isDev ? "dev:" : "";
  const theme = localStorage.getItem(`${prefix}hudhud:theme:v1`);
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
})();
