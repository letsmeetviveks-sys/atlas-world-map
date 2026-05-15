# Atlas — Interactive World Map

A paper-map-styled interactive world atlas for classroom use. Built with vanilla HTML/CSS/JS and [Leaflet](https://leafletjs.com/).

## Features

- **Reference lines** — Equator, Prime Meridian, Tropic of Cancer, Tropic of Capricorn, Arctic Circle, Antarctic Circle. Each is color-coded and labeled with its exact angle (e.g. 23°26′N).
- **Latitude/longitude grid** — every 15°, with adaptive labels that thin out at low zoom to stay readable.
- **Click-to-read coordinates** — click anywhere to see the spot in both decimal (e.g. `12.9768°, 77.5901°`) and degrees-minutes-seconds (e.g. `12°58′36.5″N 77°35′24.3″E`), plus hemisphere. Live cursor coordinates run in the status bar.
- **Country overlays** — borders and italic country names. Hover highlights a country; click zooms to fit its bounds. Label density adapts to zoom level so small countries appear only when relevant.
- **Search** — accepts city names (geocoded via [Nominatim](https://nominatim.openstreetmap.org/)), decimal pairs like `28.6, 77.2`, and DMS strings like `28°36'N 77°12'E`. Flies to the location and shows the coordinate popup automatically.
- **Classroom modes** — toggle **Labeled** (everything visible, poster style) or **Blank** (country outlines only, ideal for student fill-in exercises). Individual layers can also be toggled à la carte.
- **Print** — the Print button strips chrome and prints the map full-page in A4 landscape. Works for both blank and labeled modes.

## Run locally

No build step. Serve the folder over any static HTTP server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (The country GeoJSON must be served via HTTP — opening `index.html` directly with `file://` will fail because `fetch()` blocks local file reads.)

## Project structure

```
.
├── index.html        # App shell, sidebar, search, status bar
├── styles.css        # Paper-map aesthetic, print rules, responsive
├── app.js            # Map setup, grid/reference lines, search, modes
└── countries.json    # Natural Earth 110m country borders (177 features, slimmed)
```

## Data

Country boundaries are derived from [Natural Earth 1:110m Cultural Vectors](https://www.naturalearthdata.com/) (public domain). The file has been slimmed to keep only `NAME`, `NAME_LONG`, `ISO_A2`, `ISO_A3`, `CONTINENT`, `LABEL_X`, `LABEL_Y`.

Base tiles: [CARTO Voyager (no labels)](https://carto.com/attributions) + © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Geocoding: Nominatim.

## License

MIT — see [LICENSE](LICENSE).
