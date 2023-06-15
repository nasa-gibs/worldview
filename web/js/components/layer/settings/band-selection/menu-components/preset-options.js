import React, { useState } from 'react';

const landsatPresets = [
  {
    id: 'naturalColor',
    title: 'Natural Color',
    r: 'BO4',
    g: 'BO3',
    b: 'BO2',
  },
  {
    id: 'colorInfrared',
    title: 'Color Infrared (CIR)',
    r: 'BO5',
    g: 'BO4',
    b: 'BO3',
  },
  {
    id: 'falseColorUrban',
    title: 'False Color (Urban)',
    r: 'BO7',
    g: 'BO6',
    b: 'BO4',
  },
  {
    id: 'FalseColorVegetation',
    title: 'False Color (Vegetative Analysis)',
    r: 'BO6',
    g: 'BO5',
    b: 'BO4',
  },
  {
    id: 'shortwaveInfrared',
    title: 'Shortwave Infrared',
    r: 'BO7',
    g: 'BO5',
    b: 'BO4',
  },
];

export default function PresetOptions() {
  return (
    <div className="band-selection-presets-container">
      <div className="band-selection-presets-title-row">
        <p>Other Presets:</p>
      </div>

    </div>
  );
}
