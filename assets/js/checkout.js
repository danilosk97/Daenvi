// assets/js/checkout.js
const CART_KEY = "daenvi_cart";
const ORDERS_KEY = "daenvi_orders";

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

function getOrders(){
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}
function saveOrders(list){
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
}

function calcTotal(cart){
  return cart.reduce((acc,i)=> acc + (Number(i.preco)||0) * (Number(i.qtd)||0), 0);
}

function genId(){
  return "DV" + Date.now().toString(36).toUpperCase();
}

function nowStr(){
  return new Date().toLocaleString("pt-BR");
}

function showMsg(type, text){
  const msg = $("msg");
  if(!msg) return;
  msg.className = "msg " + (type || "");
  msg.textContent = text || "";
}

function renderResumo(){
  const cart = getCart();
  const box = $("checkoutItems");
  const totalEl = $("checkoutTotal");

  if(!box || !totalEl) return;

  if(cart.length === 0){
    box.innerHTML = `<div class="muted">Seu carrinho está vazio.</div>`;
    totalEl.textContent = money(0);
    return;
  }

  box.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <div>
        <div style="font-weight:900;">${i.qtd}x ${i.nome}</div>
        <div class="muted small">${money(i.preco)} cada</div>
      </div>
      <div style="font-weight:900;">${money((Number(i.preco)||0) * (Number(i.qtd)||0))}</div>
    </div>
  `).join("");

  totalEl.textContent = money(calcTotal(cart));
}

function getFormData(){
  return {
    nome: ($("nome")?.value || "").trim(),
    cpf: ($("cpf")?.value || "").trim(),
    whatsapp: ($("whatsapp")?.value || "").trim(),
    cep: ($("cep")?.value || "").trim(),
    endereco: ($("endereco")?.value || "").trim(),
    numero: ($("numero")?.value || "").trim(),
    complemento: ($("complemento")?.value || "").trim(),
    bairro: ($("bairro")?.value || "").trim(),
    cidade: ($("cidade")?.value || "").trim(),
    estado: ($("estado")?.value || "").trim(),
    pagamento: ($("pagamento")?.value || "").trim()
  };
}

function validateForm(d){
  if(!d.nome) return "Informe seu nome completo.";
  if(!d.cpf) return "Informe seu CPF.";
  if(!d.whatsapp) return "Informe seu WhatsApp/Telefone.";
  if(!d.cep) return "Informe seu CEP.";
  if(!d.endereco) return "Informe seu endereço.";
  if(!d.numero) return "Informe o número.";
  if(!d.bairro) return "Informe o bairro.";
  if(!d.cidade) return "Informe a cidade.";
  if(!d.estado) return "Informe o estado.";
  if(!d.pagamento) return "Selecione a forma de pagamento.";
  return null;
}

function buildItensText(cart){
  return cart.map(i => `${i.qtd}x ${i.nome} (${money(i.preco)})`).join(" | ");
}

async function finalizarPedido(){
  showMsg("", "");

  const cart = getCart();
  if(cart.length === 0){
    showMsg("error", "Seu carrinho está vazio. Adicione produtos antes de finalizar.");
    return;
  }

  const data = getFormData();
  const err = validateForm(data);
  if(err){
    showMsg("error", err);
    return;
  }

  const orderId = genId();
  const createdAt = nowStr();
  const total = calcTotal(cart);

  const pedido = {
    id: orderId,
    criadoEm: createdAt,
    status: "Recebido",
    cliente: data,
    itens: cart,
    total: total,
    itensResumo: buildItensText(cart)
  };

  const orders = getOrders();
  orders.unshift(pedido);
  saveOrders(orders);

  // limpa carrinho após registrar pedido
  saveCart([]);

  showMsg("ok", `Pedido enviado com sucesso! ID: ${orderId}`);

  setTimeout(() => {
    window.location.href = `pedido-recebido.html?id=${encodeURIComponent(orderId)}`;
  }, 700);
}

(function init(){
  renderResumo();

  const btn = $("btnFinalizar");
  if(btn){
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      finalizarPedido();
    });
  }
})();