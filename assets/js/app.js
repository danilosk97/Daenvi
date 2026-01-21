// assets/js/app.js
const API_PRODUCTS = "/api/products?action=products_list";

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=60";

const $ = (id) => document.getElementById(id);

function moneyLabel(priceStr) {
  const s = String(priceStr || "").trim();
  if (!s) return "R$ 0,00";
  // Se já tem R$ no texto, respeita
  if (s.toLowerCase().includes("r$")) return s;
  // Se vier 79.90 ou 79,90
  return "R$ " + s.replace(".", ",");
}

async function fetchProducts() {
  const res = await fetch(API_PRODUCTS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return [];
  return data.products || [];
}

function renderProducts(list, q = "", category = "Todos") {
  const grid = $("productsGrid");
  if (!grid) return;

  const query = (q || "").toLowerCase().trim();
  const cat = (category || "Todos").toLowerCase();

  const filtered = list.filter(p => {
    const hay = `${p.name} ${p.category} ${p.description}`.toLowerCase();
    const okQuery = !query || hay.includes(query);
    const okCat = cat === "todos" || String(p.category || "").toLowerCase() === cat;
    return okQuery && okCat;
  });

  grid.innerHTML = "";

  if (!filtered.length) {
    grid.innerHTML = `<div class="mini-note">Nenhum produto encontrado.</div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = p.imageUrl ? p.imageUrl : DEFAULT_IMG;

    card.innerHTML = `
      <a href="produto.html?id=${encodeURIComponent(p.id)}">
        <div class="product-img">
          <img src="${img}" alt="${escapeHtml(p.name)}" onerror="this.src='${DEFAULT_IMG}'">
        </div>
      </a>
      <div class="product-body">
        <div class="product-title">${escapeHtml(p.name)}</div>
        <div class="product-meta">
          <div>
            <div class="price">${escapeHtml(moneyLabel(p.price))}</div>
            <div class="kicker">${escapeHtml(p.category || "Geral")}</div>
          </div>
          <div class="kicker">ID: ${escapeHtml(p.id)}</div>
        </div>

        <div class="product-actions">
          <button class="btn ghost" data-view="${escapeHtml(p.id)}">Ver</button>
          <button class="btn primary" data-add="${escapeHtml(p.id)}">Adicionar</button>
        </div>
      </div>
    `;

    card.querySelector("[data-view]").addEventListener("click", () => {
      window.location.href = `produto.html?id=${encodeURIComponent(p.id)}`;
    });

    card.querySelector("[data-add]").addEventListener("click", () => {
      // integra com teu carrinho.js (precisa ter addToCart global)
      if (typeof window.addToCart === "function") {
        window.addToCart({
          id: p.id,
          nome: p.name,
          preco: Number(String(p.price).replace(",", ".").replace(/[^\d.]/g, "")) || 0,
          img: p.imageUrl || DEFAULT_IMG
        });
      } else {
        alert("Carrinho não carregou. Verifique carrinho.js.");
      }
    });

    grid.appendChild(card);
  });
}

function renderCategories(products) {
  const row = $("categoryRow");
  if (!row) return;

  const cats = Array.from(new Set(products.map(p => (p.category || "Geral").trim()).filter(Boolean)));
  cats.sort((a,b) => a.localeCompare(b));

  const all = ["Todos", ...cats];
  row.innerHTML = "";

  all.forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.className = "cat" + (idx === 0 ? " active" : "");
    btn.textContent = c;
    btn.addEventListener("click", () => {
      row.querySelectorAll(".cat").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      const q = ($("searchInput")?.value || "");
      renderProducts(window.__DAENVI_PRODUCTS || [], q, c);
    });
    row.appendChild(btn);
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  // Atualiza badge carrinho (se carrinho.js expõe updateCartBadge)
  if (typeof window.updateCartBadge === "function") window.updateCartBadge();

  const products = await fetchProducts();
  window.__DAENVI_PRODUCTS = products;

  renderCategories(products);

  const search = $("searchInput");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value || "";
      // categoria selecionada
      const activeCat = document.querySelector(".cat.active")?.textContent || "Todos";
      renderProducts(products, q, activeCat);
    });
  }

  // Render inicial
  renderProducts(products, "", "Todos");
}

init();