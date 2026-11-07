document.addEventListener("DOMContentLoaded", () => {
  const ticketList = document.getElementById("userTicketList");
  const refreshButton = document.getElementById("refreshTickets");
  const message = document.getElementById("ticketMessage");

  if (!ticketList) return;

  const normalize = value =>
    String(value ?? "").trim().toLowerCase();

  function showMessage(text, type = "") {
    if (!message) return;

    message.textContent = text;
    message.classList.toggle("error", type === "error");
    message.classList.toggle("success", type === "success");
  }

  function showEmpty(text) {
    ticketList.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "user-empty";
    cell.textContent = text;

    row.appendChild(cell);
    ticketList.appendChild(row);
  }

  function loadTicketHistory() {
    let session;
    let tickets;

    try {
      session = JSON.parse(
        localStorage.getItem("innoventSession") || "null"
      );

      tickets = JSON.parse(
        localStorage.getItem("innoventTickets") || "[]"
      );
    } catch {
      showEmpty("No fue posible cargar el historial.");
      showMessage("Error al leer los datos.", "error");
      return;
    }

    const user = session?.user;

    if (!session?.authenticated || !user?.email) {
      window.location.href = "./login.html";
      return;
    }

    if (normalize(user.role) !== "user") {
      showEmpty("Esta sección es exclusiva para usuarios.");
      showMessage("No tienes acceso a esta sección.", "error");
      return;
    }

    // Mostrar únicamente tickets vinculados al correo de la sesión.
    const userTickets = (Array.isArray(tickets) ? tickets : [])
      .filter(ticket => {
        const ticketEmail = ticket.userEmail || ticket.email;
        return normalize(ticketEmail) === normalize(user.email);
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });

    if (userTickets.length === 0) {
      showEmpty("Todavía no tienes tickets registrados en tu historial.");
      showMessage("");
      return;
    }

    const fragment = document.createDocumentFragment();

    userTickets.forEach(ticket => {
      const row = document.createElement("tr");

      const values = [
        ticket.id ?? ticket.ticketId ?? "Sin ID",
        ticket.title || ticket.subject || "Sin título",
        ticket.category || "Sin categoría",
        ticket.priority || "Media"
      ];

      values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.appendChild(cell);
      });

      const statusCell = document.createElement("td");
      const status = ticket.status || "Pendiente";
      const badge = document.createElement("span");

      badge.className = "ticket-status";
      badge.dataset.status = status;
      badge.textContent = status;

      statusCell.appendChild(badge);
      row.appendChild(statusCell);

      const dateCell = document.createElement("td");
      const date = new Date(ticket.createdAt || "");

      dateCell.textContent =
        ticket.createdAt && !Number.isNaN(date.getTime())
          ? date.toLocaleDateString("es-CO")
          : "No disponible";

      row.appendChild(dateCell);
      fragment.appendChild(row);
    });

    ticketList.replaceChildren(fragment);

    showMessage(
      `Se encontraron ${userTickets.length} ticket(s) en tu historial.`,
      "success"
    );
  }

  refreshButton?.addEventListener("click", loadTicketHistory);

  // Actualizar cuando otra pestaña modifique los tickets.
  window.addEventListener("storage", event => {
    if (
      event.key === "innoventTickets" ||
      event.key === "innoventSession"
    ) {
      loadTicketHistory();
    }
  });

  loadTicketHistory();
});