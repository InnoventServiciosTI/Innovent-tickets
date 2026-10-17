const seedTickets = [
 {id:"TK-1048",client:"María González",email:"maria@email.com",title:"No puedo acceder al panel",category:"Soporte técnico",priority:"Alta",status:"En progreso",description:"El usuario indica que sus credenciales son correctas pero el sistema no permite iniciar sesión.",createdAt:"2026-09-30T14:20:00"},
 {id:"TK-1047",client:"Andrés Ruiz",email:"andres@email.com",title:"Consulta sobre factura",category:"Facturación",priority:"Media",status:"Abierto",description:"Solicita aclaración sobre un cargo incluido en su última factura.",createdAt:"2026-09-30T10:10:00"},
 {id:"TK-1046",client:"Laura Pérez",email:"laura@email.com",title:"Actualizar datos de empresa",category:"Solicitud",priority:"Baja",status:"Resuelto",description:"Solicitó actualizar los datos de facturación de su empresa.",createdAt:"2026-09-29T16:45:00"},
 {id:"TK-1045",client:"Carlos Méndez",email:"carlos@email.com",title:"Error al cargar archivos",category:"Soporte técnico",priority:"Alta",status:"Abierto",description:"El formulario muestra un error cuando intenta subir archivos mayores de 5 MB.",createdAt:"2026-09-29T09:15:00"}
];

let tickets = JSON.parse(localStorage.getItem("ticketflow_tickets") || "null") || seedTickets;
let currentTicket = null;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function save(){localStorage.setItem("ticketflow_tickets",JSON.stringify(tickets));}
function formatDate(v){return new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v))}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function priorityClass(p){return "priority-"+p.toLowerCase()}
function statusClass(s){return "status-"+s.toLowerCase().replaceAll(" ","-")}
function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;$("#toastContainer").append(el);setTimeout(()=>el.remove(),2800)}

function navigate(view){
  $$(".view").forEach(v=>v.classList.remove("active-view"));
  $(`#${view}View`).classList.add("active-view");
  $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const titles={dashboard:"Dashboard",tickets:"Tickets",new:"Nuevo ticket"};
  $("#pageTitle").textContent=titles[view];
  $("#sidebar").classList.remove("open");
  if(view==="tickets") renderTickets();
  if(view==="dashboard") renderDashboard();
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$$("[data-view-target]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.viewTarget)));
$("#topNewBtn").addEventListener("click",()=>navigate("new"));
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("ticketflow_dark",document.body.classList.contains("dark"));});
if(localStorage.getItem("ticketflow_dark")==="true") document.body.classList.add("dark");

function renderDashboard(){
  const total=tickets.length, progress=tickets.filter(t=>t.status==="En progreso").length, high=tickets.filter(t=>t.priority==="Alta").length, resolved=tickets.filter(t=>t.status==="Resuelto"||t.status==="Cerrado").length;
  $("#totalStat").textContent=total;$("#progressStat").textContent=progress;$("#highStat").textContent=high;$("#resolvedStat").textContent=resolved;
  const open=tickets.filter(t=>t.status==="Abierto").length;
  $("#openCount").textContent=open;$("#progressCount").textContent=progress;$("#resolvedCount").textContent=resolved;
  const pct=n=>total?`${Math.round(n/total*100)}%`:"0%";
  $("#openBar").style.width=pct(open);$("#progressBar").style.width=pct(progress);$("#resolvedBar").style.width=pct(resolved);
  const recent=[...tickets].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  $("#recentTickets").innerHTML=recent.length?recent.map(ticketRow).join(""):`<div class="empty-state">No hay tickets registrados.</div>`;
}
function ticketRow(t){return `<div class="ticket-row"><div class="ticket-main"><strong>${escapeHtml(t.title)}</strong><span>${t.id} · ${escapeHtml(t.client)}</span></div><div class="ticket-meta"><span class="badge ${priorityClass(t.priority)}">${t.priority}</span><span class="badge ${statusClass(t.status)}">${t.status}</span></div></div>`}

