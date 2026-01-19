const KEY_PIN = "daenvi_admin_pin";
const KEY_SESSION = "daenvi_admin_session";

function showMsg(type, text){
  const msg = document.getElementById("msg");
  msg.className = "msg " + (type || "");
  msg.textContent = text || "";
  msg.style.display = text ? "block" : "nome";
}

function ensureDefaultPin(){
  // PIN padrão só pra primeiro acesso (você troca no botão)
  if(!localStorage.getItem(KEY_PIN)){
    localStorage.setItem(KEY_PIN, "1234");
  }
}

ensureDefaultPin();

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const pin = document.getElementById("pin").value.trim();
  const real = localStorage.getItem(KEY_PIN);

  if(pin === real){
    localStorage.setItem(KEY_SESSION, "ok");
    window.location.href = "dashboard.html";
  }else{
    showMsg("error", "PIN incorreto.");
  }
});

document.getElementById("btnSetup").addEventListener("click", () => {
  const current = prompt("Digite o PIN atual (ou 1234 se for primeiro acesso):");
  if(current === null) return;

  const real = localStorage.getItem(KEY_PIN);
  if(current.trim() !== real){
    showMsg("error", "PIN atual inválido.");
    return;
  }

  const newPin = prompt("Digite o NOVO PIN (mín. 4 dígitos):");
  if(newPin === null) return;

  const np = newPin.trim();
  if(np.length < 4){
    showMsg("error", "PIN muito curto. Use 4+ dígitos.");
    return;
  }

  localStorage.setItem(KEY_PIN, np);
  showMsg("ok", "PIN alterado com sucesso ✅");
});
