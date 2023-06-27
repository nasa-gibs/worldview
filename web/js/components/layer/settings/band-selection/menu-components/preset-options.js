import React from 'react';
import {
  Card, CardImg, CardBody, CardTitle, CardText,
} from 'reactstrap';

const imgPath = 'images/band-combination-presets/';

const landsatPresets = [
  {
    id: 'naturalColor_landsat',
    title: 'Natural Color',
    r: 'B04',
    g: 'B03',
    b: 'B02',
    img: 'naturalColor_landsat.png',
  },
  {
    id: 'colorInfrared_landsat',
    title: 'Color Infrared (CIR)',
    r: 'B05',
    g: 'B04',
    b: 'B03',
    img: 'colorInfrared_landsat.png',
  },
  {
    id: 'falseColorUrban_landsat',
    title: 'False Color (Urban)',
    r: 'B07',
    g: 'B06',
    b: 'B04',
    img: 'falseColorUrban_landsat.png',
  },
  {
    id: 'FalseColorVegetation_landsat',
    title: 'False Color (Vegetation)',
    r: 'B06',
    g: 'B05',
    b: 'B04',
    img: 'FalseColorVegetation_landsat.png',
  },
  {
    id: 'shortwaveInfrared_landsat',
    title: 'Shortwave Infrared',
    r: 'B07',
    g: 'B05',
    b: 'B04',
    img: 'shortwaveInfrared_landsat.png',
  },
];

const sentinelPresets = [
  {
    id: 'trueColor_sentinel',
    title: 'True Color',
    r: 'B04',
    g: 'B03',
    b: 'B02',
    img: 'trueColor_sentinel.png',
  },
  {
    id: 'falseColor_sentinel',
    title: 'False Color',
    r: 'B08',
    g: 'B04',
    b: 'B03',
    img: 'falseColor_sentinel.png',
  },
  {
    id: 'falseColorUrban_sentinel',
    title: 'False Color Urban',
    r: 'B12',
    g: 'B11',
    b: 'B4',
    img: 'falseColorUrban_sentinel.png',
  },
  {
    id: 'SWIR_sentinel',
    title: 'SWIR',
    r: 'B12',
    g: 'B8A',
    b: 'B04',
    img: 'SWIR_sentinel.png',
  },
];

export default function PresetOptions(props) {
  const {
    setBandSelection, selectedPreset, setSelectedPreset, presetOptions,
  } = props;
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setBandSelection({
      r: preset.r,
      g: preset.g,
      b: preset.b,
    });
  };

  const presets = presetOptions === 'landsat' ? landsatPresets : sentinelPresets;

  return (
    <div className="band-selection-presets-container">
      <div className="band-selection-presets-title-row">
        <p>Other selectable presets (optional):</p>
      </div>
      <div className="band-selection-presets-scrollable">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            className={`band-selection-preset-card ${preset.id === selectedPreset?.id ? 'selected-preset' : ''}`}
          >
            <CardImg top className="band-selection-preset-image" src={imgPath + preset.img} alt={preset.title} />
            <CardBody>
              <CardTitle tag="h5">{preset.title}</CardTitle>
              <CardText>{`R: ${preset.r}, G: ${preset.g}, B: ${preset.b}`}</CardText>
            </CardBody>
          </Card>
        ))}
      </div>

    </div>
  );
}
