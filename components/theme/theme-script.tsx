// Runs before hydration (first child of <body>) so the `.dark` class is set
// before first paint — avoids a light→dark (or dark→light) flash on load.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("rynva-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "system";
    var isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
