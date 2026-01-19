function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    alert("Copiado ✅");
  }catch(e){
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Copiado ✅");
  }
}

function money(v){
  return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function updateCartBadge(){
  const cart = JSON.parse(localStorage.getItem("daenvi_cart") || "[]");
  const count = cart.reduce((acc,i)=> acc + (i.qtd||0), 0);
  const badge = document.getElementById("cartCount");
  if(badge) badge.textContent = count;
}

function renderResumo(pedidoId){
  const resumoBox = document.getElementById("resumoBox");

  // tenta achar o pedido no localStorage do mesmo navegador
  const list = JSON.parse(localStorage.getItem("daenvi_orders") || "[]");
  const order = list.find(o => o.id === pedidoId);

  if(!order){
    resumoBox.textContent = "Resumo não disponível neste dispositivo. Guarde o ID e acompanhe pelo link.";
    return;
  }

  const itens = (order.itens || []).map(i => {
    const qtd = i.qtd || 1;
    const total = (Number(i.preco)||0) * qtd;
    return `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06);">
      <span>${i.nome} <span style="opacity:.7;">x${qtd}</span></span>
      <b>${money(total)}</b>
    </div>`;
  }).join("");

  resumoBox.innerHTML = `
    <div style="opacity:.85;margin-bottom:8px;">
      <b>Total:</b> ${money(order.total)} • <b>Data:</b> ${new Date(order.createdAt).toLocaleString("pt-BR")}
    </div>
    <div>${itens || "Sem itens"}</div>
  `;
}

(function init(){
  updateCartBadge();

  const pedidoId = getParam("id") || localStorage.getItem("daenvi_last_order_id") || "";
  const status = (getParam("status") || "NOVO").toUpperCase();

  const idEl = document.getElementById("pedidoId");
  const stEl = document.getElementById("statusTxt");
  const btnCopy = document.getElementById("btnCopy");
  const btnTrack = document.getElementById("btnTrack");

  idEl.textContent = pedidoId || "—";
  stEl.textContent = status;

  if(btnTrack){
    btnTrack.href = pedidoId ? `acompanhar.html?id=${encodeURIComponent(pedidoId)}` : "acompanhar.html";
  }

  btnCopy.addEventListener("click", () => {
    if(!pedidoId) return alert("Sem ID para copiar.");
    copyText(pedidoId);
  });

  if(pedidoId) renderResumo(pedidoId);
  else document.getElementById("resumoBox").textContent = "ID não encontrado. Volte e finalize um pedido.";
})();
