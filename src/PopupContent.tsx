// PopupContent.tsx
import React from "react";

interface PopupContentProps {
  pointNumber: number;
}

const PopupContent: React.FC<PopupContentProps> = ({ pointNumber }) => {
  return (
    <div>
      <h3>Point {pointNumber}</h3>
      <p>This is a custom React component inside a Mapbox popup.</p>
    </div>
  );
};

export default PopupContent;