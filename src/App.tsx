import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import * as turf from "@turf/turf"
import "mapbox-gl/dist/mapbox-gl.css"
import "./App.css"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { createPulsingDot } from "./Here"

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const centerPoint: [number, number] = [-122.4165, 37.7554]

  useEffect(() => {
    if (!mapContainer.current) return
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: centerPoint,
      zoom: 16,
      minZoom: 14,
      maxZoom: 18
    })

    // Generate random points and add routes layer
    map.on("load", async () => {
      map.addLayer({
        id: "routes",
        type: "line",
        source: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 4,
          "line-opacity": 0.75
        }
      })

      // Then add the pulsing dot (higher z-index)
      const pulsingDot = createPulsingDot(map)
      map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 })

      map.addSource("here-dot", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: centerPoint
              },
              properties: {}
            }
          ]
        }
      })

      map.addLayer({
        id: "here-dot",
        type: "symbol",
        source: "here-dot",
        layout: {
          "icon-image": "pulsing-dot",
          "icon-allow-overlap": true
        }
      })

      const points = Array.from(
        { length: 5 },
        () =>
          turf.destination(turf.point(centerPoint), 1, Math.random() * 360, { units: "miles" })
            .geometry.coordinates as [number, number]
      )

      // Add destination markers, fetch routes
      const routeData = await Promise.all(
        points.map(async (point, i) => {
          // Add marker
          new mapboxgl.Marker({ color: "#666" })
            .setLngLat(point)
            .setPopup(new mapboxgl.Popup().setHTML(`Point ${i + 1}`))
            .addTo(map)

          // Get route
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/walking/${centerPoint.join(
              ","
            )};${point.join(",")}?geometries=geojson&access_token=${mapboxgl.accessToken}`
          )
          const {
            routes: [route]
          } = await response.json()

          return {
            distance: route.distance,
            feature: {
              type: "Feature",
              properties: { color: "#666" },
              geometry: route.geometry
            }
          }
        })
      )

      // Find shortest route, update colors
      const shortestIndex = routeData
        .map((r, i) => ({ index: i, distance: r.distance }))
        .sort((a, b) => a.distance - b.distance)[0].index

      const routes = routeData.map((r, i) => ({
        ...r.feature,
        type: "Feature" as const,
        properties: { color: i === shortestIndex ? "#000" : "#666" }
      }))

      // Update routes
      ;(map.getSource("routes") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: routes
      })

      // Fit map to show all points
      const bounds = new mapboxgl.LngLatBounds()
        .extend(centerPoint)
        .extend(points.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds()))
      map.fitBounds(bounds, { padding: 50 })
    })

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl
    })

    map.addControl(geocoder, "top-left")

    return () => map.remove()
  }, [])

  return (
    <div ref={mapContainer} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
  )
}

export default App
