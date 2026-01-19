// Daenvi/assets/js/app.js
const CART_KEY = "daenvi_cart";

function $(id){ return document.getElementById(id); }

function money(v){
  return (Number(v) || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function getCart(){
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge(){
  const cart = getCart();
  const count = cart.reduce((acc,i)=> acc + (i.qtd || 0), 0);
  const badge = $("cartCount");
  if(badge) badge.textContent = count;
}

function addToCart(product){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === product.id);

  if(idx >= 0){
    cart[idx].qtd += 1;
  }else{
    cart.push({
      id: product.id,
      nome: product.nome,
      preco: Number(product.preco) || 0,
      imagem: product.imagem || "",
      qtd: 1
    });
  }

  saveCart(cart);
  updateCartBadge();
}

function uniqueCategories(list){
  const set = new Set(list.map(p => (p.categoria || "").trim()).filter(Boolean));
  return Array.from(set).sort((a,b)=> a.localeCompare(b,"pt-BR"));
}

function sortProducts(list, mode){
  const arr = [...list];
  if(mode === "price_asc") arr.sort((a,b)=> (a.preco||0) - (b.preco||0));
  if(mode === "price_desc") arr.sort((a,b)=> (b.preco||0) - (a.preco||0));
  if(mode === "name_asc") arr.sort((a,b)=> String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR"));
  return arr;
}

async function loadProducts(){
  const res = await fetch("assets/data/produtos.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Falha ao carregar produtos.json");
  const data = await res.json();
  if(!Array.isArray(data)) return [];
  return data.map(p => ({
    id: String(p.id || "").trim(),
    nome: String(p.nome || "").trim(),
    categoria: String(p.categoria || "").trim(),
    preco: Number(p.preco) || 0,
    preco_antigo: p.preco_antigo != null ? Number(p.preco_antigo) : null,
    selo: String(p.selo || "").trim(), // OFERTA / TOP / NOVO etc
    tags: Array.isArray(p.tags) ? p.tags.slice(0,3) : [],
    imagem: String(p.imagem || "").trim(),
    descricao: String(p.descricao || "").trim()
  })).filter(p => p.id && p.nome);
}

function calcDiscount(preco, antigo){
  if(!antigo || antigo <= preco) return null;
  const pct = Math.round((1 - (preco/antigo)) * 100);
  return pct > 0 ? pct : null;
}

function renderProducts(list){
  const grid = $("productsGrid");
  const empty = $("emptyState");
  if(!grid) return;

  if(list.length === 0){
    grid.innerHTML = "";
    if(empty) empty.style.display = "block";
    return;
  }
  if(empty) empty.style.display = "none";

  grid.innerHTML = list.map(p => {
    const pct = calcDiscount(p.preco, p.preco_antigo);
    const badge = p.selo ? `<span class="p-badge">${p.selo}</span>` : (pct ? `<span class="p-badge">-${pct}%</span>` : "");
    const old = (p.preco_antigo && p.preco_antigo > p.preco) ? `<span class="p-old">${money(p.preco_antigo)}</span>` : "";
    const chips = (p.tags || []).map(t => `<span class="p-chip">${t}</span>`).join("");

    return `
      <article class="product-card">
        <a class="product-img" href="produto.html?id=${encodeURIComponent(p.id)}" title="${p.nome}">
          ${badge}
          <img src="${p.imagem}" alt="${p.nome}" loading="lazy"/>
        </a>

        <div class="product-body">
          <div class="product-title">${p.nome}</div>

          <div class="product-meta">
            <span class="kicker">${p.categoria || "Geral"}</span>
            <span class="price">
              ${old}
              ${money(p.preco)}
            </span>
          </div>

          ${chips ? `<div class="p-chips">${chips}</div>` : ""}

          <div class="product-actions">
            <button class="btn primary" data-add="${p.id}" type="button">Adicionar</button>
            <a class="btn ghost" href="produto.html?id=${encodeURIComponent(p.id)}">Ver</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  grid.onclick = (e) => {
    const btn = e.target.closest("[data-add]");
    if(!btn) return;

    const id = btn.getAttribute("data-add");
    const prod = list.find(x => x.id === id);
    if(!prod) return;

    addToCart(prod);
    btn.textContent = "Adicionado ✓";
    setTimeout(() => btn.textContent = "Adicionar", 800);
  };
}

function fillCategories(products){
  const select = $("category");
  if(!select) return;

  const cats = uniqueCategories(products);
  select.innerHTML = `<option value="all">Todas categorias</option>` + cats.map(c => `
    <option value="${c}">${c}</option>
  `).join("");
}

function applyFilters(all){
  const q = ($("search")?.value || "").trim().toLowerCase();
  const cat = $("category")?.value || "all";
  const sort = $("sort")?.value || "relevance";

  let out = [...all];

  if(cat !== "all"){
    out = out.filter(p => (p.categoria || "") === cat);
  }

  if(q){
    out = out.filter(p =>
      (p.nome || "").toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q)
    );
  }

  out = sortProducts(out, sort);
  renderProducts(out);
}

(async function init(){
  updateCartBadge();

  let products = [];
  try{
    products = await loadProducts();
  }catch(err){
    console.error(err);
    const grid = $("productsGrid");
    if(grid) grid.innerHTML = `<div class="muted">Não consegui carregar os produtos agora.</div>`;
    return;
  }

  fillCategories(products);
  applyFilters(products);

  $("search")?.addEventListener("input", () => applyFilters(products));
  $("category")?.addEventListener("change", () => applyFilters(products));
  $("sort")?.addEventListener("change", () => applyFilters(products));
})();
