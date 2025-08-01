export const UPDATE_BOUNDARIES = 'IMAGE-DOWNLOAD/UPDATE_BOUNDARIES';
export const UPDATE_FILE_TYPE = 'IMAGE-DOWNLOAD/UPDATE_FILE_TYPE';
export const UPDATE_WORLDFILE = 'IMAGE-DOWNLOAD/UPDATE_WORLDFILE';
export const UPDATE_RESOLUTION = 'IMAGE-DOWNLOAD/UPDATE_RESOLUTION';

export const resolutionsGeo = {
  values: [
    { value: '30', text: '30m' },
    { value: '60', text: '60m' },
    { value: '125', text: '125m' },
    { value: '250', text: '250m' },
    { value: '500', text: '500m' },
    { value: '1000', text: '1km' },
    { value: '5000', text: '5km' },
    { value: '10000', text: '10km' },
  ],
};
export const resolutionsPolar = {
  values: [
    { value: '250', text: '250m' },
    { value: '500', text: '500m' },
    { value: '1000', text: '1km' },
    { value: '5000', text: '5km' },
    { value: '10000', text: '10km' },
  ],
};
export const fileTypesGeo = {
  values: [
    { value: 'image/jpeg', text: 'JPEG' },
    { value: 'image/png', text: 'PNG' },
    { value: 'image/tiff', text: 'GeoTIFF' },
    { value: 'application/vnd.google-earth.kmz', text: 'KMZ' },
  ],
};
export const fileTypesPolar = {
  values: [
    { value: 'image/jpeg', text: 'JPEG' },
    { value: 'image/png', text: 'PNG' },
    { value: 'image/tiff', text: 'GeoTIFF' },
  ],
};
export const maxSize = 8200;

const PALETTE_WARNING = 'One or more layers on the map have been modified (changed palette, '
  + 'thresholds, etc.). These modifications cannot be used to take a '
  + 'snapshot. Would you like to temporarily revert to the original '
  + 'layer(s)?';

const ROTATE_WARNING = 'Image may not be downloaded when rotated. Would you like to temporarily reset rotation?';

export const notificationWarnings = {
  palette: PALETTE_WARNING,
  rotate: ROTATE_WARNING,
};

export const GDAL_WASM_PATH = 'gdal3js';

export const DRIVER_DICT = {
  tiff: 'GTiff',
  tif: 'GTiff',
  jpg: 'JPEG',
  jpeg: 'JPEG',
  png: 'PNG',
};

