(() => {
  const SESSION_STORAGE_KEY = "saborcito_user";
  const USER_COORDS_STORAGE_KEY = "saborcito_user_coords";
  const STAGE_DURATION_MS = 10000; // Avanza automáticamente cada 10 segundos

  const ORDER_STAGES = [
    {
      key: "preparing",
      shortLabel: "Siendo preparado",
      title: "Tu pedido está siendo preparado",
      subtitle: "El restaurante recibió tu orden y está cocinando tus platillos.",
      icon: "🍳",
      eta: "Llegada estimada: 20–25 min",
      courierStatus: "En camino al restaurante",
      progress: 25,
      routeRatio: 0.05
    },
    {
      key: "ready",
      shortLabel: "Listo para recoger",
      title: "Listo para ser recogido",
      subtitle: "El restaurante empacó tu pedido y lo entrega al repartidor.",
      icon: "🛍️",
      eta: "Llegada estimada: 12–15 min",
      courierStatus: "Recogiendo tu pedido en el local",
      progress: 50,
      routeRatio: 0.18
    },
    {
      key: "on_the_way",
      shortLabel: "En camino",
      title: "Tu pedido está en camino",
      subtitle: "El repartidor va en ruta hacia tu ubicación actual.",
      icon: "🛵",
      eta: "Llegada estimada: 5–8 min",
      courierStatus: "En ruta hacia tu dirección",
      progress: 78,
      routeRatio: 0.65
    },
    {
      key: "arrived",
      shortLabel: "¡Ya llegó!",
      title: "¡Tu pedido ya llegó!",
      subtitle: "El repartidor entregó tu pedido. ¡Califica tu experiencia!",
      icon: "🎉",
      eta: "Entregado ahora",
      courierStatus: "Pedido entregado en tu ubicación",
      progress: 100,
      routeRatio: 1.0
    }
  ];

  const COURIER_PROFILES = [
    {
      name: "Carlos Mendoza",
      rating: "4.9",
      deliveries: 842,
      vehicle: "Moto Honda CB190",
      plate: "PBA-4821",
      phone: "099 482 1903",
      avatar: "🛵"
    },
    {
      name: "Sofía Herrera",
      rating: "4.95",
      deliveries: 1120,
      vehicle: "Moto Yamaha FZ",
      plate: "PBC-7390",
      phone: "098 761 3340",
      avatar: "🛵"
    },
    {
      name: "Mateo Vargas",
      rating: "4.88",
      deliveries: 615,
      vehicle: "Scooter Eléctrica Niu",
      plate: "PBD-2109",
      phone: "099 114 8821",
      avatar: "⚡"
    },
    {
      name: "Valeria Castro",
      rating: "4.92",
      deliveries: 930,
      vehicle: "Moto Suzuki Gixxer",
      plate: "PBA-9054",
      phone: "098 339 5120",
      avatar: "🛵"
    }
  ];

  const STAR_LABELS = {
    0: "Selecciona de 1 a 5 estrellas",
    1: "1 estrella · Muy malo",
    2: "2 estrellas · Regular",
    3: "3 estrellas · Bueno",
    4: "4 estrellas · Muy bueno",
    5: "5 estrellas · ¡Excelente!"
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
  }

  function getOrderCourier(order) {
    if (order && order.courier && order.courier.name) {
      return order.courier;
    }
    const seed = Number(String(order?.shortCode || "0").replace(/\D/g, "")) || 0;
    return COURIER_PROFILES[seed % COURIER_PROFILES.length];
  }

  function getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
      return user && user.email ? user : null;
    } catch {
      return null;
    }
  }

  function getUserKey() {
    const user = getCurrentUser();
    return String(user?.email || user?.id || "anon").trim().toLowerCase();
  }

  function getActiveOrdersKey() {
    return `saborcito_active_orders_${getUserKey()}`;
  }

  function getPurchaseHistoryKey() {
    return `saborcito_purchase_history_${getUserKey()}`;
  }

  function getSavedCardsKey() {
    return `saborcito_saved_cards_${getUserKey()}`;
  }

  function getMinimizedKey() {
    return `saborcito_tracker_minimized_${getUserKey()}`;
  }

  function loadActiveOrders() {
    try {
      const raw = JSON.parse(localStorage.getItem(getActiveOrdersKey()) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveActiveOrders(orders) {
    try {
      localStorage.setItem(getActiveOrdersKey(), JSON.stringify(orders));
    } catch {
      // ignore storage errors
    }
  }

  function getDefaultPurchaseHistory() {
    return [
      {
        id: "ord_hist_1",
        shortCode: "8421",
        createdAt: Date.now() - 86400000 * 2,
        address: localStorage.getItem("saborcito_delivery_address") || "Dirección de entrega",
        paymentMethod: "card",
        paymentLabel: "Tarjeta •••• 4242",
        total: 26.99,
        items: [
          { id: "1", name: "Pizza Margherita", quantity: 1, price: 12.5 },
          { id: "11", name: "Whopper Clásica", quantity: 2, price: 6.5 }
        ],
        foodRating: 5,
        courierRating: 5,
        ratingSubmitted: true
      }
    ];
  }

  function loadPurchaseHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(getPurchaseHistoryKey()) || "null");
      const stored = Array.isArray(raw) ? raw : getDefaultPurchaseHistory();
      if (!raw) {
        localStorage.setItem(getPurchaseHistoryKey(), JSON.stringify(stored));
      }
      // Combinar con pedidos activos para que siempre aparezcan los más recientes
      const active = loadActiveOrders();
      const byId = new Map();
      for (const ord of [...active, ...stored]) {
        if (ord && ord.id && !byId.has(ord.id)) {
          byId.set(ord.id, ord);
        }
      }
      return [...byId.values()].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    } catch {
      return getDefaultPurchaseHistory();
    }
  }

  function saveOrderToHistory(order) {
    try {
      const current = loadPurchaseHistory();
      const idx = current.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...order };
      } else {
        current.unshift(order);
      }
      localStorage.setItem(getPurchaseHistoryKey(), JSON.stringify(current.slice(0, 25)));
    } catch {
      // ignore storage errors
    }
  }

  function getDefaultSavedCards() {
    const user = getCurrentUser();
    const holderName = user?.name || "Titular Saborcito";
    return [
      {
        id: "card_default_4242",
        brand: "VISA",
        last4: "4242",
        holder: holderName,
        expiry: "09/28",
        isDefault: true
      },
      {
        id: "card_default_8819",
        brand: "MASTERCARD",
        last4: "8819",
        holder: holderName,
        expiry: "11/27",
        isDefault: false
      }
    ];
  }

  function loadSavedCards() {
    try {
      const raw = JSON.parse(localStorage.getItem(getSavedCardsKey()) || "null");
      if (Array.isArray(raw) && raw.length > 0) {
        return raw;
      }
      const seeded = getDefaultSavedCards();
      localStorage.setItem(getSavedCardsKey(), JSON.stringify(seeded));
      return seeded;
    } catch {
      return getDefaultSavedCards();
    }
  }

  function saveSavedCards(cards) {
    try {
      localStorage.setItem(getSavedCardsKey(), JSON.stringify(cards));
    } catch {
      // ignore storage errors
    }
  }

  function registerNewCard({ holder, number, expiry }) {
    const digits = String(number || "").replace(/\D/g, "");
    if (digits.length < 4) return null;
    const last4 = digits.slice(-4);
    const brand = digits.startsWith("5")
      ? "MASTERCARD"
      : digits.startsWith("3")
        ? "AMEX"
        : "VISA";
    const cards = loadSavedCards();
    const existing = cards.find(c => c.last4 === last4 && c.expiry === expiry);
    if (existing) return existing;

    cards.forEach(c => { c.isDefault = false; });
    const newCard = {
      id: `card_${Date.now()}_${last4}`,
      brand,
      last4,
      holder: holder || getCurrentUser()?.name || "Titular",
      expiry: expiry || "08/29",
      isDefault: true
    };
    cards.unshift(newCard);
    saveSavedCards(cards);
    return newCard;
  }

  function computeStageIndex(order) {
    const manualStage = Number(order.manualStage ?? 0);
    const elapsedStages = Math.floor(Math.max(0, Date.now() - Number(order.createdAt || Date.now())) / STAGE_DURATION_MS);
    return Math.min(ORDER_STAGES.length - 1, Math.max(manualStage, elapsedStages));
  }

  let selectedOrderId = null;
  let trackerRoot = null;
  let headerBadgeBtn = null;
  let tickTimer = null;
  let renderedSignature = "";

  // Estado del menú desplegable de cuenta y modal
  let userDropdownEl = null;
  let userModalBackdropEl = null;
  let activeModalView = null; // "history" | "cards" | null

  // Estado del mapa interactivo (Leaflet + OpenStreetMap + Geolocation API)
  let leafletReadyPromise = null;
  let mapInstance = null;
  let userMarker = null;
  let restaurantMarker = null;
  let courierMarker = null;
  let routeLine = null;
  let userCoords = loadSavedCoords();
  let geoRequested = false;

  const ECUADOR_BOUNDS = [
    [-5.15, -92.50],
    [1.50, -75.15]
  ];

  function isCoordsInEcuador(lat, lng) {
    const nLat = Number(lat);
    const nLng = Number(lng);
    return !isNaN(nLat) && !isNaN(nLng) &&
      nLat >= ECUADOR_BOUNDS[0][0] && nLat <= ECUADOR_BOUNDS[1][0] &&
      nLng >= ECUADOR_BOUNDS[0][1] && nLng <= ECUADOR_BOUNDS[1][1];
  }

  function loadSavedCoords() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(USER_COORDS_STORAGE_KEY) || "null");
      if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lng) && isCoordsInEcuador(saved.lat, saved.lng)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return { lat: -0.1807, lng: -78.4678, isRealGps: false };
  }

  function requestUserGeolocation(forceRecenter = false) {
    if (!("geolocation" in navigator)) return;
    geoRequested = true;
    const statusLabel = document.querySelector("#tracker-gps-status");
    if (statusLabel && forceRecenter) {
      statusLabel.textContent = "Obteniendo tu ubicación GPS...";
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isCoordsInEcuador(lat, lng)) {
          userCoords = { lat: -0.1807, lng: -78.4678, isRealGps: false };
          const lbl = document.querySelector("#tracker-gps-status");
          if (lbl) lbl.textContent = "📍 Ubicación del pedido (Quito, Ecuador 🇪🇨)";
          return;
        }
        userCoords = {
          lat,
          lng,
          isRealGps: true
        };
        try {
          sessionStorage.setItem(USER_COORDS_STORAGE_KEY, JSON.stringify(userCoords));
        } catch {
          // ignore
        }
        updateLiveMapPositions(true);
      },
      () => {
        const lbl = document.querySelector("#tracker-gps-status");
        if (lbl) lbl.textContent = "📍 Ubicación estimada en el mapa (Ecuador)";
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
    );
  }

  function ensureLeafletLoaded() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletReadyPromise) return leafletReadyPromise;

    leafletReadyPromise = new Promise(resolve => {
      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => resolve(window.L || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });

    return leafletReadyPromise;
  }

  function destroyMapInstance() {
    if (mapInstance) {
      try {
        mapInstance.remove();
      } catch {
        // ignore
      }
    }
    mapInstance = null;
    userMarker = null;
    restaurantMarker = null;
    courierMarker = null;
    routeLine = null;
  }

  function getActiveStageRatio() {
    const orders = loadActiveOrders();
    const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
    if (!activeOrder) return 0.1;
    const stageIdx = computeStageIndex(activeOrder);
    return ORDER_STAGES[stageIdx]?.routeRatio ?? 0.1;
  }

  function updateLiveMapPositions(recenter = false) {
    const statusLabel = document.querySelector("#tracker-gps-status");
    if (statusLabel) {
      statusLabel.textContent = userCoords.isRealGps
        ? `📍 Tu ubicación actual (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)})`
        : "📍 Tu ubicación en el mapa";
    }

    if (!mapInstance || !window.L) return;

    const uLat = userCoords.lat;
    const uLng = userCoords.lng;
    const rLat = uLat + 0.0045;
    const rLng = uLng - 0.0055;
    const ratio = getActiveStageRatio();
    const cLat = rLat + (uLat - rLat) * ratio;
    const cLng = rLng + (uLng - rLng) * ratio;

    if (userMarker) userMarker.setLatLng([uLat, uLng]);
    if (restaurantMarker) restaurantMarker.setLatLng([rLat, rLng]);
    if (courierMarker) courierMarker.setLatLng([cLat, cLng]);
    if (routeLine) routeLine.setLatLngs([[rLat, rLng], [uLat, uLng]]);

    if (recenter) {
      mapInstance.fitBounds([[rLat, rLng], [uLat, uLng]], { padding: [22, 22], maxZoom: 15 });
    }
  }

  async function initLiveMap() {
    const mapContainer = document.querySelector("#tracker-live-map");
    if (!mapContainer) return;

    if (!geoRequested) {
      requestUserGeolocation(false);
    }

    const L = await ensureLeafletLoaded();
    if (!L || !document.querySelector("#tracker-live-map")) return;

    destroyMapInstance();

    const uLat = userCoords.lat;
    const uLng = userCoords.lng;
    const rLat = uLat + 0.0045;
    const rLng = uLng - 0.0055;
    const ratio = getActiveStageRatio();
    const cLat = rLat + (uLat - rLat) * ratio;
    const cLng = rLng + (uLng - rLng) * ratio;

    const ecuadorBounds = L.latLngBounds(
      L.latLng(ECUADOR_BOUNDS[0][0], ECUADOR_BOUNDS[0][1]),
      L.latLng(ECUADOR_BOUNDS[1][0], ECUADOR_BOUNDS[1][1])
    );

    mapInstance = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: ecuadorBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 6
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18
    }).addTo(mapInstance);

    const makePin = (emoji, bg) => L.divIcon({
      className: "tracker-map-divicon",
      html: `<span class="tracker-map-pin" style="background:${bg}">${emoji}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    restaurantMarker = L.marker([rLat, rLng], { icon: makePin("🏪", "#fff0d5") })
      .addTo(mapInstance)
      .bindTooltip("Restaurante", { direction: "top" });

    userMarker = L.marker([uLat, uLng], { icon: makePin("📍", "#dcfce7") })
      .addTo(mapInstance)
      .bindTooltip("Tu ubicación actual", { direction: "top" });

    courierMarker = L.marker([cLat, cLng], { icon: makePin("🛵", "#FFB03B") })
      .addTo(mapInstance)
      .bindTooltip("Repartidor en camino", { direction: "top" });

    routeLine = L.polyline([[rLat, rLng], [uLat, uLng]], {
      color: "#FFB03B",
      weight: 4,
      dashArray: "6, 6"
    }).addTo(mapInstance);

    mapInstance.fitBounds([[rLat, rLng], [uLat, uLng]], { padding: [22, 22], maxZoom: 15 });
    window.setTimeout(() => {
      mapInstance?.invalidateSize();
    }, 150);
  }

  /* ==========================================================================
     Menú Desplegable de Usuario en la Barra de Navegación y Modales de Cuenta
     ========================================================================== */
  function ensureUserMenuDOM() {
    const accountLink = document.querySelector("#account-link");
    if (!accountLink) return;

    const headerActions = accountLink.closest(".header-actions");
    if (headerActions) {
      headerActions.style.position = "relative";
    }

    if (!userDropdownEl) {
      userDropdownEl = document.createElement("div");
      userDropdownEl.id = "user-account-dropdown";
      userDropdownEl.className = "user-account-dropdown";
      userDropdownEl.setAttribute("role", "menu");
      userDropdownEl.setAttribute("aria-label", "Opciones de tu cuenta");
      userDropdownEl.hidden = true;
      (headerActions || document.body).appendChild(userDropdownEl);

      userDropdownEl.addEventListener("click", event => {
        const btn = event.target.closest("button[data-user-menu-action]");
        if (!btn) return;
        const action = btn.dataset.userMenuAction;
        closeUserDropdown();

        if (action === "history") {
          openUserModal("history");
        } else if (action === "cards") {
          openUserModal("cards");
        } else if (action === "logout") {
          performUserLogout();
        }
      });
    }

    if (!userModalBackdropEl) {
      userModalBackdropEl = document.createElement("div");
      userModalBackdropEl.id = "user-account-modal-backdrop";
      userModalBackdropEl.className = "user-modal-backdrop";
      userModalBackdropEl.hidden = true;
      document.body.appendChild(userModalBackdropEl);

      userModalBackdropEl.addEventListener("click", event => {
        if (event.target === userModalBackdropEl) {
          closeUserModal();
          return;
        }
        const btn = event.target.closest("button");
        if (!btn) return;

        if (btn.dataset.closeUserModal !== undefined) {
          closeUserModal();
          return;
        }

        if (btn.dataset.switchModalTab) {
          openUserModal(btn.dataset.switchModalTab);
          return;
        }

        if (btn.dataset.setDefaultCard) {
          const cardId = btn.dataset.setDefaultCard;
          const cards = loadSavedCards().map(c => ({
            ...c,
            isDefault: c.id === cardId
          }));
          saveSavedCards(cards);
          renderUserModalContent();
          return;
        }

        if (btn.dataset.deleteSavedCard) {
          const cardId = btn.dataset.deleteSavedCard;
          let cards = loadSavedCards().filter(c => c.id !== cardId);
          if (cards.length > 0 && !cards.some(c => c.isDefault)) {
            cards[0].isDefault = true;
          }
          saveSavedCards(cards);
          renderUserModalContent();
        }
      });

      userModalBackdropEl.addEventListener("submit", event => {
        const form = event.target.closest("#user-add-card-form");
        if (!form) return;
        event.preventDefault();

        const holder = form.querySelector("#modal-card-holder")?.value.trim() || "";
        const rawNumber = (form.querySelector("#modal-card-number")?.value || "").replace(/\D/g, "");
        const expiry = form.querySelector("#modal-card-expiry")?.value.trim() || "";
        const errEl = form.querySelector("#modal-card-error");

        if (holder.length < 3) {
          if (errEl) { errEl.textContent = "Ingresa el nombre del titular."; errEl.hidden = false; }
          return;
        }
        if (rawNumber.length < 13) {
          if (errEl) { errEl.textContent = "Ingresa los 16 dígitos de la tarjeta."; errEl.hidden = false; }
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
          if (errEl) { errEl.textContent = "Formato de vencimiento inválido (usa MM/AA)."; errEl.hidden = false; }
          return;
        }

        registerNewCard({ holder, number: rawNumber, expiry });
        renderUserModalContent();
      });
    }
  }

  function renderUserDropdownContent() {
    if (!userDropdownEl) return;
    const user = getCurrentUser();
    if (!user) {
      userDropdownEl.hidden = true;
      return;
    }

    const historyCount = loadPurchaseHistory().length;
    const cardsCount = loadSavedCards().length;

    userDropdownEl.innerHTML = `
      <div class="user-dropdown-header">
        <span class="user-dropdown-avatar" aria-hidden="true">👤</span>
        <div class="user-dropdown-identity">
          <strong>${escapeHTML(user.name || "Usuario")}</strong>
          <small>${escapeHTML(user.email)}</small>
        </div>
      </div>
      <div class="user-dropdown-list">
        <button type="button" class="user-dropdown-item" role="menuitem" data-user-menu-action="history">
          <span class="user-dropdown-item-icon" aria-hidden="true">🧾</span>
          <span class="user-dropdown-item-copy">
            <strong>Historial de compras</strong>
            <small>${historyCount} ${historyCount === 1 ? "pedido registrado" : "pedidos registrados"}</small>
          </span>
        </button>
        <button type="button" class="user-dropdown-item" role="menuitem" data-user-menu-action="cards">
          <span class="user-dropdown-item-icon" aria-hidden="true">💳</span>
          <span class="user-dropdown-item-copy">
            <strong>Tarjetas registradas</strong>
            <small>${cardsCount} ${cardsCount === 1 ? "tarjeta guardada" : "tarjetas guardadas"}</small>
          </span>
        </button>
        <hr class="user-dropdown-divider">
        <button type="button" class="user-dropdown-item user-dropdown-logout" role="menuitem" data-user-menu-action="logout">
          <span class="user-dropdown-item-icon" aria-hidden="true">🚪</span>
          <span class="user-dropdown-item-copy">
            <strong>Cerrar sesión</strong>
            <small>Salir de tu cuenta en este navegador</small>
          </span>
        </button>
      </div>
    `;
  }

  function toggleUserDropdown(event) {
    const user = getCurrentUser();
    if (!user) return false;
    if (event) event.preventDefault();
    ensureUserMenuDOM();
    if (!userDropdownEl) return true;

    const willOpen = userDropdownEl.hidden;
    if (willOpen) {
      renderUserDropdownContent();
      userDropdownEl.hidden = false;
      document.querySelector("#account-link")?.setAttribute("aria-expanded", "true");
    } else {
      closeUserDropdown();
    }
    return true;
  }

  function closeUserDropdown() {
    if (userDropdownEl) {
      userDropdownEl.hidden = true;
    }
    document.querySelector("#account-link")?.setAttribute("aria-expanded", "false");
  }

  function openUserModal(view) {
    ensureUserMenuDOM();
    activeModalView = view === "cards" ? "cards" : "history";
    renderUserModalContent();
    if (userModalBackdropEl) {
      userModalBackdropEl.hidden = false;
    }
  }

  function closeUserModal() {
    activeModalView = null;
    if (userModalBackdropEl) {
      userModalBackdropEl.hidden = true;
    }
  }

  function formatOrderDate(timestamp) {
    try {
      const d = new Date(Number(timestamp || Date.now()));
      return d.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Reciente";
    }
  }

  function renderUserModalContent() {
    if (!userModalBackdropEl || !activeModalView) return;
    const isHistory = activeModalView === "history";
    const historyOrders = loadPurchaseHistory();
    const savedCards = loadSavedCards();

    const bodyHTML = isHistory
      ? (historyOrders.length === 0
        ? `<p class="empty-state">Aún no tienes compras registradas en tu cuenta.</p>`
        : `<div class="user-history-list">
            ${historyOrders.map(ord => {
              const itemsText = (ord.items || [])
                .map(i => `${i.quantity}x ${i.name}`)
                .join(", ") || "Pedido Saborcito";
              const stageIdx = computeStageIndex(ord);
              const isCompleted = ord.id.startsWith("ord_hist_") || stageIdx === ORDER_STAGES.length - 1;
              const statusBadge = isCompleted
                ? `<span class="history-status-badge is-delivered">✓ Entregado</span>`
                : `<span class="history-status-badge is-live">${escapeHTML(ORDER_STAGES[stageIdx].icon)} ${escapeHTML(ORDER_STAGES[stageIdx].shortLabel)}</span>`;
              const ratingBadge = ord.ratingSubmitted
                ? `<span class="history-rating-pill">★ Comida: ${Number(ord.foodRating || 5)}/5 · Repartidor: ${Number(ord.courierRating || 5)}/5</span>`
                : "";

              return `
                <article class="user-history-card">
                  <div class="user-history-top">
                    <div>
                      <strong>Pedido #${escapeHTML(ord.shortCode || "1024")}</strong>
                      <span class="user-history-date"> · ${escapeHTML(formatOrderDate(ord.createdAt))}</span>
                    </div>
                    ${statusBadge}
                  </div>
                  <p class="user-history-items">🍽️ ${escapeHTML(itemsText)}</p>
                  <div class="user-history-meta">
                    <span>📍 ${escapeHTML(ord.address || "Dirección de entrega")}</span>
                    <span>💳 ${escapeHTML(ord.paymentLabel || "Tarjeta")}</span>
                  </div>
                  <div class="user-history-bottom">
                    ${ratingBadge || `<span></span>`}
                    <strong class="user-history-total">Total: $${Number(ord.total || 0).toFixed(2)}</strong>
                  </div>
                </article>
              `;
            }).join("")}
          </div>`)
      : `
        <div class="user-cards-section">
          <div class="user-saved-cards-list">
            ${savedCards.length === 0
              ? `<p class="empty-state">No tienes tarjetas guardadas en tu cuenta.</p>`
              : savedCards.map(card => `
                <div class="user-saved-card-row ${card.isDefault ? "is-default" : ""}">
                  <span class="card-brand-badge">${escapeHTML(card.brand || "VISA")}</span>
                  <div class="user-saved-card-copy">
                    <strong>•••• •••• •••• ${escapeHTML(card.last4)} ${card.isDefault ? '<span class="card-default-pill">Predeterminada</span>' : ""}</strong>
                    <small>${escapeHTML(card.holder)} · Vence ${escapeHTML(card.expiry)}</small>
                  </div>
                  <div class="user-saved-card-actions">
                    ${!card.isDefault
                      ? `<button type="button" class="user-card-action-btn" data-set-default-card="${escapeHTML(card.id)}">Predeterminar</button>`
                      : ""}
                    <button type="button" class="user-card-delete-btn" data-delete-saved-card="${escapeHTML(card.id)}" aria-label="Eliminar tarjeta terminada en ${escapeHTML(card.last4)}">Eliminar</button>
                  </div>
                </div>
              `).join("")}
          </div>

          <form class="user-add-card-form" id="user-add-card-form" novalidate>
            <h4>+ Registrar nueva tarjeta</h4>
            <div class="user-add-card-grid">
              <label class="auth-field" for="modal-card-holder">
                <span>Nombre en la tarjeta</span>
                <input id="modal-card-holder" type="text" placeholder="Ej. Carlos Mendoza" required>
              </label>
              <label class="auth-field" for="modal-card-number">
                <span>Número de tarjeta (16 dígitos)</span>
                <input id="modal-card-number" type="text" inputmode="numeric" maxlength="19" placeholder="4532 8910 2341 9921" required>
              </label>
              <label class="auth-field" for="modal-card-expiry">
                <span>Vencimiento (MM/AA)</span>
                <input id="modal-card-expiry" type="text" inputmode="numeric" maxlength="5" placeholder="08/29" required>
              </label>
            </div>
            <p class="tracker-rating-error" id="modal-card-error" hidden></p>
            <button type="submit" class="primary-button user-save-card-btn">Guardar tarjeta en mi cuenta</button>
          </form>
        </div>
      `;

    userModalBackdropEl.innerHTML = `
      <div class="user-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div class="user-modal-header">
          <div class="user-modal-tabs" role="tablist">
            <button type="button" class="user-modal-tab" role="tab" aria-selected="${isHistory}" data-switch-modal-tab="history">
              🧾 Historial de compras
            </button>
            <button type="button" class="user-modal-tab" role="tab" aria-selected="${!isHistory}" data-switch-modal-tab="cards">
              💳 Tarjetas registradas
            </button>
          </div>
          <button type="button" class="close-button" data-close-user-modal="true" aria-label="Cerrar ventana">×</button>
        </div>
        <div class="user-modal-body">
          <h3 id="user-modal-title">${isHistory ? "Tu historial de compras" : "Tarjetas registradas en tu cuenta"}</h3>
          <p class="user-modal-subtitle">${isHistory
            ? "Revisa todos los pedidos realizados con tu cuenta de Saborcito."
            : "Administra tus métodos de pago guardados para pagar más rápido."}</p>
          ${bodyHTML}
        </div>
      </div>
    `;
  }

  function performUserLogout() {
    closeUserDropdown();
    closeUserModal();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    fetch("/api/logout", { method: "POST" }).catch(() => {});

    if (typeof window.onSaborcitoLogout === "function") {
      window.onSaborcitoLogout();
      return;
    }
    window.location.replace("auth.html");
  }

  function decorateAccountNavButton() {
    const accountLink = document.querySelector("#account-link");
    if (!accountLink) return;
    const user = getCurrentUser();
    if (user && user.name) {
      accountLink.textContent = `👤 ${user.name} ▾`;
      accountLink.href = "#";
      accountLink.setAttribute("aria-haspopup", "menu");
      accountLink.setAttribute("aria-expanded", userDropdownEl && !userDropdownEl.hidden ? "true" : "false");
      accountLink.setAttribute("aria-label", `Abrir menú de cuenta de ${user.name}`);
    } else {
      closeUserDropdown();
    }
  }

  function isMinimized() {
    return sessionStorage.getItem(getMinimizedKey()) === "true";
  }

  function setMinimized(val) {
    sessionStorage.setItem(getMinimizedKey(), val ? "true" : "false");
  }

  function ensureHeaderBadge() {
    const headerActions = document.querySelector(".header-actions");
    if (!headerActions) return null;
    if (!headerBadgeBtn) {
      headerBadgeBtn = document.querySelector("#live-order-header-btn");
    }
    if (!headerBadgeBtn) {
      headerBadgeBtn = document.createElement("button");
      headerBadgeBtn.type = "button";
      headerBadgeBtn.id = "live-order-header-btn";
      headerBadgeBtn.className = "icon-button live-order-pill";
      headerBadgeBtn.hidden = true;
      headerBadgeBtn.addEventListener("click", () => {
        setMinimized(false);
        if (trackerRoot) trackerRoot.hidden = false;
        renderTracker(true);
      });
      headerActions.insertBefore(headerBadgeBtn, headerActions.firstChild);
    }
    return headerBadgeBtn;
  }

  function updateRatingStarsDOM(target, value) {
    if (!trackerRoot) return;
    trackerRoot.querySelectorAll(`[data-rate-target="${target}"]`).forEach(btn => {
      const starVal = Number(btn.dataset.rateValue);
      const isFilled = starVal <= value;
      btn.classList.toggle("is-active", isFilled);
      btn.setAttribute("aria-pressed", String(starVal === value));
      btn.textContent = isFilled ? "★" : "☆";
    });
    const labelEl = trackerRoot.querySelector(`#tracker-rate-label-${target}`);
    if (labelEl) {
      labelEl.textContent = STAR_LABELS[value] || STAR_LABELS[0];
    }
    const errorEl = trackerRoot.querySelector("#tracker-rating-error");
    if (errorEl) {
      errorEl.hidden = true;
    }
  }

  function ensureTrackerDOM() {
    if (trackerRoot) return trackerRoot;
    trackerRoot = document.createElement("aside");
    trackerRoot.id = "order-tracker-popup";
    trackerRoot.className = "order-tracker-popup";
    trackerRoot.setAttribute("role", "region");
    trackerRoot.setAttribute("aria-label", "Estado de tu pedido en tiempo real");
    trackerRoot.setAttribute("aria-live", "polite");
    trackerRoot.hidden = true;
    document.body.appendChild(trackerRoot);

    trackerRoot.addEventListener("click", event => {
      const btn = event.target.closest("button");
      if (!btn) return;

      if (btn.dataset.trackerMinimize !== undefined) {
        setMinimized(!isMinimized());
        renderTracker(true);
        return;
      }

      if (btn.dataset.trackerSelectOrder) {
        selectedOrderId = btn.dataset.trackerSelectOrder;
        renderTracker(true);
        return;
      }

      if (btn.dataset.trackerLocateMe !== undefined) {
        requestUserGeolocation(true);
        return;
      }

      if (btn.dataset.rateTarget && btn.dataset.rateValue) {
        const target = btn.dataset.rateTarget; // "food" | "courier"
        const val = Math.max(1, Math.min(5, Number(btn.dataset.rateValue) || 5));
        const orders = loadActiveOrders();
        const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
        if (activeOrder) {
          if (target === "food") {
            activeOrder.foodRating = val;
          } else if (target === "courier") {
            activeOrder.courierRating = val;
          }
          saveActiveOrders(orders);
          saveOrderToHistory(activeOrder);
          updateRatingStarsDOM(target, val);
        }
        return;
      }

      if (btn.dataset.trackerSubmitRating) {
        const orderId = btn.dataset.trackerSubmitRating;
        const orders = loadActiveOrders();
        const activeOrder = orders.find(o => o.id === orderId) || orders[0];
        if (!activeOrder) return;

        const foodStars = Number(activeOrder.foodRating || 0);
        const courierStars = Number(activeOrder.courierRating || 0);
        if (foodStars < 1 || courierStars < 1) {
          const errorEl = trackerRoot.querySelector("#tracker-rating-error");
          if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = "⚠️ Por favor selecciona las estrellas tanto para tu comida como para el repartidor.";
          }
          return;
        }

        const commentInput = trackerRoot.querySelector("#tracker-rating-comment");
        if (commentInput) {
          activeOrder.ratingComment = commentInput.value.trim();
        }
        activeOrder.ratingSubmitted = true;
        saveActiveOrders(orders);
        saveOrderToHistory(activeOrder);
        renderTracker(true);
        return;
      }

      if (btn.dataset.trackerDismiss) {
        const orderId = btn.dataset.trackerDismiss;
        const orders = loadActiveOrders().filter(o => o.id !== orderId);
        saveActiveOrders(orders);
        if (selectedOrderId === orderId) {
          selectedOrderId = orders[0]?.id || null;
        }
        renderTracker(true);
      }
    });

    return trackerRoot;
  }

  function renderCourierCardHTML(courier, stage) {
    return `
      <div class="tracker-courier-card" aria-label="Datos del repartidor asignado">
        <div class="tracker-courier-avatar" aria-hidden="true">${escapeHTML(courier.avatar || "🛵")}</div>
        <div class="tracker-courier-info">
          <div class="tracker-courier-top">
            <strong>${escapeHTML(courier.name)}</strong>
            <span class="tracker-courier-rating">★ ${escapeHTML(courier.rating)} · ${escapeHTML(courier.deliveries)} entregas</span>
          </div>
          <p class="tracker-courier-vehicle">${escapeHTML(courier.vehicle)} · Placa <strong>${escapeHTML(courier.plate)}</strong></p>
          <div class="tracker-courier-meta">
            <span class="tracker-courier-status" id="tracker-courier-status">🛵 ${escapeHTML(stage.courierStatus)}</span>
            <span class="tracker-courier-phone">📞 ${escapeHTML(courier.phone)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function buildStarButtonsHTML(target, currentRating, groupLabel) {
    const val = Number(currentRating || 0);
    const stars = [1, 2, 3, 4, 5].map(n => {
      const isFilled = n <= val;
      return `
        <button
          type="button"
          class="tracker-star-btn ${isFilled ? "is-active" : ""}"
          data-rate-target="${escapeHTML(target)}"
          data-rate-value="${n}"
          aria-label="Calificar ${escapeHTML(groupLabel)} con ${n} de 5 estrellas"
          aria-pressed="${val === n}"
        >${isFilled ? "★" : "☆"}</button>
      `;
    }).join("");

    return `
      <div class="tracker-star-row" role="group" aria-label="Calificación de ${escapeHTML(groupLabel)}">
        ${stars}
      </div>
      <span class="tracker-rate-caption" id="tracker-rate-label-${escapeHTML(target)}">${escapeHTML(STAR_LABELS[val] || STAR_LABELS[0])}</span>
    `;
  }

  function updateTrackerDynamicContent(activeOrder, stageIdx) {
    const stage = ORDER_STAGES[stageIdx];
    const heroIcon = trackerRoot?.querySelector("#tracker-hero-icon");
    const etaPill = trackerRoot?.querySelector("#tracker-eta-pill");
    const heroTitle = trackerRoot?.querySelector("#tracker-hero-title");
    const heroSubtitle = trackerRoot?.querySelector("#tracker-hero-subtitle");
    const progressFill = trackerRoot?.querySelector("#tracker-progress-fill");
    const courierStatus = trackerRoot?.querySelector("#tracker-courier-status");

    if (heroIcon) heroIcon.textContent = stage.icon;
    if (etaPill) etaPill.textContent = stage.eta;
    if (heroTitle) heroTitle.textContent = stage.title;
    if (heroSubtitle) heroSubtitle.textContent = stage.subtitle;
    if (progressFill) progressFill.style.width = `${stage.progress}%`;
    if (courierStatus) courierStatus.textContent = `🛵 ${stage.courierStatus}`;

    trackerRoot?.querySelectorAll("[data-step-idx]").forEach(li => {
      const idx = Number(li.dataset.stepIdx);
      li.className = `tracker-step ${idx < stageIdx ? "is-done" : idx === stageIdx ? "is-current" : "is-pending"}`;
      const circle = li.querySelector(".tracker-step-circle");
      if (circle) {
        circle.textContent = idx < stageIdx ? "✓" : ORDER_STAGES[idx].icon;
      }
    });

    updateLiveMapPositions(false);
  }

  function renderTracker(forceRebuild = false) {
    decorateAccountNavButton();
    const user = getCurrentUser();
    const badge = ensureHeaderBadge();
    const root = ensureTrackerDOM();

    if (!user) {
      root.hidden = true;
      if (badge) badge.hidden = true;
      destroyMapInstance();
      renderedSignature = "";
      return;
    }

    const orders = loadActiveOrders();
    if (orders.length === 0) {
      root.hidden = true;
      if (badge) badge.hidden = true;
      destroyMapInstance();
      renderedSignature = "";
      return;
    }

    if (!selectedOrderId || !orders.some(o => o.id === selectedOrderId)) {
      selectedOrderId = orders[0].id;
    }

    const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
    const stageIdx = computeStageIndex(activeOrder);
    const stage = ORDER_STAGES[stageIdx];
    const isArrived = stage.key === "arrived";
    const courier = getOrderCourier(activeOrder);
    const minimized = isMinimized();

    if (badge) {
      badge.hidden = false;
      badge.innerHTML = `<span class="live-pulse-dot" aria-hidden="true"></span><span>${escapeHTML(stage.icon)} ${escapeHTML(stage.shortLabel)}</span>`;
      badge.title = "Ver seguimiento del pedido en vivo";
    }

    root.hidden = false;
    root.classList.toggle("is-minimized", minimized);

    const viewMode = isArrived ? (activeOrder.ratingSubmitted ? "rated" : "rating") : "tracking";
    const nextSignature = `${activeOrder.id}_${minimized}_${orders.length}_${viewMode}`;
    if (!forceRebuild && renderedSignature === nextSignature && !minimized && viewMode === "tracking") {
      updateTrackerDynamicContent(activeOrder, stageIdx);
      return;
    }
    if (!forceRebuild && renderedSignature === nextSignature && !minimized && viewMode !== "tracking") {
      return;
    }

    renderedSignature = nextSignature;

    const itemsSummary = (activeOrder.items || [])
      .map(item => `${item.quantity}x ${item.name}`)
      .join(", ");

    const orderTabsHTML = orders.length > 1
      ? `<div class="tracker-order-tabs" role="tablist" aria-label="Pedidos activos">
          ${orders.map((ord, idx) => {
            const st = ORDER_STAGES[computeStageIndex(ord)];
            const isSelected = ord.id === activeOrder.id;
            return `<button type="button" class="tracker-order-tab" role="tab" aria-selected="${isSelected}" data-tracker-select-order="${escapeHTML(ord.id)}">
              ${escapeHTML(st.icon)} Pedido #${escapeHTML(ord.shortCode || (orders.length - idx))}
            </button>`;
          }).join("")}
        </div>`
      : "";

    if (minimized) {
      destroyMapInstance();
      root.innerHTML = `
        <div class="tracker-minimized-bar">
          <button type="button" class="tracker-minimized-main" data-tracker-minimize="toggle" aria-label="Expandir ventana de estado del pedido">
            <span class="tracker-stage-badge">${escapeHTML(stage.icon)}</span>
            <span class="tracker-minimized-copy">
              <strong>Pedido #${escapeHTML(activeOrder.shortCode)} · ${escapeHTML(stage.shortLabel)}</strong>
              <small>${escapeHTML(isArrived && !activeOrder.ratingSubmitted ? "⭐ Toca para calificar tu pedido" : stage.eta)}</small>
            </span>
          </button>
          <button type="button" class="tracker-icon-btn" data-tracker-minimize="toggle" aria-label="Expandir seguimiento" title="Expandir">▢</button>
        </div>
      `;
      return;
    }

    // Si el pedido ya llegó (stage === "arrived"), cambiar a la vista de calificación por estrellas
    if (isArrived) {
      destroyMapInstance();

      const ratingContentHTML = activeOrder.ratingSubmitted
        ? `
          <div class="tracker-rating-thanks">
            <div class="tracker-thanks-icon" aria-hidden="true">🌟</div>
            <h4>¡Gracias por calificar tu pedido!</h4>
            <p>Tu opinión ayuda a mejorar la calidad de los restaurantes y repartidores en Saborcito.</p>
            <div class="tracker-thanks-summary">
              <div>
                <span>🍽️ Comida:</span>
                <strong>${"★".repeat(Number(activeOrder.foodRating || 5))}${"☆".repeat(5 - Number(activeOrder.foodRating || 5))}</strong>
              </div>
              <div>
                <span>🛵 Repartidor (${escapeHTML(courier.name)}):</span>
                <strong>${"★".repeat(Number(activeOrder.courierRating || 5))}${"☆".repeat(5 - Number(activeOrder.courierRating || 5))}</strong>
              </div>
              ${activeOrder.ratingComment ? `<p class="tracker-thanks-comment">“${escapeHTML(activeOrder.ratingComment)}”</p>` : ""}
            </div>
            <button type="button" class="primary-button tracker-finish-btn" data-tracker-dismiss="${escapeHTML(activeOrder.id)}">
              Finalizar y cerrar
            </button>
          </div>
        `
        : `
          <div class="tracker-rating-panel">
            <div class="tracker-rating-block">
              <div class="tracker-rating-header">
                <span class="tracker-rating-emoji" aria-hidden="true">🍽️</span>
                <div>
                  <h4>¿Qué tal estuvo tu comida?</h4>
                  <p>${escapeHTML(itemsSummary || "Platillos de tu pedido")}</p>
                </div>
              </div>
              ${buildStarButtonsHTML("food", activeOrder.foodRating, "la comida")}
            </div>

            <div class="tracker-rating-block">
              <div class="tracker-rating-header">
                <span class="tracker-rating-emoji" aria-hidden="true">${escapeHTML(courier.avatar || "🛵")}</span>
                <div>
                  <h4>Califica a tu repartidor: ${escapeHTML(courier.name)}</h4>
                  <p>${escapeHTML(courier.vehicle)} · Placa ${escapeHTML(courier.plate)}</p>
                </div>
              </div>
              ${buildStarButtonsHTML("courier", activeOrder.courierRating, "el repartidor")}
            </div>

            <label class="tracker-rating-comment-label" for="tracker-rating-comment">
              Comentario adicional (opcional)
              <input
                type="text"
                id="tracker-rating-comment"
                class="tracker-rating-input"
                placeholder="Ej. Llegó calientito y muy puntual..."
                value="${escapeHTML(activeOrder.ratingComment || "")}"
              >
            </label>

            <p class="tracker-rating-error" id="tracker-rating-error" hidden></p>

            <button type="button" class="primary-button tracker-submit-rating-btn" data-tracker-submit-rating="${escapeHTML(activeOrder.id)}">
              Enviar calificación ⭐
            </button>
          </div>
        `;

      root.innerHTML = `
        <div class="tracker-header">
          <div class="tracker-header-title">
            <span class="live-pulse-dot" aria-hidden="true"></span>
            <span>Pedido entregado · <strong>#${escapeHTML(activeOrder.shortCode)}</strong></span>
          </div>
          <div class="tracker-header-actions">
            <button type="button" class="tracker-icon-btn" data-tracker-minimize="toggle" aria-label="Minimizar ventana de seguimiento" title="Minimizar">−</button>
            <button type="button" class="tracker-icon-btn" data-tracker-dismiss="${escapeHTML(activeOrder.id)}" aria-label="Cerrar seguimiento de este pedido" title="Cerrar pedido">×</button>
          </div>
        </div>

        ${orderTabsHTML}

        <div class="tracker-body">
          <div class="tracker-hero tracker-hero-arrived">
            <div class="tracker-hero-icon" id="tracker-hero-icon" aria-hidden="true">${escapeHTML(stage.icon)}</div>
            <div class="tracker-hero-copy">
              <span class="tracker-eta-pill tracker-eta-arrived" id="tracker-eta-pill">${escapeHTML(stage.eta)}</span>
              <h3 id="tracker-hero-title">${escapeHTML(stage.title)}</h3>
              <p id="tracker-hero-subtitle">${escapeHTML(stage.subtitle)}</p>
            </div>
          </div>

          ${ratingContentHTML}

          ${renderCourierCardHTML(courier, stage)}

          <div class="tracker-details">
            <div class="tracker-detail-row">
              <span>📍 Entregado en:</span>
              <strong>${escapeHTML(activeOrder.address || "Dirección de entrega")}</strong>
            </div>
            <div class="tracker-detail-row">
              <span>💳 Pago (${escapeHTML(activeOrder.paymentLabel || "Tarjeta")}):</span>
              <strong>$${Number(activeOrder.total || 0).toFixed(2)}</strong>
            </div>
            <div class="tracker-detail-row tracker-items-line">
              <span>🍽️ Productos:</span>
              <span title="${escapeHTML(itemsSummary)}">${escapeHTML(itemsSummary)}</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Vista normal de seguimiento en vivo (Pasos 1 a 3)
    root.innerHTML = `
      <div class="tracker-header">
        <div class="tracker-header-title">
          <span class="live-pulse-dot" aria-hidden="true"></span>
          <span>Seguimiento en vivo · <strong>#${escapeHTML(activeOrder.shortCode)}</strong></span>
        </div>
        <div class="tracker-header-actions">
          <button type="button" class="tracker-icon-btn" data-tracker-minimize="toggle" aria-label="Minimizar ventana de seguimiento" title="Minimizar (seguir explorando)">−</button>
          <button type="button" class="tracker-icon-btn" data-tracker-dismiss="${escapeHTML(activeOrder.id)}" aria-label="Cerrar seguimiento de este pedido" title="Cerrar pedido">×</button>
        </div>
      </div>

      ${orderTabsHTML}

      <div class="tracker-body">
        <div class="tracker-hero">
          <div class="tracker-hero-icon" id="tracker-hero-icon" aria-hidden="true">${escapeHTML(stage.icon)}</div>
          <div class="tracker-hero-copy">
            <span class="tracker-eta-pill" id="tracker-eta-pill">${escapeHTML(stage.eta)}</span>
            <h3 id="tracker-hero-title">${escapeHTML(stage.title)}</h3>
            <p id="tracker-hero-subtitle">${escapeHTML(stage.subtitle)}</p>
          </div>
        </div>

        <div class="tracker-progress-track" aria-hidden="true">
          <div class="tracker-progress-fill" id="tracker-progress-fill" style="width: ${stage.progress}%"></div>
        </div>

        <ol class="tracker-steps" aria-label="Etapas del pedido">
          ${ORDER_STAGES.map((st, idx) => {
            const stateClass = idx < stageIdx ? "is-done" : idx === stageIdx ? "is-current" : "is-pending";
            return `
              <li class="tracker-step ${stateClass}" data-step-idx="${idx}">
                <div class="tracker-step-btn">
                  <span class="tracker-step-circle" aria-hidden="true">${idx < stageIdx ? "✓" : escapeHTML(st.icon)}</span>
                  <span class="tracker-step-label">${escapeHTML(st.shortLabel)}</span>
                </div>
              </li>
            `;
          }).join("")}
        </ol>

        <!-- Datos del repartidor asignado -->
        ${renderCourierCardHTML(courier, stage)}

        <!-- Mini-mapa en vivo con ubicación actual -->
        <div class="tracker-map-wrapper">
          <div class="tracker-map-topbar">
            <span id="tracker-gps-status">📍 ${userCoords.isRealGps ? `Tu ubicación actual (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)})` : "Tu ubicación en el mapa"}</span>
            <button type="button" class="tracker-gps-btn" data-tracker-locate-me="true" title="Actualizar con mi GPS actual">Mi GPS 🎯</button>
          </div>
          <div class="tracker-live-map" id="tracker-live-map" aria-label="Mapa de ubicación actual y ruta del pedido"></div>
        </div>

        <div class="tracker-details">
          <div class="tracker-detail-row">
            <span>📍 Entrega en:</span>
            <strong>${escapeHTML(activeOrder.address || "Dirección de entrega")}</strong>
          </div>
          <div class="tracker-detail-row">
            <span>💳 Pago (${escapeHTML(activeOrder.paymentLabel || "Tarjeta")}):</span>
            <strong>$${Number(activeOrder.total || 0).toFixed(2)}</strong>
          </div>
          <div class="tracker-detail-row tracker-items-line">
            <span>🍽️ Productos:</span>
            <span title="${escapeHTML(itemsSummary)}">${escapeHTML(itemsSummary)}</span>
          </div>
        </div>

        <div class="tracker-footer">
          <span class="tracker-nonblocking-hint">✨ Desliza hacia abajo para ver más detalles · Puedes seguir explorando</span>
        </div>
      </div>
    `;

    initLiveMap();
  }

  function createActiveOrder(orderData) {
    const orders = loadActiveOrders();
    const shortCode = String(Math.floor(1000 + Math.random() * 9000));
    const seed = Number(shortCode) || 0;
    const courier = COURIER_PROFILES[seed % COURIER_PROFILES.length];
    const newOrder = {
      id: `ord_${Date.now()}_${shortCode}`,
      shortCode,
      createdAt: Date.now(),
      manualStage: 0,
      address: orderData.address || localStorage.getItem("saborcito_delivery_address") || "Dirección de entrega",
      paymentMethod: orderData.paymentMethod || "card",
      paymentLabel: orderData.paymentLabel || "Tarjeta",
      total: Number(orderData.total || 0),
      items: Array.isArray(orderData.items) ? orderData.items : [],
      courier,
      foodRating: 0,
      courierRating: 0,
      ratingComment: "",
      ratingSubmitted: false
    };
    orders.unshift(newOrder);
    saveActiveOrders(orders.slice(0, 5));
    saveOrderToHistory(newOrder);
    selectedOrderId = newOrder.id;
    setMinimized(false);
    renderTracker(true);
    return newOrder;
  }

  function startTicker() {
    if (tickTimer) window.clearInterval(tickTimer);
    tickTimer = window.setInterval(() => {
      const orders = loadActiveOrders();
      if (orders.length > 0) {
        renderTracker(false);
      }
    }, 2500);
  }

  /* ==========================================================================
     Modal Emergente de Detalles del Plato (Agregar al carro / Cancelar)
     ========================================================================== */
  let dishModalBackdropEl = null;
  let activeModalDish = null;
  let activeModalQty = 1;
  let onAddToCartCallback = null;

  function ensureDishModalDOM() {
    if (dishModalBackdropEl) return dishModalBackdropEl;
    dishModalBackdropEl = document.createElement("div");
    dishModalBackdropEl.id = "dish-detail-modal-backdrop";
    dishModalBackdropEl.className = "dish-modal-backdrop";
    dishModalBackdropEl.hidden = true;
    document.body.appendChild(dishModalBackdropEl);

    dishModalBackdropEl.addEventListener("click", event => {
      if (event.target === dishModalBackdropEl) {
        closeDishModal();
        return;
      }
      const btn = event.target.closest("button");
      if (!btn) return;

      if (btn.dataset.dishModalClose !== undefined) {
        closeDishModal();
        return;
      }

      if (btn.dataset.dishModalQtyDelta) {
        const delta = Number(btn.dataset.dishModalQtyDelta) || 0;
        activeModalQty = Math.max(1, Math.min(20, activeModalQty + delta));
        const valEl = dishModalBackdropEl.querySelector("#dish-modal-qty-val");
        if (valEl) valEl.textContent = activeModalQty;
        const confirmBtn = dishModalBackdropEl.querySelector("#dish-modal-confirm-btn");
        if (confirmBtn && activeModalDish) {
          const subtotal = (Number(activeModalDish.price) || 0) * activeModalQty;
          confirmBtn.textContent = `Añadir al carrito · $${subtotal.toFixed(2)}`;
        }
        return;
      }

      if (btn.dataset.dishModalConfirm !== undefined) {
        if (!activeModalDish) return;
        const dishToAdd = { ...activeModalDish };
        const qtyToAdd = activeModalQty;
        closeDishModal();
        if (typeof onAddToCartCallback === "function") {
          onAddToCartCallback(dishToAdd, qtyToAdd);
        }
      }
    });

    return dishModalBackdropEl;
  }

  function openDishModal(dish, restaurant = null, onConfirm = null) {
    if (!dish) return;
    ensureDishModalDOM();
    activeModalDish = dish;
    activeModalQty = 1;
    onAddToCartCallback = onConfirm;

    const restName = restaurant?.name || dish.restaurantName || "Saborcito";
    const restIcon = restaurant?.icon || dish.restaurantIcon || "🍽️";
    const numPrice = Number(dish.price) || 0;
    const oldPrice = dish.originalPrice || dish.oldPrice || (numPrice * 1.35);
    const hasDiscount = Boolean(dish.isPromotion || dish.badge || numPrice < oldPrice);
    const badgeText = dish.badge || (hasDiscount ? "🔥 OFERTA" : "");

    let dishModalImg = "";
    if (typeof window.getMatchingDishImage === "function") {
      dishModalImg = window.getMatchingDishImage(dish.name, dish.id);
    }
    if (!dishModalImg && dish.image) {
      dishModalImg = dish.image;
    }

    dishModalBackdropEl.innerHTML = `
      <div class="dish-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="dish-modal-title">
        <div class="dish-modal-header">
          ${dishModalImg
            ? `<img src="${escapeHTML(dishModalImg)}" alt="${escapeHTML(dish.name)}" loading="lazy" onerror="this.onerror=null; this.src='Imagenes/plato_papas_fritas.jpg';">`
            : `<div class="dish-modal-placeholder" aria-hidden="true">${escapeHTML(restIcon)}</div>`}
          ${badgeText ? `<span class="promo-badge-pill dish-modal-badge">${escapeHTML(badgeText)}</span>` : ""}
          <button type="button" class="dish-modal-close" data-dish-modal-close="true" aria-label="Cerrar detalles del plato">×</button>
        </div>

        <div class="dish-modal-body">
          <span class="offer-tag dish-modal-restaurant-tag">${escapeHTML(restIcon)} ${escapeHTML(restName)}</span>
          <h3 class="dish-modal-title" id="dish-modal-title">${escapeHTML(dish.name)}</h3>
          <p class="dish-modal-desc">${escapeHTML(dish.description || "Delicioso platillo preparado al momento con los mejores ingredientes.")}</p>

          <div class="dish-modal-pricing-box">
            <div class="dish-modal-pricing-left">
              ${hasDiscount ? `<span class="dish-modal-old-price">$${Number(oldPrice).toFixed(2)}</span>` : ""}
              <strong class="dish-modal-price">$${numPrice.toFixed(2)}</strong>
            </div>

            <div class="dish-modal-qty-control" role="group" aria-label="Cantidad a ordenar">
              <button type="button" class="dish-modal-qty-btn" data-dish-modal-qty-delta="-1" aria-label="Disminuir cantidad">−</button>
              <span class="dish-modal-qty-val" id="dish-modal-qty-val">1</span>
              <button type="button" class="dish-modal-qty-btn" data-dish-modal-qty-delta="1" aria-label="Aumentar cantidad">+</button>
            </div>
          </div>
        </div>

        <div class="dish-modal-footer">
          <button type="button" class="dish-modal-cancel-btn" data-dish-modal-close="true">Cancelar</button>
          <button type="button" class="primary-button dish-modal-confirm-btn" id="dish-modal-confirm-btn" data-dish-modal-confirm="true">
            Añadir al carrito · $${numPrice.toFixed(2)}
          </button>
        </div>
      </div>
    `;

    dishModalBackdropEl.hidden = false;
  }

  function closeDishModal() {
    activeModalDish = null;
    activeModalQty = 1;
    if (dishModalBackdropEl) {
      dishModalBackdropEl.hidden = true;
    }
  }

  /* ==========================================================================
     Modal Emergente de Advertencia para Eliminar Plato del Carrito (cantidad 1)
     ========================================================================== */
  let removeConfirmBackdropEl = null;
  let onRemoveConfirmCallback = null;

  function ensureRemoveConfirmDOM() {
    if (removeConfirmBackdropEl) return removeConfirmBackdropEl;

    removeConfirmBackdropEl = document.createElement("div");
    removeConfirmBackdropEl.id = "remove-confirm-modal-backdrop";
    removeConfirmBackdropEl.className = "remove-confirm-backdrop";
    removeConfirmBackdropEl.hidden = true;
    document.body.appendChild(removeConfirmBackdropEl);

    removeConfirmBackdropEl.addEventListener("click", event => {
      if (event.target === removeConfirmBackdropEl) {
        closeRemoveConfirmModal();
        return;
      }
      const btn = event.target.closest("button");
      if (!btn) return;

      if (btn.dataset.removeConfirmClose !== undefined) {
        closeRemoveConfirmModal();
        return;
      }

      if (btn.dataset.removeConfirmDelete !== undefined) {
        const cb = onRemoveConfirmCallback;
        closeRemoveConfirmModal();
        if (typeof cb === "function") cb();
      }
    });

    return removeConfirmBackdropEl;
  }

  function confirmRemoveDish(dishName, onConfirm) {
    ensureRemoveConfirmDOM();
    onRemoveConfirmCallback = onConfirm;

    removeConfirmBackdropEl.innerHTML = `
      <div class="remove-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-confirm-title" aria-describedby="remove-confirm-desc">
        <button type="button" class="remove-confirm-close" data-remove-confirm-close="true" aria-label="Cerrar advertencia">×</button>
        <div class="remove-confirm-icon-wrap" aria-hidden="true">
          <span class="remove-confirm-icon">⚠️</span>
        </div>
        <div class="remove-confirm-content">
          <h3 class="remove-confirm-title" id="remove-confirm-title">¿Eliminar producto?</h3>
          <p class="remove-confirm-desc" id="remove-confirm-desc">
            Solo queda 1 unidad de <strong>${escapeHTML(dishName || "este producto")}</strong> en tu pedido. ¿Deseas eliminarlo del carrito?
          </p>
        </div>
        <div class="remove-confirm-actions">
          <button type="button" class="remove-confirm-btn-cancel" data-remove-confirm-close="true">
            Cancelar
          </button>
          <button type="button" class="remove-confirm-btn-delete" data-remove-confirm-delete="true">
            Sí, eliminar
          </button>
        </div>
      </div>
    `;

    removeConfirmBackdropEl.hidden = false;
  }

  function closeRemoveConfirmModal() {
    onRemoveConfirmCallback = null;
    if (removeConfirmBackdropEl) {
      removeConfirmBackdropEl.hidden = true;
    }
  }

  function setupGlobalUserMenuListeners() {
    ensureUserMenuDOM();
    decorateAccountNavButton();

    document.addEventListener("click", event => {
      const accountLink = event.target.closest("#account-link");
      if (accountLink) {
        const user = getCurrentUser();
        if (user) {
          event.preventDefault();
          event.stopImmediatePropagation();
          toggleUserDropdown(event);
        }
        return;
      }

      if (userDropdownEl && !userDropdownEl.hidden && !event.target.closest("#user-account-dropdown")) {
        closeUserDropdown();
      }
    }, true);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        if (userDropdownEl && !userDropdownEl.hidden) {
          closeUserDropdown();
        }
        if (userModalBackdropEl && !userModalBackdropEl.hidden) {
          closeUserModal();
        }
        if (dishModalBackdropEl && !dishModalBackdropEl.hidden) {
          closeDishModal();
        }
        if (removeConfirmBackdropEl && !removeConfirmBackdropEl.hidden) {
          closeRemoveConfirmModal();
        }
      }
    });
  }

  window.SaborcitoOrderTracker = {
    createActiveOrder,
    renderTracker,
    loadActiveOrders,
    loadPurchaseHistory,
    loadSavedCards,
    registerNewCard,
    toggleUserDropdown,
    openUserModal,
    openDishModal,
    closeDishModal,
    confirmRemoveDish,
    closeRemoveConfirmModal
  };

  function removeBannerLabels() {
    document.querySelectorAll(".restaurant-banner-label, #restaurant-banner-label").forEach(el => el.remove());
    const b = document.querySelector("#restaurant-banner");
    if (b) {
      Array.from(b.childNodes).forEach(c => { if (c.nodeType !== 1 || c.tagName !== "IMG") c.remove(); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      removeBannerLabels();
      setupGlobalUserMenuListeners();
      renderTracker(true);
      startTicker();
    });
  } else {
    removeBannerLabels();
    setupGlobalUserMenuListeners();
    renderTracker(true);
    startTicker();
  }

  window.addEventListener("pageshow", () => {
    removeBannerLabels();
    decorateAccountNavButton();
    renderTracker(true);
  });
  window.addEventListener("storage", () => {
    removeBannerLabels();
    decorateAccountNavButton();
    renderTracker(false);
  });
})();
