import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import util from '../../../../util/util';
import { drawTravelModePaletteOnCanvas } from '../../../../modules/palettes/util';

function ColorBarRow({ layerID, legend, index }) {
  const canvasRef = useRef(null);
  const width = 400;
  const height = 40;

  useEffect(() => {
    if (legend.type === 'continuous' || legend.type === 'discrete') {
      drawOnCanvas(canvasRef, legend, width, height);
    }
  }, [legend]);

  const drawOnCanvas = (canvasRef, colorMap, width, height) => {
    if (canvasRef.current && colorMap) {
      const ctx = canvasRef.current.getContext('2d');
      drawTravelModePaletteOnCanvas(ctx, colorMap.colors, width, height);
    }
  };

  return (
    <div className="travel-mode-colorbar-row" datalayer={layerID} key={index}>
      <div id="travel-mode-colorbar-case">
        <canvas
          id={`${util.encodeId(layerID)}-${util.encodeId(legend.id)}${index}colorbar`}
          width={width}
          height={height}
          ref={canvasRef}
        />
      </div>
    </div>
  );
}

function TravelModeColorbars() {
  const palettes = useSelector((state) => state.palettes.rendered);

  return (
    <div id="travel-mode-colorbar-container">
      {Object.values(palettes).map((layer, index) => {
        const layerID = layer.id;
        const legend = layer.maps[0].legend;
        return (
          <ColorBarRow
            key={index}
            layerID={layerID}
            legend={legend}
            index={index}
          />
        );
      })}
    </div>
  );
}

export default TravelModeColorbars;
