// Daenvi/assets/js/produto.js

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

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function loadProducts(){
  const res = await fetch("assets/data/produtos.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Falha ao carregar produtos.json");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

function renderProduct(p){
  const page = $("productPage");
  if(!page) return;

  $("crumbName").textContent = p.nome || "Produto";

  page.innerHTML = `
    <div class="product-wrap">
      <div class="product-media">
        <img src="${p.imagem}" alt="${p.nome}" />
      </div>

      <div class="product-info">
        <h1 class="product-title">${p.nome}</h1>
        <div class="muted">${p.categoria || "Geral"}</div>

        <div class="product-price">${money(p.preco)}</div>

        <p class="product-desc">${p.descricao || ""}</p>

        <div class="product-actions">
          <button class="btn primary" id="btnAdd" type="button">Adicionar ao carrinho</button>
          <a class="btn ghost" href="carrinho.html">Ver carrinho</a>
        </div>

        <div class="card" style="margin-top:14px;background:rgba(255,255,255,.02);">
          <div class="muted" style="line-height:1.5;">
            <b>Como funciona:</b> você finaliza o pedido, o sistema gera um ID e a equipe confirma disponibilidade e envio.
          </div>
        </div>
      </div>
    </div>
  `;

  $("btnAdd").onclick = () => {
    addToCart(p);
    const btn = $("btnAdd");
    btn.textContent = "Adicionado ✓";
    setTimeout(() => btn.textContent = "Adicionar ao carrinho", 900);
  };
}

(async function init(){
  updateCartBadge();

  const id = getParam("id");
  if(!id){
    $("productPage").innerHTML = `<div class="muted">Produto não encontrado.</div>`;
    return;
  }

  try{
    const products = await loadProducts();
    const p = products.find(x => String(x.id) === String(id));

    if(!p){
      $("productPage").innerHTML = `<div class="muted">Produto não encontrado.</div>`;
      return;
    }

    renderProduct(p);

    // Busca (opcional): leva pra home e filtra
    const search = $("searchInput");
    if(search){
      search.addEventListener("keydown", (e) => {
        if(e.key === "Enter"){
          const q = search.value.trim();
          if(q) window.location.href = `index.html#produtos`;
        }
      });
    }
  }catch(err){
    console.error(err);
    $("productPage").innerHTML = `<div class="muted">Erro ao carregar produto.</div>`;
  }
})();
