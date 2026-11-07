
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const message = document.getElementById("loginMessage");
    const loginButton = document.getElementById("loginButton");

    if (!form || !emailInput || !passwordInput || !message) {
        console.error(
            "Innovent: no se encontraron los elementos del formulario."
        );
        return;
    }

    const accounts = [
        {
            name: "Administrador Innovent",
            email: "admin@innovent.com",
            password: "Innovent123",
            role: "admin",
            page: "./admin.html"
        },
        {
            name: "Usuario Innovent",
            email: "usuario@innovent.com",
            password: "Usuario123",
            role: "user",
            page: "./usuario.html"
        }
    ];

    function showMessage(text, type = "error") {
        message.textContent = text;
        message.dataset.type = type;
    }

    // Mostrar u ocultar contraseña
    if (togglePassword) {
        togglePassword.addEventListener("click", function () {
            const show = passwordInput.type === "password";

            passwordInput.type = show ? "text" : "password";
            togglePassword.setAttribute(
                "aria-label",
                show ? "Ocultar contraseña" : "Mostrar contraseña"
            );
            togglePassword.setAttribute("aria-pressed", String(show));
        });
    }

    // Inicio de sesión
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const selectedRole = form.querySelector(
            'input[name="role"]:checked'
        );

        if (!selectedRole) {
            showMessage("Selecciona Administrador o Usuario.");
            return;
        }

        if (!email || !password) {
            showMessage("Ingresa tu correo y contraseña.");
            return;
        }

        if (!emailInput.checkValidity()) {
            showMessage("Ingresa un correo electrónico válido.");
            return;
        }

        const account = accounts.find(function (item) {
            return item.email === email &&
                   item.password === password &&
                   item.role === selectedRole.value;
        });

        if (!account) {
            showMessage(
                "Correo, contraseña o perfil incorrecto. Verifica los datos."
            );
            return;
        }

        const session = {
            authenticated: true,
            user: {
                name: account.name,
                email: account.email,
                role: account.role
            }
        };

        try {
            localStorage.setItem(
                "innoventSession",
                JSON.stringify(session)
            );

            // Confirmar que la sesión se guardó
            const savedSession = JSON.parse(
                localStorage.getItem("innoventSession")
            );

            if (
                !savedSession ||
                savedSession.authenticated !== true ||
                savedSession.user.role !== account.role
            ) {
                throw new Error("No se pudo verificar la sesión.");
            }

            showMessage("Acceso correcto. Abriendo el panel...", "success");

            if (loginButton) {
                loginButton.disabled = true;
            }

            window.location.assign(account.page);

        } catch (error) {
            console.error("Error de inicio de sesión:", error);

            showMessage(
                "No se pudo guardar la sesión. Comprueba el navegador y vuelve a intentarlo."
            );

            if (loginButton) {
                loginButton.disabled = false;
            }
        }
    });

    // Recuperación de contraseña aún no habilitada
    const forgotPassword = document.getElementById("forgotPassword");

    if (forgotPassword) {
        forgotPassword.addEventListener("click", function (event) {
            event.preventDefault();

            showMessage(
                "La recuperación de contraseña todavía no está habilitada."
            );
        });
    }
});