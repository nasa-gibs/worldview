import React from 'react';
import {
  Card, CardImg, CardBody, CardTitle, CardText,
} from 'reactstrap';

const imgPath = 'images/band-combination-presets/';

const landsatPresets = [
  {
    id: 'naturalColor',
    title: 'Natural Color',
    r: 'BO4',
    g: 'BO3',
    b: 'BO2',
    img: 'naturalColor.png',
  },
  {
    id: 'colorInfrared',
    title: 'Color Infrared (CIR)',
    r: 'BO5',
    g: 'BO4',
    b: 'BO3',
    img: 'colorInfrared.png',
  },
  {
    id: 'falseColorUrban',
    title: 'False Color (Urban)',
    r: 'BO7',
    g: 'BO6',
    b: 'BO4',
    img: 'falseColorUrban.png',
  },
  {
    id: 'FalseColorVegetation',
    title: 'False Color (Vegetation)',
    r: 'BO6',
    g: 'BO5',
    b: 'BO4',
    img: 'FalseColorVegetation.png',
  },
  {
    id: 'shortwaveInfrared',
    title: 'Shortwave Infrared',
    r: 'BO7',
    g: 'BO5',
    b: 'BO4',
    img: 'shortwaveInfrared.png',
  },
];

export default function PresetOptions({ setBandSelection, selectedPreset, setSelectedPreset }) {
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setBandSelection({
      r: preset.r,
      g: preset.g,
      b: preset.b,
    });
  };

  return (
    <div className="band-selection-presets-container">
      <div className="band-selection-presets-title-row">
        <p>Other selectable presets (optional):</p>
      </div>
      <div className="band-selection-presets-scrollable">
        {landsatPresets.map((preset) => (
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
