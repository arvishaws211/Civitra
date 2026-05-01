import { showToast } from "./app.js";

let map = null;
let userMarker = null;
let boothMarkers = [];
let userPosition = null;
let mapsLoaded = false;

export function initBooth() {
  document.getElementById("booth-locate-btn")?.addEventListener("click", requestLocation);
}

async function loadMapsAPI() {
  if (mapsLoaded) return true;

  try {
    const res = await fetch("/api/booth/maps-key");
    if (!res.ok) {
      showBoothFallback();
      return false;
    }
    const { key } = await res.json();

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=__initGoogleMaps`;
      script.async = true;
      script.defer = true;
      window.__initGoogleMaps = () => {
        mapsLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        showToast("Failed to load Google Maps", "error");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  } catch {
    showBoothFallback();
    return false;
  }
}

function requestLocation() {
  const btn = document.getElementById("booth-locate-btn");
  btn.textContent = "Locating...";
  btn.disabled = true;

  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser", "error");
    btn.textContent = "Enable Location";
    btn.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const loaded = await loadMapsAPI();
      if (loaded) {
        initMap();
        searchNearbyBooths();
      } else {
        // Fallback: show results without map
        showBoothsWithoutMap();
      }
    },
    (err) => {
      showToast("Location access denied. Please enable it in your browser settings.", "error");
      btn.textContent = "Enable Location";
      btn.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function initMap() {
  const placeholder = document.getElementById("booth-map-placeholder");
  if (placeholder) placeholder.style.display = "none";

  const mapContainer = document.getElementById("booth-map");
  if (!mapContainer) return;

  // Clear existing map if any
  mapContainer.innerHTML = "";

  const mapDiv = document.createElement("div");
  mapDiv.id = "google-map-canvas";
  mapDiv.style.width = "100%";
  mapDiv.style.height = "100%";
  mapContainer.appendChild(mapDiv);

  // Small timeout to ensure DOM has rendered dimensions
  setTimeout(() => {
    map = new google.maps.Map(mapDiv, {
      center: userPosition,
      zoom: 14,
      styles: getMapStyles(),
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    userMarker = new google.maps.Marker({
      position: userPosition,
      map: map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#06b6d4",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
      },
    });
  }, 100);
}

function searchNearbyBooths() {
  const service = new google.maps.places.PlacesService(map);

  const request = {
    location: userPosition,
    radius: 5000, // 5km radius
    keyword: "polling booth voting station school government",
    type: "school", // Polling booths are often in schools/govt buildings
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length) {
      displayBooths(results.slice(0, 8)); // Show top 8
    } else {
      // Fallback: search for government buildings
      service.nearbySearch(
        {
          location: userPosition,
          radius: 5000,
          keyword: "government school community hall",
        },
        (r2, s2) => {
          if (s2 === google.maps.places.PlacesServiceStatus.OK && r2.length) {
            displayBooths(r2.slice(0, 8));
          } else {
            document.getElementById("booth-results").innerHTML = `
            <h3>🗳️ Nearby Booths</h3>
            <p class="booth__hint">No polling stations found nearby. Use the ECI portal below to find your exact booth.</p>
          `;
          }
        }
      );
    }
  });
}

function displayBooths(places) {
  const resultsEl = document.getElementById("booth-results");
  let html = '<h3>🗳️ Nearby Potential Booth Locations</h3><div class="booth__list">';

  // Clear old markers
  boothMarkers.forEach((m) => m.setMap(null));
  boothMarkers = [];

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(userPosition);

  places.forEach((place, i) => {
    const dist = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(userPosition),
      place.geometry.location
    );
    const distKm = (dist / 1000).toFixed(1);

    // Add marker
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map: map,
      title: place.name,
      label: { text: String(i + 1), color: "#fff", fontWeight: "700" },
      icon: {
        path: "M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z",
        fillColor: "#14b8a6",
        fillOpacity: 1,
        strokeColor: "#0d9488",
        strokeWeight: 1,
        scale: 1.5,
        anchor: new google.maps.Point(12, 24),
        labelOrigin: new google.maps.Point(12, 9),
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="color:#333;padding:4px"><strong>${place.name}</strong><br>${place.vicinity}<br><em>${distKm} km away</em></div>`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
      showTrafficTiming(place, distKm);
    });

    boothMarkers.push(marker);
    bounds.extend(place.geometry.location);

    html += `
      <div class="booth__item" data-index="${i}">
        <div class="booth__item-num">${i + 1}</div>
        <div class="booth__item-info">
          <div class="booth__item-name">${place.name}</div>
          <div class="booth__item-addr">${place.vicinity || ""}</div>
          <div class="booth__item-dist">${distKm} km away</div>
        </div>
        <button class="booth__item-dir" title="Get directions" data-lat="${place.geometry.location.lat()}" data-lng="${place.geometry.location.lng()}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
        </button>
      </div>
    `;
  });

  html += "</div>";
  html +=
    '<p class="booth__disclaimer-note">These are potential booth locations based on nearby public buildings. Always verify your assigned booth via the ECI portal.</p>';
  resultsEl.innerHTML = html;

  map.fitBounds(bounds, { padding: 60 });

  // Bind click events on booth items
  resultsEl.querySelectorAll(".booth__item").forEach((item) => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.dataset.index);
      google.maps.event.trigger(boothMarkers[idx], "click");
      map.panTo(boothMarkers[idx].getPosition());
      map.setZoom(16);
    });
  });

  // Bind direction buttons
  resultsEl.querySelectorAll(".booth__item-dir").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const lat = btn.dataset.lat;
      const lng = btn.dataset.lng;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${lat},${lng}&travelmode=driving`,
        "_blank"
      );
    });
  });
}

function showTrafficTiming(place, distKm) {
  const timingEl = document.getElementById("booth-timing");
  const dist = parseFloat(distKm);

  // Estimate travel times
  const walkMin = Math.round(dist * 12); // ~5 km/h walking
  const driveMin = Math.max(3, Math.round(dist * 3)); // ~20 km/h in city traffic

  // Suggest best voting times (based on typical Indian election patterns)
  const earlySlot = "7:00 - 9:00 AM";
  const midSlot = "11:00 AM - 1:00 PM";
  const lateSlot = "3:00 - 5:00 PM";

  timingEl.innerHTML = `
    <h3>🕐 Timing for ${place.name}</h3>
    <div class="booth__timing-grid">
      <div class="booth__timing-item">
        <span class="booth__timing-icon">🚶</span>
        <span>Walking: ~${walkMin} min</span>
      </div>
      <div class="booth__timing-item">
        <span class="booth__timing-icon">🚗</span>
        <span>Driving: ~${driveMin} min</span>
      </div>
    </div>
    <h4>Recommended Voting Windows</h4>
    <div class="booth__timing-slots">
      <div class="booth__slot booth__slot--best">
        <span class="booth__slot-badge">Least Crowded</span>
        <strong>${earlySlot}</strong>
        <p>Early morning slots typically have the shortest queues</p>
      </div>
      <div class="booth__slot">
        <span class="booth__slot-badge">Moderate</span>
        <strong>${midSlot}</strong>
        <p>Mid-day traffic is generally lighter</p>
      </div>
      <div class="booth__slot">
        <span class="booth__slot-badge">Busy</span>
        <strong>${lateSlot}</strong>
        <p>Afternoon can be crowded; plan extra time</p>
      </div>
    </div>
    <p class="booth__privacy-note">Timing estimates are general guidance. Actual conditions may vary on election day.</p>
  `;
}

function showBoothsWithoutMap() {
  // Fallback for when Maps API is not available
  const placeholder = document.getElementById("booth-map-placeholder");
  placeholder.innerHTML = `
    <div class="booth__map-icon">🗺️</div>
    <h3>Maps API Not Configured</h3>
    <p>Add your MAPS_API_KEY to the .env file to enable the interactive map.</p>
    <p>Meanwhile, use the ECI portal to find your booth:</p>
    <a href="https://electoralsearch.eci.gov.in/" target="_blank" rel="noopener" class="btn btn--primary">Open ECI Booth Search</a>
  `;

  document.getElementById("booth-results").innerHTML = `
    <h3>🗳️ Find Your Booth</h3>
    <p>Your location: ${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}</p>
    <p>Use the official ECI Electoral Search to find your assigned polling station.</p>
  `;
}

function getMapStyles() {
  return [
    { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a5a" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1a2b" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e2a3a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  ];
}

function showBoothFallback() {
  const placeholder = document.getElementById("booth-map-placeholder");
  if (!placeholder) return;
  placeholder.innerHTML = `
    <div class="fallback-banner">
      <strong>Booth lookup requires Google Maps</strong><br>
      Use the <a href="https://electoralsearch.eci.gov.in/" target="_blank" rel="noopener">ECI Electoral Search portal</a> directly to find your polling station.
    </div>
  `;
}