function getFiltered(){
 const q=$("#searchInput").value.trim().toLowerCase(), st=$("#statusFilter").value, pr=$("#priorityFilter").value, cat=$("#categoryFilter").value;
 return tickets.filter(t=>(!q||[t.id,t.title,t.client,t.email,t.category].some(x=>String(x).toLowerCase().includes(q)))&&(st==="all"||t.status===st)&&(pr==="all"||t.priority===pr)&&(cat==="all"||t.category===cat));
}
function renderTickets(){
 const rows=getFiltered();
 $("#ticketsTable").innerHTML=rows.map(t=>`<tr>
 <td><input type="checkbox" class="ticket-check" data-id="${t.id}"></td>
 <td><strong>${t.id}</strong></td>
 <td><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.category)}</small></td>
 <td>${escapeHtml(t.client)}<small>${escapeHtml(t.email||"Sin correo")}</small></td>
 <td><span class="badge ${priorityClass(t.priority)}">${t.priority}</span></td>
 <td><span class="badge ${statusClass(t.status)}">${t.status}</span></td>
 <td>${formatDate(t.createdAt)}</td>
 <td><button class="action-btn" data-id="${t.id}" title="Ver ticket">Ver</button></td>
 </tr>`).join("");
 $("#emptyTickets").classList.toggle("hidden",rows.length>0);
 $("#selectAll").checked=false; updateBulk();
 $$(".action-btn").forEach(b=>b.addEventListener("click",()=>openTicket(b.dataset.id)));
 $$(".ticket-check").forEach(b=>b.addEventListener("change",updateBulk));
}
["searchInput","statusFilter","priorityFilter","categoryFilter"].forEach(id=>$("#"+id).addEventListener(id==="searchInput"?"input":"change",renderTickets));
$("#selectAll").addEventListener("change",e=>{$$(".ticket-check").forEach(c=>c.checked=e.target.checked);updateBulk()});
function updateBulk(){const n=$$(".ticket-check:checked").length;$("#selectedCount").textContent=`${n} seleccionado${n===1?"":"s"}`;$("#bulkBar").classList.toggle("visible",n>0)}
$("#bulkDeleteBtn").addEventListener("click",()=>{const ids=$$(".ticket-check:checked").map(c=>c.dataset.id);if(!ids.length)return;if(confirm(`¿Eliminar ${ids.length} ticket(s)?`)){tickets=tickets.filter(t=>!ids.includes(t.id));save();renderTickets();renderDashboard();toast("Tickets eliminados correctamente.")}});

function openTicket(id){
 currentTicket=tickets.find(t=>t.id===id); if(!currentTicket)return;
 const t=currentTicket;
 $("#modalContent").innerHTML=`<div class="modal-title"><span class="eyebrow">${t.id}</span><h2>${escapeHtml(t.title)}</h2></div>
 <div class="detail-grid">
 <div class="detail-item"><span>Cliente</span>${escapeHtml(t.client)}</div><div class="detail-item"><span>Correo</span>${escapeHtml(t.email||"No registrado")}</div>
 <div class="detail-item"><span>Categoría</span>${escapeHtml(t.category)}</div><div class="detail-item"><span>Prioridad</span><span class="badge ${priorityClass(t.priority)}">${t.priority}</span></div>
 <div class="detail-item"><span>Fecha</span>${formatDate(t.createdAt)}</div><div class="detail-item"><span>Estado actual</span><span class="badge ${statusClass(t.status)}">${t.status}</span></div>
 </div><div class="detail-description"><strong>Descripción</strong><br>${escapeHtml(t.description)}</div>
 <div class="modal-actions"><select id="modalStatus"><option ${t.status==="Abierto"?"selected":""}>Abierto</option><option ${t.status==="En progreso"?"selected":""}>En progreso</option><option ${t.status==="Resuelto"?"selected":""}>Resuelto</option><option ${t.status==="Cerrado"?"selected":""}>Cerrado</option></select><button class="primary-btn" id="saveStatus">Actualizar estado</button></div>`;
 $("#ticketModal").classList.remove("hidden");
 $("#saveStatus").addEventListener("click",()=>{currentTicket.status=$("#modalStatus").value;save();$("#ticketModal").classList.add("hidden");renderTickets();renderDashboard();toast("Estado actualizado.")});
}
$("#modalClose").addEventListener("click",()=>$("#ticketModal").classList.add("hidden"));
$("#ticketModal").addEventListener("click",e=>{if(e.target.id==="ticketModal")$("#ticketModal").classList.add("hidden")});

