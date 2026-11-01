/**
 * Saborcito — Selector de Dirección con Ubicación Actual y Mapa Interactivo Leaflet
 */
(function() {
  const ADDRESS_STORAGE_KEY = "saborcito_delivery_address";
  const COORDS_STORAGE_KEY = "saborcito_delivery_coords";
  const DEFAULT_COORDS = { lat: 4.6534, lon: -74.0836 }; // Bogotá central por defecto

  let modalBackdrop = null;
  let leafletMap = null;
  let leafletMarker = null;
  let activeCallback = null;
  let currentCoords = { ...DEFAULT_COORDS };
  let reverseGeocodeTimer = null;

  function getCleanSavedAddress() {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return "";
    const trimmed = raw.trim();
    if (trimmed === "Av. Siempre Viva 742" || trimmed === "") {
      return "";
    }
    return trimmed;
  }

  function setSavedAddress(address, coords = null) {
    const clean = (address || "").trim();
    if (clean) {
      localStorage.setItem(ADDRESS_STORAGE_KEY, clean);
      if (coords && coords.lat && coords.lon) {
        localStorage.setItem(COORDS_STORAGE_KEY, JSON.stringify({ lat: coords.lat, lon: coords.lon }));
      }
    } else {
      localStorage.removeItem(ADDRESS_STORAGE_KEY);
      localStorage.removeItem(COORDS_STORAGE_KEY);
    }
    syncGlobalAddressUI();
    window.dispatchEvent(new CustomEvent("saborcito:address-updated", {
      detail: { address: clean, coords }
    }));
  }

  function syncGlobalAddressUI() {
    const saved = getCleanSavedAddress();
    const addressEl = document.querySelector("#address");
    const addressBtn = document.querySelector("#address-button");

    if (addressEl) {
      if (saved) {
        addressEl.textContent = saved;
        addressEl.classList.remove("address-empty");
      } else {
        addressEl.textContent = "Indica tu dirección de entrega";
        addressEl.classList.add("address-empty");
      }
    }

    if (addressBtn) {
      if (saved) {
        addressBtn.textContent = "Cambiar dirección";
        addressBtn.classList.remove("address-btn-prompt");
      } else {
        addressBtn.textContent = "Ingresar dirección";
        addressBtn.classList.add("address-btn-prompt");
      }
    }

    const deliveryInput = document.querySelector("#delivery-address");
    if (deliveryInput) {
      deliveryInput.value = saved;
      deliveryInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function loadLeaflet(callback) {
    if (window.L) {
      callback();
      return;
    }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="leaflet"]')) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => callback();
      script.onerror = () => {
        console.error("Error al cargar Leaflet desde CDN.");
        callback(new Error("Leaflet CDN load failed"));
      };
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.L) {
          clearInterval(checkInterval);
          callback();
        }
      }, 60);
    }
  }

  function ensureModalDOM() {
    if (modalBackdrop) return;

    modalBackdrop = document.createElement("div");
    modalBackdrop.className = "address-modal-backdrop";
    modalBackdrop.id = "address-modal-backdrop";
    modalBackdrop.hidden = true;

    modalBackdrop.innerHTML = `
      <div class="address-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
        
        <!-- VISTA 1: Opciones iniciales (Ubicación actual vs Otra dirección / Mapa) -->
        <div class="address-modal-view" id="address-choice-view">
          <div class="address-modal-header">
            <h2 id="address-modal-title">📍 Dirección de entrega</h2>
            <button type="button" class="address-modal-close" data-address-close="true" aria-label="Cerrar ventana">×</button>
          </div>
          <p class="address-modal-sub">¿Cómo prefieres indicar a dónde llevamos tu pedido?</p>
          
          <div class="address-options-list">
            <button type="button" class="address-option-card" id="btn-use-current-location">
              <span class="address-option-icon" aria-hidden="true">📍</span>
              <div class="address-option-copy">
                <strong>Usar mi ubicación actual</strong>
                <small>Detectar automáticamente mediante el GPS de tu dispositivo</small>
              </div>
              <span class="address-option-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" class="address-option-card" id="btn-choose-on-map">
              <span class="address-option-icon" aria-hidden="true">🗺️</span>
              <div class="address-option-copy">
                <strong>Ingresar otra dirección o fijar en el mapa</strong>
                <small>Escribe tu calle o mueve el marcador para indicar el punto exacto</small>
              </div>
              <span class="address-option-arrow" aria-hidden="true">→</span>
            </button>
          </div>

          <div class="address-modal-status" id="address-choice-status" role="status" hidden></div>
        </div>

        <!-- VISTA 2: Mapa interactivo con marcador Leaflet -->
        <div class="address-modal-view" id="address-map-view" hidden>
          <div class="address-modal-header">
            <button type="button" class="address-modal-back" id="btn-map-back" aria-label="Volver a las opciones">← Volver</button>
            <h2 class="address-modal-title-map">Fijar punto de entrega</h2>
            <button type="button" class="address-modal-close" data-address-close="true" aria-label="Cerrar ventana">×</button>
          </div>

          <div class="address-map-search-bar">
            <div class="address-input-wrapper">
              <span class="address-input-icon" aria-hidden="true">📍</span>
              <input type="text" id="address-map-input" placeholder="Escribe tu calle, número o busca aquí..." autocomplete="off">
              <button type="button" id="btn-search-address-map" class="address-search-btn" title="Buscar en mapa">Buscar</button>
            </div>
          </div>

          <div class="address-map-wrapper">
            <div id="saborcito-map-canvas" class="address-map-canvas"></div>
            <div class="address-map-hint">
              <span>👆 Haz clic o arrastra el marcador 📍 para afinar la ubicación exacta</span>
            </div>
          </div>

          <div class="address-extra-fields">
            <input type="text" id="address-map-reference" placeholder="Apto, interior, piso o referencia adicional (opcional)">
          </div>

          <div class="address-modal-status" id="address-map-status" role="status" hidden></div>

          <div class="address-modal-footer">
            <button type="button" class="address-modal-cancel" data-address-close="true">Cancelar</button>
            <button type="button" class="primary-button address-modal-confirm" id="btn-confirm-address">Confirmar esta dirección</button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modalBackdrop);

    // Eventos de cierre y navegación
    modalBackdrop.addEventListener("click", event => {
      if (event.target === modalBackdrop || event.target.closest("[data-address-close]")) {
        closeModal();
      }
    });

    modalBackdrop.querySelector("#btn-map-back").addEventListener("click", () => {
      showChoiceView();
    });

    modalBackdrop.querySelector("#btn-use-current-location").addEventListener("click", () => {
      handleUseCurrentLocation();
    });

    modalBackdrop.querySelector("#btn-choose-on-map").addEventListener("click", () => {
      openMapView();
    });

    modalBackdrop.querySelector("#btn-confirm-address").addEventListener("click", () => {
      handleConfirmAddress();
    });

    modalBackdrop.querySelector("#btn-search-address-map").addEventListener("click", () => {
      handleForwardSearch();
    });

    modalBackdrop.querySelector("#address-map-input").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleForwardSearch();
      }
    });
  }

  function showChoiceView() {
    ensureModalDOM();
    modalBackdrop.querySelector("#address-choice-view").hidden = false;
    modalBackdrop.querySelector("#address-map-view").hidden = true;
    const statusEl = modalBackdrop.querySelector("#address-choice-status");
    statusEl.hidden = true;
    statusEl.textContent = "";
  }

  function openMapView(initialCoords = null, autoAddress = "") {
    ensureModalDOM();
    modalBackdrop.querySelector("#address-choice-view").hidden = true;
    modalBackdrop.querySelector("#address-map-view").hidden = false;

    const inputEl = modalBackdrop.querySelector("#address-map-input");
    const refEl = modalBackdrop.querySelector("#address-map-reference");
    const statusEl = modalBackdrop.querySelector("#address-map-status");
    statusEl.hidden = true;
    refEl.value = "";

    // Cargar coordenadas previas o iniciales
    let targetCoords = initialCoords;
    if (!targetCoords) {
      try {
        const storedCoords = JSON.parse(localStorage.getItem(COORDS_STORAGE_KEY) || "null");
        if (storedCoords && storedCoords.lat && storedCoords.lon) {
          targetCoords = storedCoords;
        }
      } catch {}
    }
    if (!targetCoords) {
      targetCoords = { ...DEFAULT_COORDS };
    }
    currentCoords = targetCoords;

    if (autoAddress) {
      inputEl.value = autoAddress;
    } else {
      inputEl.value = getCleanSavedAddress() || "";
    }

    loadLeaflet(() => {
      initOrUpdateMap(currentCoords.lat, currentCoords.lon, !autoAddress);
    });
  }

  function initOrUpdateMap(lat, lon, shouldGeocode = false) {
    if (!window.L) return;
    const container = document.getElementById("saborcito-map-canvas");
    if (!container) return;

    if (!leafletMap) {
      leafletMap = L.map("saborcito-map-canvas", {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lon], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(leafletMap);

      leafletMarker = L.marker([lat, lon], {
        draggable: true,
        autoPan: true
      }).addTo(leafletMap);

      leafletMarker.on("dragend", event => {
        const pos = event.target.getLatLng();
        currentCoords = { lat: pos.lat, lon: pos.lng };
        scheduleReverseGeocode(pos.lat, pos.lng);
      });

      leafletMap.on("click", event => {
        leafletMarker.setLatLng(event.latlng);
        currentCoords = { lat: event.latlng.lat, lon: event.latlng.lng };
        scheduleReverseGeocode(event.latlng.lat, event.latlng.lng);
      });
    } else {
      leafletMap.setView([lat, lon], 16);
      leafletMarker.setLatLng([lat, lon]);
    }

    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 120);

    if (shouldGeocode && !document.getElementById("address-map-input").value.trim()) {
      scheduleReverseGeocode(lat, lon);
    }
  }

  function scheduleReverseGeocode(lat, lon) {
    clearTimeout(reverseGeocodeTimer);
    const statusEl = document.querySelector("#address-map-status");
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = "📍 Identificando dirección en el mapa...";
    }

    reverseGeocodeTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "es"
          }
        });
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const road = addr.road || addr.pedestrian || addr.street || addr.suburb || "";
          const num = addr.house_number ? ` #${addr.house_number}` : "";
          const neigh = addr.neighbourhood || addr.suburb || addr.quarter || "";
          const city = addr.city || addr.town || addr.municipality || "";

          let cleanText = "";
          if (road) {
            cleanText = road + num + (neigh ? `, ${neigh}` : "") + (city ? `, ${city.replace(/\s+ciudad/i, "")}` : "");
          } else if (data.display_name) {
            cleanText = data.display_name.split(",").slice(0, 3).join(",");
          } else {
            cleanText = `Ubicación (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          }

          const inputEl = document.querySelector("#address-map-input");
          if (inputEl) {
            inputEl.value = cleanText.trim();
          }
        }
      } catch (err) {
        // En caso de fallo de red en geocodificación inversa, mantener lo existente
      } finally {
        if (statusEl) statusEl.hidden = true;
      }
    }, 380);
  }

  async function handleForwardSearch() {
    const inputEl = document.querySelector("#address-map-input");
    const query = inputEl?.value.trim();
    if (!query) return;

    const statusEl = document.querySelector("#address-map-status");
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = `🔍 Buscando "${query}" en el mapa...`;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "es" }
      });
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const first = results[0];
          const newLat = parseFloat(first.lat);
          const newLon = parseFloat(first.lon);
          currentCoords = { lat: newLat, lon: newLon };
          if (leafletMap && leafletMarker) {
            leafletMap.setView([newLat, newLon], 16);
            leafletMarker.setLatLng([newLat, newLon]);
          }
          if (statusEl) {
            statusEl.textContent = `✓ Ubicación encontrada: ${first.display_name.split(",").slice(0, 2).join(",")}`;
            setTimeout(() => { if (statusEl) statusEl.hidden = true; }, 2400);
          }
          return;
        }
      }
      if (statusEl) {
        statusEl.textContent = "No encontramos esa dirección exacta. Puedes tocar directamente sobre el mapa para colocar el pin.";
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = "Error al conectar con la búsqueda. Puedes marcar directamente en el mapa.";
      }
    }
  }

  function handleUseCurrentLocation() {
    const statusEl = document.querySelector("#address-choice-status");
    statusEl.hidden = false;
    statusEl.innerHTML = `<span class="address-spinner"></span> Solicitando coordenadas GPS a tu dispositivo...`;

    if (!navigator.geolocation) {
      statusEl.textContent = "Tu navegador no soporta geolocalización. Elige la opción del mapa para fijar tu dirección.";
      setTimeout(() => openMapView(), 1000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        statusEl.textContent = "✓ Coordenadas obtenidas. Cargando mapa y dirección...";

        // Geocodificar ubicación actual
        let detectedAddress = "";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, {
            headers: { "Accept-Language": "es" }
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || addr.street || addr.suburb || "";
            const num = addr.house_number ? ` #${addr.house_number}` : "";
            const neigh = addr.neighbourhood || addr.suburb || addr.quarter || "";
            const city = addr.city || addr.town || addr.municipality || "";
            if (road) {
              detectedAddress = road + num + (neigh ? `, ${neigh}` : "") + (city ? `, ${city.replace(/\s+ciudad/i, "")}` : "");
            } else if (data.display_name) {
              detectedAddress = data.display_name.split(",").slice(0, 3).join(",");
            }
          }
        } catch {}

        if (!detectedAddress) {
          detectedAddress = `Ubicación actual (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        }

        openMapView({ lat, lon }, detectedAddress);
      },
      error => {
        let msg = "No se pudo obtener la ubicación GPS.";
        if (error.code === 1) {
          msg = "Permiso de ubicación no concedido. Puedes fijar tu dirección en el mapa a continuación.";
        } else if (error.code === 2) {
          msg = "Señal GPS no disponible temporalmente. Puedes fijar tu dirección en el mapa a continuación.";
        }
        statusEl.textContent = msg;
        setTimeout(() => openMapView(), 1400);
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 30000
      }
    );
  }

  function handleConfirmAddress() {
    const inputEl = document.querySelector("#address-map-input");
    const refEl = document.querySelector("#address-map-reference");
    const statusEl = document.querySelector("#address-map-status");

    const street = inputEl?.value.trim();
    if (!street || street.length < 3) {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "⚠️ Por favor, ingresa o selecciona una dirección válida en el mapa antes de continuar.";
      }
      inputEl?.focus();
      return;
    }

    const ref = refEl?.value.trim();
    const finalAddress = ref ? `${street} (${ref})` : street;

    setSavedAddress(finalAddress, currentCoords);
    closeModal();

    if (typeof activeCallback === "function") {
      activeCallback(finalAddress, currentCoords);
    }

    if (window.showNotice) {
      window.showNotice(`Dirección confirmada: ${finalAddress}`);
    }
  }

  function openModal(options = {}) {
    activeCallback = options.onAddressSelected || null;
    ensureModalDOM();
    showChoiceView();
    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.hidden = true;
    document.body.style.overflow = "";
    activeCallback = null;
  }

  // Inicialización global
  window.SaborcitoAddressModal = {
    open: openModal,
    close: closeModal,
    getSavedAddress: getCleanSavedAddress,
    setSavedAddress: setSavedAddress,
    syncUI: syncGlobalAddressUI
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      syncGlobalAddressUI();
      document.querySelector("#address-button")?.addEventListener("click", () => openModal());
    });
  } else {
    syncGlobalAddressUI();
    document.querySelector("#address-button")?.addEventListener("click", () => openModal());
  }

  window.addEventListener("pageshow", syncGlobalAddressUI);
  window.addEventListener("storage", syncGlobalAddressUI);
})();
