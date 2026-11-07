
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =====================================================
  // INNOVENT SERVICIOS TI - GESTIÓN DE TICKETS
  // Panel administrativo
  // =====================================================

  const TICKETS_KEY = "innoventTickets";
  const SESSION_KEY = "innoventSession";
  const THEME_KEY = "innoventTheme";

  const STATUSES = ["Abierto", "En progreso", "Resuelto", "Cerrado"];
  const PRIORITIES = ["Alta", "Media", "Baja"];
  const VALID_VIEWS = ["dashboard", "tickets", "new"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    ticketsTable: $("#ticketsTable"),
    emptyTickets: $("#emptyTickets"),
    ticketForm: $("#ticketForm"),
    searchInput: $("#searchInput"),
    statusFilter: $("#statusFilter"),
    priorityFilter: $("#priorityFilter"),
    categoryFilter: $("#categoryFilter"),
    selectAll: $("#selectAll"),
    bulkBar: $("#bulkBar"),
    selectedCount: $("#selectedCount"),
    bulkDeleteBtn: $("#bulkDeleteBtn"),

    totalStat: $("#totalStat"),
    progressStat: $("#progressStat"),
    highStat: $("#highStat"),
    resolvedStat: $("#resolvedStat"),
    recentTickets: $("#recentTickets"),

    openCount: $("#openCount"),
    progressCount: $("#progressCount"),
    resolvedCount: $("#resolvedCount"),
    openBar: $("#openBar"),
    progressBar: $("#progressBar"),
    resolvedBar: $("#resolvedBar"),

    ticketModal: $("#ticketModal"),
    modalContent: $("#modalContent"),
    toastContainer: $("#toastContainer"),

    modalClose: $("#modalClose"),
    exportBtn: $("#exportBtn"),
    importInput: $("#importInput"),
    logoutBtn: $("#logoutBtn"),
    themeBtn: $("#themeBtn"),
    topNewBtn: $("#topNewBtn"),
    menuBtn: $("#menuBtn"),
    sidebar: $("#sidebar"),
    pageTitle: $("#pageTitle"),

    advisorPanel: $("#advisorPanel"),
    advisorMessages: $("#advisorMessages"),
    advisorForm: $("#advisorForm"),
    advisorInput: $("#advisorInput"),
    advisorFab: $("#advisorFab"),
    advisorClose: $("#advisorClose"),
    advisorSuggestions: $("#advisorSuggestions")
  };

  let storageCorrupted = false;
  let storageWarningShown = false;

  // =====================================================
  // SESIÓN Y AUTORIZACIÓN
  // =====================================================

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("No se pudo leer la sesión:", error);
      return null;
    }
  }

  const session = getSession();

  const user = session?.user || session;
  const role = String(user?.role || session?.role || "")
    .trim()
    .toLowerCase();

  if (!session || session.authenticated !== true || role !== "admin") {
    window.location.replace("copialogin.html");
    return;
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  function createId() {
    if (window.crypto?.randomUUID) {
      return "TKT-" + crypto.randomUUID().toUpperCase();
    }

    return (
      "TKT-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 9).toUpperCase()
    );
  }

  function normalizeText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;

    return String(value).trim() || fallback;
  }

  function normalizeStatus(status) {
    const normalized = normalizeText(status).toLowerCase();

    const aliases = {
      pendiente: "Abierto",
      abierto: "Abierto",
      "en proceso": "En progreso",
      "en progreso": "En progreso",
      resuelto: "Resuelto",
      cerrado: "Cerrado"
    };

    return aliases[normalized] || "Abierto";
  }

  function normalizePriority(priority) {
    const normalized = normalizeText(priority).toLowerCase();

    const aliases = {
      alta: "Alta",
      media: "Media",
      baja: "Baja"
    };

    return aliases[normalized] || "Media";
  }

  function normalizeTicket(ticket, usedIds = new Set()) {
    const source =
      ticket && typeof ticket === "object" && !Array.isArray(ticket)
        ? ticket
        : {};

    let id = normalizeText(source.id, createId());

    // Evitar identificadores duplicados.
    if (usedIds.has(id)) {
      id = createId();

      while (usedIds.has(id)) {
        id = createId();
      }
    }

    usedIds.add(id);

    const createdAt = normalizeText(
      source.createdAt,
      new Date().toISOString()
    );

    return {
      ...source,
      id,

      userId: normalizeText(source.userId, ""),
      userEmail: normalizeText(
        source.userEmail,
        normalizeText(source.email, "")
      ),
      userName: normalizeText(
        source.userName,
        normalizeText(source.client, "Sin nombre")
      ),

      client: normalizeText(
        source.client,
        normalizeText(source.userName, "Sin nombre")
      ),

      email: normalizeText(
        source.email,
        normalizeText(source.userEmail, "")
      ),

      title: normalizeText(
        source.title,
        normalizeText(source.subject, "Sin título")
      ),

      subject: normalizeText(
        source.subject,
        normalizeText(source.title, "Sin título")
      ),

      category: normalizeText(source.category, "Consulta"),
      priority: normalizePriority(source.priority),
      status: normalizeStatus(source.status),
      description: normalizeText(source.description, ""),
      contact: normalizeText(source.contact, ""),
      createdAt,
      updatedAt: normalizeText(source.updatedAt, createdAt)
    };
  }

  function getTickets() {
    let raw;

    try {
      raw = localStorage.getItem(TICKETS_KEY);
    } catch (error) {
      console.error("No se pudo acceder al almacenamiento:", error);
      storageCorrupted = true;
      notify("No se puede acceder al almacenamiento de tickets.", "error");
      return [];
    }

    if (raw === null || raw === "") {
      storageCorrupted = false;
      return [];
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error("El JSON de tickets está dañado:", error);
      storageCorrupted = true;

      if (!storageWarningShown) {
        notify(
          "Los datos guardados están dañados. Exporta o recupera una copia antes de continuar.",
          "error"
        );
        storageWarningShown = true;
      }

      return [];
    }

    if (!Array.isArray(data)) {
      storageCorrupted = true;

      if (!storageWarningShown) {
        notify(
          "El almacenamiento no contiene una lista válida de tickets.",
          "error"
        );
        storageWarningShown = true;
      }

      return [];
    }

    storageCorrupted = false;
    storageWarningShown = false;

    const usedIds = new Set();

    return data
      .filter(
        ticket =>
          ticket &&
          typeof ticket === "object" &&
          !Array.isArray(ticket)
      )
      .map(ticket => normalizeTicket(ticket, usedIds));
  }

  function saveTickets(tickets, options = {}) {
    const { allowRecovery = false } = options;

    if (storageCorrupted && !allowRecovery) {
      notify(
        "Guardado bloqueado para evitar sobrescribir datos dañados. Recupera una copia mediante Importar.",
        "error"
      );
      return false;
    }

    if (!Array.isArray(tickets)) {
      notify("No se pueden guardar datos con un formato inválido.", "error");
      return false;
    }

    try {
      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
      storageCorrupted = false;
      storageWarningShown = false;
      return true;
    } catch (error) {
      console.error("Error guardando los tickets:", error);

      notify(
        "No se pudieron guardar los tickets. Comprueba el espacio disponible del navegador.",
        "error"
      );

      return false;
    }
  }

  function formatDate(value) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Sin fecha"
      : date.toLocaleString("es-CO");
  }

  function notify(message, type = "success") {
    if (!elements.toastContainer) {
      console.log(`[Innovent] ${message}`);
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", "polite");

    elements.toastContainer.appendChild(toast);

    window.setTimeout(() => toast.remove(), 4000);
  }

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  function updateStatistics(tickets) {
    const total = tickets.length;

    const open = tickets.filter(
      ticket => ticket.status === "Abierto"
    ).length;

    const progress = tickets.filter(
      ticket => ticket.status === "En progreso"
    ).length;

    const resolved = tickets.filter(
      ticket => ["Resuelto", "Cerrado"].includes(ticket.status)
    ).length;

    const high = tickets.filter(
      ticket => ticket.priority === "Alta"
    ).length;

    if (elements.totalStat) elements.totalStat.textContent = total;
    if (elements.progressStat) elements.progressStat.textContent = progress;
    if (elements.highStat) elements.highStat.textContent = high;
    if (elements.resolvedStat) elements.resolvedStat.textContent = resolved;

    if (elements.openCount) elements.openCount.textContent = open;
    if (elements.progressCount) elements.progressCount.textContent = progress;
    if (elements.resolvedCount) elements.resolvedCount.textContent = resolved;

    const denominator = total || 1;

    if (elements.openBar) {
      elements.openBar.style.width = `${(open / denominator) * 100}%`;
    }

    if (elements.progressBar) {
      elements.progressBar.style.width =
        `${(progress / denominator) * 100}%`;
    }

    if (elements.resolvedBar) {
      elements.resolvedBar.style.width =
        `${(resolved / denominator) * 100}%`;
    }
  }

  // =====================================================
  // FILTROS
  // =====================================================

  function getFilteredTickets(tickets) {
    const query = normalizeText(elements.searchInput?.value)
      .toLocaleLowerCase("es-CO");

    const status = elements.statusFilter?.value || "all";
    const priority = elements.priorityFilter?.value || "all";
    const category = elements.categoryFilter?.value || "all";

    return tickets.filter(ticket => {
      const searchable = [
        ticket.id,
        ticket.title,
        ticket.subject,
        ticket.client,
        ticket.email,
        ticket.description,
        ticket.category,
        ticket.status,
        ticket.priority
      ]
        .join(" ")
        .toLocaleLowerCase("es-CO");

      return (
        (!query || searchable.includes(query)) &&
        (status === "all" || ticket.status === status) &&
        (priority === "all" || ticket.priority === priority) &&
        (category === "all" || ticket.category === category)
      );
    });
  }

  // =====================================================
  // TABLA DE TICKETS
  // =====================================================

  function getSelectedIds() {
    return $$(".ticket-select:checked").map(
      checkbox => checkbox.value
    );
  }

  function updateBulkBar() {
    const selected = getSelectedIds();

    if (elements.selectedCount) {
      elements.selectedCount.textContent =
        `${selected.length} seleccionados`;
    }

    elements.bulkBar?.classList.toggle("hidden", selected.length === 0);

    if (elements.selectAll) {
      const checkboxes = $$(".ticket-select");

      elements.selectAll.checked =
        checkboxes.length > 0 &&
        checkboxes.every(checkbox => checkbox.checked);

      elements.selectAll.indeterminate =
        checkboxes.some(checkbox => checkbox.checked) &&
        !checkboxes.every(checkbox => checkbox.checked);
    }
  }

  function renderTickets() {
    if (!elements.ticketsTable) return;

    // Guardar la selección antes de borrar las filas anteriores.
    const selectedBeforeRender = new Set(getSelectedIds());

    const allTickets = getTickets();

    const tickets = getFilteredTickets(allTickets).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });

    elements.ticketsTable.replaceChildren();

    tickets.forEach(ticket => {
      const row = document.createElement("tr");

      // Selección.
      const selectCell = document.createElement("td");
      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.className = "ticket-select";
      checkbox.value = String(ticket.id);
      checkbox.checked = selectedBeforeRender.has(String(ticket.id));
      checkbox.setAttribute(
        "aria-label",
        `Seleccionar ticket ${ticket.id}`
      );

      selectCell.appendChild(checkbox);
      row.appendChild(selectCell);

      // Identificador.
      const idCell = document.createElement("td");
      idCell.textContent = ticket.id;
      row.appendChild(idCell);

      // Título.
      const titleCell = document.createElement("td");
      titleCell.textContent = ticket.title;
      row.appendChild(titleCell);

      // Cliente.
      const clientCell = document.createElement("td");
      clientCell.textContent = ticket.client;
      row.appendChild(clientCell);

      // Prioridad.
      const priorityCell = document.createElement("td");
      const priorityBadge = document.createElement("span");

      priorityBadge.className =
        `ticket-priority priority-${ticket.priority.toLowerCase()}`;

      priorityBadge.textContent = ticket.priority;
      priorityCell.appendChild(priorityBadge);
      row.appendChild(priorityCell);

      // Estado editable.
      const statusCell = document.createElement("td");
      const statusSelect = document.createElement("select");

      statusSelect.className = "admin-ticket-status";
      statusSelect.setAttribute(
        "aria-label",
        `Estado del ticket ${ticket.id}`
      );

      STATUSES.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = ticket.status === status;
        statusSelect.appendChild(option);
      });

      statusSelect.addEventListener("change", () => {
        updateTicketStatus(ticket.id, statusSelect.value);
      });

      statusCell.appendChild(statusSelect);
      row.appendChild(statusCell);

      // Fecha.
      const dateCell = document.createElement("td");
      dateCell.textContent = formatDate(ticket.createdAt);
      row.appendChild(dateCell);

      // Acciones.
      const actionCell = document.createElement("td");
      const detailButton = document.createElement("button");

      detailButton.type = "button";
      detailButton.className = "text-btn";
      detailButton.textContent = "Ver detalle";

      detailButton.addEventListener("click", () => {
        showTicketDetail(ticket.id);
      });

      actionCell.appendChild(detailButton);
      row.appendChild(actionCell);

      elements.ticketsTable.appendChild(row);
    });

    if (elements.emptyTickets) {
      elements.emptyTickets.classList.toggle(
        "hidden",
        tickets.length > 0
      );
    }

    updateBulkBar();
  }

  // =====================================================
  // ACTUALIZAR ESTADO
  // =====================================================

  function updateTicketStatus(ticketId, newStatus) {
    if (!STATUSES.includes(newStatus)) {
      notify("El estado seleccionado no es válido.", "error");
      return;
    }

    const tickets = getTickets();

    const ticket = tickets.find(
      item => String(item.id) === String(ticketId)
    );

    if (!ticket) {
      notify("No se encontró el ticket.", "error");
      renderAll();
      return;
    }

    const previousStatus = ticket.status;

    ticket.status = newStatus;
    ticket.updatedAt = new Date().toISOString();

    if (!saveTickets(tickets)) {
      renderAll();
      return;
    }

    notify(
      `Ticket ${ticketId}: ${previousStatus} → ${newStatus}.`
    );

    renderAll();
  }

  // =====================================================
  // DETALLE DEL TICKET
  // =====================================================

  function showTicketDetail(ticketId) {
    const ticket = getTickets().find(
      item => String(item.id) === String(ticketId)
    );

    if (!ticket || !elements.ticketModal || !elements.modalContent) {
      return;
    }

    elements.modalContent.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = `Ticket ${ticket.id}`;
    elements.modalContent.appendChild(heading);

    const details = [
      ["Título", ticket.title],
      ["Cliente", ticket.client],
      ["Correo", ticket.email || "No especificado"],
      ["Categoría", ticket.category],
      ["Prioridad", ticket.priority],
      ["Estado", ticket.status],
      ["Fecha de creación", formatDate(ticket.createdAt)],
      ["Última actualización", formatDate(ticket.updatedAt)],
      ["Descripción", ticket.description || "Sin descripción"]
    ];

    details.forEach(([label, value]) => {
      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");

      strong.textContent = `${label}: `;

      paragraph.appendChild(strong);
      paragraph.appendChild(
        document.createTextNode(String(value ?? ""))
      );

      elements.modalContent.appendChild(paragraph);
    });

    elements.ticketModal.classList.remove("hidden");
    elements.ticketModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    elements.ticketModal?.classList.add("hidden");
    elements.ticketModal?.setAttribute("aria-hidden", "true");
  }

  elements.modalClose?.addEventListener("click", closeModal);

  elements.ticketModal?.addEventListener("click", event => {
    if (event.target === elements.ticketModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  // =====================================================
  // TICKETS RECIENTES
  // =====================================================

  function renderRecentTickets(tickets) {
    if (!elements.recentTickets) return;

    elements.recentTickets.replaceChildren();

    const recent = tickets
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    if (recent.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Todavía no hay tickets registrados.";
      elements.recentTickets.appendChild(empty);
      return;
    }

    recent.forEach(ticket => {
      const item = document.createElement("div");
      item.className = "recent-ticket";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute(
        "aria-label",
        `Ver detalles del ticket ${ticket.id}`
      );

      const title = document.createElement("strong");
      title.textContent = ticket.title;

      const meta = document.createElement("p");
      meta.textContent =
        `${ticket.id} · ${ticket.client} · ${ticket.status}`;

      item.append(title, meta);

      item.addEventListener("click", () => {
        showTicketDetail(ticket.id);
      });

      item.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showTicketDetail(ticket.id);
        }
      });

      elements.recentTickets.appendChild(item);
    });
  }

  function renderAll() {
    const tickets = getTickets();

    updateStatistics(tickets);
    renderTickets();
    renderRecentTickets(tickets);
  }

  // =====================================================
  // CREAR TICKET
  // =====================================================

  elements.ticketForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!elements.ticketForm.reportValidity()) return;

    const formData = new FormData(elements.ticketForm);

    const client = normalizeText(formData.get("client"));
    const email = normalizeText(formData.get("email"));
    const title = normalizeText(formData.get("title"));
    const category = normalizeText(
      formData.get("category"),
      "Consulta"
    );
    const priority = normalizePriority(formData.get("priority"));
    const description = normalizeText(
      formData.get("description")
    );

    if (!client || !title || !description) {
      notify(
        "Completa el nombre del cliente, el título y la descripción.",
        "error"
      );
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      notify("Introduce un correo electrónico válido.", "error");
      return;
    }

    const tickets = getTickets();
    const now = new Date().toISOString();

    const newTicket = {
      id: createId(),

      // Datos de propiedad y contacto.
      userId: normalizeText(user.id, ""),
      userName: client,
      userEmail: email,

      client,
      email,
      title,
      subject: title,
      category,
      priority,
      description,
      contact: email,

      status: "Abierto",
      createdAt: now,
      updatedAt: now
    };

    tickets.push(newTicket);

    if (!saveTickets(tickets)) return;

    elements.ticketForm.reset();

    renderAll();
    notify(`Ticket ${newTicket.id} creado correctamente.`);
    showView("tickets");
  });

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  function showView(viewName) {
    if (!VALID_VIEWS.includes(viewName)) return;

    $$(".view").forEach(view => {
      view.classList.remove("active-view");
      view.setAttribute("aria-hidden", "true");
    });

    const target = $(`#${viewName}View`);

    if (target) {
      target.classList.add("active-view");
      target.setAttribute("aria-hidden", "false");
    }

    $$("[data-view]").forEach(button => {
      const active = button.dataset.view === viewName;

      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (elements.pageTitle) {
      elements.pageTitle.textContent = {
        dashboard: "Dashboard",
        tickets: "Tickets",
        new: "Nuevo ticket"
      }[viewName];
    }

    elements.sidebar?.classList.remove("sidebar-open");

    if (viewName === "tickets") {
      renderTickets();
    }
  }

  $$("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  $$("[data-view-target]").forEach(button => {
    button.addEventListener("click", () => {
      showView(button.dataset.viewTarget);
    });
  });

  elements.topNewBtn?.addEventListener("click", () => {
    showView("new");
  });

  elements.menuBtn?.addEventListener("click", () => {
    elements.sidebar?.classList.toggle("sidebar-open");
  });

  // =====================================================
  // BÚSQUEDA Y FILTROS
  // =====================================================

  [
    elements.searchInput,
    elements.statusFilter,
    elements.priorityFilter,
    elements.categoryFilter
  ].forEach(control => {
    control?.addEventListener("input", renderTickets);
    control?.addEventListener("change", renderTickets);
  });

  // =====================================================
  // SELECCIÓN MÚLTIPLE Y ELIMINACIÓN
  // =====================================================

  elements.ticketsTable?.addEventListener("change", event => {
    if (event.target.matches(".ticket-select")) {
      updateBulkBar();
    }
  });

  elements.selectAll?.addEventListener("change", () => {
    $$(".ticket-select").forEach(checkbox => {
      checkbox.checked = elements.selectAll.checked;
    });

    updateBulkBar();
  });

  elements.bulkDeleteBtn?.addEventListener("click", () => {
    const selected = getSelectedIds();

    if (selected.length === 0) {
      notify("Selecciona al menos un ticket.", "error");
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas eliminar ${selected.length} ticket(s)? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const tickets = getTickets().filter(
      ticket => !selected.includes(String(ticket.id))
    );

    if (!saveTickets(tickets)) return;

    if (elements.selectAll) {
      elements.selectAll.checked = false;
      elements.selectAll.indeterminate = false;
    }

    renderAll();
    notify("Tickets seleccionados eliminados.");
  });

  // =====================================================
  // EXPORTAR TICKETS
  // =====================================================

  elements.exportBtn?.addEventListener("click", () => {
    let data;

    try {
      const raw = localStorage.getItem(TICKETS_KEY);

      if (storageCorrupted || (raw && !Array.isArray(JSON.parse(raw)))) {
        notify(
          "No se puede exportar una lista dañada. Recupera una copia válida.",
          "error"
        );
        return;
      }

      data = getTickets();
    } catch (error) {
      console.error("Error preparando la exportación:", error);
      notify("No se pudieron preparar los datos para exportar.", "error");
      return;
    }

    try {
      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `innovent-tickets-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Dar tiempo al navegador para iniciar la descarga.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      notify("Exportación de tickets iniciada.");
    } catch (error) {
      console.error("Error exportando tickets:", error);
      notify("No se pudo generar el archivo de exportación.", "error");
    }
  });

  // =====================================================
  // IMPORTAR TICKETS
  // =====================================================

  elements.importInput?.addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("El archivo supera el límite de 10 MB.");
      }

      const imported = JSON.parse(await file.text());

      if (!Array.isArray(imported)) {
        throw new Error(
          "El archivo JSON debe contener una lista de tickets."
        );
      }

      if (
        imported.some(
          ticket =>
            !ticket ||
            typeof ticket !== "object" ||
            Array.isArray(ticket)
        )
      ) {
        throw new Error(
          "El archivo contiene elementos que no son tickets válidos."
        );
      }

      const usedIds = new Set();

      const validTickets = imported.map(ticket =>
        normalizeTicket(ticket, usedIds)
      );

      const confirmed = window.confirm(
        `Se importarán ${validTickets.length} ticket(s). ` +
        "Esta operación reemplazará los tickets guardados en este navegador. " +
        "Se conservarán los campos compatibles del archivo. ¿Continuar?"
      );

      if (!confirmed) return;

      // La importación confirmada permite recuperar un almacenamiento
      // dañado o reemplazar su contenido por una copia válida.
      if (
        saveTickets(validTickets, { allowRecovery: true })
      ) {
        renderAll();
        notify(
          `${validTickets.length} ticket(s) importados correctamente.`
        );
      }
    } catch (error) {
      console.error("Error importando tickets:", error);

      notify(
        error.message ||
        "No se pudo importar el archivo. Comprueba su formato JSON.",
        "error"
      );
    } finally {
      event.target.value = "";
    }
  });

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  elements.logoutBtn?.addEventListener("click", () => {
    if (!window.confirm("¿Deseas cerrar la sesión?")) return;

    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("No se pudo eliminar la sesión:", error);
    }

    window.location.replace("copialogin.html");
  });

  // =====================================================
  // TEMA VISUAL
  // =====================================================

  function applyTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark-theme", dark);

    if (elements.themeBtn) {
      elements.themeBtn.setAttribute(
        "aria-pressed",
        String(dark)
      );
    }
  }

  elements.themeBtn?.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    const nextTheme = isDark ? "light" : "dark";

    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      console.warn("No se pudo guardar el tema:", error);
    }
  });

  try {
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
  } catch {
    applyTheme("light");
  }

  // =====================================================
  // ASESOR VIRTUAL LOCAL
  // =====================================================

  function toggleAdvisor(open) {
    if (!elements.advisorPanel) return;

    elements.advisorPanel.classList.toggle("advisor-open", open);
    elements.advisorPanel.classList.toggle("hidden", !open);
    elements.advisorPanel.setAttribute(
      "aria-hidden",
      String(!open)
    );

    if (open) {
      elements.advisorInput?.focus();
    }
  }

  function addAdvisorMessage(text, type = "bot") {
    if (!elements.advisorMessages) return;

    const message = document.createElement("div");
    message.className = `advisor-message advisor-${type}`;
    message.textContent = String(text);

    elements.advisorMessages.appendChild(message);
    elements.advisorMessages.scrollTop =
      elements.advisorMessages.scrollHeight;
  }

  function advisorReply(question) {
    const text = question.toLocaleLowerCase("es-CO");
    const tickets = getTickets();

    if (text.includes("resumen") || text.includes("total")) {
      const open = tickets.filter(
        ticket => ticket.status === "Abierto"
      ).length;

      const progress = tickets.filter(
        ticket => ticket.status === "En progreso"
      ).length;

      const resolved = tickets.filter(
        ticket => ["Resuelto", "Cerrado"].includes(ticket.status)
      ).length;

      return (
        `Hay ${tickets.length} tickets registrados: ` +
        `${open} abiertos, ${progress} en progreso y ` +
        `${resolved} resueltos o cerrados.`
      );
    }

    if (
      text.includes("prioridad") ||
      text.includes("alta") ||
      text.includes("urgente")
    ) {
      const high = tickets.filter(
        ticket => ticket.priority === "Alta"
      );

      return high.length
        ? `Hay ${high.length} ticket(s) de prioridad alta: ` +
          high
            .map(ticket => `${ticket.id} - ${ticket.title}`)
            .join("; ")
        : "No hay tickets de prioridad alta.";
    }

    if (
      text.includes("crear") ||
      text.includes("nuevo") ||
      text.includes("registrar")
    ) {
      showView("new");

      return (
        "He abierto el formulario de creación. " +
        "Completa los campos obligatorios y envía el formulario."
      );
    }

    if (text.includes("abierto")) {
      const open = tickets.filter(
        ticket => ticket.status === "Abierto"
      );

      return open.length
        ? `Hay ${open.length} ticket(s) abiertos: ` +
          open.map(ticket => `${ticket.id} - ${ticket.title}`).join("; ")
        : "No hay tickets abiertos.";
    }

    if (text.includes("resuelto") || text.includes("cerrado")) {
      const resolved = tickets.filter(
        ticket => ["Resuelto", "Cerrado"].includes(ticket.status)
      );

      return `Hay ${resolved.length} ticket(s) resueltos o cerrados.`;
    }

    return (
      "Puedo ayudarte con el resumen de tickets, las solicitudes " +
      "de alta prioridad, los tickets abiertos y el formulario de creación. " +
      "Prueba con «resumen», «alta prioridad» o «crear ticket»."
    );
  }

  elements.advisorFab?.addEventListener("click", () => {
    toggleAdvisor(true);
  });

  elements.advisorClose?.addEventListener("click", () => {
    toggleAdvisor(false);
  });

  elements.advisorSuggestions?.addEventListener("click", event => {
    const button = event.target.closest("[data-advisor]");

    if (!button) return;

    const questions = {
      resumen: "resumen",
      alta: "alta prioridad",
      crear: "crear ticket",
      ayuda: "¿Qué puedes hacer?"
    };

    const question = questions[button.dataset.advisor];

    if (!question) return;

    addAdvisorMessage(question, "user");
    addAdvisorMessage(advisorReply(question), "bot");
  });

  elements.advisorForm?.addEventListener("submit", event => {
    event.preventDefault();

    const question = normalizeText(elements.advisorInput?.value);

    if (!question) return;

    addAdvisorMessage(question, "user");
    addAdvisorMessage(advisorReply(question), "bot");

    if (elements.advisorInput) {
      elements.advisorInput.value = "";
      elements.advisorInput.focus();
    }
  });

  // =====================================================
  // SINCRONIZACIÓN ENTRE PESTAÑAS DEL MISMO ORIGEN
  // =====================================================

  window.addEventListener("storage", event => {
    if (event.key === TICKETS_KEY || event.key === null) {
      renderAll();
    }

    if (event.key === SESSION_KEY) {
      const currentSession = getSession();
      const currentUser = currentSession?.user || currentSession;
      const currentRole = String(
        currentUser?.role || currentSession?.role || ""
      ).toLowerCase();

      if (
        !currentSession ||
        currentSession.authenticated !== true ||
        currentRole !== "admin"
      ) {
        window.location.replace("copialogin.html");
      }
    }

    if (event.key === THEME_KEY) {
      try {
        applyTheme(localStorage.getItem(THEME_KEY) || "light");
      } catch {
        // Se mantiene el tema actual si no se puede leer.
      }
    }
  });

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  renderAll();

  console.info("Innovent Gestión de Tickets: panel inicializado.");
});
