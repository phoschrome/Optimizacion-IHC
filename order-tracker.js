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
      progress: 25,
      routeRatio: 0.05
    },
    {
      key: "ready",
      shortLabel: "Listo para recoger",
      title: "Listo para ser recogido",
      subtitle: "El restaurante empacó tu pedido y espera al repartidor.",
      icon: "🛍️",
      eta: "Llegada estimada: 12–15 min",
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
      progress: 78,
      routeRatio: 0.65
    },
    {
      key: "arrived",
      shortLabel: "¡Ya llegó!",
      title: "¡Tu pedido ya llegó!",
      subtitle: "El repartidor está en tu ubicación. ¡Que disfrutes tu comida!",
      icon: "🎉",
      eta: "Entregado ahora",
      progress: 100,
      routeRatio: 1.0
    }
  ];

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
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

  // Estado del mapa interactivo (Leaflet + OpenStreetMap + Geolocation API)
  let leafletReadyPromise = null;
  let mapInstance = null;
  let userMarker = null;
  let restaurantMarker = null;
  let courierMarker = null;
  let routeLine = null;
  let userCoords = loadSavedCoords();
  let geoRequested = false;

  function loadSavedCoords() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(USER_COORDS_STORAGE_KEY) || "null");
      if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lng)) {
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
        userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
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
        if (lbl) lbl.textContent = "📍 Ubicación estimada en el mapa";
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

    mapInstance = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false
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
      .bindTooltip("Tu pedido", { direction: "top" });

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

  function updateTrackerDynamicContent(activeOrder, stageIdx) {
    const stage = ORDER_STAGES[stageIdx];
    const heroIcon = trackerRoot?.querySelector("#tracker-hero-icon");
    const etaPill = trackerRoot?.querySelector("#tracker-eta-pill");
    const heroTitle = trackerRoot?.querySelector("#tracker-hero-title");
    const heroSubtitle = trackerRoot?.querySelector("#tracker-hero-subtitle");
    const progressFill = trackerRoot?.querySelector("#tracker-progress-fill");

    if (heroIcon) heroIcon.textContent = stage.icon;
    if (etaPill) etaPill.textContent = stage.eta;
    if (heroTitle) heroTitle.textContent = stage.title;
    if (heroSubtitle) heroSubtitle.textContent = stage.subtitle;
    if (progressFill) progressFill.style.width = `${stage.progress}%`;

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
    const minimized = isMinimized();

    if (badge) {
      badge.hidden = false;
      badge.innerHTML = `<span class="live-pulse-dot" aria-hidden="true"></span><span>${escapeHTML(stage.icon)} ${escapeHTML(stage.shortLabel)}</span>`;
      badge.title = "Ver seguimiento del pedido en vivo";
    }

    root.hidden = false;
    root.classList.toggle("is-minimized", minimized);

    const nextSignature = `${activeOrder.id}_${minimized}_${orders.length}`;
    if (!forceRebuild && renderedSignature === nextSignature && !minimized) {
      updateTrackerDynamicContent(activeOrder, stageIdx);
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
              <small>${escapeHTML(stage.eta)}</small>
            </span>
          </button>
          <button type="button" class="tracker-icon-btn" data-tracker-minimize="toggle" aria-label="Expandir seguimiento" title="Expandir">▢</button>
        </div>
      `;
      return;
    }

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
            <strong>${escapeHTML(activeOrder.address || "Av. Siempre Viva 742")}</strong>
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
          <span class="tracker-nonblocking-hint">✨ Puedes seguir explorando o hacer otro pedido mientras tanto.</span>
        </div>
      </div>
    `;

    initLiveMap();
  }

  function createActiveOrder(orderData) {
    const orders = loadActiveOrders();
    const shortCode = String(Math.floor(1000 + Math.random() * 9000));
    const newOrder = {
      id: `ord_${Date.now()}_${shortCode}`,
      shortCode,
      createdAt: Date.now(),
      manualStage: 0,
      address: orderData.address || "Av. Siempre Viva 742",
      paymentMethod: orderData.paymentMethod || "card",
      paymentLabel: orderData.paymentLabel || "Tarjeta",
      total: Number(orderData.total || 0),
      items: Array.isArray(orderData.items) ? orderData.items : []
    };
    orders.unshift(newOrder);
    saveActiveOrders(orders.slice(0, 5));
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

  window.SaborcitoOrderTracker = {
    createActiveOrder,
    renderTracker,
    loadActiveOrders
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderTracker(true);
      startTicker();
    });
  } else {
    renderTracker(true);
    startTicker();
  }

  window.addEventListener("pageshow", () => renderTracker(true));
  window.addEventListener("storage", () => renderTracker(false));
})();
