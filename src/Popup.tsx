import React, { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"
const ROUTE_COLOR = "#4169E1",
  SPOT_COLOR = "rgba(20, 200, 20, 0.3)"

export interface PopupNode extends HTMLDivElement {
  loadMap?: () => void
  unloadMap?: () => void
}

interface PopupProps {
  pointNumber: number
  popupNode: PopupNode
  coordinates: [number, number]
  routeGeometry?: GeoJSON.LineString
  startPoint?: [number, number]
}

const Popup: React.FC<PopupProps> = ({ pointNumber, popupNode, coordinates, routeGeometry, startPoint }) => {
  const miniMapContainer = useRef<HTMLDivElement>(null)
  const miniMapRef = useRef<mapboxgl.Map | null>(null)
  const initStarted = useRef(false)

  const loadMap = () => {
    if (!miniMapContainer.current || miniMapRef.current || initStarted.current) return

    initStarted.current = true

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: miniMapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: coordinates,
      zoom: 18,
      minZoom: 18,
      maxZoom: 18,
      interactive: true,
      collectResourceTiming: false
    })

    miniMapRef.current = map

    map.on("load", () => {
      if (!miniMapRef.current) return

      miniMapRef.current.addLayer({
        id: "spot",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: coordinates
            }
          }
        },
        paint: {
          "circle-color": SPOT_COLOR,
          "circle-radius": 60
        }
      })

      miniMapRef.current.on("mouseenter", "spot", () => {
        console.log("hover");
      
        // Find the image with the matching data-index for the pointNumber
        const img = document.querySelector(`img[data-index='${pointNumber}']`)  as HTMLImageElement;;
      
        if (img) {
          img.style.display = "block"; // Show the image
          console.log(`Image for point ${pointNumber} displayed`);
        }
      });
      
      miniMapRef.current.on("mouseleave", "spot", () => {
        const img = document.querySelector(`img[data-index='${pointNumber}']`)  as HTMLImageElement;;
        
        if (img) {
          img.style.display = "none"; // Hide the image
        }
      });
      // Add the route layer
      miniMapRef.current.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: routeGeometry || {
              type: "LineString",
              coordinates: []
            }
          }
        },
        paint: {
          "line-color": ROUTE_COLOR,
          "line-width": 14,
          "line-opacity": 0.8
        }
      })

      // Add start point marker if provided
      if (startPoint) {
        new mapboxgl.Marker({ color: ROUTE_COLOR }).setLngLat(startPoint).addTo(miniMapRef.current)
      }
    })
  }

  const unloadMap = () => {
    if (miniMapRef.current) {
      miniMapRef.current.remove()
      miniMapRef.current = null
    }
    initStarted.current = false
  }

  useEffect(() => {
    popupNode.loadMap = loadMap
    popupNode.unloadMap = unloadMap

    loadMap()

    return () => {
      unloadMap()
      delete popupNode.loadMap
      delete popupNode.unloadMap
    }
  }, [coordinates, routeGeometry])

  return (
    <div
      ref={miniMapContainer}
      style={{ width: "100%", height: "300px", margin: 0 }}
    ></div>
  )
}

export default Popup
