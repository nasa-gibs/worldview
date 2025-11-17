export const UPDATE_BOUNDARIES = 'IMAGE-DOWNLOAD/UPDATE_BOUNDARIES';
export const UPDATE_FILE_TYPE = 'IMAGE-DOWNLOAD/UPDATE_FILE_TYPE';
export const UPDATE_WORLDFILE = 'IMAGE-DOWNLOAD/UPDATE_WORLDFILE';
export const UPDATE_RESOLUTION = 'IMAGE-DOWNLOAD/UPDATE_RESOLUTION';

export const RESOLUTIONS_GEO = {
  values: [
    { value: 0.075, text: '0.075m' },
    { value: 0.3, text: '0.3m' },
    { value: 30, text: '30m', tileMatrixID: 11 },
    { value: 60, text: '60m', tileMatrixID: 10 },
    { value: 125, text: '125m', tileMatrixID: 9 },
    { value: 250, text: '250m', tileMatrixID: 8 },
    { value: 500, text: '500m', tileMatrixID: 7 },
    { value: 1000, text: '1km', tileMatrixID: 6 },
    { value: 5000, text: '5km', tileMatrixID: 5 },
    { value: 10000, text: '10km', tileMatrixID: 4 },
  ],
};
export const RESOLUTIONS_POLAR = {
  values: [
    { value: 250, text: '250m', tileMatrixID: 5 },
    { value: 500, text: '500m', tileMatrixID: 4 },
    { value: 1000, text: '1km', tileMatrixID: 3 },
    { value: 5000, text: '5km', tileMatrixID: 2 },
    { value: 10000, text: '10km', tileMatrixID: 1 },
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

export const GDAL_WASM_PATH = 'build/gdal3js';

export const DRIVER_DICT = {
  tiff: 'GTiff',
  tif: 'GTiff',
  jpg: 'JPEG',
  jpeg: 'JPEG',
  png: 'PNG',
};

