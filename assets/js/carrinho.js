// Daenvi/assets/js/carrinho.js
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

function calcTotal(cart){
  return cart.reduce((acc,i)=> acc + (Number(i.preco)||0) * (Number(i.qtd)||0), 0);
}

function renderCart(){
  const cart = getCart();
  const list = $("cartList");
  const totalEl = $("cartTotal");
  const empty = $("cartEmpty");

  updateCartBadge();

  // Se a página não tiver cartList (ex: produto.html), só atualiza badge e sai
  if(!list) return;

  if(cart.length === 0){
    list.innerHTML = "";
    if(totalEl) totalEl.textContent = money(0);
    if(empty) empty.style.display = "block";
    return;
  }

  if(empty) empty.style.display = "none";

  list.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="cart-left">
        <img class="cart-img" src="${i.imagem || ""}" alt="${i.nome}" />
        <div class="cart-info">
          <div class="cart-name">${i.nome}</div>
          <div class="muted">${money(i.preco)}</div>
          <button class="btn ghost small" data-remove="${i.id}" type="button">Remover</button>
        </div>
      </div>

      <div class="cart-right">
        <div class="qty">
          <button class="btn ghost small" data-dec="${i.id}" type="button">-</button>
          <span class="qty-num">${i.qtd}</span>
          <button class="btn ghost small" data-inc="${i.id}" type="button">+</button>
        </div>
        <div class="cart-subtotal"><b>${money((Number(i.preco)||0) * (Number(i.qtd)||0))}</b></div>
      </div>
    </div>
  `).join("");

  if(totalEl) totalEl.textContent = money(calcTotal(cart));
}

function inc(id){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id);
  if(idx < 0) return;
  cart[idx].qtd += 1;
  saveCart(cart);
  renderCart();
}

function dec(id){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id);
  if(idx < 0) return;

  cart[idx].qtd -= 1;
  if(cart[idx].qtd <= 0) cart.splice(idx, 1);

  saveCart(cart);
  renderCart();
}

function removeItem(id){
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}

(function init(){
  renderCart();

  const list = $("cartList");
  if(!list) return;

  list.addEventListener("click", (e) => {
    const incBtn = e.target.closest("[data-inc]");
    const decBtn = e.target.closest("[data-dec]");
    const rmBtn  = e.target.closest("[data-remove]");

    if(incBtn) return inc(incBtn.getAttribute("data-inc"));
    if(decBtn) return dec(decBtn.getAttribute("data-dec"));
    if(rmBtn)  return removeItem(rmBtn.getAttribute("data-remove"));
  });
})();
