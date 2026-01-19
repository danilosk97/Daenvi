function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function money(v){
  return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
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

async function pasteText(){
  try{
    return await navigator.clipboard.readText();
  }catch(e){
    return "";
  }
}

function updateCartBadge(){
  const cart = JSON.parse(localStorage.getItem("daenvi_cart") || "[]");
  const count = cart.reduce((acc,i)=> acc + (i.qtd||0), 0);
  const badge = document.getElementById("cartCount");
  if(badge) badge.textContent = count;
}

function findLocalOrder(pedidoId){
  const list = JSON.parse(localStorage.getItem("daenvi_orders") || "[]");
  return list.find(o => o.id === pedidoId);
}

function renderDetails(order){
  const box = document.getElementById("rDetails");
  if(!order){
    box.textContent = "Detalhes não disponíveis neste dispositivo.";
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

  box.innerHTML = `
    <div style="opacity:.85;margin-bottom:8px;">
      <b>Total:</b> ${money(order.total)} • <b>Data:</b> ${new Date(order.createdAt).toLocaleString("pt-BR")}
    </div>
    <div>${itens || "Sem itens"}</div>
  `;
}

function showResult(pedidoId, order){
  const resultBox = document.getElementById("resultBox");
  const rId = document.getElementById("rId");
  const rStatus = document.getElementById("rStatus");
  const rMsg = document.getElementById("rMsg");
  const btnBack = document.getElementById("btnBackReceived");
  const btnCopyId = document.getElementById("btnCopyId");

  resultBox.style.display = "block";
  rId.textContent = pedidoId;

  // Sem backend, status global não atualiza automaticamente no site.
  // Se tiver pedido local, usa status salvo. Senão assume NOVO.
  const status = (order?.status || "novo").toUpperCase();
  rStatus.textContent = status;

  rMsg.innerHTML = `
    <b>Status:</b> ${status}<br/>
    Estamos analisando seu pedido e vamos entrar em contato para confirmar disponibilidade e envio.
  `;

  btnBack.href = pedidoId ? `pedido-recebido.html?id=${encodeURIComponent(pedidoId)}` : "pedido-recebido.html";

  btnCopyId.onclick = () => copyText(pedidoId);

  renderDetails(order);
}

(function init(){
  updateCartBadge();

  const form = document.getElementById("trackForm");
  const input = document.getElementById("trackId");
  const btnPaste = document.getElementById("btnPaste");

  const fromUrl = getParam("id") || localStorage.getItem("daenvi_last_order_id") || "";
  if(fromUrl) input.value = fromUrl;

  btnPaste.addEventListener("click", async () => {
    const t = await pasteText();
    if(t) input.value = t.trim();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pedidoId = input.value.trim();
    if(!pedidoId) return;

    const order = findLocalOrder(pedidoId);
    showResult(pedidoId, order);
  });

  if(fromUrl){
    const order = findLocalOrder(fromUrl);
    showResult(fromUrl, order);
  }
})();
