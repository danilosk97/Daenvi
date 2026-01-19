// assets/js/checkout.js

function money(v){
  return v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function getCart(){
  return JSON.parse(localStorage.getItem("daenvi_cart") || "[]");
}

function updateCartBadge(){
  const count = getCart().reduce((acc,i)=> acc + (i.qtd || 0), 0);
  const badge = document.getElementById("cartCount");
  if(badge) badge.textContent = count;
}

function calcTotal(cart){
  return cart.reduce((acc,i)=> acc + (Number(i.preco) * Number(i.qtd)), 0);
}

function renderCheckoutItems(){
  const cart = getCart();
  const box = document.getElementById("checkoutItems");
  const total = calcTotal(cart);

  if(!box) return;

  if(cart.length === 0){
    box.innerHTML = `<div class="muted">Carrinho vazio. Volte e escolha produtos.</div>`;
    const totalEl = document.getElementById("checkoutTotal");
    if(totalEl) totalEl.textContent = money(0);
    return;
  }

  box.innerHTML = "";
  cart.forEach(i => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <span>${i.nome} <span class="muted">x${i.qtd}</span></span>
      <strong>${money(i.preco * i.qtd)}</strong>
    `;
    box.appendChild(div);
  });

  const totalEl = document.getElementById("checkoutTotal");
  if(totalEl) totalEl.textContent = money(total);
}

function onlyDigits(s){
  return (s || "").replace(/\D/g, "");
}

function formatCPF(value){
  const v = onlyDigits(value).slice(0, 11);
  const p1 = v.slice(0,3);
  const p2 = v.slice(3,6);
  const p3 = v.slice(6,9);
  const p4 = v.slice(9,11);

  let out = p1;
  if(p2) out += "." + p2;
  if(p3) out += "." + p3;
  if(p4) out += "-" + p4;
  return out;
}

function formatCEP(value){
  const v = onlyDigits(value).slice(0, 8);
  const p1 = v.slice(0,5);
  const p2 = v.slice(5,8);
  return p2 ? `${p1}-${p2}` : p1;
}

function formatWhats(value){
  const v = onlyDigits(value).slice(0, 11);
  if(v.length <= 2) return v;

  const ddd = v.slice(0,2);
  const rest = v.slice(2);

  if(rest.length <= 4) return `(${ddd}) ${rest}`;
  if(rest.length <= 9) return `(${ddd}) ${rest.slice(0,5)}-${rest.slice(5)}`;
  return `(${ddd}) ${rest.slice(0,5)}-${rest.slice(5,9)}`;
}

function showMsg(type, text){
  const msg = document.getElementById("msg");
  if(!msg) return;

  msg.className = "msg " + (type || "");
  msg.textContent = text || "";
  msg.style.display = text ? "block" : "none";
}

function buildOrderText(data, cart, total, pedidoId){
  const itens = cart.map(i => `- ${i.nome} (x${i.qtd}) = ${money(i.preco * i.qtd)}`).join("\n");

  return `
🛒 *Pedido Daenvi*
━━━━━━━━━━━━━━━━
🆔 *ID:* ${pedidoId}

👤 *Cliente:* ${data.nome}
🪪 *CPF:* ${data.cpf}
📲 *Whats:* ${data.whats}
📧 *Email:* ${data.email || "Não informado"}

📦 *Endereço*
CEP: ${data.cep}
Rua: ${data.rua}, Nº ${data.numero}
Bairro: ${data.bairro}
Cidade/UF: ${data.cidade}-${data.estado}
Complemento: ${data.complemento || "-"}

💳 *Pagamento:* ${data.pagamento}

🧾 *Itens*
${itens}

💰 *Total:* ${money(total)}
━━━━━━━━━━━━━━━━
✅ Confirmação e envio conforme fornecedor.
`.trim();
}

async function sendToNetlifyForms(payloadObj){
  const payload = new URLSearchParams();
  payload.append("form-name", "daenvi-orders");

  for(const [k,v] of Object.entries(payloadObj)){
    payload.append(k, v == null ? "" : String(v));
  }

  // Netlify Forms funciona quando o site está publicado
  // Em local pode falhar: sem problema, pedido ainda fica salvo localmente
  await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString()
  });
}

// ===== Registro leve do cliente (sem login) =====
const KEY_CLIENT = "daenvi_client_profile";

function saveClientProfile(data){
  const profile = {
    nome: data.nome,
    cpf: data.cpf,
    whats: data.whats,
    email: data.email || "",
    cep: data.cep,
    rua: data.rua,
    numero: data.numero,
    bairro: data.bairro,
    cidade: data.cidade,
    estado: data.estado,
    complemento: data.complemento || ""
  };
  localStorage.setItem(KEY_CLIENT, JSON.stringify(profile));
}

function loadClientProfile(){
  const raw = localStorage.getItem(KEY_CLIENT);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
}

function fillFromProfile(){
  const p = loadClientProfile();
  if(!p) return;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if(el && !el.value) el.value = val || "";
  };

  set("nome", p.nome);
  set("cpf", p.cpf);
  set("whats", p.whats);
  set("email", p.email);
  set("cep", p.cep);
  set("rua", p.rua);
  set("numero", p.numero);
  set("bairro", p.bairro);
  set("cidade", p.cidade);
  set("estado", p.estado);
  set("complemento", p.complemento);
}

(function init(){
  updateCartBadge();
  renderCheckoutItems();
  fillFromProfile();

  const cartNow = getCart();
  if(cartNow.length === 0){
    showMsg("error", "Seu carrinho está vazio. Volte e adicione produtos antes de finalizar.");
  }

  const cpfInput = document.getElementById("cpf");
  const cepInput = document.getElementById("cep");
  const whatsInput = document.getElementById("whats");

  if(cpfInput) cpfInput.addEventListener("input", () => cpfInput.value = formatCPF(cpfInput.value));
  if(cepInput) cepInput.addEventListener("input", () => cepInput.value = formatCEP(cepInput.value));
  if(whatsInput) whatsInput.addEventListener("input", () => whatsInput.value = formatWhats(whatsInput.value));

  const form = document.getElementById("checkoutForm");
  if(!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cart = getCart();
    if(cart.length === 0){
      showMsg("error", "Carrinho vazio. Adicione produtos antes de finalizar.");
      return;
    }

    const data = {
      nome: document.getElementById("nome").value.trim(),
      cpf: document.getElementById("cpf").value.trim(),
      whats: document.getElementById("whats").value.trim(),
      email: document.getElementById("email").value.trim(),

      cep: document.getElementById("cep").value.trim(),
      numero: document.getElementById("numero").value.trim(),
      rua: document.getElementById("rua").value.trim(),
      bairro: document.getElementById("bairro").value.trim(),
      cidade: document.getElementById("cidade").value.trim(),
      estado: document.getElementById("estado").value.trim().toUpperCase(),
      complemento: document.getElementById("complemento").value.trim(),

      pagamento: document.getElementById("pagamento").value
    };

    if(!data.nome || !data.cpf || !data.whats || !data.cep || !data.numero || !data.rua || !data.bairro || !data.cidade || !data.estado){
      showMsg("error", "Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    if(onlyDigits(data.cpf).length !== 11){
      showMsg("error", "CPF inválido. Preencha corretamente.");
      return;
    }

    if(onlyDigits(data.cep).length !== 8){
      showMsg("error", "CEP inválido. Preencha corretamente.");
      return;
    }

    if(onlyDigits(data.whats).length < 10){
      showMsg("error", "WhatsApp inválido. Preencha corretamente com DDD.");
      return;
    }

    // ✅ salva perfil do cliente
    saveClientProfile(data);

    const total = calcTotal(cart);

    // ID, data e status
    const pedidoId = "PED-" + Date.now();
    const createdAt = new Date().toISOString();
    const status = "novo";

    const orderText = buildOrderText(data, cart, total, pedidoId);

    // ✅ salva histórico local (opcional)
    const pedidos = JSON.parse(localStorage.getItem("daenvi_orders") || "[]");
    pedidos.push({
      id: pedidoId,
      createdAt,
      status,
      cliente: data,
      itens: cart,
      total
    });
    localStorage.setItem("daenvi_orders", JSON.stringify(pedidos));

    showMsg("ok", "Pedido registrado ✅ Enviando...");

    // ✅ envia pro Netlify Forms (pedido real no FREE)
    try {
      await sendToNetlifyForms({
        pedido_id: pedidoId,
        status,
        criado_em: createdAt,

        nome: data.nome,
        cpf: data.cpf,
        whats: data.whats,
        email: data.email || "",

        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        complemento: data.complemento || "",

        pagamento: data.pagamento,
        total: String(total),

        itens_json: JSON.stringify(cart),
        mensagem_whats: orderText
      });

      showMsg("ok", "Pedido enviado ✅");
    } catch (err) {
      // em local pode falhar
      showMsg("error", "Falha ao enviar automaticamente agora. Mas seu pedido foi registrado.");
    }

    // ✅ limpa carrinho
    localStorage.removeItem("daenvi_cart");
    updateCartBadge();
    renderCheckoutItems();

    // ✅ guarda último pedido e redireciona pra tela "pedido recebido"
    localStorage.setItem("daenvi_last_order_id", pedidoId);

    setTimeout(() => {
      window.location.href = `pedido-recebido.html?id=${encodeURIComponent(pedidoId)}&status=${encodeURIComponent(status)}`;
    }, 800);
  });
})();
