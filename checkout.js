const SESSION_STORAGE_KEY = "saborcito_user";
const CATALOG_CACHE_KEY = window.CATALOG_CACHE_KEY || "saborcito_catalog_cache_v8";
const ADDRESS_STORAGE_KEY = "saborcito_delivery_address";
function safeGetMatchingDishImage(dishName, dishId) {
if (typeof window.getMatchingDishImage === "function") {
const res = window.getMatchingDishImage(dishName, dishId);
if (res) return res;
}
return "";
}
const SEED_RESTAURANTS = window.SEED_RESTAURANTS || [];
const DEFAULT_RESTAURANT_BANNERS = window.DEFAULT_RESTAURANT_BANNERS || {};
const PROMO_DISHES = [
{ id: "burger", restaurantId: "2", name: "La clásica smash", price: 189 },
{ id: "pizza", restaurantId: "1", name: "Pizza margarita", price: 220 },
{ id: "salad", restaurantId: "7", name: "Bowl arcoíris", price: 165 },
{ id: "ramen", restaurantId: "6", name: "Ramen de la casa", price: 198 }
];
const SEED_DISHES = window.SEED_DISHES || [];
let currentUser = null;
const cart = new Map();
let deliverySpeed = "standard";
let paymentMethod = "card";
let cardSource = "saved";
let selectedCardId = "card_default_4242";
let cashPreset = "20";
let selectedTip = 1;
let noticeTimer;
const checkoutForm = document.querySelector("#checkout-form");
const emptyState = document.querySelector("#checkout-empty-state");
const itemsListEl = document.querySelector("#checkout-items-list");
const feedbackEl = document.querySelector("#checkout-feedback");
const confirmBtn = document.querySelector("#confirm-payment-btn");
const topSearch = document.querySelector("#search");
const searchResults = document.querySelector("#search-results");
function escapeHTML(value) {
return String(value ?? "").replace(/[&<>"']/g, ch => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': "&quot;",
"'": "&#39;"
})[ch]);
}
function showNotice(message) {
const notice = document.querySelector("#notice");
if (!notice) return;
notice.textContent = message;
notice.hidden = false;
window.clearTimeout(noticeTimer);
noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 3200);
}
function getUserKey() {
return String(currentUser?.email || currentUser?.id || "anon").trim().toLowerCase();
}
function getCartStorageKey() {
return `saborcito_cart_${getUserKey()}`;
}
function getOrderHistoryKey(restaurantId) {
return `saborcito_recent_orders_${getUserKey()}_rest_${restaurantId}`;
}
function saveLocalRecentDishIds(restaurantId, newDishIds) {
try {
const stored = JSON.parse(localStorage.getItem(getOrderHistoryKey(restaurantId)) || "[]");
const existing = Array.isArray(stored) ? stored.map(String) : [];
const combined = [...newDishIds.map(String), ...existing];
const uniqueLastThree = [...new Set(combined)].slice(0, 3);
localStorage.setItem(getOrderHistoryKey(restaurantId), JSON.stringify(uniqueLastThree));
} catch {
}
}
function getCatalogData() {
try {
const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
if (cached && Array.isArray(cached.restaurants) && Array.isArray(cached.dishes)) {
const sanitizedDishes = cached.dishes.map(d => {
let img = d?.image || "";
if (img && Object.values(DEFAULT_RESTAURANT_BANNERS).includes(img)) {
img = "";
}
const match = safeGetMatchingDishImage(d?.name, d?.id);
if (match) img = match;
return { ...d, image: img };
});
return {
restaurants: cached.restaurants,
dishes: [...sanitizedDishes, ...PROMO_DISHES]
};
}
} catch {
}
return {
restaurants: SEED_RESTAURANTS,
dishes: [...SEED_DISHES, ...PROMO_DISHES]
};
}
function loadCartFromCache() {
cart.clear();
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
} catch {
}
}
function saveCartToCache() {
try {
localStorage.setItem(getCartStorageKey(), JSON.stringify([...cart.entries()]));
} catch {
}
}
function calculateTotals() {
const { dishes } = getCatalogData();
let subtotal = 0;
for (const [id, qty] of cart.entries()) {
const dish = dishes.find(d => String(d.id) === String(id));
if (dish) subtotal += Number(dish.price) * qty;
}
const deliveryFee = deliverySpeed === "priority" ? 1.5 : 0;
const serviceFee = subtotal > 0 ? 0.99 : 0;
const tip = subtotal > 0 ? selectedTip : 0;
const total = subtotal + deliveryFee + serviceFee + tip;
return { subtotal, deliveryFee, serviceFee, tip, total };
}
function getSavedCards() {
if (window.SaborcitoOrderTracker?.loadSavedCards) {
const list = window.SaborcitoOrderTracker.loadSavedCards();
if (Array.isArray(list)) return list;
}
try {
const userKey = String(currentUser?.email || currentUser?.id || "anon").trim().toLowerCase();
const stored = localStorage.getItem(`saborcito_saved_cards_${userKey}`) ?? localStorage.getItem("saborcito_saved_cards");
if (stored !== null) {
const raw = JSON.parse(stored);
if (Array.isArray(raw)) return raw;
}
} catch {}
return [
{
id: "card_default_4242",
brand: "VISA",
last4: "4242",
holder: currentUser?.name || "Carlos Mendoza",
expiry: "09/28",
isDefault: true
}
];
}
function renderSavedCards() {
const container = document.querySelector("#saved-cards-list");
if (!container) return;
const cards = getSavedCards();
const exists = cards.some(c => c.id === selectedCardId);
if (selectedCardId !== "new" && !exists) {
const def = cards.find(c => c.isDefault) || cards[0];
selectedCardId = def ? def.id : "new";
cardSource = selectedCardId;
}
const cardsHtml = cards.map(c => {
const isSelected = selectedCardId === c.id;
const brand = String(c.brand || "VISA").toUpperCase();
const badgeClass = brand === "MASTERCARD" ? "card-brand-mastercard" : brand === "AMEX" ? "card-brand-amex" : "";
const cardTitle = c.holder ? `Tarjeta de ${escapeHTML(c.holder)} •••• ${escapeHTML(c.last4)}` : `Tarjeta personal •••• ${escapeHTML(c.last4)}`;
const statusNote = c.isDefault ? "Predeterminada" : "Guardada";
return `
<div class="saved-card-row ${isSelected ? 'is-selected' : ''}" data-card-choice="${escapeHTML(c.id)}">
<label class="saved-card-item">
<input type="radio" name="cardSource" value="${escapeHTML(c.id)}" ${isSelected ? 'checked' : ''}>
<span class="card-brand-badge ${badgeClass}">${escapeHTML(brand)}</span>
<span class="saved-card-info">
<strong>${cardTitle}</strong>
<small>Vence ${escapeHTML(c.expiry || '08/29')} · ${statusNote}</small>
</span>
</label>
<button type="button" class="btn-delete-saved-card" data-delete-card="${escapeHTML(c.id)}" aria-label="Eliminar tarjeta terminada en ${escapeHTML(c.last4)}" title="Eliminar tarjeta">
🗑️
</button>
</div>
`;
}).join("");
const newOptionHtml = `
<label class="saved-card-item ${selectedCardId === 'new' ? 'is-selected' : ''}" data-card-choice="new">
<input type="radio" name="cardSource" value="new" ${selectedCardId === 'new' ? 'checked' : ''}>
<span class="card-brand-badge card-brand-new">+</span>
<span class="saved-card-info">
<strong>Ingresar otra tarjeta</strong>
<small>Simular pago con nuevos datos de tarjeta</small>
</span>
</label>
`;
container.innerHTML = cardsHtml + newOptionHtml;
const newCardFields = document.querySelector("#new-card-fields");
if (newCardFields) {
newCardFields.hidden = selectedCardId !== "new";
}
}
function updateSaveCardButtonState() {
const btn = document.querySelector("#btn-save-new-card");
if (!btn) return false;
const holder = (document.querySelector("#card-holder")?.value || "").trim();
const rawNumber = (document.querySelector("#card-number")?.value || "").replace(/\D/g, "");
const expiry = (document.querySelector("#card-expiry")?.value || "").trim();
const cvv = (document.querySelector("#card-cvv")?.value || "").trim();
const isValid = holder.length >= 3 &&
rawNumber.length >= 15 && rawNumber.length <= 19 &&
/^\d{2}\/\d{2}$/.test(expiry) &&
/^\d{3,4}$/.test(cvv);
btn.disabled = !isValid;
return isValid;
}
function updateCashPreview() {
const preview = document.querySelector("#cash-change-preview");
if (!preview) return;
const { total } = calculateTotals();
if (!["exact", "5", "10", "20"].includes(String(cashPreset))) {
cashPreset = "20";
}
preview.classList.remove("is-warning");
if (cashPreset === "exact") {
preview.hidden = true;
preview.style.display = "none";
preview.textContent = "";
return;
}
preview.hidden = false;
preview.style.display = "";
const bill = Number(cashPreset);
if (total <= 0) {
preview.textContent = `💵 Pagarás con billete de $${bill.toFixed(2)}.`;
return;
}
if (bill >= total) {
const change = bill - total;
preview.textContent = `💵 Pagarás con billete de $${bill.toFixed(2)} · El repartidor llevará $${change.toFixed(2)} de cambio.`;
} else if (total > 20 && bill === 20) {
const billsCount = Math.ceil(total / 20);
const totalCash = billsCount * 20;
const change = totalCash - total;
preview.textContent = `💵 Pagarás con ${billsCount} billetes de $20.00 ($${totalCash.toFixed(2)}) · El repartidor llevará $${change.toFixed(2)} de cambio.`;
} else {
preview.classList.add("is-warning");
const suggested = total <= 10 ? "$10.00" : "$20.00";
preview.textContent = `⚠️ El billete de $${bill.toFixed(2)} no cubre el total de tu pedido ($${total.toFixed(2)}). Te sugerimos seleccionar billete de ${suggested} o pagar monto exacto.`;
}
}
function renderCheckout() {
const { restaurants, dishes } = getCatalogData();
const entries = [...cart.entries()];
if (entries.length === 0) {
checkoutForm.hidden = true;
emptyState.hidden = false;
return;
}
checkoutForm.hidden = false;
emptyState.hidden = true;
itemsListEl.innerHTML = entries.map(([id, qty]) => {
const dish = dishes.find(d => String(d.id) === String(id));
if (!dish) return "";
const rest = restaurants.find(r => String(r.id) === String(dish.restaurantId));
const restLabel = rest ? `${rest.icon || "🍽️"} ${rest.name}` : "Saborcito";
const lineTotal = Number(dish.price) * qty;
return `
<div class="checkout-item-row">
<div class="checkout-item-info">
<span class="checkout-item-rest">${escapeHTML(restLabel)}</span>
<strong>${escapeHTML(dish.name)}</strong>
<span class="checkout-item-unit">$${Number(dish.price).toFixed(2)} c/u · Subtotal $${lineTotal.toFixed(2)}</span>
</div>
<div class="checkout-item-actions">
<div class="quantity-controls">
<button type="button" data-qty-id="${escapeHTML(dish.id)}" data-delta="-1" aria-label="Quitar una unidad de ${escapeHTML(dish.name)}">−</button>
<span aria-label="Cantidad">${qty}</span>
<button type="button" data-qty-id="${escapeHTML(dish.id)}" data-delta="1" aria-label="Añadir una unidad de ${escapeHTML(dish.name)}">+</button>
</div>
<button type="button" class="cart-remove-button" data-remove-cart-item="${escapeHTML(dish.id)}" aria-label="Eliminar ${escapeHTML(dish.name)} del pedido" title="Eliminar del pedido">🗑️</button>
</div>
</div>
`;
}).join("");
const { subtotal, deliveryFee, serviceFee, tip, total } = calculateTotals();
document.querySelector("#summary-subtotal").textContent = `$${subtotal.toFixed(2)}`;
document.querySelector("#summary-delivery").textContent = deliveryFee === 0 ? "Gratis" : `$${deliveryFee.toFixed(2)}`;
document.querySelector("#summary-service").textContent = `$${serviceFee.toFixed(2)}`;
document.querySelector("#summary-tip").textContent = `$${tip.toFixed(2)}`;
document.querySelector("#summary-total").textContent = `$${total.toFixed(2)}`;
confirmBtn.textContent = `Confirmar y pagar $${total.toFixed(2)}`;
document.querySelectorAll("[data-cash-preset]").forEach(b => {
b.classList.toggle("is-selected", b.dataset.cashPreset === String(cashPreset));
});
updateCashPreview();
renderSavedCards();
updateCheckoutPaymentButtonState();
}
function updateCheckoutPaymentButtonState() {
const addressInput = document.querySelector("#delivery-address");
const confirmBtn = document.querySelector("#confirm-payment-btn");
const warningEl = document.querySelector("#checkout-address-warning");
const addressVal = (addressInput?.value || "").trim();
const hasValidAddress = Boolean(addressVal.length >= 3 && addressVal !== "Av. Siempre Viva 742");
if (confirmBtn) {
if (!hasValidAddress) {
confirmBtn.disabled = true;
confirmBtn.setAttribute("aria-disabled", "true");
confirmBtn.classList.add("btn-disabled-address");
confirmBtn.title = "⚠️ Debes ingresar una dirección de entrega antes de pagar.";
if (warningEl) warningEl.hidden = false;
} else {
confirmBtn.disabled = false;
confirmBtn.removeAttribute("aria-disabled");
confirmBtn.classList.remove("btn-disabled-address");
confirmBtn.title = "Confirmar y procesar tu pedido";
if (warningEl) warningEl.hidden = true;
}
}
return hasValidAddress;
}
document.querySelector("#delivery-address")?.addEventListener("input", event => {
const val = event.target.value.trim();
if (val && val !== "Av. Siempre Viva 742") {
localStorage.setItem(ADDRESS_STORAGE_KEY, val);
}
updateCheckoutPaymentButtonState();
});
document.querySelector("#btn-checkout-pick-address")?.addEventListener("click", () => {
if (window.SaborcitoAddressModal) {
window.SaborcitoAddressModal.open({
onAddressSelected: selectedAddress => {
const addrInput = document.querySelector("#delivery-address");
if (addrInput) {
addrInput.value = selectedAddress;
}
updateCheckoutPaymentButtonState();
}
});
}
});
window.addEventListener("saborcito:address-updated", event => {
const newAddr = event.detail?.address || localStorage.getItem(ADDRESS_STORAGE_KEY) || "";
const addrInput = document.querySelector("#delivery-address");
if (addrInput && newAddr && newAddr !== "Av. Siempre Viva 742") {
addrInput.value = newAddr;
}
updateCheckoutPaymentButtonState();
});
document.querySelector("#card-number")?.addEventListener("input", event => {
const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
event.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
});
document.querySelector("#card-expiry")?.addEventListener("input", event => {
const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
if (digits.length >= 3) {
event.target.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
} else {
event.target.value = digits;
}
});
document.querySelectorAll('input[name="deliverySpeed"]').forEach(radio => {
radio.addEventListener("change", () => {
deliverySpeed = radio.value;
document.querySelectorAll("[data-speed-card]").forEach(card => {
card.classList.toggle("is-selected", card.dataset.speedCard === deliverySpeed);
});
renderCheckout();
});
});
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
radio.addEventListener("change", () => {
paymentMethod = radio.value;
document.querySelectorAll("[data-method-card]").forEach(card => {
card.classList.toggle("is-selected", card.dataset.methodCard === paymentMethod);
});
document.querySelector("#payment-panel-card").hidden = paymentMethod !== "card";
document.querySelector("#payment-panel-cash").hidden = paymentMethod !== "cash";
feedbackEl.hidden = true;
updateCashPreview();
});
});
document.querySelector("#saved-cards-list")?.addEventListener("change", event => {
const radio = event.target.closest('input[name="cardSource"]');
if (!radio) return;
selectedCardId = radio.value;
cardSource = radio.value;
document.querySelectorAll("#saved-cards-list .saved-card-item, #saved-cards-list .saved-card-row").forEach(card => {
card.classList.toggle("is-selected", card.dataset.cardChoice === selectedCardId);
});
const newCardFields = document.querySelector("#new-card-fields");
if (newCardFields) {
newCardFields.hidden = selectedCardId !== "new";
if (selectedCardId === "new") {
updateSaveCardButtonState();
document.querySelector("#card-holder")?.focus();
}
}
feedbackEl.hidden = true;
});
document.querySelector("#saved-cards-list")?.addEventListener("click", event => {
const delBtn = event.target.closest("[data-delete-card]");
if (delBtn) {
event.preventDefault();
event.stopPropagation();
const cardId = delBtn.dataset.deleteCard;
const cards = getSavedCards();
const card = cards.find(c => c.id === cardId);
const cardLast4 = card?.last4 || "••••";
const cardLabel = card ? `•••• ${cardLast4}` : "esta tarjeta";
const executeDelete = () => {
if (window.SaborcitoOrderTracker?.deleteSavedCard) {
window.SaborcitoOrderTracker.deleteSavedCard(cardId);
} else {
let updatedCards = getSavedCards().filter(c => c.id !== cardId);
if (updatedCards.length > 0 && !updatedCards.some(c => c.isDefault)) {
updatedCards[0].isDefault = true;
}
try {
const userKey = String(currentUser?.email || currentUser?.id || "anon").trim().toLowerCase();
localStorage.setItem(`saborcito_saved_cards_${userKey}`, JSON.stringify(updatedCards));
localStorage.setItem("saborcito_saved_cards", JSON.stringify(updatedCards));
} catch {}
}
if (selectedCardId === cardId) {
const remaining = getSavedCards();
const def = remaining.find(c => c.isDefault) || remaining[0];
selectedCardId = def ? def.id : "new";
cardSource = selectedCardId;
}
renderSavedCards();
showNotice(`Tarjeta ${cardLabel} eliminada.`);
};
if (window.SaborcitoOrderTracker?.confirmRemoveDish) {
window.SaborcitoOrderTracker.confirmRemoveDish(
`Tarjeta terminada en ${cardLast4}`,
executeDelete,
`¿Deseas eliminar la tarjeta terminada en <strong>${escapeHTML(cardLast4)}</strong> de tus métodos de pago guardados?`
);
} else if (window.confirm(`¿Deseas eliminar la tarjeta ${cardLabel}?`)) {
executeDelete();
}
return;
}
const row = event.target.closest(".saved-card-row");
if (row) {
const radio = row.querySelector('input[type="radio"]');
if (radio && !radio.checked) {
radio.checked = true;
radio.dispatchEvent(new Event("change", { bubbles: true }));
}
}
});
["#card-holder", "#card-number", "#card-expiry", "#card-cvv"].forEach(selector => {
document.querySelector(selector)?.addEventListener("input", updateSaveCardButtonState);
});
document.querySelector("#card-cvv")?.addEventListener("input", event => {
event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
updateSaveCardButtonState();
});
document.querySelector("#btn-save-new-card")?.addEventListener("click", () => {
if (!updateSaveCardButtonState()) return;
const holder = (document.querySelector("#card-holder")?.value || "").trim();
const rawNumber = (document.querySelector("#card-number")?.value || "").replace(/\D/g, "");
const expiry = (document.querySelector("#card-expiry")?.value || "").trim();
let newCard = null;
if (window.SaborcitoOrderTracker?.registerNewCard) {
newCard = window.SaborcitoOrderTracker.registerNewCard({ holder, number: rawNumber, expiry });
}
if (!newCard) {
const last4 = rawNumber.slice(-4);
const brand = rawNumber.startsWith("5") ? "MASTERCARD" : rawNumber.startsWith("3") ? "AMEX" : "VISA";
newCard = {
id: `card_${Date.now()}_${last4}`,
brand,
last4,
holder,
expiry,
isDefault: true
};
try {
const userKey = String(currentUser?.email || currentUser?.id || "anon").trim().toLowerCase();
const storageKey = `saborcito_saved_cards_${userKey}`;
const cards = getSavedCards();
cards.forEach(c => { c.isDefault = false; });
cards.unshift(newCard);
localStorage.setItem(storageKey, JSON.stringify(cards));
localStorage.setItem("saborcito_saved_cards", JSON.stringify(cards));
} catch {}
}
const holderInput = document.querySelector("#card-holder");
const numberInput = document.querySelector("#card-number");
const expiryInput = document.querySelector("#card-expiry");
const cvvInput = document.querySelector("#card-cvv");
if (holderInput) holderInput.value = "";
if (numberInput) numberInput.value = "";
if (expiryInput) expiryInput.value = "";
if (cvvInput) cvvInput.value = "";
updateSaveCardButtonState();
selectedCardId = newCard.id;
cardSource = newCard.id;
renderSavedCards();
showNotice(`Tarjeta •••• ${newCard.last4} guardada exitosamente.`);
});
document.addEventListener("click", event => {
const btn = event.target.closest("button");
if (!btn) {
if (searchResults && !event.target.closest(".search-wrap")) {
searchResults.hidden = true;
}
return;
}
if (btn.dataset.removeCartItem) {
const id = btn.dataset.removeCartItem;
const { dishes } = getCatalogData();
const dish = dishes.find(d => String(d.id) === String(id));
const dishName = dish ? dish.name : "este producto";
const doRemove = () => {
cart.delete(id);
saveCartToCache();
renderCheckout();
showNotice(`Se eliminó "${dishName}" del pedido.`);
};
if (window.SaborcitoOrderTracker?.confirmRemoveDish) {
window.SaborcitoOrderTracker.confirmRemoveDish(dishName, doRemove);
} else if (window.confirm(`¿Deseas eliminar "${dishName}" del pedido?`)) {
doRemove();
}
return;
}
if (btn.dataset.qtyId) {
const id = btn.dataset.qtyId;
const delta = Number(btn.dataset.delta || 0);
const currentQty = cart.get(id) || 0;
if (delta === -1 && currentQty === 1) {
const { dishes } = getCatalogData();
const dish = dishes.find(d => String(d.id) === String(id));
const dishName = dish ? dish.name : "este producto";
if (window.SaborcitoOrderTracker?.confirmRemoveDish) {
window.SaborcitoOrderTracker.confirmRemoveDish(dishName, () => {
cart.delete(id);
saveCartToCache();
renderCheckout();
});
} else if (window.confirm(`¿Deseas eliminar "${dishName}" del pedido?`)) {
cart.delete(id);
saveCartToCache();
renderCheckout();
}
return;
}
const next = currentQty + delta;
if (next <= 0) cart.delete(id);
else cart.set(id, next);
saveCartToCache();
renderCheckout();
return;
}
if (btn.dataset.cashPreset) {
cashPreset = btn.dataset.cashPreset;
document.querySelectorAll("[data-cash-preset]").forEach(b => {
b.classList.toggle("is-selected", b.dataset.cashPreset === cashPreset);
});
updateCashPreview();
return;
}
if (btn.dataset.tip !== undefined) {
selectedTip = Number(btn.dataset.tip);
document.querySelectorAll("[data-tip]").forEach(b => {
b.classList.toggle("is-selected", Number(b.dataset.tip) === selectedTip);
});
renderCheckout();
return;
}
if (btn.dataset.quickAddDish) {
const dishId = btn.dataset.quickAddDish;
const { restaurants, dishes } = getCatalogData();
const dish = dishes.find(d => String(d.id) === String(dishId));
const rest = restaurants.find(r => String(r.id) === String(dish?.restaurantId));
if (searchResults) searchResults.hidden = true;
if (topSearch) topSearch.value = "";
if (dish && window.SaborcitoOrderTracker?.openDishModal) {
window.SaborcitoOrderTracker.openDishModal(dish, rest, (selectedDish, qty) => {
cart.set(dishId, (cart.get(dishId) || 0) + qty);
saveCartToCache();
renderCheckout();
showNotice(`${selectedDish.name} (x${qty}) agregado a tu pedido.`);
});
} else {
cart.set(dishId, (cart.get(dishId) || 0) + 1);
saveCartToCache();
renderCheckout();
showNotice("Producto agregado a tu pedido.");
}
}
});
if (topSearch) {
const handleCheckoutSearch = (window.saborcitoDebounce || (fn => fn))(() => {
const query = topSearch.value.trim().toLocaleLowerCase("es");
if (!query) {
searchResults.hidden = true;
return;
}
const { restaurants, dishes } = getCatalogData();
const matched = dishes.filter(d => d.name.toLocaleLowerCase("es").includes(query)).slice(0, 6);
searchResults.innerHTML = matched.length
? matched.map(d => {
const rest = restaurants.find(r => String(r.id) === String(d.restaurantId));
return `<button class="search-result" type="button" data-quick-add-dish="${escapeHTML(d.id)}">
<strong>+ ${escapeHTML(d.name)} ($${Number(d.price).toFixed(2)})</strong>
<span> · ${escapeHTML(rest?.name || "Saborcito")}</span>
</button>`;
}).join("")
: '<div class="search-result">Sin coincidencias.</div>';
searchResults.hidden = false;
}, 250);
topSearch.addEventListener("input", handleCheckoutSearch);
}
checkoutForm?.addEventListener("submit", event => {
event.preventDefault();
feedbackEl.hidden = true;
const addressInput = document.querySelector("#delivery-address");
const address = addressInput?.value.trim() || "";
if (!updateCheckoutPaymentButtonState() || !address) {
feedbackEl.textContent = "Por favor, indica una dirección de entrega antes de pagar.";
feedbackEl.hidden = false;
addressInput?.focus();
return;
}
const { dishes } = getCatalogData();
const { total } = calculateTotals();
let paymentLabel = "Tarjeta •••• 4242";
if (paymentMethod === "card") {
if (selectedCardId === "new") {
const holder = document.querySelector("#card-holder")?.value.trim() || "";
const rawNumber = (document.querySelector("#card-number")?.value || "").replace(/\D/g, "");
const expiry = document.querySelector("#card-expiry")?.value.trim() || "";
const cvv = document.querySelector("#card-cvv")?.value.trim() || "";
if (holder.length < 3) {
feedbackEl.textContent = "Ingresa el nombre del titular de la tarjeta.";
feedbackEl.hidden = false;
document.querySelector("#card-holder")?.focus();
return;
}
if (rawNumber.length < 15) {
feedbackEl.textContent = "Ingresa un número de tarjeta válido (16 dígitos).";
feedbackEl.hidden = false;
document.querySelector("#card-number")?.focus();
return;
}
if (!/^\d{2}\/\d{2}$/.test(expiry)) {
feedbackEl.textContent = "Ingresa la fecha de vencimiento en formato MM/AA.";
feedbackEl.hidden = false;
document.querySelector("#card-expiry")?.focus();
return;
}
if (cvv.length < 3) {
feedbackEl.textContent = "Ingresa el código de seguridad CVV (3 o 4 dígitos).";
feedbackEl.hidden = false;
document.querySelector("#card-cvv")?.focus();
return;
}
paymentLabel = `Tarjeta •••• ${rawNumber.slice(-4)}`;
window.SaborcitoOrderTracker?.registerNewCard({ holder, number: rawNumber, expiry });
} else {
const cards = getSavedCards();
const chosen = cards.find(c => c.id === selectedCardId) || cards[0];
paymentLabel = chosen
? `Tarjeta (${chosen.brand || 'VISA'} •••• ${chosen.last4 || '4242'})`
: 'Tarjeta de crédito / débito';
}
} else {
if (cashPreset === "exact") {
paymentLabel = `Efectivo (Monto exacto: $${total.toFixed(2)} · Sin cambio)`;
} else {
const bill = Number(cashPreset) || 20;
if (bill < total && !(total > 20 && bill === 20)) {
const suggested = total <= 10 ? "$10.00" : "$20.00";
feedbackEl.textContent = `El billete de $${bill.toFixed(2)} no cubre el total de tu pedido ($${total.toFixed(2)}). Por favor selecciona billete de ${suggested} o monto exacto.`;
feedbackEl.hidden = false;
return;
}
if (bill >= total) {
const change = bill - total;
paymentLabel = `Efectivo (Billete $${bill.toFixed(2)} · Cambio: $${change.toFixed(2)})`;
} else {
const billsCount = Math.ceil(total / 20);
const totalCash = billsCount * 20;
const change = totalCash - total;
paymentLabel = `Efectivo (${billsCount}x Billete $20.00 · Cambio: $${change.toFixed(2)})`;
}
}
}
localStorage.setItem(ADDRESS_STORAGE_KEY, address);
confirmBtn.disabled = true;
confirmBtn.textContent = "Procesando pago seguro...";
window.setTimeout(() => {
const dishesByRestaurant = new Map();
const orderItems = [];
for (const [dishId, qty] of cart.entries()) {
const dish = dishes.find(item => String(item.id) === String(dishId));
if (!dish) continue;
orderItems.push({
id: String(dish.id),
name: dish.name,
quantity: qty,
price: Number(dish.price)
});
const restId = dish.restaurantId;
if (restId) {
if (!dishesByRestaurant.has(restId)) dishesByRestaurant.set(restId, []);
dishesByRestaurant.get(restId).push(String(dish.id));
}
}
for (const [restId, dishIds] of dishesByRestaurant.entries()) {
saveLocalRecentDishIds(restId, dishIds);
}
cart.clear();
saveCartToCache();
const createdOrder = window.SaborcitoOrderTracker?.createActiveOrder({
address,
paymentMethod,
paymentLabel,
total,
items: orderItems
});
confirmBtn.disabled = false;
checkoutForm.hidden = true;
emptyState.hidden = false;
document.querySelector("#checkout-empty-title").textContent = `¡Pago confirmado! Pedido #${createdOrder?.shortCode || "1024"} en marcha`;
document.querySelector("#checkout-empty-desc").textContent =
"Tu pago fue procesado con éxito. En la esquina inferior derecha puedes ver la ventana emergente con el estado en vivo de tu pedido (Preparando → Listo para recoger → En camino → Ya llegó) mientras sigues explorando o realizas otro pedido.";
showNotice("¡Pago realizado con éxito! Seguimiento en vivo activado.");
}, 900);
});
try {
const savedUser = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
if (!savedUser || !savedUser.email) {
window.location.replace("auth.html");
} else {
currentUser = savedUser;
const rawAddress = localStorage.getItem(ADDRESS_STORAGE_KEY);
const savedAddress = (rawAddress && rawAddress.trim() !== "Av. Siempre Viva 742") ? rawAddress.trim() : "";
const addrInput = document.querySelector("#delivery-address");
if (addrInput) addrInput.value = savedAddress;
const accountLink = document.querySelector("#account-link");
if (accountLink && savedUser.name) {
accountLink.textContent = `👤 ${savedUser.name} ▾`;
accountLink.href = "#";
accountLink.setAttribute("aria-label", `Abrir menú de cuenta de ${savedUser.name}`);
accountLink.addEventListener("click", event => {
event.preventDefault();
window.SaborcitoOrderTracker?.toggleUserDropdown(event);
});
}
loadCartFromCache();
renderCheckout();
}
} catch {
window.location.replace("auth.html");
}