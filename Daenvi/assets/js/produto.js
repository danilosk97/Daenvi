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

function addToCart(product){
  const cart = getCart();
  const found = cart.find(i => i.id === product.id);
  if(found) found.qtd += 1;
  else cart.push({ id: product.id, nome: product.nome, preco: product.preco, imagem: product.imagem, qtd: 1 });
  setCart(cart);
  alert("Adicionado ao carrinho ✅");
}

function getQueryParam(key){
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

async function loadProducts(){
  const override = localStorage.getItem("daenvi_products_override");
  if (override) {
    try { return JSON.parse(override); } catch(e) {}
  }

  const res = await fetch(PRODUCTS_URL);
  return await res.json();
}

(async function init(){
  updateCartBadge();

  const id = getQueryParam("id");
  const products = await loadProducts();
  const p = products.find(x => x.id === id);

  const page = document.getElementById("productPage");
  if(!p){
    page.innerHTML = `<div class="card"><b>Produto não encontrado</b><p class="muted">Volte e escolha outro item.</p></div>`;
    return;
  }

  document.getElementById("crumbName").textContent = p.nome;

  page.innerHTML = `
    <div class="product-view">
      <img src="${p.imagem}" alt="${p.nome}">
    </div>

    <div class="product-info">
      <h2>${p.nome}</h2>

      <div class="product-badges">
        <span class="badge2">${p.categoria}</span>
        <span class="badge2">Garantia do fornecedor</span>
        <span class="badge2">Entrega conforme CEP</span>
      </div>

      <p class="product-desc">${p.descricao}</p>

      <div class="product-meta" style="margin-top:12px;">
        <div>
          <div class="kicker">Preço</div>
          <div class="price" style="font-size:22px">${money(p.preco)}</div>
        </div>
      </div>

      <div class="product-cta">
        <button class="btn primary" id="btnAdd">Adicionar ao carrinho</button>
        <a class="btn ghost" href="carrinho.html">Ver carrinho</a>
      </div>
    </div>
  `;

  document.getElementById("btnAdd").onclick = () => addToCart(p);

  const input = document.getElementById("searchInput");
  if(input){
    input.addEventListener("keydown", (e) => {
      if(e.key === "Enter"){
        window.location.href = "index.html";
      }
    });
  }
})();
