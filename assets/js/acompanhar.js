// assets/js/acompanhar.js
const ORDERS_KEY = "daenvi_orders";

function $(id){ return document.getElementById(id); }

function money(v){
  return (Number(v) || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function getOrders(){
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}

function show(type, text){
  const msg = $("trackMsg");
  msg.className = "msg " + (type || "");
  msg.textContent = text || "";
}

function setVisible(el, on){
  el.style.display = on ? "block" : "none";
}

function fill(p){
  $("rId").textContent = p.id || "—";
  $("rDate").textContent = p.criadoEm || "—";
  $("rStatus").textContent = p.status || "Recebido";
  $("rItems").textContent = p.itensResumo || "—";
  $("rTotal").textContent = money(p.total || 0);
}

function findAndRender(){
  const id = ($("trackId").value || "").trim();
  if(!id){
    show("error", "Digite o ID do pedido.");
    setVisible($("trackResult"), false);
    return;
  }

  const orders = getOrders();
  const pedido = orders.find(o => (o.id || "") === id);

  if(!pedido){
    show("error", "Não encontrei esse pedido neste dispositivo/navegador.");
    setVisible($("trackResult"), false);
    return;
  }

  show("ok", "Pedido encontrado ✅");
  fill(pedido);
  setVisible($("trackResult"), true);
}

(function init(){
  $("btnTrack").addEventListener("click", findAndRender);
})();