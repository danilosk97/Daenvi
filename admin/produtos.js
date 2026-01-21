(() => {
  const $ = (id) => document.getElementById(id);

  // SIMPLES: usa a mesma lógica de “token admin” que você já tem.
  // Se você já usa outro nome de token, troca aqui.
  const ADMIN_TOKEN_KEY = "daenvi_admin_token";
  const LIST_URL = "/api/products/list";
  const UPSERT_URL = "/api/products/upsert";
  const DELETE_URL = "/api/products/delete";

  function setMsg(el, text, type="") {
    if (!el) return;
    el.className = "msg " + type;
    el.textContent = text || "";
    el.style.display = text ? "block" : "none";
  }

  function moneyToNumber(str) {
    const s = String(str || "")
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
      .trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function requireAuth() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      alert("Acesso não autorizado. Faça login no admin.");
      window.location.href = "../admin.html";
      return false;
    }
    return true;
  }

  function fillForm(p) {
    $("id").value = p.id || "";
    $("nome").value = p.nome || "";
    $("categoria").value = p.categoria || "";
    $("preco").value = (p.preco != null ? String(p.preco).replace(".", ",") : "");
    $("imagem").value = p.imagem || "";
    $("descricao").value = p.descricao || "";
    $("ativo").value = String(p.ativo ?? "1");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    $("id").value = "";
    $("nome").value = "";
    $("categoria").value = "";
    $("preco").value = "";
    $("imagem").value = "";
    $("descricao").value = "";
    $("ativo").value = "1";
  }

  async function loadList() {
    const msgList = $("msgList");
    const list = $("list");
    setMsg(msgList, "Carregando produtos...", "ok");
    list.innerHTML = "";

    try {
      const res = await fetch(LIST_URL);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.log(data);
        setMsg(msgList, "Erro ao carregar produtos.", "error");
        return;
      }

      const items = Array.isArray(data.data) ? data.data : [];
      setMsg(msgList, "", "");

      if (!items.length) {
        list.innerHTML = `<div class="mini-note">Nenhum produto cadastrado ainda.</div>`;
        return;
      }

      items.forEach((p) => {
        const wrap = document.createElement("div");
        wrap.className = "checkout-item";

        const ativoTxt = String(p.ativo || "1") === "1" ? "Ativo" : "Inativo";
        wrap.innerHTML = `
          <div>
            <div style="font-weight:900;">${p.nome || "Produto"}</div>
            <div class="kicker">${p.categoria || "Sem categoria"} • ${ativoTxt}</div>
            <div class="kicker">${(p.imagem ? "Imagem OK" : "Sem imagem")} • ${p.id || ""}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div style="font-weight:900;">R$ ${Number(p.preco||0).toFixed(2).replace(".", ",")}</div>
            <button class="btn ghost" data-edit="${p.id}">Editar</button>
            <button class="btn" data-del="${p.id}">Apagar</button>
          </div>
        `;

        wrap.querySelector("[data-edit]").addEventListener("click", () => fillForm(p));

        wrap.querySelector("[data-del]").addEventListener("click", async () => {
          if (!confirm("Apagar este produto?")) return;
          await delProduct(p.id);
          await loadList();
        });

        list.appendChild(wrap);
      });

    } catch (e) {
      setMsg(msgList, "Falha: " + e.message, "error");
    }
  }

  async function saveProduct(ev) {
    ev.preventDefault();

    const msg = $("msg");
    setMsg(msg, "", "");

    const product = {
      id: String($("id").value || "").trim(),
      nome: String($("nome").value || "").trim(),
      categoria: String($("categoria").value || "").trim(),
      preco: moneyToNumber($("preco").value),
      imagem: String($("imagem").value || "").trim(),
      descricao: String($("descricao").value || "").trim(),
      ativo: String($("ativo").value || "1")
    };

    if (!product.nome) return setMsg(msg, "Preencha o nome do produto.", "error");
    if (!product.preco || product.preco <= 0) return setMsg(msg, "Preço inválido.", "error");

    setMsg(msg, "Salvando...", "ok");

    try {
      const res = await fetch(UPSERT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        console.log(data);
        setMsg(msg, "Erro ao salvar produto.", "error");
        return;
      }

      setMsg(msg, "Produto salvo ✅", "ok");
      clearForm();
      await loadList();
    } catch (e) {
      setMsg(msg, "Falha: " + e.message, "error");
    }
  }

  async function delProduct(id) {
    const msg = $("msg");
    setMsg(msg, "Apagando...", "ok");
    try {
      const res = await fetch(DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        console.log(data);
        setMsg(msg, "Erro ao apagar produto.", "error");
        return;
      }
      setMsg(msg, "Produto apagado ✅", "ok");
    } catch (e) {
      setMsg(msg, "Falha: " + e.message, "error");
    }
  }

  function init() {
    if (!requireAuth()) return;

    $("btnLogout").addEventListener("click", () => {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.href = "../index.html";
    });

    $("btnReload").addEventListener("click", loadList);
    $("btnClear").addEventListener("click", clearForm);
    $("form").addEventListener("submit", saveProduct);

    loadList();
  }

  init();
})();