// assets/js/checkout.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ===== Config =====
  const ORDER_API = "/api/orders";
  const PUBLIC_WRITE_KEY = "DAENVI_PEDIDO_2026";

  // Coloque sua chave Pix aqui (pode trocar depois)
  const PIX_KEY = "SUA_CHAVE_PIX_AQUI";

  // ===== Helpers =====
  function setMsg(el, text, type) {
    if (!el) return;
    el.className = "msg " + (type || "");
    el.textContent = text || "";
    el.style.display = text ? "block" : "none";
  }

  function onlyDigits(s) {
    return String(s || "").replace(/\D+/g, "");
  }

  function isValidCPF(cpf) {
    cpf = onlyDigits(cpf);
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i), 10) * (10 - i);
    let d1 = 11 - (sum % 11);
    if (d1 >= 10) d1 = 0;
    if (d1 !== parseInt(cpf.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i), 10) * (11 - i);
    let d2 = 11 - (sum % 11);
    if (d2 >= 10) d2 = 0;
    if (d2 !== parseInt(cpf.charAt(10), 10)) return false;

    return true;
  }

  function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getCart() {
    // Usa o carrinho.js (se você já tem funções globais), senão lê localStorage padrão
    if (typeof window.getCartItems === "function") return window.getCartItems();

    const key = window.CART_KEY || "daenvi_cart";
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function clearCart() {
    if (typeof window.clearCart === "function") return window.clearCart();

    const key = window.CART_KEY || "daenvi_cart";
    localStorage.removeItem(key);
    if (typeof window.updateCartBadge === "function") window.updateCartBadge();
  }

  function genOrderId() {
    return "DV-" + Date.now().toString(36).toUpperCase();
  }

  // ===== Payment state =====
  let paymentConfirmed = false;
  let paymentProof = "";
  let currentMethod = "Pix";

  function lockSendBtn() {
    const btn = $("btnSendOrder");
    if (btn) btn.disabled = !paymentConfirmed;
  }

  function resetPaymentState() {
    paymentConfirmed = false;
    paymentProof = "";
    setMsg($("msgPix"), "", "");
    setMsg($("msgCard"), "", "");
    setMsg($("msgBoleto"), "", "");
    lockSendBtn();
  }

  function showPaymentBox(method) {
    $("payPix").style.display = method === "Pix" ? "block" : "none";
    $("payCard").style.display = method === "Cartão" ? "block" : "none";
    $("payBoleto").style.display = method === "Boleto" ? "block" : "none";
  }

  async function copyText(txt) {
    try {
      await navigator.clipboard.writeText(txt);
      return true;
    } catch {
      return false;
    }
  }

  function confirmPayment(method) {
    resetPaymentState();

    if (method === "Pix") {
      const proof = String($("pixProof").value || "").trim();
      if (!proof || proof.length < 6) {
        setMsg($("msgPix"), "Cole um código/ID de comprovante válido (mín. 6 caracteres).", "error");
        return;
      }
      paymentConfirmed = true;
      paymentProof = proof;
      setMsg($("msgPix"), "Pagamento confirmado (modo manual). Agora você pode enviar o pedido.", "ok");
      lockSendBtn();
      return;
    }

    if (method === "Cartão") {
      const proof = String($("cardProof").value || "").trim();
      if (!proof || proof.length < 6) {
        setMsg($("msgCard"), "Cole um código/ID de comprovante válido (mín. 6 caracteres).", "error");
        return;
      }
      paymentConfirmed = true;
      paymentProof = proof;
      setMsg($("msgCard"), "Pagamento confirmado (modo manual). Agora você pode enviar o pedido.", "ok");
      lockSendBtn();
      return;
    }

    if (method === "Boleto") {
      const proof = String($("boletoProof").value || "").trim();
      if (!proof || proof.length < 6) {
        setMsg($("msgBoleto"), "Cole um código/ID de comprovante válido (mín. 6 caracteres).", "error");
        return;
      }
      paymentConfirmed = true;
      paymentProof = proof;
      setMsg($("msgBoleto"), "Pagamento confirmado (modo manual). Agora você pode enviar o pedido.", "ok");
      lockSendBtn();
      return;
    }
  }

  // ===== Render summary =====
  function renderSummary() {
    const items = getCart();
    const wrap = $("checkoutItems");
    wrap.innerHTML = "";

    if (!items.length) {
      wrap.innerHTML = `<div class="mini-note">Seu carrinho está vazio.</div>`;
      $("subtotal").textContent = money(0);
      $("frete").textContent = money(0);
      $("total").textContent = money(0);
      return;
    }

    let subtotal = 0;

    items.forEach((it) => {
      const qtd = Number(it.qtd || it.quantidade || 1);
      const preco = Number(it.preco || it.price || 0);
      subtotal += qtd * preco;

      const row = document.createElement("div");
      row.className = "checkout-item";
      row.innerHTML = `
        <div>
          <div style="font-weight:900;">${it.nome || it.name || "Produto"}</div>
          <div class="kicker">Qtd: ${qtd} • ${money(preco)}</div>
        </div>
        <div style="font-weight:900;">${money(qtd * preco)}</div>
      `;
      wrap.appendChild(row);
    });

    const frete = 0; // depois a gente coloca regra simples
    $("subtotal").textContent = money(subtotal);
    $("frete").textContent = money(frete);
    $("total").textContent = money(subtotal + frete);
  }

  // ===== Submit order =====
  async function submitOrder(ev) {
    ev.preventDefault();

    const msg = $("msgCheckout");
    setMsg(msg, "", "");

    if (!paymentConfirmed) {
      setMsg(msg, "Confirme o pagamento antes de enviar o pedido.", "error");
      return;
    }

    const cart = getCart();
    if (!cart.length) {
      setMsg(msg, "Seu carrinho está vazio.", "error");
      return;
    }

    const nome = String($("nome").value || "").trim();
    const whatsapp = onlyDigits($("whatsapp").value);
    const cpf = onlyDigits($("cpf").value);
    const cep = onlyDigits($("cep").value);
    const endereco = String($("endereco").value || "").trim();
    const numero = String($("numero").value || "").trim();
    const complemento = String($("complemento").value || "").trim();
    const bairro = String($("bairro").value || "").trim();
    const cidade = String($("cidade").value || "").trim();
    const uf = String($("uf").value || "").trim().toUpperCase();

    if (!nome || !whatsapp || !cpf) {
      setMsg(msg, "Preencha nome, WhatsApp e CPF.", "error");
      return;
    }
    if (!isValidCPF(cpf)) {
      setMsg(msg, "CPF inválido. Verifique e tente novamente.", "error");
      return;
    }
    if (!cep || !endereco || !numero || !bairro || !cidade || !uf) {
      setMsg(msg, "Preencha endereço completo (CEP, rua, número, bairro, cidade e UF).", "error");
      return;
    }

    // total (do resumo)
    const totalTxt = $("total").textContent || "R$ 0,00";

    const orderId = genOrderId();
    const createdAt = new Date().toLocaleString("pt-BR");

    const payload = {
      action: "create_order",
      key: PUBLIC_WRITE_KEY,
      order: {
        orderId,
        createdAt,
        status: "Aguardando confirmação",
        total: totalTxt,
        payment: currentMethod,
        paymentProof: paymentProof, // vai gravar no itemsJson junto se tua planilha estiver setada
        name: nome,
        cpf,
        whatsapp,
        cep,
        address: endereco,
        number: numero,
        complement: complemento,
        neighborhood: bairro,
        city: cidade,
        state: uf,
        itemsJson: JSON.stringify(cart)
      }
    };

    try {
      const btn = $("btnSendOrder");
      btn.disabled = true;
      btn.textContent = "Enviando...";

      const res = await fetch(ORDER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        btn.disabled = false;
        btn.textContent = "Enviar pedido";
        setMsg(msg, `Não consegui enviar o pedido. (${data.error || res.status})`, "error");
        return;
      }

      setMsg(msg, "Pedido enviado com sucesso! Abrindo acompanhamento...", "ok");

      clearCart();

      // salva código para a página de acompanhar
      localStorage.setItem("daenvi_last_order", orderId);

      setTimeout(() => {
        window.location.href = "acompanhar.html?orderId=" + encodeURIComponent(orderId);
      }, 700);

    } catch (err) {
      setMsg(msg, "Falha ao enviar: " + err.message, "error");
      const btn = $("btnSendOrder");
      btn.disabled = false;
      btn.textContent = "Enviar pedido";
    }
  }

  // ===== Init =====
  function init() {
    renderSummary();
    if (typeof window.updateCartBadge === "function") window.updateCartBadge();

    // Pix key
    $("pixKeyText").textContent = PIX_KEY;

    // Payment method change
    const sel = $("paymentMethod");
    currentMethod = sel.value;
    showPaymentBox(currentMethod);
    resetPaymentState();

    sel.addEventListener("change", () => {
      currentMethod = sel.value;
      showPaymentBox(currentMethod);
      resetPaymentState();
    });

    $("btnCopyPix").addEventListener("click", async () => {
      const ok = await copyText(PIX_KEY);
      setMsg($("msgPix"), ok ? "Chave Pix copiada ✅" : "Não consegui copiar. Copie manualmente.", ok ? "ok" : "error");
    });

    $("btnConfirmPix").addEventListener("click", () => confirmPayment("Pix"));
    $("btnConfirmCard").addEventListener("click", () => confirmPayment("Cartão"));
    $("btnConfirmBoleto").addEventListener("click", () => confirmPayment("Boleto"));

    $("checkoutForm").addEventListener("submit", submitOrder);
  }

const btnPayMP = document.getElementById("btnPayMP");
const msgMP = document.getElementById("msgMP");

btnPayMP.addEventListener("click", async () => {
  try {
    setMsg(msgMP, "Gerando link de pagamento...", "ok");

    const totalText = document.getElementById("total").textContent || "R$ 0,00";
    const amount = Number(totalText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

    if (amount <= 0) {
      setMsg(msgMP, "Total inválido. Adicione itens no carrinho.", "error");
      return;
    }

    const orderId = localStorage.getItem("daenvi_pending_order") || ("DV-" + Date.now().toString(36).toUpperCase());
    localStorage.setItem("daenvi_pending_order", orderId);

    const backUrl = window.location.origin + "/checkout.html";

    const res = await fetch("/api/mp/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        title: "Pedido Daenvi",
        amount,
        backUrl
      })
    });

    const data = await res.json();
    if (!data.ok) {
      setMsg(msgMP, "Erro ao criar pagamento.", "error");
      console.log(data);
      return;
    }

    // redireciona pro MP
    window.location.href = data.init_point;

  } catch (e) {
    setMsg(msgMP, "Falha: " + e.message, "error");
  }
});

const params = new URLSearchParams(window.location.search);
const payment_id = params.get("payment_id");
const mp = params.get("mp");

if (payment_id && mp) {
  // Confere no servidor
  fetch("/api/mp/status?payment_id=" + encodeURIComponent(payment_id))
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.status === "approved") {
        paymentConfirmed = true;
        paymentProof = "MP_PAYMENT_ID=" + payment_id;
        lockSendBtn();
        setMsg(document.getElementById("msgCheckout"), "Pagamento aprovado ✅ Agora você pode enviar o pedido.", "ok");
      } else {
        paymentConfirmed = false;
        lockSendBtn();
        setMsg(document.getElementById("msgCheckout"), "Pagamento não aprovado ainda (" + (data.status || "desconhecido") + ").", "error");
      }
    })
    .catch(() => {
      paymentConfirmed = false;
      lockSendBtn();
      setMsg(document.getElementById("msgCheckout"), "Não consegui confirmar o pagamento agora.", "error");
    });
}

  init();
})();