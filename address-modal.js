/**
 * Saborcito — Selector de Dirección con Ubicación Actual y Mapa Interactivo Leaflet
 */
(function() {
  const ADDRESS_STORAGE_KEY = "saborcito_delivery_address";
  const COORDS_STORAGE_KEY = "saborcito_delivery_coords";
  // Coordenadas centrales por defecto: Quito, Ecuador
  const DEFAULT_COORDS = { lat: -0.1807, lon: -78.4678 };

  // Límites geográficos estrictos de Ecuador (Continental + Galápagos)
  // Latitudes: de -5.15°S a 1.50°N
  // Longitudes: de -92.50°O (Galápagos) a -75.15°O (Oriente)
  const ECUADOR_LAT_MIN = -5.15;
  const ECUADOR_LAT_MAX = 1.50;
  const ECUADOR_LON_MIN = -92.50;
  const ECUADOR_LON_MAX = -75.15;

  function isInsideEcuador(lat, lon) {
    const nLat = Number(lat);
    const nLon = Number(lon);
    return !isNaN(nLat) && !isNaN(nLon) &&
      nLat >= ECUADOR_LAT_MIN && nLat <= ECUADOR_LAT_MAX &&
      nLon >= ECUADOR_LON_MIN && nLon <= ECUADOR_LON_MAX;
  }

  function clampToEcuador(lat, lon) {
    const clampedLat = Math.max(ECUADOR_LAT_MIN, Math.min(ECUADOR_LAT_MAX, Number(lat) || DEFAULT_COORDS.lat));
    const clampedLon = Math.max(ECUADOR_LON_MIN, Math.min(ECUADOR_LON_MAX, Number(lon) || DEFAULT_COORDS.lon));
    return { lat: clampedLat, lon: clampedLon };
  }

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

    attachAddressListeners();
  }

  function attachAddressListeners() {
    document.querySelectorAll("#address-button").forEach(btn => {
      if (!btn._addressModalAttached) {
        btn._addressModalAttached = true;
        btn.addEventListener("click", event => {
          event.stopPropagation();
          openModal();
        });
      }
    });

    document.querySelectorAll(".location").forEach(loc => {
      if (!loc._addressModalAttached) {
        loc._addressModalAttached = true;
        loc.style.cursor = "pointer";
        loc.addEventListener("click", event => {
          if (!event.target.closest("button")) {
            openModal();
          }
        });
      }
    });
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
          <p class="address-modal-sub">¿Cómo prefieres indicar a dónde llevamos tu pedido en Ecuador? 🇪🇨</p>
          
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
                <small>Escribe tu calle o mueve el marcador para indicar el punto exacto en Ecuador</small>
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
            <h2 class="address-modal-title-map">Fijar entrega en Ecuador 🇪🇨</h2>
            <button type="button" class="address-modal-close" data-address-close="true" aria-label="Cerrar ventana">×</button>
          </div>

          <div class="address-map-search-bar">
            <div class="address-input-wrapper">
              <span class="address-input-icon" aria-hidden="true">📍</span>
              <input type="text" id="address-map-input" placeholder="Escribe tu calle, barrio o ciudad en Ecuador (ej. Av. Amazonas, Quito)..." autocomplete="off">
              <button type="button" id="btn-search-address-map" class="address-search-btn" title="Buscar en mapa">Buscar</button>
            </div>
          </div>

          <div class="address-map-wrapper">
            <div id="saborcito-map-canvas" class="address-map-canvas"></div>
            <div class="address-map-hint">
              <span>🇪🇨 Mapa delimitado a Ecuador · Toca o arrastra el marcador 📍 para afinar la entrega</span>
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

    // Cargar coordenadas previas o iniciales garantizando que estén en Ecuador
    let targetCoords = initialCoords;
    if (!targetCoords) {
      try {
        const storedCoords = JSON.parse(localStorage.getItem(COORDS_STORAGE_KEY) || "null");
        if (storedCoords && isInsideEcuador(storedCoords.lat, storedCoords.lon)) {
          targetCoords = storedCoords;
        }
      } catch {}
    }
    if (!targetCoords || !isInsideEcuador(targetCoords.lat, targetCoords.lon)) {
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

    const safeCoords = isInsideEcuador(lat, lon) ? { lat: Number(lat), lon: Number(lon) } : { ...DEFAULT_COORDS };
    const ecuadorBounds = L.latLngBounds(
      L.latLng(ECUADOR_LAT_MIN, ECUADOR_LON_MIN),
      L.latLng(ECUADOR_LAT_MAX, ECUADOR_LON_MAX)
    );

    if (!leafletMap) {
      leafletMap = L.map("saborcito-map-canvas", {
        zoomControl: true,
        attributionControl: false,
        maxBounds: ecuadorBounds,
        maxBoundsViscosity: 1.0, // Impide arrastrar el mapa fuera del territorio ecuatoriano
        minZoom: 6,              // Impide alejar la vista más allá de Ecuador
        maxZoom: 19
      }).setView([safeCoords.lat, safeCoords.lon], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        bounds: ecuadorBounds
      }).addTo(leafletMap);

      leafletMarker = L.marker([safeCoords.lat, safeCoords.lon], {
        draggable: true,
        autoPan: true
      }).addTo(leafletMap);

      leafletMarker.on("dragend", event => {
        const pos = event.target.getLatLng();
        if (!isInsideEcuador(pos.lat, pos.lng)) {
          const clamped = clampToEcuador(pos.lat, pos.lng);
          leafletMarker.setLatLng([clamped.lat, clamped.lon]);
          currentCoords = clamped;
          const statusEl = document.querySelector("#address-map-status");
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.textContent = "⚠️ La entrega se limita al territorio de Ecuador 🇪🇨.";
            setTimeout(() => { if (statusEl) statusEl.hidden = true; }, 3200);
          }
        } else {
          currentCoords = { lat: pos.lat, lon: pos.lng };
        }
        scheduleReverseGeocode(currentCoords.lat, currentCoords.lon);
      });

      leafletMap.on("click", event => {
        if (!isInsideEcuador(event.latlng.lat, event.latlng.lng)) {
          const statusEl = document.querySelector("#address-map-status");
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.textContent = "⚠️ Por favor, selecciona una ubicación dentro de Ecuador 🇪🇨.";
            setTimeout(() => { if (statusEl) statusEl.hidden = true; }, 3200);
          }
          return;
        }
        leafletMarker.setLatLng(event.latlng);
        currentCoords = { lat: event.latlng.lat, lon: event.latlng.lng };
        scheduleReverseGeocode(event.latlng.lat, event.latlng.lng);
      });
    } else {
      leafletMap.setMaxBounds(ecuadorBounds);
      leafletMap.setView([safeCoords.lat, safeCoords.lon], 16);
      leafletMarker.setLatLng([safeCoords.lat, safeCoords.lon]);
    }

    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 120);

    if (shouldGeocode && !document.getElementById("address-map-input").value.trim()) {
      scheduleReverseGeocode(safeCoords.lat, safeCoords.lon);
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
      statusEl.textContent = `🔍 Buscando "${query}" en Ecuador 🇪🇨...`;
    }

    try {
      // Restringir búsqueda exclusivamente a Ecuador con countrycodes=ec y bounded
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ec&viewbox=-92.5,1.50,-75.15,-5.15&bounded=1&limit=3`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "es" }
      });
      if (res.ok) {
        const results = await res.json();
        const validMatch = Array.isArray(results)
          ? results.find(r => isInsideEcuador(parseFloat(r.lat), parseFloat(r.lon)))
          : null;

        if (validMatch) {
          const newLat = parseFloat(validMatch.lat);
          const newLon = parseFloat(validMatch.lon);
          currentCoords = { lat: newLat, lon: newLon };
          if (leafletMap && leafletMarker) {
            leafletMap.setView([newLat, newLon], 16);
            leafletMarker.setLatLng([newLat, newLon]);
          }
          if (statusEl) {
            statusEl.textContent = `✓ Ubicación encontrada en Ecuador: ${validMatch.display_name.split(",").slice(0, 2).join(",")}`;
            setTimeout(() => { if (statusEl) statusEl.hidden = true; }, 2600);
          }
          return;
        }
      }
      if (statusEl) {
        statusEl.textContent = "No encontramos esa dirección en Ecuador. Puedes buscar indicando calle y ciudad (ej. Av. 9 de Octubre, Guayaquil) o marcar en el mapa.";
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = "Error al conectar con la búsqueda. Puedes marcar directamente sobre el mapa de Ecuador.";
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

        if (!isInsideEcuador(lat, lon)) {
          statusEl.textContent = "⚠️ Tu GPS detectó una ubicación fuera de Ecuador. Te posicionamos en Quito para que elijas tu entrega en Ecuador 🇪🇨.";
          setTimeout(() => {
            openMapView({ lat: DEFAULT_COORDS.lat, lon: DEFAULT_COORDS.lon }, "Quito, Ecuador");
          }, 1800);
          return;
        }

        statusEl.textContent = "✓ Coordenadas obtenidas en Ecuador. Cargando mapa y dirección...";

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

    if (!isInsideEcuador(currentCoords.lat, currentCoords.lon)) {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "⚠️ La dirección de entrega debe estar ubicada dentro del territorio de Ecuador 🇪🇨.";
      }
      return;
    }

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
    });
  } else {
    syncGlobalAddressUI();
  }

  window.addEventListener("pageshow", syncGlobalAddressUI);
  window.addEventListener("storage", syncGlobalAddressUI);
})();
