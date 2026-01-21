// assets/js/checkout.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ========= CONFIG =========
  const MP_CREATE_URL = "/api/mp/create";
  const MP_STATUS_URL = "/api/mp/status";

  const ORDER_API_URL = "/api/orders"; // sua API de pedidos/planilha
  const PUBLIC_WRITE_KEY = "DAENVI_PEDIDO_2026"; // a mesma key que você já usa

  // ========= HELPERS =========
  function setMsg(el, text, type = "") {
    if (!el) return;
    el.className = "msg " + type;
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
    // Se teu carrinho.js tiver helper global, usa
    if (typeof window.getCartItems === "function") return window.getCartItems();

    // fallback
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

  function parseAmountFromTotalText(totalText) {
    // Ex: "R$ 1.234,56"
    const cleaned = String(totalText || "")
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
      .trim();

    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function getBackUrl() {
    return window.location.origin + "/checkout.html";
  }

  // ========= STATE =========
  let paymentApproved = false;
  let paymentId = "";
  let orderId = "";

  function lockSendButton() {
    const btn = $("btnSendOrder");
    if (btn) btn.disabled = !paymentApproved;
  }

  // ========= RENDER SUMMARY =========
  function renderSummary() {
    const items = getCart();
    const wrap = $("checkoutItems");
    wrap.innerHTML = "";

    if (!items.length) {
      wrap.innerHTML = `<div class="mini-note">Seu carrinho está vazio.</div>`;
      $("subtotal").textContent = money(0);
      $("frete").textContent = money(0);
      $("total").textContent = money(0);
      return { subtotal: 0, total: 0 };
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

    const frete = 0;
    const total = subtotal + frete;

    $("subtotal").textContent = money(subtotal);
    $("frete").textContent = money(frete);
    $("total").textContent = money(total);

    return { subtotal, total };
  }

  // ========= MERCADO PAGO =========
  async function createPayment() {
    const msgMP = $("msgMP");
    setMsg(msgMP, "", "");

    const cart = getCart();
    if (!cart.length) {
      setMsg(msgMP, "Carrinho vazio. Adicione produtos antes de pagar.", "error");
      return;
    }

    // gera orderId se ainda não tiver
    orderId = localStorage.getItem("daenvi_pending_order_id") || genOrderId();
    localStorage.setItem("daenvi_pending_order_id", orderId);

    const totalText = $("total").textContent || "R$ 0,00";
    const amount = parseAmountFromTotalText(totalText);

    if (amount <= 0) {
      setMsg(msgMP, "Total inválido. Verifique o carrinho.", "error");
      return;
    }

    setMsg(msgMP, "Gerando pagamento no Mercado Pago...", "ok");

    try {
      const res = await fetch(MP_CREATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          title: "Pedido Daenvi",
          amount,
          backUrl: getBackUrl(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.init_point) {
        console.log("MP create response:", data);
        setMsg(msgMP, "Erro ao criar pagamento no Mercado Pago.", "error");
        return;
      }

      setMsg(msgMP, "Redirecionando para pagamento...", "ok");

      // Vai pro Mercado Pago
      window.location.href = data.init_point;
    } catch (e) {
      setMsg(msgMP, "Falha ao criar pagamento: " + e.message, "error");
    }
  }

  async function checkPaymentStatus(pid) {
    const msgMP = $("msgMP");
    setMsg(msgMP, "", "");

    if (!pid) {
      setMsg(msgMP, "Sem payment_id pra verificar.", "error");
      return false;
    }

    setMsg(msgMP, "Verificando pagamento...", "ok");

    try {
      const res = await fetch(MP_STATUS_URL + "?payment_id=" + encodeURIComponent(pid));
      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.log("MP status response:", data);
        setMsg(msgMP, "Não consegui confirmar o pagamento agora.", "error");
        return false;
      }

      if (data.status === "approved") {
        paymentApproved = true;
        paymentId = pid;
        localStorage.setItem("daenvi_mp_payment_id", pid);

        setMsg(msgMP, "Pagamento APROVADO ✅ Agora você pode enviar o pedido.", "ok");
        lockSendButton();
        return true;
      }

      paymentApproved = false;
      lockSendButton();

      setMsg(
        msgMP,
        "Pagamento ainda não aprovado. Status: " + (data.status || "desconhecido"),
        "error"
      );
      return false;
    } catch (e) {
      setMsg(msgMP, "Erro ao verificar: " + e.message, "error");
      return false;
    }
  }

  // ========= SEND ORDER =========
  async function submitOrder(ev) {
    ev.preventDefault();

    const msg = $("msgCheckout");
    setMsg(msg, "", "");

    if (!paymentApproved) {
      setMsg(msg, "Você precisa pagar e ter o pagamento APROVADO antes de enviar o pedido.", "error");
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
      setMsg(msg, "Preencha o endereço completo.", "error");
      return;
    }

    // orderId final
    const finalOrderId = localStorage.getItem("daenvi_pending_order_id") || genOrderId();
    const createdAt = new Date().toLocaleString("pt-BR");
    const totalText = $("total").textContent || "R$ 0,00";

    const payload = {
      action: "create_order",
      key: PUBLIC_WRITE_KEY,
      order: {
        orderId: finalOrderId,
        createdAt,
        status: "Pago",
        total: totalText,

        payment: "Mercado Pago",
        paymentProof: "payment_id=" + paymentId,

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

        itemsJson: JSON.stringify(cart),
      },
    };

    try {
      const btn = $("btnSendOrder");
      btn.disabled = true;
      btn.textContent = "Enviando...";

      const res = await fetch(ORDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        btn.disabled = false;
        btn.textContent = "Enviar pedido";
        setMsg(msg, "Não consegui enviar o pedido. (" + (data.error || res.status) + ")", "error");
        return;
      }

      setMsg(msg, "Pedido enviado com sucesso ✅ Abrindo acompanhamento...", "ok");

      // limpa carrinho
      clearCart();

      // limpa state de pagamento
      localStorage.removeItem("daenvi_pending_order_id");
      localStorage.removeItem("daenvi_mp_payment_id");

      // salva último pedido
      localStorage.setItem("daenvi_last_order", finalOrderId);

      setTimeout(() => {
        window.location.href = "acompanhar.html?orderId=" + encodeURIComponent(finalOrderId);
      }, 600);
    } catch (e) {
      setMsg(msg, "Falha ao enviar: " + e.message, "error");
      const btn = $("btnSendOrder");
      btn.disabled = false;
      btn.textContent = "Enviar pedido";
    }
  }

  // ========= INIT =========
  function init() {
    renderSummary();
    if (typeof window.updateCartBadge === "function") window.updateCartBadge();

    paymentApproved = false;
    lockSendButton();

    // Se voltou do MP, pega payment_id e confirma
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("payment_id");

    if (pid) {
      checkPaymentStatus(pid);
    }

    $("btnPayMP").addEventListener("click", createPayment);

    $("btnCheckPayment").addEventListener("click", () => {
      const saved = localStorage.getItem("daenvi_mp_payment_id") || pid || "";
      if (!saved) {
        setMsg($("msgMP"), "Nenhum pagamento encontrado ainda. Clique em pagar primeiro.", "error");
        return;
      }
      checkPaymentStatus(saved);
    });

    $("checkoutForm").addEventListener("submit", submitOrder);
  }

  init();
})();