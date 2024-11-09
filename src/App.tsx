import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "./App.css"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken =
      "pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-122.4194, 37.7749], // SF
      zoom: 5,
      maxZoom: 15
    })

    // Add navigation controls (zoom in/out)
    map.addControl(new mapboxgl.NavigationControl(), "top-left")
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl
    });

    map.addControl(geocoder, "top-left");

    return () => map.remove()
  }, [])

  return (
    <div ref={mapContainer} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
  )
}

export default App
