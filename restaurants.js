let restaurants = [];
let allDishes = [];
let dishes = [];
let recentDishIds = [];
let currentRestaurant = null;
let currentUser = null;
let apiBaseUrl = "";
let selectedPromoFilter = "all";
let selectedRestCategory = "all";
const cart = new Map();
let noticeTimer;
const CATALOG_CACHE_KEY = window.CATALOG_CACHE_KEY || "saborcito_catalog_cache_v8";
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
const topSearch = document.querySelector("#search");
const searchResults = document.querySelector("#search-results");
const pageIntro = document.querySelector("#restaurant-page-intro");
const sourceNote = document.querySelector("#catalog-source-note");
const directorySection = document.querySelector("#restaurant-directory-section");
const directoryGrid = document.querySelector("#restaurant-directory-grid");
const detailSection = document.querySelector("#restaurant-detail-section");
const recentSection = document.querySelector("#restaurant-recent-section");
const recentGrid = document.querySelector("#restaurant-recent-grid");
const bookmarkButton = document.querySelector("#restaurant-bookmark");
const catalogError = document.querySelector("#catalog-error");
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
function showNotice(message) {
const notice = document.querySelector("#notice");
if (!notice) return;
notice.textContent = message;
notice.hidden = false;
window.clearTimeout(noticeTimer);
noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 3000);
}
function getUserKey() {
return String(currentUser?.email || currentUser?.id || "anon").trim().toLowerCase();
}
function getOrderHistoryKey(restaurantId) {
return `saborcito_recent_orders_${getUserKey()}_rest_${restaurantId}`;
}
function getSavedBookmarksKey() {
return `saborcito_bookmarks_${getUserKey()}`;
}
function getCartStorageKey() {
return `saborcito_cart_${getUserKey()}`;
}
function loadCartFromCache() {
cart.clear();
if (!currentUser?.email) return;
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
if (!currentUser?.email) return;
try {
localStorage.setItem(getCartStorageKey(), JSON.stringify([...cart.entries()]));
} catch {}
}
function getLocalRecentDishIds(restaurantId) {
try {
const stored = JSON.parse(localStorage.getItem(getOrderHistoryKey(restaurantId)) || "[]");
return Array.isArray(stored) ? stored.map(String) : [];
} catch {
return [];
}
}
function saveLocalRecentDishIds(restaurantId, newDishIds) {
const existing = getLocalRecentDishIds(restaurantId);
const combined = [...newDishIds.map(String), ...existing];
const uniqueLastThree = [...new Set(combined)].slice(0, 3);
try {
localStorage.setItem(getOrderHistoryKey(restaurantId), JSON.stringify(uniqueLastThree));
} catch {}
return uniqueLastThree;
}
function updateBookmarkState() {
if (!bookmarkButton || !currentRestaurant) return;
try {
const parsed = JSON.parse(localStorage.getItem(getSavedBookmarksKey()) || "[]");
const saved = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
const isBookmarked = saved.has(String(currentRestaurant.id));
bookmarkButton.setAttribute("aria-pressed", String(isBookmarked));
} catch {
bookmarkButton.setAttribute("aria-pressed", "false");
}
}
const PROMO_FALLBACK_DISHES = [
{ id: "burger", restaurantId: "2", name: "La clásica smash", price: 189 },
{ id: "pizza", restaurantId: "1", name: "Pizza margarita", price: 220 },
{ id: "salad", restaurantId: "7", name: "Bowl arcoíris", price: 165 },
{ id: "ramen", restaurantId: "6", name: "Ramen de la casa", price: 198 }
];
function findCartDish(id) {
return allDishes.find(item => String(item.id) === String(id)) ||
PROMO_FALLBACK_DISHES.find(item => String(item.id) === String(id));
}
function updateCart() {
saveCartToCache();
const items = [...cart.entries()];
const count = items.reduce((sum, [, quantity]) => sum + quantity, 0);
const cartCount = document.querySelector("#cart-count");
const cartButton = document.querySelector("#cart-button");
const checkoutBtn = document.querySelector("#checkout-button");
const clearCartBtn = document.querySelector("#clear-cart-button");
if (cartCount) cartCount.textContent = count;
if (cartButton) {
cartButton.setAttribute("aria-label", currentUser?.email ? `Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}` : "Inicia sesión para acceder al carrito");
}
const total = items.reduce((sum, [id, quantity]) => {
const dish = findCartDish(id);
return sum + (dish ? dish.price * quantity : 0);
}, 0);
const cartTotal = document.querySelector("#cart-total");
if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
const cartItems = document.querySelector("#cart-items");
if (cartItems) {
cartItems.innerHTML = items.length
? items.map(([id, quantity]) => {
const dish = findCartDish(id);
if (!dish) return "";
return `
<div class="cart-item">
<div class="cart-item-info">
<strong>${escapeHTML(dish.name)}</strong>
<p>$${escapeHTML(dish.price.toFixed(2))} · Subtotal $${escapeHTML((dish.price * quantity).toFixed(2))}</p>
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
}).join("")
: '<p class="empty-state">Tu carrito está vacío. ¡Elige algo delicioso!</p>';
}
if (checkoutBtn) {
checkoutBtn.textContent = "Realizar pedido";
checkoutBtn.disabled = items.length === 0;
}
if (clearCartBtn) {
clearCartBtn.hidden = items.length === 0;
}
}
function openCart() {
if (!currentUser || !currentUser.email) {
window.location.href = "auth.html";
return;
}
if (!drawer || !backdrop) return;
drawer.hidden = false;
backdrop.hidden = false;
document.querySelector("#close-cart")?.focus();
}
function closeCart() {
if (!drawer || !backdrop) return;
drawer.hidden = true;
backdrop.hidden = true;
document.querySelector("#cart-button")?.focus();
}
function normalizeCollection(payload, name) {
const records = Array.isArray(payload) ? payload : (payload?.data ?? payload?.items);
if (!Array.isArray(records)) throw new Error(`La respuesta de ${name} debe ser una lista de registros.`);
return records;
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
function normalizeRestaurant(record, apiBase) {
const id = record?.id ?? record?.id_restaurante;
const name = record?.name ?? record?.nombre_comercial;
if (!record || (typeof id !== "string" && typeof id !== "number") || !name) {
throw new Error("Un restaurante recibido no contiene un id y un nombre válidos.");
}
const strId = String(id);
const rawLogo = record.logo || record.logo_url || "";
const logo = resolveImageUrl(rawLogo, apiBase);
const rawBanner = record.banner || record.banner_url || record.imagen_banner || record.imagen_url || record.imagen || "";
let banner = resolveImageUrl(rawBanner, apiBase);
if (!banner) {
banner = DEFAULT_RESTAURANT_BANNERS[strId] || "";
}
return {
id: strId,
name: String(name),
category: String(record.category || "Restaurante"),
icon: String(record.icon || "🍽️"),
rating: Number(record.rating ?? 4.8),
time: String(record.time || record.deliveryTime || record.time_est || "20–30 min"),
description: String(record.description || record.direccion || ""),
logo,
banner
};
}
function safeGetMatchingDishImage(dishName, dishId) {
if (typeof window.getMatchingDishImage === "function") {
const res = window.getMatchingDishImage(dishName, dishId);
if (res) return res;
}
return "";
}
function normalizeDish(record, apiBase) {
const id = record?.id ?? record?.id_producto;
const restaurantId = record?.restaurantId ?? record?.restaurantid ?? record?.id_restaurante;
const name = record?.name ?? record?.nombre;
const price = Number(record?.price ?? record?.precio);
if (!record || (typeof id !== "string" && typeof id !== "number") ||
(typeof restaurantId !== "string" && typeof restaurantId !== "number") ||
!name || !Number.isFinite(price) || price < 0) {
throw new Error("Un plato recibido no contiene id, restaurantId, nombre y precio válidos.");
}
const rawImage = record.image || record.imagen || record.imagen_url || record.foto || "";
let image = resolveImageUrl(rawImage, apiBase);
if (image && Object.values(DEFAULT_RESTAURANT_BANNERS).includes(image)) {
image = "";
}
const catalogImage = safeGetMatchingDishImage(name, id);
if (catalogImage) image = catalogImage;
const numId = Number(id);
const isPromotion = Boolean(
record.isPromotion === true ||
record.isPromotion === "true" ||
record.isPromotion === 1 ||
record.ispromotion === 1 ||
record.ispromotion === "true" ||
(Number.isFinite(numId) && numId % 5 === 1)
);
return {
id: String(id),
restaurantId: String(restaurantId),
name: String(name),
category: String(record.category || "Menú Principal"),
description: String(record.description ?? record.descripcion ?? ""),
price,
image,
alt: String(record.alt || name),
isPromotion
};
}
function getResolvedDishImage(dish) {
const match = safeGetMatchingDishImage(dish.name, dish.id);
if (match) return match;
return resolveImageUrl(dish.image || "");
}
function renderRecentOrderCard(dish) {
const imgSrc = getResolvedDishImage(dish) || "Imagenes/plato_hamburguesa_smash.webp";
return `
<article class="recent-order-card">
<div class="recent-order-thumb">
<img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(dish.alt || dish.name)}" width="240" height="160" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>';">
<button class="recent-add-button" type="button" data-add="${escapeHTML(dish.id)}" aria-label="Volver a pedir ${escapeHTML(dish.name)}" title="Añadir al carrito">+</button>
</div>
<div class="recent-order-meta">
<strong>${escapeHTML(dish.name)}</strong>
<span class="price">$${escapeHTML(dish.price.toFixed(2))}</span>
</div>
</article>`;
}
function renderDish(dish, index = 3) {
const imgSrc = getResolvedDishImage(dish);
const loadAttr = index < 3 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
return `
<article class="food-card">
<div class="food-image">${imgSrc
? `<img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(dish.alt || dish.name)}" width="320" height="200" ${loadAttr} onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>';">`
: `<div class="food-image-placeholder" aria-hidden="true"><span>${escapeHTML(currentRestaurant?.icon || "🍽️")}</span><small>Imagen del plato</small></div>`}</div>
<div class="food-info">
<h4 class="food-name">${escapeHTML(dish.name)}</h4>
<p class="food-description">${escapeHTML(dish.description)}</p>
<div class="food-bottom">
<span class="price">$${escapeHTML(dish.price.toFixed(2))}</span>
<button class="add-button" type="button" data-add="${escapeHTML(dish.id)}" aria-label="Añadir ${escapeHTML(dish.name)} al carrito" title="Añadir al carrito">+</button>
</div>
</div>
</article>`;
}
const PROMO_TYPES = [
{ type: "descuento", badge: "🔥 25% DCTO", multiplier: 1.33, note: "25% de descuento directo hoy." },
{ type: "2x1", badge: "⚡ 2X1 HOY", multiplier: 1.5, note: "Lleva 2 por el precio especial de promoción." },
{ type: "combo", badge: "🎁 PRECIO COMBO", multiplier: 1.25, note: "Promoción especial por tiempo limitado." },
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
function renderDirectory() {
if (!directoryGrid) return;
const query = (topSearch?.value || "").trim().toLocaleLowerCase("es");
let promoDishes = allDishes.filter(d => d.isPromotion || Number(d.id) % 5 === 1);
if (promoDishes.length === 0) {
promoDishes = allDishes.slice(0, 12);
}
const visible = promoDishes.filter(dish => {
const rest = restaurants.find(r => r.id === dish.restaurantId);
const meta = getPromoMeta(dish);
const matchesFilter = selectedPromoFilter === "all" || meta.type === selectedPromoFilter;
const matchesQuery = !query || `${dish.name} ${dish.description} ${rest?.name || ""} ${meta.badge}`.toLocaleLowerCase("es").includes(query);
return matchesFilter && matchesQuery;
});
directoryGrid.innerHTML = visible.length
? visible.map((dish, index) => {
const rest = restaurants.find(r => r.id === dish.restaurantId);
const meta = getPromoMeta(dish);
const icon = rest?.icon || "🍽️";
const restName = rest?.name || "Saborcito";
const imgSrc = getResolvedDishImage(dish);
const loadAttr = index < 3 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
return `
<article class="food-card promo-dish-card">
<div class="food-image promo-dish-image">
${imgSrc
? `<img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(dish.alt || dish.name)}" width="320" height="200" ${loadAttr} onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>';">`
: `<div class="food-image-placeholder" aria-hidden="true"><span>${escapeHTML(icon)}</span><small>Imagen del plato</small></div>`}
<span class="promo-badge-pill promo-badge-floating">${escapeHTML(meta.badge)}</span>
</div>
<div class="food-info promo-dish-copy">
<span class="offer-tag">${escapeHTML(icon)} ${escapeHTML(restName)}</span>
<h3 class="food-name">${escapeHTML(dish.name)}</h3>
<p class="food-description">${escapeHTML(meta.note)}</p>
<div class="food-bottom promo-bottom-row">
<div class="promo-price-row">
<span class="promo-old-price">$${escapeHTML(meta.originalPrice.toFixed(2))}</span>
<strong class="promo-new-price">$${escapeHTML(dish.price.toFixed(2))}</strong>
</div>
<button class="add-button promo-add-btn" type="button" data-add="${escapeHTML(dish.id)}" aria-label="Añadir promoción ${escapeHTML(dish.name)} al carrito" title="Añadir oferta al carrito">+</button>
</div>
<a class="restaurant-menu-link" href="restaurants.html?restaurant=${encodeURIComponent(dish.restaurantId)}">Ver menú de ${escapeHTML(restName)} →</a>
</div>
</article>`;
}).join("")
: '<p class="empty-state">No encontramos platillos en promoción con ese filtro o búsqueda.</p>';
}
function renderRestaurantsCatalog() {
const grid = document.querySelector("#restaurants-catalog-grid");
if (!grid) return;
const query = (topSearch?.value || "").trim().toLocaleLowerCase("es");
const filtered = restaurants.filter(r => {
const matchesCat = selectedRestCategory === "all" || r.category.toLocaleLowerCase("es") === selectedRestCategory.toLocaleLowerCase("es");
const matchesQuery = !query || `${r.name} ${r.category} ${r.description}`.toLocaleLowerCase("es").includes(query);
return matchesCat && matchesQuery;
});
if (filtered.length === 0) {
grid.innerHTML = '<p class="empty-state">No encontramos restaurantes con ese filtro o búsqueda.</p>';
return;
}
grid.innerHTML = filtered.map((r, index) => {
const loadAttr = index < 3 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
return `
<a class="category-restaurant-card" href="restaurants.html?restaurant=${encodeURIComponent(r.id)}" aria-label="Ver menú de ${escapeHTML(r.name)} (${escapeHTML(r.category)})">
<div class="category-restaurant-banner">
${r.banner
? `<img src="${escapeHTML(r.banner)}" alt="Banner de ${escapeHTML(r.name)}" width="400" height="180" ${loadAttr}>`
: `<span class="category-banner-fallback" aria-hidden="true">${escapeHTML(r.icon)}</span>`
}
<span class="category-banner-tag">${escapeHTML(r.icon)} ${escapeHTML(r.category)}</span>
</div>
<div class="category-restaurant-caption">
<h3 class="category-restaurant-name">${escapeHTML(r.name)}</h3>
<span class="category-restaurant-meta">★ ${escapeHTML(r.rating)} · ${escapeHTML(r.time)}</span>
</div>
</a>
`;
}).join("");
}
function renderRecentOrders() {
if (!recentSection || !recentGrid || !currentRestaurant) return;
const recentDishes = recentDishIds
.map(id => dishes.find(dish => dish.id === String(id)))
.filter(Boolean)
.slice(0, 3);
if (recentDishes.length === 0) {
recentSection.hidden = true;
recentGrid.innerHTML = "";
return;
}
recentSection.hidden = false;
recentGrid.innerHTML = recentDishes.map(renderRecentOrderCard).join("");
}
function renderMenu() {
if (!currentRestaurant) {
const isPromosPage = window.location.pathname.toLowerCase().includes("promociones") || new URLSearchParams(window.location.search).get("tab") === "promociones";
if (isPromosPage) {
renderDirectory();
} else {
renderRestaurantsCatalog();
}
return;
}
const query = (topSearch?.value || "").trim().toLocaleLowerCase("es");
const matchesSearch = dish => `${dish.name} ${dish.category} ${dish.description}`.toLocaleLowerCase("es").includes(query);
const visibleDishes = dishes.filter(matchesSearch);
const sections = document.querySelector("#restaurant-menu-sections");
renderRecentOrders();
document.querySelector("#menu-description").textContent =
`${visibleDishes.length} ${visibleDishes.length === 1 ? "platillo disponible" : "platillos disponibles"}.`;
const categories = [...new Set(visibleDishes.map(dish => dish.category))];
let dishRenderCount = 0;
sections.innerHTML = categories.length
? categories.map(category => {
const categoryDishes = visibleDishes.filter(dish => dish.category === category);
return `
<section class="restaurant-menu-category" aria-label="Platillos: ${escapeHTML(category)}">
<h3>${escapeHTML(category)}</h3>
<div class="food-grid">${categoryDishes.map(dish => renderDish(dish, dishRenderCount++)).join("")}</div>
</section>`;
}).join("")
: '<p class="empty-state">No encontramos platillos con esa búsqueda.</p>';
}
function renderSearchSuggestions() {
if (!topSearch || !searchResults) return;
const query = topSearch.value.trim().toLocaleLowerCase("es");
if (!query) {
searchResults.hidden = true;
return;
}
const matchingRestaurants = restaurants
.filter(r => `${r.name} ${r.category}`.toLocaleLowerCase("es").includes(query))
.slice(0, 4)
.map(r => `<button class="search-result" type="button" role="option" data-goto-restaurant="${escapeHTML(r.id)}"><strong>${escapeHTML(r.icon)} ${escapeHTML(r.name)}</strong><span> · Restaurante</span></button>`);
const matchingDishes = allDishes
.filter(d => `${d.name} ${d.description}`.toLocaleLowerCase("es").includes(query))
.slice(0, 4)
.map(d => {
const rest = restaurants.find(r => r.id === d.restaurantId);
return `<button class="search-result" type="button" role="option" data-goto-restaurant="${escapeHTML(d.restaurantId)}" data-dish-name="${escapeHTML(d.name)}"><strong>${escapeHTML(d.name)}</strong><span> · ${escapeHTML(rest ? rest.name : "Platillo")}</span></button>`;
});
const combined = [...matchingRestaurants, ...matchingDishes];
searchResults.innerHTML = combined.length
? combined.join("")
: '<div class="search-result" role="option">Sin coincidencias. Prueba otro término.</div>';
searchResults.hidden = false;
}
function renderRestaurant() {
const params = new URLSearchParams(window.location.search);
const restaurantId = params.get("restaurant");
const isPromosPage = window.location.pathname.toLowerCase().includes("promociones") || params.get("tab") === "promociones";
const viewSwitchNav = document.querySelector("#view-switch-nav");
const restaurantListSection = document.querySelector("#restaurant-list-section");
const tabBtnRestaurants = document.querySelector("#tab-btn-restaurants");
const tabBtnPromotions = document.querySelector("#tab-btn-promotions");
const heroBtn = document.querySelector("#restaurant-page-hero-btn");
if (!restaurantId) {
currentRestaurant = null;
if (detailSection) detailSection.hidden = true;
if (pageIntro) pageIntro.hidden = false;
if (viewSwitchNav) viewSwitchNav.hidden = !isPromosPage;
if (isPromosPage) {
if (restaurantListSection) restaurantListSection.hidden = true;
if (directorySection) directorySection.hidden = false;
document.title = "Ofertas y Promociones — Saborcito";
if (tabBtnRestaurants) {
tabBtnRestaurants.classList.remove("is-active");
tabBtnRestaurants.setAttribute("aria-selected", "false");
}
if (tabBtnPromotions) {
tabBtnPromotions.classList.add("is-active");
tabBtnPromotions.setAttribute("aria-selected", "true");
}
if (heroBtn) {
heroBtn.setAttribute("href", "#restaurant-directory-section");
heroBtn.innerHTML = 'Explorar ofertas <span aria-hidden="true">↓</span>';
}
renderDirectory();
} else {
if (directorySection) directorySection.hidden = true;
if (restaurantListSection) restaurantListSection.hidden = false;
document.title = "Restaurantes — Saborcito";
if (tabBtnRestaurants) {
tabBtnRestaurants.classList.add("is-active");
tabBtnRestaurants.setAttribute("aria-selected", "true");
}
if (tabBtnPromotions) {
tabBtnPromotions.classList.remove("is-active");
tabBtnPromotions.setAttribute("aria-selected", "false");
}
if (heroBtn) {
heroBtn.setAttribute("href", "#restaurant-list-section");
heroBtn.innerHTML = 'Explorar restaurantes <span aria-hidden="true">↓</span>';
}
renderRestaurantsCatalog();
}
return;
}
currentRestaurant = restaurants.find(item => item.id === restaurantId);
if (!currentRestaurant) {
throw new Error("No encontramos ese restaurante en el catálogo.");
}
if (pageIntro) pageIntro.hidden = true;
if (viewSwitchNav) viewSwitchNav.hidden = true;
if (restaurantListSection) restaurantListSection.hidden = true;
if (directorySection) directorySection.hidden = true;
dishes = allDishes.filter(dish => dish.restaurantId === currentRestaurant.id);
detailSection.hidden = false;
const bannerEl = document.querySelector("#restaurant-banner");
if (bannerEl) {
bannerEl.querySelectorAll(".restaurant-banner-label").forEach(el => el.remove());
bannerEl.innerHTML = currentRestaurant.banner
? `<img src="${escapeHTML(currentRestaurant.banner)}" alt="Banner de ${escapeHTML(currentRestaurant.name)}" width="960" height="320" fetchpriority="high" decoding="async">`
: "";
Array.from(bannerEl.childNodes).forEach(child => {
if (child.nodeType !== 1 || child.tagName !== "IMG") child.remove();
});
}
const logoEl = document.querySelector("#restaurant-detail-icon");
if (logoEl) {
logoEl.innerHTML = currentRestaurant.logo
? `<img src="${escapeHTML(currentRestaurant.logo)}" alt="Logo de ${escapeHTML(currentRestaurant.name)}" width="72" height="72" decoding="async">`
: escapeHTML(currentRestaurant.icon);
}
const starsCount = Math.max(1, Math.min(5, Math.round(Number(currentRestaurant.rating) || 5)));
const starsEl = document.querySelector("#restaurant-detail-stars");
if (starsEl) {
starsEl.textContent = Array.from({ length: 5 }, (_, idx) => (idx < starsCount ? "★" : "☆")).join(" ");
}
document.querySelector("#restaurant-detail-category").textContent = currentRestaurant.category;
document.querySelector("#restaurant-detail-title").textContent = currentRestaurant.name;
document.querySelector("#restaurant-detail-description").textContent = currentRestaurant.description;
document.querySelector("#restaurant-detail-meta").textContent = `${currentRestaurant.rating} · ${currentRestaurant.time}`;
document.title = `${currentRestaurant.name} — Menú | Saborcito`;
updateBookmarkState();
recentDishIds = getLocalRecentDishIds(currentRestaurant.id);
renderMenu();
}
async function loadCloudCatalog() {
const apiBase = document.querySelector('meta[name="saborcito-api-base-url"]')?.content.trim();
if (!apiBase) {
throw new Error("La conexión con la base de datos aún no está configurada.");
}
let baseUrl;
try {
baseUrl = new URL(apiBase);
} catch {
throw new Error("La URL base de la API debe ser absoluta.");
}
if (baseUrl.protocol !== "https:" &&
!(baseUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(baseUrl.hostname))) {
throw new Error("La API debe usar HTTPS (HTTP solo está permitido en localhost).");
}
apiBaseUrl = apiBase.replace(/\/+$/, "");
const SEED_RESTAURANTS = window.SEED_RESTAURANTS || [];
const SEED_DISHES = window.SEED_DISHES || [];
try {
const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
if (cached && Array.isArray(cached.restaurants) && Array.isArray(cached.dishes)) {
restaurants = cached.restaurants.map(r => normalizeRestaurant(r, apiBaseUrl));
allDishes = cached.dishes.map(d => {
let img = resolveImageUrl(d.image || "");
if (img && Object.values(DEFAULT_RESTAURANT_BANNERS).includes(img)) {
img = "";
}
const match = safeGetMatchingDishImage(d.name, d.id);
if (match) img = match;
return { ...d, image: img };
});
} else {
restaurants = SEED_RESTAURANTS;
allDishes = SEED_DISHES;
}
sourceNote.hidden = true;
renderRestaurant();
updateCart();
} catch {
restaurants = SEED_RESTAURANTS;
allDishes = SEED_DISHES;
sourceNote.hidden = true;
renderRestaurant();
updateCart();
}
try {
const [restaurantResponse, dishResponse] = await Promise.all([
fetch(`${apiBaseUrl}/restaurants`, { headers: { Accept: "application/json" } }),
fetch(`${apiBaseUrl}/dishes`, { headers: { Accept: "application/json" } })
]);
if (!restaurantResponse.ok || !dishResponse.ok) return;
const [restaurantPayload, dishPayload] = await Promise.all([
restaurantResponse.json(),
dishResponse.json()
]);
const nextRestaurants = normalizeCollection(restaurantPayload, "restaurantes").map(r => normalizeRestaurant(r, apiBaseUrl));
const nextDishes = normalizeCollection(dishPayload, "platillos").map(record => normalizeDish(record, apiBaseUrl));
const restaurantIds = new Set(nextRestaurants.map(restaurant => restaurant.id));
if (nextDishes.some(dish => !restaurantIds.has(dish.restaurantId))) return;
restaurants = nextRestaurants;
allDishes = nextDishes;
localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ restaurants: nextRestaurants, dishes: nextDishes, updatedAt: Date.now() }));
sourceNote.hidden = true;
renderRestaurant();
updateCart();
if (currentUser?.id && localStorage.getItem(getSavedBookmarksKey()) === null) {
fetch(`${apiBaseUrl}/favorites?userId=${encodeURIComponent(currentUser.id)}`, {
headers: { Accept: "application/json" }
})
.then(res => (res.ok ? res.json() : null))
.then(payload => {
if (!payload || localStorage.getItem(getSavedBookmarksKey()) !== null) return;
const items = Array.isArray(payload) ? payload : (payload?.items ?? payload?.data);
if (!Array.isArray(items) || items.length === 0) return;
const cloudIds = items.map(item => String(item.restaurantId ?? item.id_restaurante ?? item.id)).filter(Boolean);
if (cloudIds.length > 0) {
localStorage.setItem(getSavedBookmarksKey(), JSON.stringify([...new Set(cloudIds)]));
updateBookmarkState();
}
})
.catch(() => {});
}
} catch {}
}
if (topSearch) {
const handleTopSearch = (window.saborcitoDebounce || (fn => fn))(() => {
renderSearchSuggestions();
renderMenu();
}, 250);
topSearch.addEventListener("input", handleTopSearch);
topSearch.addEventListener("keydown", event => {
if (event.key === "Escape" && searchResults) searchResults.hidden = true;
});
}
bookmarkButton?.addEventListener("click", () => {
if (!currentUser || !currentUser.email) {
window.location.href = "auth.html";
return;
}
if (!currentRestaurant) return;
try {
const key = getSavedBookmarksKey();
const parsed = JSON.parse(localStorage.getItem(key) || "[]");
const saved = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
const restId = String(currentRestaurant.id);
let action = "add";
if (saved.has(restId)) {
saved.delete(restId);
action = "remove";
showNotice(`${currentRestaurant.name} se quitó de tus favoritos.`);
} else {
saved.add(restId);
action = "add";
showNotice(`${currentRestaurant.name} se guardó en tus restaurantes favoritos.`);
}
localStorage.setItem(key, JSON.stringify([...saved]));
updateBookmarkState();
if (apiBaseUrl && currentUser?.id) {
fetch(`${apiBaseUrl}/favorites`, {
method: "POST",
headers: { "Content-Type": "text/plain;charset=UTF-8" },
body: JSON.stringify({
userId: Number(currentUser.id),
restaurantId: Number(currentRestaurant.id),
action
})
}).catch(() => {});
}
} catch {}
});
document.addEventListener("click", event => {
const target = event.target.closest("button");
if (!target) {
if (searchResults && !event.target.closest(".search-wrap")) {
searchResults.hidden = true;
}
return;
}
if (target.dataset.restCategory !== undefined) {
selectedRestCategory = target.dataset.restCategory;
document.querySelectorAll("#restaurant-category-filters [data-rest-category]").forEach(btn => {
btn.setAttribute("aria-pressed", String(btn.dataset.restCategory === selectedRestCategory));
});
renderRestaurantsCatalog();
return;
}
if (target.dataset.promoFilter !== undefined) {
selectedPromoFilter = target.dataset.promoFilter;
document.querySelectorAll("#promo-type-filters [data-promo-filter]").forEach(btn => {
btn.setAttribute("aria-pressed", String(btn.dataset.promoFilter === selectedPromoFilter));
});
renderDirectory();
return;
}
if (target.dataset.gotoRestaurant) {
const restId = target.dataset.gotoRestaurant;
if (searchResults) searchResults.hidden = true;
window.location.href = `restaurants.html?restaurant=${encodeURIComponent(restId)}`;
return;
}
if (target.dataset.add) {
if (!currentUser || !currentUser.email) {
window.location.href = "auth.html";
return;
}
const dish = allDishes.find(item => item.id === target.dataset.add);
if (!dish) return;
const rest = restaurants.find(r => r.id === dish.restaurantId) || currentRestaurant;
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
const currentQty = cart.get(selectedDish.id) || 0;
cart.set(selectedDish.id, currentQty + qty);
updateCart();
showNotice(`${selectedDish.name} (x${qty}) se añadió al carrito.`);
});
} else {
cart.set(dish.id, (cart.get(dish.id) || 0) + 1);
updateCart();
showNotice(`${dish.name} se añadió al carrito.`);
}
}
if (target.dataset.removeCartItem) {
const dishId = target.dataset.removeCartItem;
const dish = findCartDish(dishId);
const dishName = dish ? dish.name : "este platillo";
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
const dishId = target.dataset.quantity;
const delta = Number(target.dataset.delta);
const currentQty = cart.get(dishId) || 0;
if (delta === -1 && currentQty === 1) {
const dish = findCartDish(dishId);
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
});
document.querySelector("#cart-button")?.addEventListener("click", openCart);
document.querySelector("#close-cart")?.addEventListener("click", closeCart);
backdrop?.addEventListener("click", closeCart);
document.querySelector("#checkout-button")?.addEventListener("click", () => {
if (!currentUser || !currentUser.email) {
window.location.href = "auth.html";
return;
}
if (!cart.size) {
showNotice("Añade algo delicioso a tu carrito para continuar.");
return;
}
closeCart();
window.location.href = "checkout.html";
});
document.querySelector("#clear-cart-button")?.addEventListener("click", () => {
if (!cart.size) return;
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
const savedUser = JSON.parse(localStorage.getItem("saborcito_user") || "null");
const accountLink = document.querySelector("#account-link");
const cartButton = document.querySelector("#cart-button");
if (cartButton) {
cartButton.disabled = false;
cartButton.title = savedUser?.email ? "Abrir carrito" : "Inicia sesión para acceder al carrito";
}
if (savedUser && savedUser.email) {
currentUser = savedUser;
loadCartFromCache();
if (accountLink && savedUser.name) {
accountLink.textContent = `👤 ${savedUser.name} ▾`;
accountLink.href = "#";
accountLink.setAttribute("aria-label", `Abrir menú de cuenta de ${savedUser.name}`);
accountLink.addEventListener("click", event => {
event.preventDefault();
window.SaborcitoOrderTracker?.toggleUserDropdown(event);
});
}
} else {
currentUser = null;
}
loadCloudCatalog().catch(error => {
detailSection.hidden = true;
if (directorySection) directorySection.hidden = true;
sourceNote.hidden = true;
catalogError.hidden = false;
document.querySelector("#catalog-error-message").textContent = error.message;
});
} catch {
localStorage.removeItem("saborcito_user");
loadCloudCatalog().catch(() => {});
}
window.addEventListener("pageshow", () => {
loadCartFromCache();
updateCart();
updateBookmarkState();
if (currentRestaurant) {
recentDishIds = getLocalRecentDishIds(currentRestaurant.id);
renderRecentOrders();
}
});
window.addEventListener("storage", () => {
loadCartFromCache();
updateCart();
updateBookmarkState();
if (currentRestaurant) {
recentDishIds = getLocalRecentDishIds(currentRestaurant.id);
renderRecentOrders();
}
});