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

function normalizeCategory(cat){
  return (cat || "").trim();
}

function uniqueCategories(list){
  const set = new Set(list.map(p => normalizeCategory(p.categoria)).filter(Boolean));
  return Array.from(set).sort((a,b)=> a.localeCompare(b, "pt-BR"));
}

function sortProducts(list, mode){
  const arr = [...list];
  if(mode === "price_asc") arr.sort((a,b)=> (a.preco||0) - (b.preco||0));
  if(mode === "price_desc") arr.sort((a,b)=> (b.preco||0) - (a.preco||0));
  if(mode === "name_asc") arr.sort((a,b)=> String(a.nome||"").localeCompare(String(b.nome||""), "pt-BR"));
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
    imagem: String(p.imagem || "").trim(),
    descricao: String(p.descricao || "").trim()
  })).filter(p => p.id && p.nome);
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

  grid.innerHTML = list.map(p => `
    <article class="p-card">
      <a class="p-media" href="produto.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.imagem}" alt="${p.nome}" loading="lazy"/>
      </a>
      <div class="p-body">
        <div class="p-title">${p.nome}</div>
        <div class="p-meta muted">${p.categoria || "Geral"}</div>
        <div class="p-bottom">
          <div class="p-price">${money(p.preco)}</div>
          <button class="btn small primary" data-add="${p.id}" type="button">Adicionar</button>
        </div>
      </div>
    </article>
  `).join("");

  // Event delegation
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
