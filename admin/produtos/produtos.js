// admin/produtos/produtos.js
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "daenvi_admin_products_cfg";

function setMsg(el, text, type) {
  el.className = "msg " + (type || "");
  el.textContent = text || "";
  el.style.display = text ? "block" : "none";
}

function saveCfg(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function loadCfg() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getCfg() {
  return {
    apiUrl: $("apiUrl").value.trim() || "/api/products",
    adminKey: $("adminKey").value.trim()
  };
}

function lockAuth(locked) {
  $("apiUrl").disabled = locked;
  $("adminKey").disabled = locked;
}

function clearForm() {
  $("pId").value = "";
  $("pActive").value = "true";
  $("pName").value = "";
  $("pPrice").value = "";
  $("pCategory").value = "";
  $("pImageUrl").value = "";
  $("pDesc").value = "";
}

function productCard(p) {
  const activeBadge = p.active ? "Ativo" : "Oculto";
  const badgeClass = p.active ? "ok" : "error";

  const div = document.createElement("div");
  div.className = "checkout-item";
  div.style.cursor = "pointer";

  div.innerHTML = `
    <div style="min-width:60%;">
      <div style="font-weight:900;">${escapeHtml(p.name || "(sem nome)")}</div>
      <div class="kicker">
        <b>ID:</b> ${escapeHtml(p.id)} • <b>Preço:</b> ${escapeHtml(p.price)} • <b>Categoria:</b> ${escapeHtml(p.category || "-")}
      </div>
      <div class="kicker" style="margin-top:6px;">
        <span class="msg ${badgeClass}" style="display:inline-block; padding:6px 10px; border-radius:999px;">${activeBadge}</span>
      </div>
    </div>
    <div style="text-align:right;">
      <button class="btn ghost" data-del="${escapeHtml(p.id)}" style="padding:10px 12px;">Excluir</button>
    </div>
  `;

  div.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-del]");
    if (btn) return; // excluir é separado
    loadToForm(p);
  });

  div.querySelector("button[data-del]").addEventListener("click", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    await deleteProduct(p.id);
  });

  return div;
}

function loadToForm(p) {
  $("pId").value = p.id || "";
  $("pActive").value = p.active ? "true" : "false";
  $("pName").value = p.name || "";
  $("pPrice").value = p.price || "";
  $("pCategory").value = p.category || "";
  $("pImageUrl").value = p.imageUrl || "";
  $("pDesc").value = p.description || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function adminList() {
  const msg = $("msgForm");
  setMsg(msg, "", "");

  const { apiUrl, adminKey } = getCfg();
  if (!adminKey) {
    setMsg(msg, "Informe a Admin Key e clique Entrar.", "error");
    return;
  }

  const url = `${apiUrl}?action=products_admin_list&key=${encodeURIComponent(adminKey)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    setMsg(msg, `Falha ao listar (admin). ${data.error || res.status}`, "error");
    return;
  }

  renderList(data.products || []);
}

function renderList(products) {
  const wrap = $("listWrap");
  wrap.innerHTML = "";

  const q = ($("searchInput").value || "").toLowerCase().trim();
  const filtered = products.filter(p => {
    const hay = `${p.id} ${p.name} ${p.category}`.toLowerCase();
    return !q || hay.includes(q);
  });

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "mini-note";
    empty.textContent = "Nenhum produto cadastrado ainda.";
    wrap.appendChild(empty);
    return;
  }

  filtered.forEach(p => wrap.appendChild(productCard(p)));
}

async function upsertProduct() {
  const msg = $("msgForm");
  setMsg(msg, "", "");

  const { apiUrl, adminKey } = getCfg();
  if (!adminKey) {
    setMsg(msg, "Você precisa entrar com a Admin Key.", "error");
    return;
  }

  const product = {
    id: $("pId").value.trim(),
    active: $("pActive").value === "true",
    name: $("pName").value.trim(),
    price: $("pPrice").value.trim(),
    category: $("pCategory").value.trim(),
    imageUrl: $("pImageUrl").value.trim(),
    description: $("pDesc").value.trim()
  };

  if (!product.name) return setMsg(msg, "Preencha o nome do produto.", "error");
  if (!product.price) return setMsg(msg, "Preencha o preço.", "error");
  if (!product.imageUrl) return setMsg(msg, "Coloque a URL da imagem.", "error");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "products_upsert",
      key: adminKey,
      product
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    setMsg(msg, `Não consegui salvar. ${data.error || res.status}`, "error");
    return;
  }

  setMsg(msg, `Salvo! ID: ${data.id}`, "ok");
  clearForm();
  await adminList();
}

async function deleteProduct(id) {
  const msg = $("msgForm");
  setMsg(msg, "", "");

  const { apiUrl, adminKey } = getCfg();
  if (!adminKey) {
    setMsg(msg, "Você precisa entrar com a Admin Key.", "error");
    return;
  }

  const ok = confirm("Excluir esse produto? Isso não tem volta.");
  if (!ok) return;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "products_delete",
      key: adminKey,
      id
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    setMsg(msg, `Não consegui excluir. ${data.error || res.status}`, "error");
    return;
  }

  setMsg(msg, "Excluído com sucesso.", "ok");
  await adminList();
}

function init() {
  const cfg = loadCfg();

  $("apiUrl").value = cfg.apiUrl || "/api/products";
  $("adminKey").value = cfg.adminKey || "";

  $("btnEntrar").addEventListener("click", async () => {
    const msg = $("msgAuth");
    const newCfg = getCfg();

    if (!newCfg.adminKey) {
      setMsg(msg, "Informe a Admin Key.", "error");
      return;
    }

    saveCfg(newCfg);
    lockAuth(true);
    setMsg(msg, "OK! Acesso liberado.", "ok");
    await adminList();
  });

  $("btnSair").addEventListener("click", () => {
    lockAuth(false);
    saveCfg({ apiUrl: "/api/products", adminKey: "" });
    $("adminKey").value = "";
    setMsg($("msgAuth"), "Saiu.", "ok");
    clearForm();
    $("listWrap").innerHTML = "";
  });

  $("btnSalvar").addEventListener("click", upsertProduct);
  $("btnLimpar").addEventListener("click", () => {
    clearForm();
    setMsg($("msgForm"), "", "");
  });

  $("btnAtualizar").addEventListener("click", adminList);

  $("searchInput").addEventListener("input", adminList);

  // Se já tem key salva, entra automático
  if (cfg.adminKey) {
    lockAuth(true);
    setMsg($("msgAuth"), "Acesso carregado.", "ok");
    adminList();
  }
}

init();