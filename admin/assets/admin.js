// admin/admin.js
const LS_API = "daenvi_admin_api";
const LS_KEY = "daenvi_admin_key";

function $(id){ return document.getElementById(id); }

function showMsg(type, text){
  const msg = $("msg");
  if(!msg) return;
  msg.className = "msg " + (type||"");
  msg.textContent = text || "";
}

function saveCfg(apiUrl, key){
  localStorage.setItem(LS_API, apiUrl);
  localStorage.setItem(LS_KEY, key);
}
function loadCfg(){
  return {
    apiUrl: localStorage.getItem(LS_API) || "",
    key: localStorage.getItem(LS_KEY) || ""
  };
}
function clearCfg(){
  localStorage.removeItem(LS_API);
  localStorage.removeItem(LS_KEY);
}

async function apiGet(apiUrl, key, params){
  const url = new URL(apiUrl);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { method:"GET" });
  const data = await res.json().catch(()=>null);
  if(!res.ok || !data || data.ok === false){
    throw new Error((data && data.error) ? data.error : "Erro na API");
  }
  return data;
}

function cardOrder(o){
  let items = [];
  try { items = JSON.parse(o.itemsJson || "[]"); } catch(e){ items = []; }

  const itemsHtml = items.map(it => `
    <div class="muted small">${it.qtd}x ${it.nome} — ${(Number(it.preco)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</div>
  `).join("");

  return `
    <div class="card" style="margin:12px 0;">
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <div class="muted small">ID</div>
          <div style="font-weight:900;">${o.orderId}</div>
          <div class="muted small" style="margin-top:6px;">${o.createdAt}</div>
        </div>

        <div>
          <div class="muted small">Cliente</div>
          <div style="font-weight:900;">${o.name}</div>
          <div class="muted small">CPF: ${o.cpf}</div>
          <div class="muted small">Whats: ${o.whatsapp}</div>
        </div>

        <div>
          <div class="muted small">Total</div>
          <div style="font-weight:900;">${o.total}</div>
          <div class="muted small">Pagamento: ${o.payment}</div>
        </div>

        <div>
          <div class="muted small">Status</div>
          <select data-status="${o.orderId}" style="width:220px; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); color:#EAF0FF;">
            ${["Recebido","Separando","Enviado","Entregue","Cancelado"].map(s => `
              <option value="${s}" ${String(o.status||"")===s ? "selected":""}>${s}</option>
            `).join("")}
          </select>
          <button class="btn ghost" data-save="${o.orderId}" type="button" style="margin-top:8px;">Salvar status</button>
        </div>
      </div>

      <hr class="line"/>

      <div class="muted small">Endereço</div>
      <div style="font-weight:700; margin-top:6px;">
        ${o.address}, ${o.number} ${o.complement ? " - " + o.complement : ""}<br/>
        ${o.neighborhood} • ${o.city} / ${o.state} • CEP: ${o.cep}
      </div>

      <div style="margin-top:12px;">
        <div class="muted small">Itens</div>
        <div style="margin-top:6px;">${itemsHtml || '<span class="muted small">—</span>'}</div>
      </div>
    </div>
  `;
}

let ALL = [];

function applySearch(){
  const q = ($("search").value || "").trim().toLowerCase();
  const box = $("orders");
  const filtered = !q ? ALL : ALL.filter(o => {
    const hay = [o.orderId,o.name,o.cpf,o.whatsapp,o.city,o.status].join(" ").toLowerCase();
    return hay.includes(q);
  });

  $("count").textContent = String(filtered.length);
  box.innerHTML = filtered.map(cardOrder).join("");
}

async function loadOrders(){
  const { apiUrl, key } = loadCfg();
  if(!apiUrl || !key) return;

  showMsg("", "");
  try{
    const data = await apiGet(apiUrl, key, { action:"list" });
    ALL = data.orders || [];

    $("panel").style.display = "block";
    $("loginCard").style.display = "none";
    applySearch();
  }catch(e){
    showMsg("error", "Erro ao carregar pedidos: " + e.message);
    $("panel").style.display = "none";
    $("loginCard").style.display = "block";
  }
}

async function saveStatus(orderId){
  const { apiUrl, key } = loadCfg();
  const sel = document.querySelector(`[data-status="${orderId}"]`);
  const status = sel ? sel.value : "";
  if(!status) return;

  try{
    await apiGet(apiUrl, key, { action:"updateStatus", orderId, status });
    const idx = ALL.findIndex(x => String(x.orderId) === String(orderId));
    if(idx >= 0) ALL[idx].status = status;
    applySearch();
  }catch(e){
    alert("Não consegui salvar o status: " + e.message);
  }
}

(function init(){
  // já preenche com sua API pra facilitar
  const cfg = loadCfg();
  $("apiUrl").value = cfg.apiUrl || "/api/orders";
  $("adminKey").value = cfg.key || "";

  $("btnLogin").addEventListener("click", () => {
    const apiUrl = ($("apiUrl").value || "").trim();
    const key = ($("adminKey").value || "").trim();
    if(!apiUrl || !key){
      showMsg("error", "Preencha API URL e Admin Key.");
      return;
    }
    saveCfg(apiUrl, key);
    loadOrders();
  });

  $("btnLogout").addEventListener("click", () => {
    clearCfg();
    location.reload();
  });

  $("btnReload").addEventListener("click", loadOrders);
  $("search").addEventListener("input", applySearch);

  $("orders").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-save]");
    if(!btn) return;
    saveStatus(btn.getAttribute("data-save"));
  });

  loadOrders();
})();