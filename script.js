const DEFAULT_RESTAURANT_BANNERS = window.DEFAULT_RESTAURANT_BANNERS || {
"1": "Imagenes/banner_pizzeria_roma.webp",
"2": "Imagenes/banner_burger_king.webp",
"3": "Imagenes/banner_sushi_zen.webp",
"4": "Imagenes/banner_taco_loco.webp",
"5": "Imagenes/banner_kfc.webp",
"6": "Imagenes/banner_wok_express.webp",
"7": "Imagenes/banner_veggie_life.webp",
"8": "Imagenes/banner_sweet_bakery.webp",
"9": "Imagenes/banner_steakhouse.webp",
"10": "Imagenes/banner_gelato_mio.webp"
};
const SEED_RESTAURANTS = window.SEED_RESTAURANTS || [];
const SEED_CATALOG_DISHES = window.SEED_DISHES || [];
const CATALOG_CACHE_KEY = window.CATALOG_CACHE_KEY || "saborcito_catalog_cache_v8";
let dishes = [
{ id: "burger", restaurantId: "2", name: "La clásica smash", category: "Hamburguesas", description: "Doble carne, queso cheddar y salsa de la casa.", price: 189, image: "Imagenes/plato_hamburguesa_smash.webp", alt: "Hamburguesa con queso, lechuga y tomate" },
{ id: "pizza", restaurantId: "1", name: "Pizza margarita", category: "Pizza", description: "Tomate, mozzarella fresca y albahaca.", price: 220, image: "Imagenes/plato_pizza_margarita.webp", alt: "Pizza margarita recién horneada" },
{ id: "salad", restaurantId: "7", name: "Bowl arcoíris", category: "Saludable", description: "Quinoa, aguacate y vegetales de temporada.", price: 165, image: "Imagenes/plato_bowl_arcoiris.webp", alt: "Bowl de ensalada colorida con vegetales" },
{ id: "ramen", restaurantId: "6", name: "Ramen de la casa", category: "Asiática", description: "Caldo lento, fideos y toppings frescos.", price: 198, image: "Imagenes/plato_ramen_casa.webp", alt: "Tazón de ramen con fideos y huevo" }
];
const promos = [
{
eyebrow: "✨ Lo bueno se comparte",
title: "Tu antojo favorito, a un clic",
description: "Disfruta tus platos favoritos. Hoy tienes envío gratis en tu primer pedido.",
tag: "ENVÍO GRATIS",
image: "Imagenes/banner1.webp",
foodAlt: "Hamburguesa gourmet y papas fritas",
food: "🍔",
buttonText: "Descubrir sabores",
href: "restaurants.html"
},
{
eyebrow: "🔥 Promociones exclusivas",
title: "Ofertas y descuentos del día",
description: "Aprovecha combos especiales, 2x1 y hasta 30% de descuento en tus platos favoritos.",
tag: "HASTA 30% DCTO",
image: "Imagenes/banner2.webp",
foodAlt: "Pizzas artesanales para compartir",
food: "🍕",
buttonText: "Ver ofertas y promociones",
href: "promociones.html"
}
];
const cart = new Map();
const SESSION_STORAGE_KEY = "saborcito_user";
let currentUser = null;
let isAuthenticated = false;
let promoIndex = 0;
let selectedCategory = "all";
let noticeTimer;
const favoritesGrid = document.querySelector("#favorites-grid");
const categoryRestaurantsGrid = document.querySelector("#category-restaurants-grid");
const homePromoDishesGrid = document.querySelector("#home-promo-dishes-grid");
const search = document.querySelector("#search");
const searchResults = document.querySelector("#search-results");
const drawer = document.querySelector("#cart-drawer");
const backdrop = document.querySelector("#drawer-backdrop");
function escapeHTML(value) {
return String(value ?? "").replace(/[&<>"']/g, character => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': "&quot;",
"'": "&#39;"
})[character]);
}
function getUserKey() {
return String(currentUser?.email || currentUser?.id || "anon").trim().toLowerCase();
}
function getSavedBookmarksKey() {
return `saborcito_bookmarks_${getUserKey()}`;
}
function getCartStorageKey() {
return `saborcito_cart_${getUserKey()}`;
}
function safeGetMatchingDishImage(dishName, dishId) {
if (typeof window.getMatchingDishImage === "function") {
const res = window.getMatchingDishImage(dishName, dishId);
if (res) return res;
}
return "";
}
function resolveImageUrl(rawUrl, apiBase = "") {
if (!rawUrl || typeof rawUrl !== "string") return "";
const trimmed = rawUrl.trim();
if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";
if (/^(https?:|\/\/|data:)/i.test(trimmed)) return trimmed;
let localPath = trimmed;
if (/\.(jpe?g|png|webp|svg|gif)$/i.test(trimmed) && !trimmed.includes("/")) {
localPath = `Imagenes/${trimmed}`;
}
if (localPath.startsWith("Imagenes/") || localPath.startsWith("./Imagenes/")) {
return localPath.replace(/^(\.?\/?Imagenes\/[^?#]+)\.jpe?g$/i, "$1.webp");
}
if (apiBase) {
return `${apiBase.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`;
}
return trimmed;
}
function getAllKnownDishes() {
try {
const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
if (cached && Array.isArray(cached.dishes) && cached.dishes.length > 0) {
const sanitizedCachedDishes = cached.dishes.map(d => {
let img = resolveImageUrl(d?.image || "");
if (img && Object.values(DEFAULT_RESTAURANT_BANNERS).includes(img)) {
img = "";
}
const match = safeGetMatchingDishImage(d?.name, d?.id);
if (match) img = match;
return { ...d, image: img };
});
return [...dishes, ...sanitizedCachedDishes];
}
} catch {}
return [...dishes, ...SEED_CATALOG_DISHES];
}
function loadCartFromCache() {
cart.clear();
if (!isAuthenticated) return;
try {
const entries = JSON.parse(localStorage.getItem(getCartStorageKey()) || "[]");
if (Array.isArray(entries)) {
entries.forEach(([id, qty]) => {
const num = Number(qty);
if (id && Number.isFinite(num) && num > 0) {
cart.set(String(id), num);
}
});
}
} catch {}
}
function saveCartToCache() {
if (!isAuthenticated) return;
try {
localStorage.setItem(getCartStorageKey(), JSON.stringify([...cart.entries()]));
} catch {}
}
function normalizeCategoryText(value) {
return String(value || "")
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim()
.toLowerCase();
}
function enrichRestaurantBanner(r, apiBase = "") {
const id = String(r?.id ?? r?.id_restaurante ?? "");
const seedMatch = SEED_RESTAURANTS.find(s => s.id === id);
const rawBanner = r?.banner || r?.banner_url || r?.imagen_banner || r?.imagen_url || r?.imagen || "";
let banner = resolveImageUrl(rawBanner, apiBase);
if (!banner) {
banner = DEFAULT_RESTAURANT_BANNERS[id] || seedMatch?.banner || "";
}
return {
id,
name: String(r?.name ?? r?.nombre_comercial ?? seedMatch?.name ?? "Restaurante"),
category: String(r?.category || seedMatch?.category || "Restaurante"),
icon: String(r?.icon || seedMatch?.icon || "🍽️"),
rating: Number(r?.rating ?? seedMatch?.rating ?? 4.8),
time: String(r?.time || r?.deliveryTime || r?.time_est || seedMatch?.time || "20–30 min"),
description: String(r?.description || r?.direccion || seedMatch?.description || ""),
banner
};
}
function normalizeCatalogDish(d, apiBase = "") {
const id = String(d?.id ?? d?.id_producto ?? "");
const restaurantId = String(d?.restaurantId ?? d?.restaurantid ?? d?.id_restaurante ?? "");
const name = String(d?.name ?? d?.nombre ?? "Platillo");
const price = Number(d?.price ?? d?.precio ?? 0);
const rawImage = d?.image || d?.imagen || d?.imagen_url || d?.foto || "";
let image = resolveImageUrl(rawImage, apiBase);
if (image && Object.values(DEFAULT_RESTAURANT_BANNERS).includes(image)) {
image = "";
}
const catalogImage = safeGetMatchingDishImage(name, id);
if (catalogImage) image = catalogImage;
const numId = Number(id);
const isPromotion = Boolean(
d?.isPromotion === true ||
d?.isPromotion === "true" ||
d?.isPromotion === 1 ||
d?.ispromotion === 1 ||
d?.ispromotion === "true" ||
(Number.isFinite(numId) && numId % 5 === 1)
);
return {
id,
restaurantId,
name,
category: String(d?.category || d?.categoria || "Menú Principal"),
description: String(d?.description ?? d?.descripcion ?? ""),
price,
image,
alt: String(d?.alt || name),
isPromotion
};
}
function getCatalogRestaurants() {
try {
const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
if (cached && Array.isArray(cached.restaurants) && cached.restaurants.length > 0) {
return cached.restaurants.map(r => enrichRestaurantBanner(r));
}
} catch {}
return SEED_RESTAURANTS;
}
function renderCategoryRestaurants() {
if (!categoryRestaurantsGrid) return;
const allRestaurants = getCatalogRestaurants();
const normalizedFilter = normalizeCategoryText(selectedCategory);
const filtered = allRestaurants.filter(r => {
if (selectedCategory === "all" || !normalizedFilter) return true;
const restCat = normalizeCategoryText(r.category);
return restCat === normalizedFilter || restCat.includes(normalizedFilter);
});
if (filtered.length === 0) {
categoryRestaurantsGrid.innerHTML = '<p class="empty-state">No encontramos restaurantes en esta categoría por ahora.</p>';
return;
}
categoryRestaurantsGrid.innerHTML = filtered.map((r, index) => {
const targetHref = `restaurants.html?restaurant=${encodeURIComponent(r.id)}`;
const loadAttr = index < 3 ? 'decoding="async"' : 'loading="lazy" decoding="async"';
return `
<a class="category-restaurant-card" href="${escapeHTML(targetHref)}" aria-label="Ver menú de ${escapeHTML(r.name)} (${escapeHTML(r.category)})">
<div class="category-restaurant-banner">
${r.banner
? `<img src="${escapeHTML(r.banner)}" alt="Banner de ${escapeHTML(r.name)}" width="400" height="180" ${loadAttr}>`
: `<span class="category-banner-fallback" aria-hidden="true">${escapeHTML(r.icon)}</span>`}
<span class="category-banner-tag">${escapeHTML(r.icon)} ${escapeHTML(r.category)}</span>
</div>
<div class="category-restaurant-caption">
<h3 class="category-restaurant-name">${escapeHTML(r.name)}</h3>
<span class="category-restaurant-meta">★ ${escapeHTML(r.rating)} · ${escapeHTML(r.time)}</span>
</div>
</a>`;
}).join("");
}
async function syncCatalogFromCloud() {
const apiBase = (document.querySelector('meta[name="saborcito-api-base-url"]')?.content || "").trim().replace(/\/+$/, "");
if (!apiBase) return;
try {
const [restRes, dishRes] = await Promise.all([
fetch(`${apiBase}/restaurants`, { headers: { Accept: "application/json" } }).catch(() => null),
fetch(`${apiBase}/dishes`, { headers: { Accept: "application/json" } }).catch(() => null)
]);
let cloudRestaurants = null;
let cloudDishes = null;
if (restRes && restRes.ok) {
const payload = await restRes.json();
const records = Array.isArray(payload) ? payload : (payload?.data ?? payload?.items);
if (Array.isArray(records) && records.length > 0) {
cloudRestaurants = records.map(rec => enrichRestaurantBanner(rec, apiBase));
}
}
if (dishRes && dishRes.ok) {
const payload = await dishRes.json();
const records = Array.isArray(payload) ? payload : (payload?.data ?? payload?.items);
if (Array.isArray(records) && records.length > 0) {
cloudDishes = records.map(rec => normalizeCatalogDish(rec, apiBase));
}
}
if (!cloudRestaurants && !cloudDishes) return;
const existingCache = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null") || {};
const finalRestaurants = cloudRestaurants || existingCache.restaurants || SEED_RESTAURANTS;
const finalDishes = cloudDishes || existingCache.dishes || SEED_CATALOG_DISHES;
localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
restaurants: finalRestaurants,
dishes: finalDishes,
updatedAt: Date.now()
}));
renderCategoryRestaurants();
renderFavoriteRestaurants();
renderHomePromoDishes();
} catch {}
}
function getBookmarkedRestaurantIds() {
if (!isAuthenticated) return new Set();
try {
const saved = JSON.parse(localStorage.getItem(getSavedBookmarksKey()) || "[]");
return new Set(Array.isArray(saved) ? saved.map(String) : []);
} catch {
return new Set();
}
}
const PROMO_TYPES = [
{ type: "2x1", badge: "🔥 2x1", multiplier: 1.85, note: "Pide 2 por el precio de 1." },
{ type: "combo", badge: "⭐ COMBO", multiplier: 1.35, note: "Incluye bebida y acompañamiento." },
{ type: "descuento", badge: "🏷️ 30% OFF", multiplier: 1.42, note: "Ahorra 30% pidiendo en línea." }
];
function getPromoMeta(dish) {
const numId = Math.abs(Number(dish.id) || 1);
const preset = PROMO_TYPES[numId % PROMO_TYPES.length];
const originalPrice = Math.max(dish.price + 1.5, Number((dish.price * preset.multiplier).toFixed(2)));
return {
type: preset.type,
badge: preset.badge,
note: preset.note,
originalPrice
};
}
function renderHomePromoDishes() {
if (!homePromoDishesGrid) return;
const allKnown = getAllKnownDishes();
const allRests = getCatalogRestaurants();
let promoDishes = allKnown.filter(d => d.isPromotion || Number(d.id) % 5 === 1);
if (promoDishes.length < 3) {
promoDishes = allKnown.slice(0, 3);
}
const top3 = promoDishes.slice(0, 3);
homePromoDishesGrid.innerHTML = top3.map(dish => {
const rest = allRests.find(r => String(r.id) === String(dish.restaurantId));
const meta = getPromoMeta(dish);
const icon = rest?.icon || "🍽️";
const restName = rest?.name || "Saborcito";
let dishImage = safeGetMatchingDishImage(dish.name, dish.id);
if (!dishImage && dish.image && !Object.values(DEFAULT_RESTAURANT_BANNERS).includes(dish.image)) {
dishImage = resolveImageUrl(dish.image);
}
return `
<article class="offer-card">
<span class="offer-icon" aria-hidden="true">${dishImage
? `<img src="${escapeHTML(dishImage)}" alt="${escapeHTML(dish.name)}" width="120" height="120" decoding="async" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>';">`
: escapeHTML(icon)}</span>
<div class="offer-copy">
<span class="offer-tag">${escapeHTML(meta.badge)} · ${escapeHTML(restName)}</span>
<h3>${escapeHTML(dish.name)}</h3>
<p>${escapeHTML(dish.description || meta.note)}</p>
<strong>$${Number(dish.price).toFixed(2)} <span class="promo-old-price">$${escapeHTML(meta.originalPrice.toFixed(2))}</span></strong>
</div>
<button class="add-button" type="button" data-add="${escapeHTML(dish.id)}" aria-label="${isAuthenticated ? `Añadir ${escapeHTML(dish.name)} al carrito` : `Inicia sesión para pedir ${escapeHTML(dish.name)}`}" title="${isAuthenticated ? "Añadir al carrito" : "Inicia sesión para pedir"}">+</button>
</article>`;
}).join("");
}
function renderFavoriteRestaurants() {
if (!favoritesGrid) return;
const bookmarkedIds = getBookmarkedRestaurantIds();
const allRestaurants = getCatalogRestaurants();
const query = search.value.trim().toLocaleLowerCase("es");
const favoriteRestaurants = allRestaurants.filter(r =>
bookmarkedIds.has(String(r.id)) &&
(!query || `${r.name} ${r.category} ${r.description}`.toLocaleLowerCase("es").includes(query))
);
if (bookmarkedIds.size === 0) {
favoritesGrid.innerHTML = '<p class="empty-state">No cuentas con favoritos aún. Entra a cualquier restaurante y pulsa el ícono de guardado para verlo aquí.</p>';
return;
}
if (favoriteRestaurants.length === 0) {
favoritesGrid.innerHTML = '<p class="empty-state">Ninguno de tus restaurantes favoritos coincide con esa búsqueda.</p>';
return;
}
favoritesGrid.innerHTML = favoriteRestaurants.map(r => `
<a class="category-restaurant-card" href="restaurants.html?restaurant=${encodeURIComponent(r.id)}" aria-label="Ver menú de ${escapeHTML(r.name)} (${escapeHTML(r.category)})">
<div class="category-restaurant-banner">
${r.banner
? `<img src="${escapeHTML(r.banner)}" alt="Banner de ${escapeHTML(r.name)}" width="400" height="180" loading="lazy" decoding="async">`
: `<span class="category-banner-fallback" aria-hidden="true">${escapeHTML(r.icon)}</span>`}
<span class="category-banner-tag">${escapeHTML(r.icon)} ${escapeHTML(r.category)}</span>
</div>
<div class="category-restaurant-caption">
<h3 class="category-restaurant-name">${escapeHTML(r.name)}</h3>
<span class="category-restaurant-meta">★ ${escapeHTML(r.rating)} · ${escapeHTML(r.time)}</span>
</div>
</a>`).join("");
}
function updateOrderButtons() {
document.querySelectorAll("[data-add]").forEach(button => {
const dish = dishes.find(item => item.id === button.dataset.add);
const productName = button.closest(".offer-card")?.querySelector("h3")?.textContent || dish?.name || "producto";
button.disabled = false;
button.setAttribute("aria-label", isAuthenticated ? `Añadir ${productName} al carrito` : `Inicia sesión para pedir ${productName}`);
button.title = isAuthenticated ? "Añadir al carrito" : "Inicia sesión para pedir";
});
}
function showNotice(message) {
const notice = document.querySelector("#notice");
if (!notice) return;
notice.textContent = message;
notice.hidden = false;
window.clearTimeout(noticeTimer);
noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 3000);
}
function renderSearchResults() {
const query = search.value.trim().toLocaleLowerCase("es");
if (!query) { searchResults.hidden = true; return; }
const allRestaurants = getCatalogRestaurants();
const matchedRestaurants = allRestaurants.filter(r =>
`${r.name} ${r.category} ${r.description}`.toLocaleLowerCase("es").includes(query)
);
const matchedDishes = dishes.filter(dish =>
`${dish.name} ${dish.category} ${dish.description}`.toLocaleLowerCase("es").includes(query)
);
const suggestions = [
...matchedRestaurants.map(r => `<button class="search-result" type="button" role="option" data-select-restaurant="${escapeHTML(r.id)}"><strong>${escapeHTML(r.icon)} ${escapeHTML(r.name)}</strong><span> · Restaurante</span></button>`),
...matchedDishes.map(dish => `<button class="search-result" type="button" role="option" data-select-dish="${escapeHTML(dish.id)}"><strong>${escapeHTML(dish.name)}</strong><span> · Oferta</span></button>`)
];
searchResults.innerHTML = suggestions.length ? suggestions.join("") : '<div class="search-result" role="option">Sin coincidencias. Prueba otro término.</div>';
searchResults.hidden = false;
}
function updateCart() {
saveCartToCache();
const knownDishes = getAllKnownDishes();
const items = [...cart.entries()];
const count = items.reduce((sum, [, quantity]) => sum + quantity, 0);
const cartCountEl = document.querySelector("#cart-count");
const cartButtonEl = document.querySelector("#cart-button");
const checkoutBtn = document.querySelector("#checkout-button");
const clearCartBtn = document.querySelector("#clear-cart-button");
if (cartCountEl) cartCountEl.textContent = count;
if (cartButtonEl) {
cartButtonEl.setAttribute("aria-label", isAuthenticated ? `Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}` : "Inicia sesión para acceder al carrito");
}
const total = items.reduce((sum, [id, quantity]) => {
const dish = knownDishes.find(item => String(item.id) === String(id));
return sum + (dish ? Number(dish.price) * quantity : 0);
}, 0);
const cartTotalEl = document.querySelector("#cart-total");
if (cartTotalEl) cartTotalEl.textContent = `$${total.toFixed(2)}`;
const cartItemsEl = document.querySelector("#cart-items");
if (cartItemsEl) {
cartItemsEl.innerHTML = items.length ? items.map(([id, quantity]) => {
const dish = knownDishes.find(item => String(item.id) === String(id));
if (!dish) return "";
return `
<div class="cart-item">
<div class="cart-item-info">
<strong>${escapeHTML(dish.name)}</strong>
<p>$${Number(dish.price).toFixed(2)} · Subtotal $${(Number(dish.price) * quantity).toFixed(2)}</p>
</div>
<div class="cart-item-actions">
<div class="quantity-controls">
<button type="button" data-quantity="${escapeHTML(id)}" data-delta="-1" aria-label="Quitar una unidad de ${escapeHTML(dish.name)}">−</button>
<span aria-label="Cantidad">${quantity}</span>
<button type="button" data-quantity="${escapeHTML(id)}" data-delta="1" aria-label="Añadir una unidad de ${escapeHTML(dish.name)}">+</button>
</div>
<button type="button" class="cart-remove-button" data-remove-cart-item="${escapeHTML(id)}" aria-label="Eliminar ${escapeHTML(dish.name)} del pedido" title="Eliminar platillo del pedido">🗑️</button>
</div>
</div>`;
}).join("") : '<p class="empty-state">Tu carrito está vacío. ¡Elige algo delicioso!</p>';
}
if (checkoutBtn) {
checkoutBtn.textContent = "Realizar pedido";
checkoutBtn.disabled = !isAuthenticated || items.length === 0;
}
if (clearCartBtn) {
clearCartBtn.hidden = items.length === 0;
}
}
async function syncFavoritesFromCloud() {
const apiBase = (document.querySelector('meta[name="saborcito-api-base-url"]')?.content || "").trim().replace(/\/+$/, "");
if (!apiBase || !currentUser?.id) return;
if (localStorage.getItem(getSavedBookmarksKey()) !== null) return;
try {
const response = await fetch(`${apiBase}/favorites?userId=${encodeURIComponent(currentUser.id)}`, {
headers: { Accept: "application/json" }
});
if (!response.ok || localStorage.getItem(getSavedBookmarksKey()) !== null) return;
const payload = await response.json();
const items = Array.isArray(payload) ? payload : (payload?.items ?? payload?.data);
if (!Array.isArray(items) || items.length === 0) return;
const cloudIds = items.map(item => String(item.restaurantId ?? item.id_restaurante ?? item.id)).filter(Boolean);
if (cloudIds.length > 0) {
localStorage.setItem(getSavedBookmarksKey(), JSON.stringify([...new Set(cloudIds)]));
renderFavoriteRestaurants();
}
} catch {}
}
function updateAuthentication(user) {
currentUser = user || null;
isAuthenticated = Boolean(user);
const accountLink = document.querySelector("#account-link");
const cartButton = document.querySelector("#cart-button");
document.querySelector("#favoritos").hidden = !isAuthenticated;
document.querySelector(".signup-prompt").hidden = isAuthenticated;
cartButton.disabled = false;
cartButton.title = isAuthenticated ? "Abrir carrito" : "Inicia sesión para acceder al carrito";
document.querySelector("#checkout-button").disabled = !isAuthenticated;
updateOrderButtons();
accountLink.textContent = isAuthenticated ? `👤 ${user.name} ▾` : "👤 Entrar";
accountLink.href = isAuthenticated ? "#" : "auth.html";
accountLink.setAttribute("aria-label", isAuthenticated ? `Abrir menú de cuenta de ${user.name}` : "Iniciar sesión");
document.querySelectorAll("[data-restaurant-link]").forEach(link => {
link.href = "restaurants.html";
});
renderFavoriteRestaurants();
renderCategoryRestaurants();
renderHomePromoDishes();
changePromo(0);
if (isAuthenticated) {
loadCartFromCache();
syncFavoritesFromCloud();
} else {
cart.clear();
}
updateCart();
}
function openCart() {
if (!isAuthenticated) {
window.location.href = "auth.html";
return;
}
drawer.hidden = false;
backdrop.hidden = false;
document.querySelector("#close-cart").focus();
}
function closeCart() {
drawer.hidden = true;
backdrop.hidden = true;
document.querySelector("#cart-button").focus();
}
function changePromo(step) {
promoIndex = (promoIndex + step + promos.length) % promos.length;
const promo = promos[promoIndex];
document.querySelector("#promo-eyebrow").textContent = promo.eyebrow;
document.querySelector("#promo-title").textContent = promo.title;
document.querySelector("#promo-description").textContent = promo.description;
document.querySelector("#promo-tag").textContent = promo.tag;
const promoFoodEl = document.querySelector("#promo-food");
if (promoFoodEl) {
if (promo.image) {
promoFoodEl.innerHTML = `<img src="${escapeHTML(promo.image)}" alt="${escapeHTML(promo.foodAlt || promo.title)}" class="promo-food-img" width="520" height="360" fetchpriority="high" decoding="async">`;
} else {
promoFoodEl.textContent = promo.food || "🍽️";
}
}
document.querySelector("#carousel-status").textContent = `Banner ${promoIndex + 1} de ${promos.length}: ${promo.title}`;
const bannerLink = document.querySelector("#promo-banner-link");
if (bannerLink) {
bannerLink.innerHTML = `${escapeHTML(promo.buttonText)} <span aria-hidden="true">→</span>`;
bannerLink.href = promo.href === "promociones.html" ? "promociones.html" : "restaurants.html";
}
}
document.addEventListener("click", event => {
const target = event.target.closest("button");
if (!target) return;
if (target.dataset.category !== undefined) {
const clickedCat = target.dataset.category;
selectedCategory = (selectedCategory === clickedCat && clickedCat !== "all") ? "all" : clickedCat;
document.querySelectorAll("#category-filters .category").forEach(btn => {
btn.setAttribute("aria-pressed", String(btn.dataset.category === selectedCategory));
});
renderCategoryRestaurants();
return;
}
if (target.dataset.add) {
if (!isAuthenticated) {
window.location.href = "auth.html";
return;
}
const knownDishes = getAllKnownDishes();
const dish = knownDishes.find(item => String(item.id) === String(target.dataset.add));
if (!dish) {
showNotice("Este plato ya no está disponible.");
return;
}
const allRests = getCatalogRestaurants();
const rest = allRests.find(r => String(r.id) === String(dish.restaurantId));
const meta = getPromoMeta(dish);
const dishToModal = {
...dish,
originalPrice: meta.originalPrice,
badge: meta.badge,
restaurantName: rest?.name,
restaurantIcon: rest?.icon
};
if (window.SaborcitoOrderTracker?.openDishModal) {
window.SaborcitoOrderTracker.openDishModal(dishToModal, rest, (selectedDish, qty) => {
const currentQty = cart.get(String(selectedDish.id)) || 0;
cart.set(String(selectedDish.id), currentQty + qty);
updateCart();
showNotice(`${selectedDish.name} (x${qty}) se añadió al carrito.`);
});
} else {
cart.set(String(target.dataset.add), (cart.get(String(target.dataset.add)) || 0) + 1);
updateCart();
showNotice(`${dish.name} se añadió al carrito.`);
}
}
if (target.dataset.removeCartItem) {
if (!isAuthenticated) return;
const dishId = target.dataset.removeCartItem;
const knownDishes = getAllKnownDishes();
const dish = knownDishes.find(item => String(item.id) === String(dishId));
const dishName = dish ? dish.name : "este producto";
const doRemove = () => {
cart.delete(dishId);
updateCart();
showNotice(`Se eliminó "${dishName}" del carrito.`);
};
if (window.SaborcitoOrderTracker?.confirmRemoveDish) {
window.SaborcitoOrderTracker.confirmRemoveDish(dishName, doRemove);
} else if (window.confirm(`¿Deseas eliminar "${dishName}" del carrito?`)) {
doRemove();
}
return;
}
if (target.dataset.quantity) {
if (!isAuthenticated) return;
const dishId = target.dataset.quantity;
const delta = Number(target.dataset.delta);
const currentQty = cart.get(dishId) || 0;
if (delta === -1 && currentQty === 1) {
const knownDishes = getAllKnownDishes();
const dish = knownDishes.find(item => String(item.id) === String(dishId));
const dishName = dish ? dish.name : "este producto";
if (window.SaborcitoOrderTracker?.confirmRemoveDish) {
window.SaborcitoOrderTracker.confirmRemoveDish(dishName, () => {
cart.delete(dishId);
updateCart();
});
} else if (window.confirm(`¿Deseas eliminar "${dishName}" del carrito?`)) {
cart.delete(dishId);
updateCart();
}
return;
}
const next = currentQty + delta;
if (next <= 0) cart.delete(dishId);
else cart.set(dishId, next);
updateCart();
}
if (target.dataset.selectRestaurant) {
searchResults.hidden = true;
window.location.href = `restaurants.html?restaurant=${encodeURIComponent(target.dataset.selectRestaurant)}`;
}
if (target.dataset.selectDish) {
const dish = dishes.find(item => item.id === target.dataset.selectDish);
if (!dish) return;
searchResults.hidden = true;
document.querySelector("#restaurantes")?.scrollIntoView({ behavior: "smooth" });
}
});
const handleSearchInput = (window.saborcitoDebounce || (fn => fn))(() => {
renderSearchResults();
renderFavoriteRestaurants();
}, 250);
search.addEventListener("input", handleSearchInput);
search.addEventListener("keydown", event => {
if (event.key === "Escape") searchResults.hidden = true;
if (event.key === "ArrowDown" && !searchResults.hidden) {
event.preventDefault();
searchResults.querySelector("button")?.focus();
}
});
searchResults.addEventListener("keydown", event => {
if (event.key === "Escape") { searchResults.hidden = true; search.focus(); }
});
document.querySelector("#cart-button").addEventListener("click", openCart);
window.onSaborcitoLogout = () => {
updateAuthentication(null);
window.SaborcitoOrderTracker?.renderTracker(true);
showNotice("Has cerrado tu sesión.");
};
document.querySelector("#account-link").addEventListener("click", event => {
if (!isAuthenticated) return;
event.preventDefault();
window.SaborcitoOrderTracker?.toggleUserDropdown(event);
});
document.querySelector("#close-cart").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", event => {
if (event.key === "Escape" && !drawer.hidden) closeCart();
if (event.key === "Tab" && !drawer.hidden) {
const focusable = [...drawer.querySelectorAll("button:not([disabled])")];
const first = focusable[0];
const last = focusable[focusable.length - 1];
if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
});
document.querySelector("#previous-promo").addEventListener("click", () => changePromo(-1));
document.querySelector("#next-promo").addEventListener("click", () => changePromo(1));
if (window.SaborcitoAddressModal) {
window.SaborcitoAddressModal.syncUI();
}
document.querySelector("#address-button")?.addEventListener("click", () => {
if (window.SaborcitoAddressModal) {
window.SaborcitoAddressModal.open({
onAddressSelected: () => {
showNotice("Actualizamos tu dirección de entrega.");
}
});
}
});
document.querySelector("#checkout-button").addEventListener("click", () => {
if (!isAuthenticated) {
window.location.href = "auth.html";
return;
}
if (!cart.size) {
showNotice("Añade algo delicioso a tu carrito para continuar.");
return;
}
window.location.href = "checkout.html";
});
document.querySelector("#clear-cart-button")?.addEventListener("click", () => {
if (!isAuthenticated || !cart.size) return;
const doClear = () => {
cart.clear();
updateCart();
showNotice("Se eliminó el pedido del carrito.");
};
if (window.SaborcitoOrderTracker?.confirmClearCart) {
window.SaborcitoOrderTracker.confirmClearCart(doClear);
} else if (window.confirm("¿Deseas eliminar todo el pedido del carrito?")) {
doClear();
}
});
try {
const savedUser = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
if (savedUser && savedUser.email) {
updateAuthentication(savedUser);
} else {
updateAuthentication(null);
}
} catch {
updateAuthentication(null);
}
syncCatalogFromCloud();
window.addEventListener("pageshow", () => {
if (isAuthenticated) {
loadCartFromCache();
updateCart();
}
renderFavoriteRestaurants();
renderCategoryRestaurants();
renderHomePromoDishes();
});
window.addEventListener("storage", () => {
if (isAuthenticated) {
loadCartFromCache();
updateCart();
}
renderFavoriteRestaurants();
renderCategoryRestaurants();
renderHomePromoDishes();
});