/* ============================================================
   Atlas — Interactive World Map
   ============================================================ */

// ---------- Map setup ----------
const map = L.map('map', {
  center: [20, 10],
  zoom: 2,
  minZoom: 2,
  maxZoom: 10,
  worldCopyJump: true,
  zoomControl: true,
  attributionControl: true,
  maxBounds: [[-85, -200], [85, 200]],
});

// Light, paper-feel base tiles (Carto Positron)
const baseLabeled = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
).addTo(map);

// ---------- Layer groups ----------
const gridLayer = L.layerGroup().addTo(map);
const gridLabelLayer = L.layerGroup().addTo(map);
const referenceLayer = L.layerGroup().addTo(map);
const referenceLabelLayer = L.layerGroup().addTo(map);
const countryLayer = L.layerGroup().addTo(map);
const countryLabelLayer = L.layerGroup().addTo(map);

// ---------- Reference lines ----------
const REFERENCE_LINES = [
  { id: 'equator',   lat:   0.0000, name: 'Equator',            short: '0°',         color: '#c0392b', dash: null,        cls: 'equator',  weight: 2.5 },
  { id: 'cancer',    lat:  23.4394, name: 'Tropic of Cancer',   short: '23°26′N',    color: '#d68910', dash: '6 6',       cls: 'tropic',   weight: 2 },
  { id: 'capricorn', lat: -23.4394, name: 'Tropic of Capricorn',short: '23°26′S',    color: '#d68910', dash: '6 6',       cls: 'tropic',   weight: 2 },
  { id: 'arctic',    lat:  66.5638, name: 'Arctic Circle',      short: '66°34′N',    color: '#1f77b4', dash: '2 4',       cls: 'circle',   weight: 2 },
  { id: 'antarctic', lat: -66.5638, name: 'Antarctic Circle',   short: '66°34′S',    color: '#1f77b4', dash: '2 4',       cls: 'circle',   weight: 2 },
];
const PRIME_MERIDIAN = { id: 'prime', name: 'Prime Meridian', short: '0°', color: '#2c3e50', cls: 'prime', weight: 2.5 };

const refState = {
  equator: true, cancer: true, capricorn: true,
  arctic: true, antarctic: true, prime: true,
};

