const themeBtn = document.getElementById("themeBtn");

  themeBtn.addEventListener("click", () => {
    const darkMode = document.body.classList.toggle("dark-theme");

    themeBtn.textContent = darkMode ? "☀" : "☾";
    themeBtn.setAttribute("aria-pressed", String(darkMode));
    themeBtn.setAttribute(
      "aria-label",
      darkMode ? "Activar tema claro" : "Activar tema oscuro"
    );
  });