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

function calcTotals(cart){
  const subtotal = cart.reduce((acc,i)=> acc + (i.preco * i.qtd), 0);
  return { subtotal, total: subtotal };
}

function renderCart(){
  const cart = getCart();
  const box = document.getElementById("cartItems");

  if(cart.length === 0){
    box.innerHTML = `
      <div class="card">
        <b>Seu carrinho está vazio</b>
        <p class="muted">Volte na loja e adicione produtos.</p>
        <a class="btn primary" href="index.html#produtos">Ver produtos</a>
      </div>
    `;
    document.getElementById("subtotal").textContent = money(0);
    document.getElementById("total").textContent = money(0);
    return;
  }

  box.innerHTML = "";
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}">
      <div>
        <div class="cart-item-title">${item.nome}</div>
        <div class="cart-item-sub">${money(item.preco)} • Qtd: ${item.qtd}</div>
      </div>
      <div class="cart-item-controls">
        <div class="qty">
          <button data-act="menos">−</button>
          <span>${item.qtd}</span>
          <button data-act="mais">+</button>
        </div>
        <button class="remove">Remover</button>
      </div>
    `;

    row.querySelector('[data-act="mais"]').onclick = () => {
      item.qtd += 1;
      setCart(cart);
      renderCart();
    };

    row.querySelector('[data-act="menos"]').onclick = () => {
      item.qtd -= 1;
      if(item.qtd <= 0){
        const idx = cart.findIndex(i => i.id === item.id);
        cart.splice(idx, 1);
      }
      setCart(cart);
      renderCart();
    };

    row.querySelector(".remove").onclick = () => {
      const idx = cart.findIndex(i => i.id === item.id);
      cart.splice(idx, 1);
      setCart(cart);
      renderCart();
    };

    box.appendChild(row);
  });

  const totals = calcTotals(cart);
  document.getElementById("subtotal").textContent = money(totals.subtotal);
  document.getElementById("total").textContent = money(totals.total);
}

(function init(){
  updateCartBadge();
  renderCart();

  document.getElementById("btnLimpar").onclick = () => {
    if(confirm("Deseja limpar o carrinho?")){
      localStorage.removeItem("daenvi_cart");
      renderCart();
      updateCartBadge();
    }
  };
})();
