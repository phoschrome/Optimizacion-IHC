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
      address: orderData.address || "Av. Siempre Viva 742",
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
