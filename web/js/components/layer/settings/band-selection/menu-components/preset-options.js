import React from 'react';
import {
  Card, CardImg, CardBody, CardTitle, CardText,
} from 'reactstrap';

const imgPath = 'images/layers/previews/geographic/';

const landsatPresets = [
  {
    id: 'HLS_True_Color_Landsat',
    title: 'True Color',
    r: 'B04',
    g: 'B03',
    b: 'B02',
    img: 'HLS_True_Color_Landsat.jpg',
  },
  {
    id: 'HLS_False_Color_Landsat',
    title: 'False Color',
    r: 'B05',
    g: 'B04',
    b: 'B03',
    img: 'HLS_False_Color_Landsat.jpg',
  },
  {
    id: 'HLS_False_Color_Urban_Landsat',
    title: 'False Color (Urban)',
    r: 'B07',
    g: 'B06',
    b: 'B04',
    img: 'HLS_False_Color_Urban_Landsat.jpg',
  },
  {
    id: 'FalseColorVegetation_landsat',
    title: 'False Color (Vegetation)',
    r: 'B06',
    g: 'B05',
    b: 'B04',
    img: 'HLS_False_Color_Vegetation_Landsat.jpg',
  },
  {
    id: 'HLS_Shortwave_Infrared_Landsat.jpg',
    title: 'Shortwave Infrared',
    r: 'B07',
    g: 'B05',
    b: 'B04',
    img: 'HLS_Shortwave_Infrared_Landsat.jpg',
  },
];

const sentinelPresets = [
  {
    id: 'HLS_True_Color_Sentinel',
    title: 'True Color',
    r: 'B04',
    g: 'B03',
    b: 'B02',
    img: 'HLS_True_Color_Sentinel.jpg',
  },
  {
    id: 'HLS_False_Color_Sentinel',
    title: 'False Color',
    r: 'B08',
    g: 'B04',
    b: 'B03',
    img: 'HLS_False_Color_Sentinel.jpg',
  },
  {
    id: 'HLS_False_Color_Urban_Sentinel',
    title: 'False Color (Urban)',
    r: 'B12',
    g: 'B11',
    b: 'B4',
    img: 'HLS_False_Color_Urban_Sentinel.jpg',
  },
  {
    id: 'HLS_False_Color_Vegetation_Sentinel',
    title: 'False Color (Vegetation)',
    r: 'B11',
    g: 'B8A',
    b: 'B04',
    img: 'HLS_False_Color_Vegetation_Sentinel.jpg',
  },
  {
    id: 'HLS_Shortwave_Infrared_Sentinel',
    title: 'Shortwave Infrared',
    r: 'B12',
    g: 'B8A',
    b: 'B04',
    img: 'HLS_Shortwave_Infrared_Sentinel.jpg',
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