$("#ticketForm").addEventListener("submit",e=>{
 e.preventDefault();const fd=new FormData(e.target);
 const num=tickets.reduce((m,t)=>Math.max(m,parseInt(t.id.replace("TK-",""))||0),1048)+1;
 tickets.unshift({id:`TK-${num}`,client:fd.get("client"),email:fd.get("email"),title:fd.get("title"),category:fd.get("category"),priority:fd.get("priority"),status:"Abierto",description:fd.get("description"),createdAt:new Date().toISOString()});
 save();e.target.reset();renderDashboard();toast(`Ticket TK-${num} creado correctamente.`);navigate("tickets");
});

$("#exportBtn").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify(tickets,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`ticketflow-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast("Respaldo exportado.");
});
$("#importInput").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;const reader=new FileReader();
 reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data))throw Error();tickets=data;save();renderDashboard();renderTickets();toast("Datos importados correctamente.");}catch{toast("El archivo no contiene datos válidos.");}};reader.readAsText(file);
});
renderDashboard();

/* ==================== ASESOR VIRTUAL ==================== */
const advisorFab = $("#advisorFab");
const advisorPanel = $("#advisorPanel");
const advisorClose = $("#advisorClose");
const advisorMessages = $("#advisorMessages");
const advisorForm = $("#advisorForm");
const advisorInput = $("#advisorInput");

function advisorTime(){
  return new Intl.DateTimeFormat("es-CO",{hour:"2-digit",minute:"2-digit"}).format(new Date());
}
function advisorAddMessage(text,type="bot"){
  const el=document.createElement("div");
  el.className=`advisor-message ${type}`;
  el.innerHTML=`${escapeHtml(text)}<span class="advisor-time">${advisorTime()}</span>`;
  advisorMessages.appendChild(el);
  advisorMessages.scrollTop=advisorMessages.scrollHeight;
}
function advisorOpen(){
  advisorPanel.classList.add("open");
  if(!advisorMessages.children.length){
    const total=tickets.length, open=tickets.filter(t=>t.status==="Abierto").length;
    advisorAddMessage(`¡Hola! Soy el Asesor Virtual de TicketFlow. 👋\n\nPuedo ayudarte a consultar tickets, revisar prioridades, interpretar el estado del soporte o llevarte directamente a una función del sistema.\n\nAhora mismo tienes ${total} ticket${total===1?"":"s"} registrado${total===1?"":"s"} y ${open} abierto${open===1?"":"s"}.`);
  }
  setTimeout(()=>advisorInput.focus(),80);
}
function advisorClosePanel(){advisorPanel.classList.remove("open")}
advisorFab.addEventListener("click",()=>advisorPanel.classList.contains("open")?advisorClosePanel():advisorOpen());
advisorClose.addEventListener("click",advisorClosePanel);

function advisorReply(raw){
  const q=raw.toLowerCase().trim();
  const total=tickets.length;
  const open=tickets.filter(t=>t.status==="Abierto").length;
  const progress=tickets.filter(t=>t.status==="En progreso").length;
  const resolved=tickets.filter(t=>t.status==="Resuelto").length;
  const closed=tickets.filter(t=>t.status==="Cerrado").length;
  const high=tickets.filter(t=>t.priority==="Alta");

  if(/^(hola|buenas|buenos|hey|saludos)/.test(q))
    return "¡Hola! 👋 Estoy listo para ayudarte. Puedes preguntarme por el resumen, tickets de alta prioridad, estados, búsqueda de un ticket o cómo crear una nueva solicitud.";
  if(/(resumen|estadística|estadisticas|métrica|metricas|cuántos|cuantos|total)/.test(q))
    return `📊 Resumen actual:\n• Total: ${total}\n• Abiertos: ${open}\n• En progreso: ${progress}\n• Resueltos: ${resolved}\n• Cerrados: ${closed}\n• Alta prioridad: ${high.length}`;
  if(/(alta prioridad|urgente|urgentes|prioridad alta)/.test(q)){
    if(!high.length) return "No hay tickets con prioridad Alta en este momento. ✅";
    return `🚨 Hay ${high.length} ticket${high.length===1?"":"s"} de alta prioridad:\n`+high.slice(0,5).map(t=>`• ${t.id}: ${t.title} — ${t.status}`).join("\n")+(high.length>5?"\n• Y algunos más...":"");
  }
  if(/(abierto|abiertos)/.test(q)) return `📂 Actualmente hay ${open} ticket${open===1?"":"s"} abierto${open===1?"":"s"}.`;
  if(/(progreso|pendiente|pendientes)/.test(q)) return `⏳ Hay ${progress} ticket${progress===1?"":"s"} en progreso.`;
  if(/(resuelto|resueltos)/.test(q)) return `✅ Hay ${resolved} ticket${resolved===1?"":"s"} resuelto${resolved===1?"":"s"}.`;
  if(/(cerrado|cerrados)/.test(q)) return `🔒 Hay ${closed} ticket${closed===1?"":"s"} cerrado${closed===1?"":"s"}.`;
  if(/(crear|nuevo|registrar).*(ticket|solicitud)|(ticket|solicitud).*(crear|nuevo|registrar)/.test(q)){
    advisorAddMessage("Perfecto. Te llevo al formulario para crear un nuevo ticket.");
    setTimeout(()=>navigate("new"),350);
    return "";
  }
  if(/(ver|listar|mostrar|buscar).*(ticket|tickets)/.test(q)){
    advisorAddMessage("Claro. Te llevo a la sección de tickets para que puedas buscarlos y filtrarlos.");
    setTimeout(()=>navigate("tickets"),350);
    return "";
  }
  if(/(ayuda|puedes hacer|funciones|qué haces|que haces)/.test(q))
    return "Puedo ayudarte con:\n• Consultar el resumen del sistema.\n• Revisar tickets de alta prioridad.\n• Consultar estados.\n• Ir a la lista de tickets.\n• Abrir el formulario de nuevo ticket.\n• Orientarte sobre el funcionamiento de TicketFlow.";
  if(/(cómo|como).*(ticket|sistema|funciona)/.test(q))
    return "TicketFlow permite crear solicitudes, asignar categoría y prioridad, consultar tickets, cambiar su estado, filtrar información y realizar respaldos. El Asesor Virtual añade una capa de ayuda rápida sobre esas funciones.";
  if(/(hola|gracias|gracias)/.test(q)) return "¡Con gusto! 😊 Estoy aquí cuando necesites consultar algo.";
  return "Puedo ayudarte mejor si me preguntas algo como: “¿Cuál es el resumen?”, “¿Hay tickets de alta prioridad?”, “¿Cuántos están en progreso?” o “Quiero crear un ticket”.";
}

function advisorAsk(text){
  const clean=text.trim(); if(!clean)return;
  advisorAddMessage(clean,"user");
  advisorInput.value="";
  const reply=advisorReply(clean);
  if(reply) setTimeout(()=>advisorAddMessage(reply),280);
}
advisorForm.addEventListener("submit",e=>{e.preventDefault();advisorAsk(advisorInput.value)});
$$("[data-advisor]").forEach(btn=>btn.addEventListener("click",()=>{
  const prompts={resumen:"Dame el resumen del sistema",alta:"¿Hay tickets de alta prioridad?",crear:"Quiero crear un ticket",ayuda:"¿Qué puedes hacer?"};
  advisorAsk(prompts[btn.dataset.advisor]);
}));

/* Logout sesion */
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("innoventSession");

    window.location.href = "login.html";

  });

}
