const PRODUCTS_URL = "assets/data/produtos.json";

function money(v){
  return v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function getCart(){
  return JSON.parse(localStorage.getItem("daenvi_cart") || "[]");
}

function setCart(cart){
  localStorage.setItem("daenvi_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge(){
  const count = getCart().reduce((acc,i)=> acc + i.qtd, 0);
  const badge = document.getElementById("cartCount");
  if(badge) badge.textContent = count;
}

async function loadProducts(){
  // Se o admin salvou override, usa ele
  const override = localStorage.getItem("daenvi_products_override");
  if (override) {
    try { return JSON.parse(override); } catch(e) {}
  }

  // Caso contrário, usa o JSON do site
  const res = await fetch(PRODUCTS_URL);
  return await res.json();
}

function addToCart(product){
  const cart = getCart();
  const found = cart.find(i => i.id === product.id);
  if(found){
    found.qtd += 1;
  }else{
    cart.push({ id: product.id, nome: product.nome, preco: product.preco, imagem: product.imagem, qtd: 1 });
  }
  setCart(cart);
  alert("Adicionado ao carrinho ✅");
}

function renderCategories(products){
  const categories = ["Todos", ...new Set(products.map(p => p.categoria))];
  const row = document.getElementById("categoryRow");
  if(!row) return;

  row.innerHTML = "";
  categories.forEach((cat, idx) => {
    const btn = document.createElement("button");
    btn.className = "cat" + (idx === 0 ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      applyFilters(products);
    };
    row.appendChild(btn);
  });
}

function currentCategory(){
  const active = document.querySelector(".cat.active");
  return active ? active.textContent : "Todos";
}

function applyFilters(products){
  const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  const cat = currentCategory();

  let filtered = products;

  if(cat && cat !== "Todos"){
    filtered = filtered.filter(p => p.categoria === cat);
  }
  if(q){
    filtered = filtered.filter(p =>
      (p.nome || "").toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q)
    );
  }

  renderProducts(filtered);
}

function renderProducts(products){
  const grid = document.getElementById("productsGrid");
  if(!grid) return;

  grid.innerHTML = "";

  if(products.length === 0){
    grid.innerHTML = `<div class="card"><b>Nenhum produto encontrado.</b><p class="muted">Tente outra busca.</p></div>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-img">
        <img src="${p.imagem}" alt="${p.nome}">
      </div>
      <div class="product-body">
        <div class="product-title">${p.nome}</div>
        <div class="product-meta">
          <div>
            <div class="kicker">${p.categoria}</div>
            <div class="price">${money(p.preco)}</div>
          </div>
        </div>
        <div class="product-actions">
          <a class="btn ghost" href="produto.html?id=${encodeURIComponent(p.id)}">Ver</a>
          <button class="btn primary">Comprar</button>
        </div>
      </div>
    `;

    card.querySelector(".btn.primary").onclick = () => addToCart(p);
    grid.appendChild(card);
  });
}

(async function init(){
  updateCartBadge();

  const products = await loadProducts();

  renderCategories(products);
  renderProducts(products);

  const input = document.getElementById("searchInput");
  if(input){
    input.addEventListener("input", () => applyFilters(products));
  }

  const btn = document.getElementById("btnVerOfertas");
  if(btn){
    btn.onclick = () => {
      document.getElementById("produtos")?.scrollIntoView({ behavior:"smooth" });
    };
  }
})();
