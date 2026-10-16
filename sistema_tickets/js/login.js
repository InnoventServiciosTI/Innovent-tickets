document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const loginMessage = document.getElementById("loginMessage");
  const forgotPassword = document.getElementById("forgotPassword");

  /*
   * USUARIO TEMPORAL
   *
   * SOLO PARA PRUEBAS DEL FRONTEND.
   *
   * En producción:
   * Node.js + MySQL + bcrypt + sesión/JWT
   */

  const demoUser = {
    email: "admin@innovent.com",
    password: "Innovent123",
    name: "Administrador",
    role: "Administrador"
  };


  /* =========================================
     MOSTRAR / OCULTAR CONTRASEÑA
  ========================================= */

  togglePassword.addEventListener("click", () => {

    const isPassword =
      passwordInput.type === "password";

    passwordInput.type =
      isPassword ? "text" : "password";

    togglePassword.textContent =
      isPassword ? "🙈" : "👁";

  });


  /* =========================================
     LOGIN
  ========================================= */

  loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const email =
      emailInput.value.trim().toLowerCase();

    const password =
      passwordInput.value;

    loginMessage.textContent = "";
    loginMessage.className = "login-message";


    if (!email || !password) {

      showError(
        "Completa todos los campos."
      );

      return;
    }


    if (
      email !== demoUser.email ||
      password !== demoUser.password
    ) {

      showError(
        "Correo o contraseña incorrectos."
      );

      return;
    }


    /*
     * Crear sesión local
     */

    const session = {

      authenticated: true,

      user: {
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role
      },

      loginAt: new Date().toISOString()

    };


    localStorage.setItem(
      "innoventSession",
      JSON.stringify(session)
    );


    showSuccess(
      "Acceso correcto. Iniciando sesión..."
    );


    setTimeout(() => {

      window.location.href = "index.html";

    }, 700);

  });


  /* =========================================
     RECUPERACIÓN
  ========================================= */

  forgotPassword.addEventListener("click", (event) => {

    event.preventDefault();

    alert(
      "La recuperación de contraseña será implementada mediante el servidor."
    );

  });


  /* =========================================
     MENSAJES
  ========================================= */

  function showError(message) {

    loginMessage.textContent = message;

    loginMessage.className =
      "login-message error";

  }


  function showSuccess(message) {

    loginMessage.textContent = message;

    loginMessage.className =
      "login-message success";

  }

});