export const UPDATE_BOUNDARIES = 'IMAGE-DOWNLOAD/UPDATE_BOUNDARIES';
export const UPDATE_FILE_TYPE = 'IMAGE-DOWNLOAD/UPDATE_FILE_TYPE';
export const UPDATE_WORLDFILE = 'IMAGE-DOWNLOAD/UPDATE_WORLDFILE';
export const UPDATE_RESOLUTION = 'IMAGE-DOWNLOAD/UPDATE_RESOLUTION';

export const resolutionsGeo = {
  values: [
    { value: '0.125', text: '30m' },
    { value: '0.25', text: '60m' },
    { value: '0.5', text: '125m' },
    { value: '1', text: '250m' },
    { value: '2', text: '500m' },
    { value: '4', text: '1km' },
    { value: '20', text: '5km' },
    { value: '40', text: '10km' },
  ],
};
export const resolutionsPolar = {
  values: [
    { value: '1', text: '250m' },
    { value: '2', text: '500m' },
    { value: '4', text: '1km' },
    { value: '20', text: '5km' },
    { value: '40', text: '10km' },
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

const GRATICLE_WARNING = 'The graticule layer cannot be used to take a snapshot. Would you '
  + 'like to temporarily hide this layer?';

const ROTATE_WARNING = 'Image may not be downloaded when rotated. Would you like to temporarily reset rotation?';

export const notificationWarnings = {
  palette: PALETTE_WARNING,
  graticule: GRATICLE_WARNING,
  rotate: ROTATE_WARNING,
};
