const GEO_ESTIMATION_CONSTANT = 256.0;
const POLAR_ESTIMATION_CONSTANT = 0.002197265625;

/*
 * Estimate appropriate Resolution based on zoom
 * This is only run if user has not already selected
 * a resolution
 */
export function imageUtilCalculateResolution(zoom, isGeoProjection, resolutions) {
  var resolution;
  var resolutionEstimate;
  var nZoomLevels = resolutions.length;
  var currentZoom = zoom < 0 ? 0 : zoom;
  var curResolution = (currentZoom >= nZoomLevels)
    ? resolutions[nZoomLevels - 1]
    : resolutions[currentZoom];

  // Estimate the option value used by "wv-image-resolution"
  resolutionEstimate = imageUtilEstimateResolution(curResolution, isGeoProjection);

  // Find the closest match of resolution within the available values
  var possibleResolutions = (isGeoProjection)
    ? [0.125, 0.25, 0.5, 1, 2, 4, 20, 40]
    : [1, 2, 4, 20, 40];
  var bestDiff = Infinity;
  var bestIdx = -1;
  var currDiff = 0;
  for (var i = 0; i < possibleResolutions.length; i++) {
    currDiff = Math.abs(possibleResolutions[i] - resolutionEstimate);
    if (currDiff < bestDiff) {
      resolution = possibleResolutions[i];
      bestDiff = currDiff;
      bestIdx = i;
    }
  }

  // Bump up resolution in certain cases where default is too low
  if (bestIdx > 0) {
    if (isGeoProjection) {
      switch (currentZoom) {
        case 3:
        case 4:
        case 6:
        case 7:
          resolution = possibleResolutions[bestIdx - 1];
      }
    } else {
      switch (currentZoom) {
        case 1:
        case 2:
        case 4:
        case 5:
          resolution = possibleResolutions[bestIdx - 1];
      }
    }
  }
  return resolution.toString();
};

/*
 * Gets active layers by day
 *
 * @method getLayersForDay
 * @private
 *
 * @param {array} array of layers
 *
 * @returns {array} array of layer ids
 *
 */
export function imageUtilGetLayers(layers, proj) {
  var result = [];
  layers.forEach((layer) => {
    if (layer.projections[proj].layer) {
      result.push(layer.projections[proj].layer);
    } else {
      result.push(layer.id);
    }
  });
  return result;
};

/*
 * Gets opacities from palettes
 *
 * @method getOpacities
 * @private
 *
 * @param {array} array of layers
 *
 * @returns {array} array of opacities
 *
 */
export function imageUtilGetLayerOpacities(layers) {
  const result = [];
  let hasOpacity = false;
  layers.forEach((layer) => {
    if ('opacity' in layer && layer.opacity !== 1) {
      hasOpacity = true;
      result.push(layer.opacity);
    } else {
      result.push('');
    }
  });
  // If no layers have an opacity set, return null and the caller can
  // omit this parameter in the request
  if (!hasOpacity) {
    return null;
  }
  return result;
};

export function imageUtilEstimateResolution(resolution, isGeoProjection) {
  return (isGeoProjection) ? resolution / POLAR_ESTIMATION_CONSTANT : resolution / GEO_ESTIMATION_CONSTANT;
}
export function imageUtilGetConversionFactor (proj) {
  if (proj === 'geographic') return 0.002197;
  return 256;
};

/*
 * Retieves coordinates from pixel
 *
 * @method getCoords
 * @private
 *
 * @returns {array} array of coords
 *
 */
export function imageUtilGetCoordsFromPixelValues (pixels, map) {
  return [
    map.getCoordinateFromPixel([Math.floor(pixels.x), Math.floor(pixels.y2)]),
    map.getCoordinateFromPixel([Math.floor(pixels.x2), Math.floor(pixels.y)])
  ];
};