function drawReferenceLines() {
  referenceLayer.clearLayers();
  referenceLabelLayer.clearLayers();

  // Latitude reference lines
  REFERENCE_LINES.forEach((line) => {
    if (!refState[line.id]) return;
    const polyline = L.polyline(
      [[line.lat, -180], [line.lat, 180]],
      { color: line.color, weight: line.weight, opacity: 0.85, dashArray: line.dash, interactive: false }
    ).addTo(referenceLayer);

    // Place a label at left side of view
    const label = L.marker([line.lat, -160], {
      icon: L.divIcon({
        className: `ref-label ${line.cls}`,
        html: `${line.name} · ${line.short}`,
        iconSize: null,
        iconAnchor: [0, 12],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(referenceLabelLayer);
  });

  // Prime Meridian
  if (refState.prime) {
    L.polyline(
      [[-85, 0], [85, 0]],
      { color: PRIME_MERIDIAN.color, weight: PRIME_MERIDIAN.weight, opacity: 0.85, interactive: false }
    ).addTo(referenceLayer);

    // Anchored just below the Antarctic land mass area in open ocean,
    // sitting right on the meridian for an unambiguous visual link.
    L.marker([-55, 0], {
      icon: L.divIcon({
        className: `ref-label ${PRIME_MERIDIAN.cls}`,
        html: `${PRIME_MERIDIAN.name} · ${PRIME_MERIDIAN.short}`,
        iconSize: [140, 20],
        iconAnchor: [70, 10],
      }),
      interactive: false,
    }).addTo(referenceLabelLayer);
  }
}

// ---------- Grid lines ----------
let gridVisible = true;
let gridLabelsVisible = true;

function drawGrid() {
  gridLayer.clearLayers();
  gridLabelLayer.clearLayers();
  if (!gridVisible) return;

  // Lines: always every 15°. Labels: density depends on zoom to prevent overlap.
  const lineStep = 15;
  const z = map.getZoom();
  // At low zooms, show labels every 30° to avoid crowding; finer steps at higher zoom.
  const labelStep = z <= 2 ? 30 : (z <= 4 ? 15 : 15);
  const refLats = new Set([0, 23.4394, -23.4394, 66.5638, -66.5638]);

  // Parallels (latitude lines)
  for (let lat = -75; lat <= 75; lat += lineStep) {
    if (refLats.has(lat) && lat === 0) continue; // Equator drawn separately
    L.polyline(
      [[lat, -180], [lat, 180]],
      { color: '#8b7d52', weight: 0.6, opacity: 0.45, interactive: false }
    ).addTo(gridLayer);

    if (gridLabelsVisible && lat % labelStep === 0) {
      L.marker([lat, -177], {
        icon: L.divIcon({
          className: 'grid-label',
          html: formatGridLabel(lat, 'lat'),
          iconSize: null,
          iconAnchor: [-2, 6],
        }),
        interactive: false,
        keyboard: false,
      }).addTo(gridLabelLayer);
    }
  }

  // Meridians (longitude lines)
  for (let lon = -180; lon <= 180; lon += lineStep) {
    if (lon === 0) continue; // Prime Meridian drawn separately
    L.polyline(
      [[-85, lon], [85, lon]],
      { color: '#8b7d52', weight: 0.6, opacity: 0.45, interactive: false }
    ).addTo(gridLayer);

    if (gridLabelsVisible && lon > -180 && lon < 180 && lon % labelStep === 0) {
      // Place longitude labels near the top of the map, centered on the meridian.
      L.marker([78, lon], {
        icon: L.divIcon({
          className: 'grid-label grid-label-lon',
          html: formatGridLabel(lon, 'lon'),
          iconSize: [44, 16],
          iconAnchor: [22, 8],
        }),
        interactive: false,
        keyboard: false,
      }).addTo(gridLabelLayer);
    }
  }
}

function formatGridLabel(deg, kind) {
  if (deg === 0) return '0°';
  if (kind === 'lat') {
    return `${Math.abs(deg)}°${deg > 0 ? 'N' : 'S'}`;
  } else {
    return `${Math.abs(deg)}°${deg > 0 ? 'E' : 'W'}`;
  }
}

// ---------- Country layer ----------
let countriesData = null;
let countryGeoLayer = null;
let countryNamesVisible = true;
let countryBordersVisible = true;

async function loadCountries() {
  const res = await fetch('countries.json');
  countriesData = await res.json();
  renderCountries();
}

function renderCountries() {
  countryLayer.clearLayers();
  countryLabelLayer.clearLayers();
  if (!countriesData) return;

  if (countryBordersVisible) {
    countryGeoLayer = L.geoJSON(countriesData, {
      style: {
        color: '#1e3a5f',
        weight: 1.0,
        opacity: 0.7,
        fillColor: '#d4a574',
        fillOpacity: 0.10,
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const name = props.NAME_LONG || props.NAME || 'Unknown';
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({
              weight: 1.5,
              fillOpacity: 0.25,
              fillColor: '#b8451f',
            });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            countryGeoLayer.resetStyle(e.target);
          },
          click: (e) => {
            // Zoom to country, but don't intercept the coordinate read on the click
            map.fitBounds(e.target.getBounds(), { padding: [40, 40], maxZoom: 6 });
            // Suppress the upcoming map click handler this turn
            suppressNextMapClick = true;
            showCoordPopup(e.latlng, name);
            L.DomEvent.stopPropagation(e);
          },
        });
      },
    }).addTo(countryLayer);
  }

  if (countryNamesVisible) {
    renderCountryLabelsForZoom();
  }
}

// ---------- Coordinate formatting ----------
function toDMS(deg, posChar, negChar) {
  const dir = deg >= 0 ? posChar : negChar;
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = ((minFloat - m) * 60).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(4, '0')}″${dir}`;
}

function formatLatLng(lat, lng) {
  // Normalize longitude to -180..180
  let lon = ((lng + 180) % 360 + 360) % 360 - 180;
  const decimal = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  const dms = `${toDMS(lat, 'N', 'S')}  ${toDMS(lon, 'E', 'W')}`;
  const hemi = `${lat >= 0 ? 'Northern' : 'Southern'} · ${lon >= 0 ? 'Eastern' : 'Western'}`;
  return { decimal, dms, hemi, lat, lon };
}

// ---------- Click → coordinate popup ----------
let suppressNextMapClick = false;
let lastPointMarker = null;

function showCoordPopup(latlng, contextName) {
  const f = formatLatLng(latlng.lat, latlng.lng);

  // Drop a pin
  if (lastPointMarker) lastPointMarker.remove();
  lastPointMarker = L.circleMarker([f.lat, f.lon], {
    radius: 5,
    color: '#b8451f',
    weight: 2,
    fillColor: '#fffdf6',
    fillOpacity: 1,
  }).addTo(map);

  const title = contextName ? contextName : 'Coordinates';
  const html = `
    <div class="coord-popup">
      <div class="title">${title}</div>
      <div class="row"><span class="k">Decimal</span><span class="v">${f.decimal}</span></div>
      <div class="row"><span class="k">DMS</span><span class="v">${f.dms}</span></div>
      <div class="row"><span class="k">Hemisphere</span><span class="v">${f.hemi}</span></div>
    </div>
  `;

  L.popup({ closeButton: true, autoClose: true, maxWidth: 320 })
    .setLatLng([f.lat, f.lon])
    .setContent(html)
    .openOn(map);

  // Update sidebar panel
  document.getElementById('coords-empty').hidden = true;
  document.getElementById('coords-display').hidden = false;
  document.getElementById('coord-decimal').textContent = f.decimal;
  document.getElementById('coord-dms').textContent = f.dms;
  document.getElementById('coord-hemi').textContent = f.hemi;
  document.getElementById('coord-copy').dataset.text =
    `${f.decimal}  |  ${f.dms}`;
}

map.on('click', (e) => {
  if (suppressNextMapClick) {
    suppressNextMapClick = false;
    return;
  }
  showCoordPopup(e.latlng, null);
});

// Live cursor coords in status bar
map.on('mousemove', (e) => {
  const f = formatLatLng(e.latlng.lat, e.latlng.lng);
  document.getElementById('cursor-coords').textContent =
    `${f.decimal}   ${f.dms}`;
});
map.on('zoomend', () => {
  document.getElementById('zoom-level').textContent = `Zoom ${map.getZoom()}`;
});

// ---------- Search ----------
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

function tryParseCoordinates(text) {
  const s = text.trim();

  // Decimal: "12.97, 77.59"  or "12.97 77.59"  or "-33.86, 151.20"
  const dec = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (dec) {
    const lat = parseFloat(dec[1]);
    const lon = parseFloat(dec[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon, label: `${lat}°, ${lon}°` };
    }
  }

  // DMS: e.g. "28°36'N 77°12'E" or "28 36 50 N, 77 12 32 E"
  const dms = s.match(
    /^\s*(\d+)[°\s:]+(\d+)?[\s'′:]*(\d+(?:\.\d+)?)?[\s"″]*\s*([NSns])\s*[,\s]\s*(\d+)[°\s:]+(\d+)?[\s'′:]*(\d+(?:\.\d+)?)?[\s"″]*\s*([EWew])\s*$/
  );
  if (dms) {
    const lat = (parseInt(dms[1]) + (parseInt(dms[2] || 0)) / 60 + (parseFloat(dms[3] || 0)) / 3600) *
      (dms[4].toUpperCase() === 'S' ? -1 : 1);
    const lon = (parseInt(dms[5]) + (parseInt(dms[6] || 0)) / 60 + (parseFloat(dms[7] || 0)) / 3600) *
      (dms[8].toUpperCase() === 'W' ? -1 : 1);
    return { lat, lon, label: s };
  }

  return null;
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!r.ok) throw new Error('Geocode failed');
  return await r.json();
}

function clearResults() {
  searchResults.innerHTML = '';
  searchResults.hidden = true;
}

function renderResults(items, onPick) {
  searchResults.innerHTML = '';
  if (!items.length) {
    searchResults.innerHTML = '<div class="info">No matches.</div>';
    searchResults.hidden = false;
    return;
  }
  items.forEach((it) => {
    const div = document.createElement('div');
    div.className = 'result';
    div.innerHTML = `
      <div class="name">${it.display_name.split(',').slice(0, 2).join(', ')}</div>
      <div class="meta">${it.display_name} · ${parseFloat(it.lat).toFixed(4)}°, ${parseFloat(it.lon).toFixed(4)}°</div>
    `;
    div.addEventListener('click', () => onPick(it));
    searchResults.appendChild(div);
  });
  searchResults.hidden = false;
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;

  // Try parsing coordinates first
  const coords = tryParseCoordinates(q);
  if (coords) {
    map.flyTo([coords.lat, coords.lon], Math.max(map.getZoom(), 6), { duration: 1.0 });
    setTimeout(() => showCoordPopup(L.latLng(coords.lat, coords.lon), coords.label), 800);
    clearResults();
    return;
  }

  // Otherwise, geocode
  try {
    searchResults.innerHTML = '<div class="info">Searching…</div>';
    searchResults.hidden = false;
    const items = await geocode(q);
    renderResults(items, (it) => {
      const lat = parseFloat(it.lat);
      const lon = parseFloat(it.lon);
      map.flyTo([lat, lon], 8, { duration: 1.0 });
      setTimeout(() => showCoordPopup(L.latLng(lat, lon), it.display_name.split(',')[0]), 800);
      clearResults();
      searchInput.value = it.display_name.split(',').slice(0, 2).join(', ');
    });
  } catch (err) {
    searchResults.innerHTML = '<div class="info">Search failed — please try again.</div>';
    searchResults.hidden = false;
  }
});

// Close results on outside click
document.addEventListener('click', (e) => {
  if (!searchForm.contains(e.target)) clearResults();
});

// ---------- Sidebar toggle ----------
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  setTimeout(() => map.invalidateSize(), 280);
});

// ---------- Toggles ----------
function bindRefToggle(id, key) {
  const el = document.getElementById(id);
  el.addEventListener('change', () => {
    refState[key] = el.checked;
    drawReferenceLines();
  });
}
bindRefToggle('t-equator',   'equator');
bindRefToggle('t-prime',     'prime');
bindRefToggle('t-cancer',    'cancer');
bindRefToggle('t-capricorn', 'capricorn');
bindRefToggle('t-arctic',    'arctic');
bindRefToggle('t-antarctic', 'antarctic');

document.getElementById('t-grid').addEventListener('change', (e) => {
  gridVisible = e.target.checked;
  drawGrid();
});
document.getElementById('t-grid-labels').addEventListener('change', (e) => {
  gridLabelsVisible = e.target.checked;
  drawGrid();
});
document.getElementById('t-countries').addEventListener('change', (e) => {
  countryBordersVisible = e.target.checked;
  renderCountries();
});
document.getElementById('t-country-names').addEventListener('change', (e) => {
  countryNamesVisible = e.target.checked;
  renderCountries();
});

// ---------- Mode switch ----------
const modeHint = document.getElementById('mode-hint');
document.querySelectorAll('input[name="mode"]').forEach((r) => {
  r.addEventListener('change', () => {
    const mode = r.value;
    if (mode === 'blank') {
      setAll(false);
      modeHint.textContent =
        'Blank outline mode — country shapes only, no labels or grid. Great for student exercises.';
    } else {
      setAll(true);
      modeHint.textContent =
        'All grid lines, labels, and country borders shown — ready to study.';
    }
  });
});

function setAll(on) {
  const map = {
    't-equator': 'equator', 't-prime': 'prime', 't-cancer': 'cancer',
    't-capricorn': 'capricorn', 't-arctic': 'arctic', 't-antarctic': 'antarctic',
  };
  Object.entries(map).forEach(([id, key]) => {
    document.getElementById(id).checked = on;
    refState[key] = on;
  });
  document.getElementById('t-grid').checked = on;
  document.getElementById('t-grid-labels').checked = on;
  document.getElementById('t-countries').checked = true; // borders always on for blank too
  document.getElementById('t-country-names').checked = on;

  gridVisible = on;
  gridLabelsVisible = on;
  countryBordersVisible = true;
  countryNamesVisible = on;

  drawGrid();
  drawReferenceLines();
  renderCountries();
}

// ---------- Copy coordinates ----------
document.getElementById('coord-copy').addEventListener('click', async (e) => {
  const text = e.target.dataset.text;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast('Coordinates copied');
  } catch {
    toast('Copy failed');
  }
});

function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 1600);
}

// ---------- Print ----------
document.getElementById('btn-print').addEventListener('click', () => {
  // Briefly invalidate map size, then print
  setTimeout(() => window.print(), 100);
});

// ---------- Init ----------
drawGrid();
drawReferenceLines();
loadCountries();

// Redraw grid labels and country labels on zoom (density depends on zoom)
map.on('zoomend', () => {
  drawGrid();
  if (countryNamesVisible) renderCountryLabelsForZoom();
});

// Render country labels based on current zoom (declutter at low zoom)
function renderCountryLabelsForZoom() {
  countryLabelLayer.clearLayers();
  if (!countriesData) return;
  const z = map.getZoom();
  // Rough thresholds based on country size proxies:
  // z=2: only the very largest countries; z=3: large; z=4+: most; z=5+: all
  const features = countriesData.features.filter((f) => {
    const p = f.properties;
    if (p.MIN_LABEL != null) return z >= p.MIN_LABEL;
    return true;
  });
  // MIN_LABEL isn't in our slim props — derive a simple area-based threshold instead.
  const filtered = countriesData.features.filter((f) => {
    const p = f.properties;
    const name = p.NAME || p.NAME_LONG || '';
    if (!name) return false;
    // Approximate area by bbox extent in degrees
    const b = L.geoJSON(f).getBounds();
    const w = b.getEast() - b.getWest();
    const h = b.getNorth() - b.getSouth();
    const area = Math.abs(w * h);
    if (z <= 2) return area > 200;    // continents-only at z2
    if (z === 3) return area > 40;
    if (z === 4) return area > 8;
    return true;
  });
  filtered.forEach((f) => {
    const p = f.properties;
    const name = (p.NAME || p.NAME_LONG || '').toUpperCase();
    let lat = p.LABEL_Y;
    let lon = p.LABEL_X;
    if (lat == null || lon == null) {
      const b = L.geoJSON(f).getBounds();
      lat = b.getCenter().lat;
      lon = b.getCenter().lng;
    }
    L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'country-label',
        html: name,
        iconSize: null,
        iconAnchor: [name.length * 3, 5],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(countryLabelLayer);
  });
}
