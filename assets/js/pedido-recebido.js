// assets/js/pedido-recebido.js
const ORDERS_KEY = "daenvi_orders";

function $(id){ return document.getElementById(id); }

function getOrders(){
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

(function init(){
  const id = getParam("id");
  const orders = getOrders();
  const pedido = orders.find(o => o.id === id);

  if(!id || !pedido){
    $("pedidoId").textContent = "Pedido não encontrado";
    $("pedidoData").textContent = "—";
    $("pedidoStatus").textContent = "—";
    return;
  }

  $("pedidoId").textContent = pedido.id;
  $("pedidoData").textContent = pedido.criadoEm || "—";
  $("pedidoStatus").textContent = pedido.status || "Recebido";

  $("btnCopy").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(pedido.id);
      $("btnCopy").textContent = "Copiado ✓";
      setTimeout(() => $("btnCopy").textContent = "Copiar ID", 900);
    }catch(e){
      alert("Não consegui copiar automaticamente. Copie manualmente: " + pedido.id);
    }
  });
})();