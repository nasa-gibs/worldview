import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { drawTravelModePaletteOnCanvas } from '../../../../modules/palettes/util';

function ColorBarRow({ legend, index }) {
  const canvasRef = useRef(null);
  const width = 400;
  const height = 40;

  const {
    minLabel, maxLabel, units, type, title, colors,
  } = legend;
  const minimum = `${minLabel} ${units}`;
  const maximum = `${maxLabel} ${units}`;

  const drawOnCanvas = () => {
    if (canvasRef.current && legend) {
      const ctx = canvasRef.current.getContext('2d');
      drawTravelModePaletteOnCanvas(ctx, colors, width, height);
    }
  };

  useEffect(() => {
    if (type === 'continuous' || type === 'discrete') {
      drawOnCanvas();
    }
  }, [legend]);

  return (
    <div className="travel-mode-colorbar-row" key={index}>
      <div className="travel-mode-colorbar-title">{title}</div>
      <div className="travel-mode-colorbar-case">
        <canvas
          className="travel-mode-colorbar"
          width={width}
          height={height}
          ref={canvasRef}
        />
      </div>
      <div className="travel-mode-colorbar-label-container">
        <div className="travel-mode-colorbar-labels">
          <div className="travel-mode-colorbar-min-label">{minimum}</div>
          <div className="travel-mode-colorbar-max-label">{maximum}</div>
        </div>
      </div>
    </div>
  );
}

function TravelModeColorbars() {
  const activePalettes = useSelector((state) => state.palettes.active);
  const renderedPalettes = useSelector((state) => state.palettes.rendered);

  // custom palettes will be found in activePalettes
  let palettes = renderedPalettes;
  if (Object.keys(activePalettes).length > 0) {
    palettes = activePalettes;
  }

  if (!palettes) return null;

  return (
    <div id="travel-mode-colorbar-container">
      {Object.values(palettes).map((layer) => {
        const layerID = layer.id;
        return layer.maps.map((mapItem, index) => {
          const { legend } = mapItem;
          return (
            <ColorBarRow
              key={`${layerID}-${legend.id}`}
              legend={legend}
              index={index}
            />
          );
        });
      })}
    </div>
  );
}

export default TravelModeColorbars;
