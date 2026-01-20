// assets/js/checkout.js
const CART_KEY = "daenvi_cart";
const ORDERS_KEY = "daenvi_orders";

// ✅ ACTION (você já mandou)
const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfJdVNb9KeNiB7a5otVfz952SmpHY4-TFW0pfXxLHe7Y5U2Lw/formResponse";

/**
 * ✅ Mapeamento pelos entry.xxxxx que você mandou.
 * Observação importante:
 * - Pix apareceu em entry.638609560 => isso é o "Pagamento"
 * - Itens/Total podem variar conforme a ordem real do seu formulário.
 * Se cair em coluna errada na planilha, é só trocar o entry daquele campo.
 */
const ENTRY = {
  orderId: "entry.1855484752",
  dateTime: "entry.922196235",
  nome: "entry.1230654357",
  cpf: "entry.76616706",
  whatsapp: "entry.1590058310",
  cep: "entry.2070484836",
  endereco: "entry.1788536542",
  numero: "entry.101360856",
  complemento: "entry.1856258826",
  bairro: "entry.1714075075",
  cidade: "entry.168789408",
  estado: "entry.447286208",
  pagamento: "entry.638609560",
  itens: "entry.821897272",
  total: "entry.393353290"
};

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

function buildItensMultiline(cart){
  return cart.map(i => `${i.qtd}x ${i.nome} — ${money(i.preco)}`).join("\n");
}

async function sendToGoogleForms(payload){
  const fd = new FormData();

  fd.append(ENTRY.orderId, payload.orderId);
  fd.append(ENTRY.dateTime, payload.dateTime);
  fd.append(ENTRY.nome, payload.nome);
  fd.append(ENTRY.cpf, payload.cpf);
  fd.append(ENTRY.whatsapp, payload.whatsapp);
  fd.append(ENTRY.cep, payload.cep);
  fd.append(ENTRY.endereco, payload.endereco);
  fd.append(ENTRY.numero, payload.numero);
  fd.append(ENTRY.complemento, payload.complemento);
  fd.append(ENTRY.bairro, payload.bairro);
  fd.append(ENTRY.cidade, payload.cidade);
  fd.append(ENTRY.estado, payload.estado);

  fd.append(ENTRY.pagamento, payload.pagamento);
  fd.append(ENTRY.itens, payload.itens);
  fd.append(ENTRY.total, payload.total);

  // no-cors: envia sem travar (o Google não libera resposta CORS)
  await fetch(GOOGLE_FORM_ACTION, { method: "POST", mode: "no-cors", body: fd });
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
  const totalNum = calcTotal(cart);

  const pedido = {
    id: orderId,
    criadoEm: createdAt,
    status: "Recebido",
    cliente: data,
    itens: cart,
    total: totalNum,
    itensResumo: buildItensMultiline(cart).replace(/\n/g, " | ")
  };

  // 1) salva local (acompanhar pedido continua funcionando)
  const orders = getOrders();
  orders.unshift(pedido);
  saveOrders(orders);

  // 2) envia pro Google Forms (cai na planilha)
  try{
    await sendToGoogleForms({
      orderId,
      dateTime: createdAt,
      nome: data.nome,
      cpf: data.cpf,
      whatsapp: data.whatsapp,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      pagamento: data.pagamento,
      itens: buildItensMultiline(cart),
      total: money(totalNum)
    });
  }catch(e){
    console.warn("Falha ao enviar pro Google Forms:", e);
    // Mesmo se falhar o envio, não quebra o fluxo pro cliente
  }

  // 3) limpa carrinho e vai pra tela de sucesso
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