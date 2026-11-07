
document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("themeBtn");
  const root = document.documentElement;

  if (!themeBtn) {
    console.warn("No se encontró el botón #themeBtn.");
    return;
  }

  // Recuperar el tema guardado o utilizar el tema claro.
  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem("innovent-theme") || "light";
  } catch (error) {
    console.warn("No se pudo leer el tema guardado.");
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";

    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    themeBtn.textContent = isDark ? "☀" : "☾";
    themeBtn.setAttribute("aria-pressed", String(isDark));
    themeBtn.setAttribute(
      "aria-label",
      isDark ? "Activar tema claro" : "Activar tema oscuro"
    );
    themeBtn.setAttribute(
      "title",
      isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
    );
  }

  applyTheme(savedTheme);

  themeBtn.addEventListener("click", () => {
    const currentTheme = root.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);

    try {
      localStorage.setItem("innovent-theme", nextTheme);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia del tema.");
    }
  });
});