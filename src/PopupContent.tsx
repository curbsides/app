// PopupContent.tsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
const MAPBOX_TOKEN =
"pk.eyJ1IjoiYWN1bWFuZSIsImEiOiJjbTNhZmxodm8xMGNiMmtvcjNrcTVjYm5vIn0.urWNru_orWfcj6C1HAMQtA"

// Define the extended interface with loadMap and unloadMap
export interface PopupNode extends HTMLDivElement {
  loadMap?: () => void;
  unloadMap?: () => void;
}

interface PopupContentProps {
  pointNumber: number;
  popupNode: PopupNode; // Use PopupNode type here
}

const PopupContent: React.FC<PopupContentProps> = ({ pointNumber, popupNode }) => {
  const miniMapContainer = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<mapboxgl.Map | null>(null);

  const loadMap = () => {
    if (!miniMapContainer.current || miniMapRef.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    miniMapRef.current = new mapboxgl.Map({
      container: miniMapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.4165, 37.7554],
      zoom: 10,
      interactive: true,
      collectResourceTiming: false, 
    });
    
  };

  const unloadMap = () => {
    if (miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
    }
  };

  useEffect(() => {
    // Attach the loadMap and unloadMap functions to popupNode
    popupNode.loadMap = loadMap;
    popupNode.unloadMap = unloadMap;

    return () => {
      unloadMap(); // Clean up on unmount
      delete popupNode.loadMap;
      delete popupNode.unloadMap;
    };
  }, []);

  return (
    <div>
      <h3>Point {pointNumber}</h3>
      <p>This is a custom React component inside a Mapbox popup.</p>
      <div
        ref={miniMapContainer}
        style={{ width: "200px", height: "200px", marginTop: "10px" }}
      ></div>
    </div>
  );
};

export default PopupContent;
