import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import * as turf from "@turf/turf"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import { createPulsingDot } from "./Here"
import ReactDOM from "react-dom/client"
import Popup, { PopupNode } from "./Popup"
import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import "./App.css"

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"
const HERE_TEMP: [number, number] = [-122.4165, 37.7554]
const ROUTE_COLOR = "#4169E1"

async function getRoute(start: [number, number], end: [number, number]) {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${start.join(",")};${end.join(
      ","
    )}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
  )
  return (await response.json()).routes[0]
}

function initializeMap(container: HTMLDivElement) {
  mapboxgl.accessToken = MAPBOX_TOKEN
  const map = new mapboxgl.Map({
    container,
    style: "mapbox://styles/mapbox/light-v11",
    center: HERE_TEMP,
    zoom: 16,
    minZoom: 14,
    maxZoom: 18,
    attributionControl: false
  })

  map.addControl(new mapboxgl.AttributionControl({ compact: true }))

  map.on("load", () => {
    map.addLayer({
      id: "routes",
      type: "line",
      source: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "width"],
        "line-opacity": 0.8
      }
    })

    // Add pulsing dot
    map.addImage("pulsing-dot", createPulsingDot(map), { pixelRatio: 2 })
    map.addSource("here-dot", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    })
    map.addLayer({
      id: "here-dot",
      type: "symbol",
      source: "here-dot",
      layout: { "icon-image": "pulsing-dot", "icon-allow-overlap": true }
    })
  })

  return map
}

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const currentMarkers = useRef<mapboxgl.Marker[]>([])
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const routesDataRef = useRef<Array<{ distance: number; geometry: GeoJSON.LineString }>>([])
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null)

  function clearSelection() {
    if (!mapRef.current || !routesDataRef.current.length) return

    // Close any open popups
    currentMarkers.current.forEach(marker => marker.getPopup().remove())
    setSelectedMarkerIndex(null)

    // Reset all routes to unselected state
    ;(mapRef.current.getSource("routes") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: routesDataRef.current.map(r => ({
        type: "Feature",
        properties: {
          color: "#666",
          width: 3
        },
        geometry: r.geometry
      }))
    })
  }

  function updateSelectedRoute(index: number) {
    if (!mapRef.current || !routesDataRef.current.length) return

    // Close any open popups
    currentMarkers.current.forEach(marker => marker.getPopup().remove())
    setSelectedMarkerIndex(index)

    // Update routes
    ;(mapRef.current.getSource("routes") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: routesDataRef.current.map((r, i) => ({
        type: "Feature",
        properties: {
          color: i === index ? ROUTE_COLOR : "#666",
          width: i === index ? 6 : 3,
          index: i
        },
        geometry: r.geometry
      }))
    })

    // Open popup for selected marker
    currentMarkers.current[index].togglePopup()
  }

  async function updateMapPoints(map: mapboxgl.Map, center: [number, number]) {
    // Clear existing markers
    currentMarkers.current.forEach(marker => marker.remove())
    currentMarkers.current = []

    // Update here-dot
    ;(map.getSource("here-dot") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: center }, properties: {} }
      ]
    })

    // Generate random points, add markers
    const points = Array.from(
      { length: 5 },
      () =>
        turf.destination(turf.point(center), 0.2, Math.random() * 360, { units: "miles" }).geometry
          .coordinates as [number, number]
    )

    const createPopup = (
      index: number,
      coords: [number, number],
      routeGeometry: GeoJSON.LineString
    ) => {
      const popupNode = document.createElement("div") as PopupNode
      const root = ReactDOM.createRoot(popupNode)

      root.render(
        <Popup
          pointNumber={index}
          popupNode={popupNode}
          coordinates={coords}
          routeGeometry={routeGeometry}
          startPoint={center}
        />
      )

      const popup = new mapboxgl.Popup({
        className: "custom-popup",
        offset: [0, -64]
      })
        .setDOMContent(popupNode)
        .on("open", () => {
          popupNode.loadMap?.()
        })
        .on("close", () => {
          popupNode.unloadMap?.()
          if (selectedMarkerIndex === index) clearSelection()
        })

      return popup
    }

    // Get routes, add markers
    const routeData = await Promise.all(
      points.map(async (point, i) => {
        const route = await getRoute(center, point)
        const popup = createPopup(i, point, route.geometry)
        const el = document.createElement("div")
        el.className = "marker"

        const marker = new mapboxgl.Marker(el).setLngLat(point).setPopup(popup).addTo(map)

        el.addEventListener("click", e => {
          e.stopPropagation()
          updateSelectedRoute(i)
        })

        currentMarkers.current.push(marker)

        return { distance: route.distance, geometry: route.geometry }
      })
    )

    routesDataRef.current = routeData

    // Find shortest route
    const shortestIndex = routeData
      .map((r, i) => ({ index: i, distance: r.distance }))
      .sort((a, b) => a.distance - b.distance)[0].index

    updateSelectedRoute(shortestIndex)

    // Fit bounds
    const bounds = points.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds().extend(center))
    map.fitBounds(bounds, { padding: 50 })
  }

  useEffect(() => {
    if (!mapContainer.current) return

    const map = initializeMap(mapContainer.current)
    mapRef.current = map

    map.on("click", e => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["markers"]
      })

      if (features.length === 0) {
        clearSelection()
      }
    })

    // Set up geocoder
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false
    })

    geocoder.on("result", async event => {
      const newCenter: [number, number] = [event.result.center[0], event.result.center[1]]
      map.flyTo({ center: newCenter, zoom: 16, essential: true })
      await updateMapPoints(map, newCenter)
    })

    map.addControl(geocoder, "top-left")
    map.on("load", () => updateMapPoints(map, HERE_TEMP))

    return () => {
      map.remove()
    }
  }, [])

  return (
    <div
      ref={mapContainer}
      style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }}
    />
  )
}

export default App
