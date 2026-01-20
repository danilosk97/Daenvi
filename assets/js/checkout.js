// assets/js/checkout.js
const CART_KEY = "daenvi_cart";
const ORDERS_KEY = "daenvi_orders";

// ✅ API do Apps Script (a sua)
const DAENVI_API_URL = "https://script.google.com/macros/s/AKfycbx6z6hD9iORhK6E9MARxKopbysGVaunBZUYGXv5beBPgHg4RiHcEmdP9JNPkCnrwHTj/exec";

// ✅ Chave para o checkout enviar pedidos (igual no Code.gs)
const DAENVI_PUBLIC_WRITE_KEY = "DAENVI_PEDIDO_2026";

function $(id){ return document.getElementById(id); }
function onlyDigits(s){ return String(s || "").replace(/\D/g, ""); }

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

/** ✅ Validação real do CPF */
function isValidCPF(cpf){
  cpf = onlyDigits(cpf);
  if(cpf.length !== 11) return false;
  if(/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for(let i=0; i<9; i++) sum += parseInt(cpf[i],10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if(d1 === 10) d1 = 0;
  if(d1 !== parseInt(cpf[9],10)) return false;

  sum = 0;
  for(let i=0; i<10; i++) sum += parseInt(cpf[i],10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if(d2 === 10) d2 = 0;
  if(d2 !== parseInt(cpf[10],10)) return false;

  return true;
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
  if(!isValidCPF(d.cpf)) return "CPF inválido. Digite um CPF verdadeiro (11 dígitos).";
  if(!d.whatsapp) return "Informe seu WhatsApp/Telefone.";
  if(onlyDigits(d.whatsapp).length < 10) return "WhatsApp/Telefone inválido (coloque DDD + número).";
  if(!d.cep) return "Informe seu CEP.";
  if(onlyDigits(d.cep).length !== 8) return "CEP inválido (8 dígitos).";
  if(!d.endereco) return "Informe seu endereço.";
  if(!d.numero) return "Informe o número.";
  if(!d.bairro) return "Informe o bairro.";
  if(!d.cidade) return "Informe a cidade.";
  if(!d.estado) return "Informe o estado (ex: PE).";
  if(!d.pagamento) return "Selecione a forma de pagamento.";
  return null;
}

function buildItensMultiline(cart){
  return cart.map(i => `${i.qtd}x ${i.nome} — ${money(i.preco)}`).join("\n");
}

async function sendOrderToApi(orderPayload){
  const res = await fetch(DAENVI_API_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({
      key: DAENVI_PUBLIC_WRITE_KEY,
      order: orderPayload
    })
  });

  const data = await res.json().catch(()=>null);
  if(!res.ok || (data && data.ok === false)){
    throw new Error((data && data.error) ? data.error : "Falha ao enviar pedido");
  }
}

let SENDING = false;

async function finalizarPedido(){
  if(SENDING) return;

  const btn = $("btnFinalizar");
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
  const totalNum = calcTotal(cart);

  // trava botão
  SENDING = true;
  if(btn){
    btn.disabled = true;
    btn.textContent = "Enviando...";
  }

  // payload para API (planilha)
  const apiOrder = {
    orderId,
    createdAt,
    status: "Recebido",
    total: money(totalNum),
    payment: data.pagamento,
    name: data.nome,
    cpf: onlyDigits(data.cpf),
    whatsapp: onlyDigits(data.whatsapp),
    cep: onlyDigits(data.cep),
    address: data.endereco,
    number: data.numero,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.cidade,
    state: data.estado,
    itemsJson: JSON.stringify(cart)
  };

  // salva local também (pra acompanhar pedido continuar)
  const localPedido = {
    id: orderId,
    criadoEm: createdAt,
    status: "Recebido",
    cliente: data,
    itens: cart,
    total: totalNum,
    itensResumo: buildItensMultiline(cart).replace(/\n/g, " | ")
  };

  try{
    await sendOrderToApi(apiOrder);

    const orders = getOrders();
    orders.unshift(localPedido);
    saveOrders(orders);

    saveCart([]);

    showMsg("ok", `Pedido enviado com sucesso! ID: ${orderId}`);
    setTimeout(() => {
      window.location.href = `pedido-recebido.html?id=${encodeURIComponent(orderId)}`;
    }, 700);

  }catch(e){
    showMsg("error", "Não consegui enviar o pedido pra planilha. Tente novamente. (" + e.message + ")");
    SENDING = false;
    if(btn){
      btn.disabled = false;
      btn.textContent = "Fazer pedido";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderResumo();

  const btn = $("btnFinalizar");
  if(btn){
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      finalizarPedido();
    });
  } else {
    console.warn("btnFinalizar não encontrado no HTML.");
  }
});