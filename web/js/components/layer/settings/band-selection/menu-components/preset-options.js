import React from 'react';
import {
  Card, CardImg, CardBody, CardTitle, CardText,
} from 'reactstrap';

const imgPath = 'images/layers/previews/geographic/';

const landsatPresets = [
  {
    id: 'HLS_False_Color_Landsat',
    title: 'Color Infrared',
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
  {
    id: 'HLS_NDVI_Landsat.jpg',
    title: 'Vegetation Index (NDVI)',
    assets: ['B05', 'B04'],
    expression: '(B05-B04)/(B05+B04)',
    rescale: '-1,1',
    colormap_name: 'greens',
    img: 'HLS_NDVI_Landsat.jpg',
  },
  {
    id: 'HLS_NDWI_Landsat.jpg',
    title: 'Water Index (NDWI)',
    assets: ['B05', 'B03'],
    expression: '(B03-B05)/(B03+B05)',
    rescale: '-1,1',
    colormap_name: 'gnbu',
    img: 'HLS_NDWI_Landsat.jpg',
  },
  {
    id: 'HLS_NDSI_Landsat.jpg',
    title: 'Snow Index (NDSI)',
    assets: ['B03', 'B06'],
    expression: '(B03-B06)/(B03+B06)',
    rescale: '-1,1',
    colormap_name: 'winter_r',
    img: 'HLS_NDSI_Landsat.jpg',
  },
  {
    id: 'HLS_Moisture_Index_Landsat.jpg',
    title: 'Moisture Index (NDMI)',
    assets: ['B05', 'B06'],
    expression: '(B05-B06)/(B05+B06)',
    rescale: '-1,1',
    colormap_name: 'jet_r',
    img: 'HLS_Moisture_Index_Landsat.jpg',
  },

];

const sentinelPresets = [
  {
    id: 'HLS_False_Color_Sentinel',
    title: 'Color Infrared',
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
    b: 'B04',
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
    img: 'HLS_SWIR_Sentinel.jpg',
  },
  {
    id: 'HLS_NDVI_Sentinel.jpg',
    title: 'Vegetation Index (NDVI)',
    assets: ['B08', 'B04'],
    expression: '(B08-B04)/(B08+B04)',
    rescale: '-1,1',
    colormap_name: 'greens',
    asset_as_band: true,
    img: 'HLS_NDVI_Sentinel.jpg',
  },
  {
    id: 'HLS_NDWI_Sentinel.jpg',
    title: 'Water Index (NDWI)',
    assets: ['B08', 'B03'],
    expression: '(B03-B08)/(B03+B08)',
    rescale: '-1,1',
    colormap_name: 'gnbu',
    asset_as_band: true,
    img: 'HLS_NDWI_Sentinel.jpg',
  },
  {
    id: 'HLS_NDSI_Sentinel.jpg',
    title: 'Snow Index (NDSI)',
    assets: ['B03', 'B11'],
    expression: '(B03-B11)/(B03+B11)',
    rescale: '-1,1',
    colormap_name: 'winter_r',
    asset_as_band: true,
    img: 'HLS_NDSI_Sentinel.jpg',
  },
  {
    id: 'HLS_Moisture_Index_Sentinel.jpg',
    title: 'Moisture Index (NDMI)',
    assets: ['B8A', 'B11'],
    expression: '(B8A-B11)/(B8A+B11)',
    rescale: '-1,1',
    colormap_name: 'jet_r',
    asset_as_band: true,
    img: 'HLS_Moisture_Index_Sentinel.jpg',
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
      assets: preset.assets,
      expression: preset.expression,
      rescale: preset.rescale,
      colormap_name: preset.colormap_name,
      asset_as_band: preset.asset_as_band,
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
              {
                !preset.expression
                  ? <CardText>{`R: ${preset.r}, G: ${preset.g}, B: ${preset.b}`}</CardText>
                  : <CardText>{preset.expression}</CardText>
              }
            </CardBody>
          </Card>
        ))}
      </div>

    </div>
  );
}
