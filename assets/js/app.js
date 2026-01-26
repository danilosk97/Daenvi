(() => {
  const grid = document.getElementById("productsGrid");
  const categorySelect = document.getElementById("category");
  const sortSelect = document.getElementById("sort");
  const searchInput = document.getElementById("search");
  const emptyState = document.getElementById("emptyState");

  const API_LIST = "/api/products/list";
  let all = [];
  let category = "all";
  let sortBy = "relevance";
  let q = "";

  function money(v) {
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function normalize(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function ensureCategories(items) {
    const set = new Set(["all"]);
    items.forEach(p => set.add((p.categoria || "Outros").trim() || "Outros"));
    const cats = Array.from(set);

    if (!categorySelect) return;
    categorySelect.innerHTML = "";

    cats.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c === "all" ? "Todas categorias" : c;
      if (c === category) opt.selected = true;
      categorySelect.appendChild(opt);
    });
  }

  function card(p) {
    const img = p.imagem || "https://via.placeholder.com/800x600?text=Daenvi";
    const nome = p.nome || "Produto";
    const preco = money(p.preco);
    const id = p.id || "";

    const el = document.createElement("div");
    el.className = "product-card";
    el.innerHTML = `
      <div class="product-img">
        <img src="${img}" alt="${nome}" onerror="this.src='https://via.placeholder.com/800x600?text=Daenvi'"/>
      </div>
      <div class="product-body">
        <div class="product-title">${nome}</div>
        <div class="product-meta">
          <div class="price">${preco}</div>
          <div class="kicker">${(p.categoria || "Outros")}</div>
        </div>
        <div class="product-actions">
          <button class="btn primary" data-buy="${id}">Comprar</button>
          <a class="btn ghost" href="produto.html?id=${encodeURIComponent(id)}">Ver</a>
        </div>
      </div>
    `;

    el.querySelector("[data-buy]").addEventListener("click", () => {
      // usa funções do carrinho.js se existirem
      const item = {
        id,
        nome,
        preco: Number(p.preco || 0),
        imagem: img,
        qtd: 1
      };

      if (typeof window.addToCart === "function") {
        window.addToCart(item);
      } else {
        // fallback simples
        const key = window.CART_KEY || "daenvi_cart";
        const cart = JSON.parse(localStorage.getItem(key) || "[]");
        const idx = cart.findIndex(x => x.id === id);
        if (idx >= 0) cart[idx].qtd = Number(cart[idx].qtd || 1) + 1;
        else cart.push(item);
        localStorage.setItem(key, JSON.stringify(cart));
      }

      if (typeof window.updateCartBadge === "function") window.updateCartBadge();
      alert("Adicionado ao carrinho ✅");
    });

    return el;
  }

  function render() {
    if (!grid) return;
    grid.innerHTML = "";

    let filtered = all
      .filter(p => String(p.ativo || "1") === "1")
      .filter(p => category === "all" ? true : (p.categoria || "Outros") === category)
      .filter(p => {
        if (!q) return true;
        const text = normalize((p.nome || "") + " " + (p.descricao || "") + " " + (p.categoria || ""));
        return text.includes(normalize(q));
      });

    // Ordenação
    if (sortBy === "price_asc") {
      filtered.sort((a, b) => Number(a.preco || 0) - Number(b.preco || 0));
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
    } else if (sortBy === "name_asc") {
      filtered.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    }
    // Para "relevance", assume ordem original do API (sem sort)

    if (!filtered.length) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    filtered.forEach(p => grid.appendChild(card(p)));
  }

  async function load() {
    if (!grid) return;

    grid.innerHTML = `<div class="mini-note">Carregando produtos...</div>`;
    if (emptyState) emptyState.style.display = "none";

    try {
      const res = await fetch(API_LIST);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        console.log(data);
        grid.innerHTML = `<div class="mini-note">Não consegui carregar produtos agora.</div>`;
        return;
      }

      all = Array.isArray(data.data) ? data.data : [];
      ensureCategories(all);
      render();
      if (typeof window.updateCartBadge === "function") window.updateCartBadge();
    } catch (e) {
      grid.innerHTML = `<div class="mini-note">Falha: ${e.message}</div>`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", (ev) => {
      q = ev.target.value || "";
      render();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", (ev) => {
      category = ev.target.value || "all";
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (ev) => {
      sortBy = ev.target.value || "relevance";
      render();
    });
  }

  load();
})();