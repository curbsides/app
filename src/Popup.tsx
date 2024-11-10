import React, { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"

export interface PopupNode extends HTMLDivElement {
  loadMap?: () => void
  unloadMap?: () => void
}

interface PopupProps {
  pointNumber: number
  popupNode: PopupNode
  coordinates: [number, number]
}

const Popup: React.FC<PopupProps> = ({ _, popupNode, coordinates }) => {
  const miniMapContainer = useRef<HTMLDivElement>(null)
  const miniMapRef = useRef<mapboxgl.Map | null>(null)

  const loadMap = () => {
    if (!miniMapContainer.current || miniMapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    miniMapRef.current = new mapboxgl.Map({
      container: miniMapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: coordinates,
      zoom: 18,
      minZoom: 18,
      maxZoom: 18,
      interactive: true,
      collectResourceTiming: false
    })
    new mapboxgl.Marker().setLngLat(coordinates).addTo(miniMapRef.current)
  }

  const unloadMap = () => {
    if (miniMapRef.current) {
      miniMapRef.current.remove()
      miniMapRef.current = null
    }
  }

  useEffect(() => {
    popupNode.loadMap = loadMap
    popupNode.unloadMap = unloadMap

    return () => {
      unloadMap()
      delete popupNode.loadMap
      delete popupNode.unloadMap
    }
  }, [coordinates])

  return (
    <div
      ref={miniMapContainer}
      style={{ width: "100%", height: "300px", margin: 0 }}
    ></div>
  )
}

export default Popup
