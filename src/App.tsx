import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import * as turf from "@turf/turf"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import { createPulsingDot } from "./Here"
import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import "./App.css"

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"
const HERE_TEMP: [number, number] = [-122.4165, 37.7554]

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
    maxZoom: 18
  })

  // Add routes layer
  map.on("load", () => {
    map.addLayer({
      id: "routes",
      type: "line",
      source: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.75 }
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
        turf.destination(turf.point(center), 1, Math.random() * 360, { units: "miles" }).geometry
          .coordinates as [number, number]
    )

    // Get routes, add markers
    const routeData = await Promise.all(
      points.map(async (point, i) => {
        currentMarkers.current.push(
          new mapboxgl.Marker({ color: "#666" })
            .setLngLat(point)
            .setPopup(new mapboxgl.Popup().setHTML(`Point ${i + 1}`))
            .addTo(map)
        )

        const route = await getRoute(center, point)
        return { distance: route.distance, geometry: route.geometry }
      })
    )

    // Update routes w/ shortest highlighted
    const shortestIndex = routeData
      .map((r, i) => ({ index: i, distance: r.distance }))
      .sort((a, b) => a.distance - b.distance)[0].index

    ;(map.getSource("routes") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: routeData.map((r, i) => ({
        type: "Feature",
        properties: { color: i === shortestIndex ? "#000" : "#666" },
        geometry: r.geometry
      }))
    })

    // Fit bounds
    const bounds = points.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds().extend(center))
    map.fitBounds(bounds, { padding: 50 })
  }

  useEffect(() => {
    if (!mapContainer.current) return

    const map = initializeMap(mapContainer.current)

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

    return () => map.remove()
  }, [])

  return (
    <div ref={mapContainer} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
  )
}

export default App
