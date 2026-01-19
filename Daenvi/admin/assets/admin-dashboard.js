const KEY_SESSION = "daenvi_admin_session";
const KEY_PRODUCTS_OVERRIDE = "daenvi_products_override";
const KEY_ORDERS = "daenvi_orders";

function $(id){ return document.getElementById(id); }

function requireAuth(){
  if(localStorage.getItem(KEY_SESSION) !== "ok"){
    window.location.href = "login.html";
  }
}

function showMsg(type, text){
  const msg = $("msg");
  if(!msg) return;
  msg.className = "msg " + (type || "");
  msg.textContent = text || "";
  msg.style.display = text ? "block" : "none";
}

function moneyToNumber(v){
  const s = (v || "").toString().trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function brl(v){
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function downloadJSON(filename, dataStr){
  const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    alert("Copiado ✅");
  }catch(e){
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Copiado ✅");
  }
}

/* Tabs */
function setTab(tab){
  const tabProdutos = $("tabProdutos");
  const tabPedidos = $("tabPedidos");
  const viewProdutos = $("viewProdutos");
  const viewPedidos = $("viewPedidos");

  if(tabProdutos && tabPedidos){
    tabProdutos.classList.toggle("active", tab === "produtos");
    tabPedidos.classList.toggle("active", tab === "pedidos");
  }
  if(viewProdutos && viewPedidos){
    viewProdutos.style.display = (tab === "produtos") ? "block" : "none";
    viewPedidos.style.display = (tab === "pedidos") ? "block" : "none";
  }
}

/* Produtos */
let products = [];
let editingId = null;

function loadProducts(){
  const raw = localStorage.getItem(KEY_PRODUCTS_OVERRIDE);
  if(raw){
    try { return JSON.parse(raw); } catch(e){}
  }
  return [];
}

function saveProducts(list){
  localStorage.setItem(KEY_PRODUCTS_OVERRIDE, JSON.stringify(list, null, 2));
}

function ensureUniqueId(id){
  return !products.some(p => p.id === id);
}

function setMode(mode){
  const pill = $("pill");
  const title = $("formTitle");
  if(pill) pill.textContent = mode;
  if(title) title.textContent = (mode === "Editando") ? "Editar produto" : "Novo produto";
}

function setImagePreview(dataUrl){
  const img = $("imgPreview");
  const empty = $("imgPreviewEmpty");
  if(!img || !empty) return;

  if(dataUrl){
    img.src = dataUrl;
    img.style.display = "block";
    empty.style.display = "none";
  }else{
    img.removeAttribute("src");
    img.style.display = "none";
    empty.style.display = "block";
  }
}

function fillForm(p){
  $("id").value = p?.id || "";
  $("nome").value = p?.nome || "";
  $("categoria").value = p?.categoria || "";
  $("preco").value = (p?.preco ?? "").toString().replace(".", ",");
  $("imagem").value = p?.imagem || "";
  $("descricao").value = p?.descricao || "";
  $("fornecedor").value = p?.fornecedor_link || "";

  setImagePreview(p?.imagem || "");

  const file = $("imagemFile");
  if(file) file.value = "";
}

function clearForm(){
  editingId = null;
  setMode("Criando");
  fillForm(null);

  $("id").disabled = false;
  $("btnDelete").disabled = true;

  showMsg("", "");
  $("imagem").value = "";
  setImagePreview("");
}

function validateProduct(p, isNew){
  if(!p.id || !p.nome || !p.categoria || !p.descricao){
    return "Preencha todos os campos obrigatórios.";
  }
  if(!p.imagem){
    return "Envie uma imagem do produto (upload obrigatório).";
  }
  if(!Number.isFinite(p.preco) || p.preco <= 0){
    return "Preço inválido.";
  }
  if(isNew && !ensureUniqueId(p.id)){
    return "ID já existe. Use outro.";
  }
  return null;
}

function normalizeProductFromForm(){
  return {
    id: $("id").value.trim(),
    nome: $("nome").value.trim(),
    categoria: $("categoria").value.trim(),
    preco: moneyToNumber($("preco").value),
    imagem: $("imagem").value.trim(),
    descricao: $("descricao").value.trim(),
    fornecedor_link: $("fornecedor").value.trim()
  };
}

function upsertProduct(prod){
  if(editingId){
    const idx = products.findIndex(p => p.id === editingId);
    products[idx] = prod;
  }else{
    products.unshift(prod);
  }
  saveProducts(products);
  renderProductList();
}

function deleteProduct(){
  if(!editingId) return;
  if(!confirm("Excluir este produto?")) return;

  products = products.filter(p => p.id !== editingId);
  saveProducts(products);

  clearForm();
  renderProductList();
  showMsg("ok", "Produto excluído ✅");
}

function renderProductList(){
  const list = $("list");
  const q = ($("search").value || "").trim().toLowerCase();

  let filtered = products;
  if(q){
    filtered = products.filter(p =>
      (p.nome || "").toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q) ||
      (p.id || "").toLowerCase().includes(q)
    );
  }

  if(filtered.length === 0){
    list.innerHTML = `<div class="muted">Sem produtos. Clique em “Importar JSON” ou crie um novo.</div>`;
    return;
  }

  list.innerHTML = "";
  filtered.forEach(p => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <b>${p.nome}</b>
        <small>${p.id} • ${p.categoria} • ${brl(p.preco)}</small>
      </div>
      <div class="pill">Editar</div>
    `;
    div.onclick = () => {
      editingId = p.id;
      setMode("Editando");
      fillForm(p);
      $("id").disabled = true;
      $("btnDelete").disabled = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    list.appendChild(div);
  });
}

function importProductsJSON(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error("JSON inválido (precisa ser um array).");

      data.forEach((p, idx) => {
        if(!p.id || !p.nome) throw new Error(`Produto inválido na posição ${idx}`);
      });

      products = data;
      saveProducts(products);
      clearForm();
      renderProductList();
      alert("Produtos importados ✅");
    }catch(e){
      alert("Falha ao importar: " + e.message);
    }
  };
  reader.readAsText(file, "utf-8");
}

function exportProductsJSON(){
  downloadJSON("produtos.json", JSON.stringify(products, null, 2));
}

function resetProductsOverride(){
  if(!confirm("Isso apaga o catálogo do admin (override). Tem certeza?")) return;

  localStorage.removeItem(KEY_PRODUCTS_OVERRIDE);
  products = [];
  clearForm();
  renderProductList();
  alert("Override de produtos resetado ✅");
}

/* Compressão */
function loadImageFromFile(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não consegui carregar a imagem.")); };
    img.src = url;
  });
}

async function compressImageFile(file, opts = {}){
  const { maxW = 900, maxH = 900, quality = 0.78, output = "image/webp" } = opts;
  const img = await loadImageFromFile(file);

  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  const newW = Math.round(width * ratio);
  const newH = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = newW;
  canvas.height = newH;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, newW, newH);

  let dataUrl = "";
  try{
    dataUrl = canvas.toDataURL(output, quality);
  }catch(e){
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if(!dataUrl || dataUrl.length < 50){
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return dataUrl;
}

/* Pedidos */
let orders = [];

function loadOrders(){
  const raw = localStorage.getItem(KEY_ORDERS);
  if(raw){
    try {
      const data = JSON.parse(raw);
      if(Array.isArray(data)) return data;
    } catch(e){}
  }
  return [];
}

function saveOrders(list){
  localStorage.setItem(KEY_ORDERS, JSON.stringify(list, null, 2));
}

function normalizeOrders(){
  orders = orders.map(o => ({
    id: o.id || ("PED-" + Date.now()),
    createdAt: o.createdAt || new Date().toISOString(),
    status: o.status || "novo",
    cliente: o.cliente || {},
    itens: Array.isArray(o.itens) ? o.itens : [],
    total: Number(o.total) || 0
  }));
  saveOrders(orders);
}

function fmtDate(iso){
  try{ return new Date(iso).toLocaleString("pt-BR"); }catch(e){ return iso || ""; }
}

function orderToText(o){
  const c = o.cliente || {};
  const itens = (o.itens || []).map(i => {
    const qtd = i.qtd || 1;
    const preco = Number(i.preco) || 0;
    return `- ${i.nome} (x${qtd}) = ${brl(preco * qtd)}`;
  }).join("\n");

  return `
🧾 *Pedido Daenvi*
━━━━━━━━━━━━━━━━
🆔 *ID:* ${o.id}
📅 *Data:* ${fmtDate(o.createdAt)}
📌 *Status:* ${String(o.status).toUpperCase()}

👤 *Cliente:* ${c.nome || "-"}
🪪 *CPF:* ${c.cpf || "-"}
📲 *Whats:* ${c.whats || "-"}
📧 *Email:* ${c.email || "Não informado"}

📦 *Endereço*
CEP: ${c.cep || "-"}
Rua: ${c.rua || "-"}, Nº ${c.numero || "-"}
Bairro: ${c.bairro || "-"}
Cidade/UF: ${c.cidade || "-"}-${c.estado || "-"}
Complemento: ${c.complemento || "-"}

💳 *Pagamento:* ${c.pagamento || "-"}

🧺 *Itens*
${itens || "(Sem itens)"}

💰 *Total:* ${brl(o.total)}
━━━━━━━━━━━━━━━━
`.trim();
}

function setOrderStatus(orderId, status){
  const idx = orders.findIndex(o => o.id === orderId);
  if(idx === -1) return;
  orders[idx].status = status;
  saveOrders(orders);
  renderOrders();
}

function deleteOrder(orderId){
  if(!confirm("Excluir este pedido?")) return;
  orders = orders.filter(o => o.id !== orderId);
  saveOrders(orders);
  renderOrders();
}

function openOrderModal(orderId){
  const modal = $("orderModal");
  const body = $("orderModalBody");
  if(!modal || !body) return;

  const o = orders.find(x => x.id === orderId);
  if(!o) return;

  const c = o.cliente || {};
  const itensHtml = (o.itens || []).map(i => {
    const qtd = i.qtd || 1;
    const total = (Number(i.preco)||0) * qtd;
    return `<div class="o-item">
      <div><b>${i.nome}</b><div class="muted">Qtd: ${qtd}</div></div>
      <div><b>${brl(total)}</b></div>
    </div>`;
  }).join("");

  body.innerHTML = `
    <div class="o-head">
      <div>
        <div class="o-id"><b>${o.id}</b></div>
        <div class="muted">${fmtDate(o.createdAt)}</div>
      </div>

      <div class="o-actions">
        <button class="btn ghost" id="btnCopyOrder">Copiar</button>
        <button class="btn danger" id="btnDeleteOrder">Excluir</button>
      </div>
    </div>

    <div class="o-status">
      <span class="pill">Status atual: <b>${String(o.status).toUpperCase()}</b></span>
      <select id="orderStatusSelect">
        <option value="novo">NOVO</option>
        <option value="confirmado">CONFIRMADO</option>
        <option value="enviado">ENVIADO</option>
        <option value="entregue">ENTREGUE</option>
        <option value="cancelado">CANCELADO</option>
      </select>
      <button class="btn primary" id="btnSaveStatus">Salvar status</button>
    </div>

    <div class="o-grid">
      <div class="o-box">
        <div class="o-title">Cliente</div>
        <div class="muted"><b>Nome:</b> ${c.nome || "-"}</div>
        <div class="muted"><b>CPF:</b> ${c.cpf || "-"}</div>
        <div class="muted"><b>Whats:</b> ${c.whats || "-"}</div>
        <div class="muted"><b>Email:</b> ${c.email || "-"}</div>
      </div>

      <div class="o-box">
        <div class="o-title">Endereço</div>
        <div class="muted">${c.rua || "-"}, Nº ${c.numero || "-"}</div>
        <div class="muted">${c.bairro || "-"}</div>
        <div class="muted">${c.cidade || "-"}-${c.estado || "-"}</div>
        <div class="muted"><b>CEP:</b> ${c.cep || "-"}</div>
        <div class="muted"><b>Compl.:</b> ${c.complemento || "-"}</div>
      </div>
    </div>

    <div class="o-box" style="margin-top:12px;">
      <div class="o-title">Itens</div>
      ${itensHtml || `<div class="muted">Sem itens</div>`}
      <div class="o-total">
        <span>Total</span>
        <b>${brl(o.total)}</b>
      </div>
      <div class="muted" style="margin-top:8px;"><b>Pagamento:</b> ${c.pagamento || "-"}</div>
    </div>
  `;

  const sel = $("orderStatusSelect");
  sel.value = o.status || "novo";

  $("btnCopyOrder").onclick = () => copyToClipboard(orderToText(o));
  $("btnDeleteOrder").onclick = () => { deleteOrder(o.id); closeOrderModal(); };

  $("btnSaveStatus").onclick = () => {
    const v = $("orderStatusSelect").value;
    setOrderStatus(o.id, v);
    openOrderModal(o.id);
  };

  modal.style.display = "flex";
}

function closeOrderModal(){
  const modal = $("orderModal");
  if(modal) modal.style.display = "none";
}

function renderOrders(){
  const list = $("ordersList");
  const q = ($("ordersSearch")?.value || "").trim().toLowerCase();
  const filtro = $("ordersFilter")?.value || "todos";

  if(!list) return;

  let filtered = [...orders];
  if(filtro !== "todos"){
    filtered = filtered.filter(o => (o.status || "novo") === filtro);
  }

  if(q){
    filtered = filtered.filter(o => {
      const c = o.cliente || {};
      return (
        (o.id || "").toLowerCase().includes(q) ||
        (c.nome || "").toLowerCase().includes(q) ||
        (c.cpf || "").toLowerCase().includes(q) ||
        (c.whats || "").toLowerCase().includes(q) ||
        (o.status || "").toLowerCase().includes(q)
      );
    });
  }

  filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if(filtered.length === 0){
    list.innerHTML = `<div class="muted">Nenhum pedido encontrado (no seu navegador).</div>`;
    const counter = $("ordersCount");
    if(counter) counter.textContent = `0 pedido(s)`;
    return;
  }

  list.innerHTML = "";
  filtered.forEach(o => {
    const c = o.cliente || {};
    const div = document.createElement("div");
    div.className = "o-row";
    div.innerHTML = `
      <div class="o-left">
        <b>${o.id}</b>
        <div class="muted">${fmtDate(o.createdAt)} • ${c.nome || "Cliente"}</div>
      </div>
      <div class="o-right">
        <span class="pill">${String(o.status || "novo").toUpperCase()}</span>
        <b>${brl(o.total)}</b>
      </div>
    `;
    div.onclick = () => openOrderModal(o.id);
    list.appendChild(div);
  });

  const counter = $("ordersCount");
  if(counter) counter.textContent = `${filtered.length} pedido(s)`;
}

function exportOrdersJSON(){
  downloadJSON("pedidos.json", JSON.stringify(orders, null, 2));
}

function clearOrders(){
  if(!confirm("Apagar TODOS os pedidos salvos neste navegador?")) return;
  localStorage.removeItem(KEY_ORDERS);
  orders = [];
  renderOrders();
  alert("Pedidos apagados ✅");
}

function init(){
  requireAuth();

  // Tabs
  if($("tabProdutos")) $("tabProdutos").onclick = () => setTab("produtos");
  if($("tabPedidos")) $("tabPedidos").onclick = () => { setTab("pedidos"); renderOrders(); };

  // Produtos
  products = loadProducts();
  renderProductList();
  clearForm();

  $("search").addEventListener("input", renderProductList);

  $("btnNew").onclick = () => clearForm();
  $("btnDelete").onclick = deleteProduct;
  $("btnClear").onclick = clearForm;

  $("btnLogout").onclick = () => {
    localStorage.removeItem(KEY_SESSION);
    window.location.href = "login.html";
  };

  $("btnPreview").onclick = () => window.open("../index.html", "_blank");

  $("btnExport").onclick = exportProductsJSON;
  $("btnReset").onclick = resetProductsOverride;

  $("btnImport").onclick = () => $("fileInput").click();
  $("fileInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if(file) importProductsJSON(file);
    e.target.value = "";
  });

  // Upload + compressão
  const fileInput = $("imagemFile");
  if(fileInput){
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if(!file) return;

      const maxOriginal = 8 * 1024 * 1024;
      if(file.size > maxOriginal){
        alert("Imagem muito grande. Use até 8MB.");
        e.target.value = "";
        return;
      }

      try{
        showMsg("ok", "Comprimindo imagem...");
        const dataUrl = await compressImageFile(file, { maxW: 900, maxH: 900, quality: 0.78, output: "image/webp" });
        $("imagem").value = dataUrl;
        setImagePreview(dataUrl);

        const approxKB = Math.round((dataUrl.length * 0.75) / 1024);
        showMsg("ok", `Imagem pronta ✅ (~${approxKB} KB)`);
      }catch(err){
        alert(err.message);
        showMsg("error", "Falha ao processar a imagem.");
      }
    });
  }

  if($("btnRemoveImg")){
    $("btnRemoveImg").addEventListener("click", () => {
      if($("imagemFile")) $("imagemFile").value = "";
      $("imagem").value = "";
      setImagePreview("");
      showMsg("ok", "Imagem removida ✅");
    });
  }

  $("productForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const prod = normalizeProductFromForm();
    const err = validateProduct(prod, !editingId);
    if(err){
      showMsg("error", err);
      return;
    }

    upsertProduct(prod);
    showMsg("ok", "Salvo ✅");

    if(!editingId){
      clearForm();
    }
  });

  // Pedidos (somente os pedidos do seu navegador)
  orders = loadOrders();
  normalizeOrders();

  if($("ordersSearch")) $("ordersSearch").addEventListener("input", renderOrders);
  if($("ordersFilter")) $("ordersFilter").addEventListener("change", renderOrders);

  if($("btnExportOrders")) $("btnExportOrders").onclick = exportOrdersJSON;
  if($("btnClearOrders")) $("btnClearOrders").onclick = clearOrders;

  if($("orderModalClose")) $("orderModalClose").onclick = closeOrderModal;

  const modal = $("orderModal");
  if(modal){
    modal.addEventListener("click", (e) => { if(e.target === modal) closeOrderModal(); });
  }

  setTab("produtos");
}

init();