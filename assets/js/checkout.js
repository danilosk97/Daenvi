// assets/js/checkout.js
const CART_KEY = "daenvi_cart";
const ORDERS_KEY = "daenvi_orders";

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfJdVNb9KeNiB7a5otVfz952SmpHY4-TFW0pfXxLHe7Y5U2Lw/formResponse";

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
  if(/^(\d)\1{10}$/.test(cpf)) return false; // bloqueia 00000000000, 111...

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

function sendToGoogleForms(payload){
  return new Promise((resolve) => {
    const iframeName = "hidden_iframe_" + Date.now();
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.action = GOOGLE_FORM_ACTION;
    form.method = "POST";
    form.target = iframeName;
    form.style.display = "none";

    function add(name, value){
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value ?? "";
      form.appendChild(input);
    }

    add(ENTRY.orderId, payload.orderId);
    add(ENTRY.dateTime, payload.dateTime);
    add(ENTRY.nome, payload.nome);
    add(ENTRY.cpf, payload.cpf);
    add(ENTRY.whatsapp, payload.whatsapp);
    add(ENTRY.cep, payload.cep);
    add(ENTRY.endereco, payload.endereco);
    add(ENTRY.numero, payload.numero);
    add(ENTRY.complemento, payload.complemento);
    add(ENTRY.bairro, payload.bairro);
    add(ENTRY.cidade, payload.cidade);
    add(ENTRY.estado, payload.estado);
    add(ENTRY.pagamento, payload.pagamento);
    add(ENTRY.itens, payload.itens);
    add(ENTRY.total, payload.total);

    document.body.appendChild(iframe);
    document.body.appendChild(form);

    iframe.onload = () => {
      // dá um tempinho pro Google processar
      setTimeout(() => {
        form.remove();
        iframe.remove();
        resolve(true);
      }, 800);
    };

    form.submit();
  });
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

  const pedido = {
    id: orderId,
    criadoEm: createdAt,
    status: "Recebido",
    cliente: data,
    itens: cart,
    total: totalNum,
    itensResumo: buildItensMultiline(cart).replace(/\n/g, " | ")
  };

  // trava botão
  SENDING = true;
  if(btn){
    btn.disabled = true;
    btn.textContent = "Enviando...";
  }

  // salva local para acompanhar funcionar
  const orders = getOrders();
  orders.unshift(pedido);
  saveOrders(orders);

  // envia pro Google Forms (planilha)
  try{
    await sendToGoogleForms({
      orderId,
      dateTime: createdAt,
      nome: data.nome,
      cpf: onlyDigits(data.cpf),
      whatsapp: onlyDigits(data.whatsapp),
      cep: onlyDigits(data.cep),
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
  }

  // limpa carrinho
  saveCart([]);

  showMsg("ok", `Pedido enviado com sucesso! ID: ${orderId}`);

  setTimeout(() => {
    window.location.href = `pedido-recebido.html?id=${encodeURIComponent(orderId)}`;
  }, 700);
}

function bind(){
  const btn = $("btnFinalizar");
  if(!btn){
    // se o botão não existir, você clica e não acontece nada — isso explica seu caso
    console.warn("btnFinalizar não encontrado no HTML.");
    return;
  }
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    finalizarPedido();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderResumo();
  bind();
});