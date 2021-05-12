import { RESOLUTION_FOR_LARGE_WMS_TILES, RESOLUTION_FOR_SMALL_WMS_TILES } from '../modules/map/constants';
import util from '../util/util';

const ZOOM_DURATION = 250;

/*
 * Setting a zoom action
 *
 * @function self.zoomAction
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} amount - Direction and
 *  amount to zoom
 * @param {number} duation - length of animation
 * @param {array} center - point to center zoom
 *
 * @returns {void}
 */
export function mapUtilZoomAction(map, amount, duration, center) {
  const zoomDuration = duration || ZOOM_DURATION;
  const centerPoint = center || undefined;
  const view = map.getView();
  const zoom = view.getZoom();
  const minZoom = view.getMinZoom();
  const maxZoom = view.getMaxZoom();

  let newZoom = zoom + amount;
  const newZoomBelowMin = newZoom < minZoom;
  const newZoomExceedsMax = newZoom > maxZoom;
  // if newZoom is animating, it may not be an integer
  // and will require revising to within min/max zoom constraints
  if (zoom < maxZoom && newZoomExceedsMax) {
    newZoom = maxZoom;
  } else if (zoom > minZoom && newZoomBelowMin) {
    newZoom = minZoom;
  } else if (newZoomExceedsMax || newZoomBelowMin) {
    return;
  }

  const isAnimating = view.getAnimating();
  view.animate({
    zoom: newZoom,
    duration: isAnimating ? 0 : zoomDuration,
    center: centerPoint,
  });
}

/**
 *
 * @param {Array} tileSize Size of tile to be returned in pixels
 *
 * @returns {Array} WMS Layer resolutions
 */
export function getGeographicResolutionWMS(tileSize) {
  if (!tileSize || !tileSize.length) return RESOLUTION_FOR_LARGE_WMS_TILES;
  return tileSize[0] === 256 ? RESOLUTION_FOR_SMALL_WMS_TILES : RESOLUTION_FOR_LARGE_WMS_TILES;
}
/**
 * getActiveLayerGroup
 * @param {Object} map
 * @param {string} layerGroupString
 *
 * @return {Object} group
 */
export function getActiveLayerGroup(map, layerGroupString) {
  let group = null;
  const array = map.getLayers().getArray();
  for (let i = 0, len = array.length; i < len; i += 1) {
    const layerGroup = array[i];
    if (layerGroup.get('group') === layerGroupString) {
      group = layerGroup;
      break;
    }
  }
  return group;
}

/**
 * Create x/y/z vectortile requester url
 * @param {Date} date
 * @param {string} layerName
 * @param {String} tileMatrixSet
 *
 * @return {String} URL
 */
export function createVectorUrl(date, layerName, tileMatrixSet) {
  const time = util.toISOStringSeconds(util.roundTimeOneMinute(date));
  const params = [
    `TIME=${time}`,
    `layer=${layerName}`,
    `tilematrixset=${tileMatrixSet}`,
    'Service=WMTS',
    'Request=GetTile',
    'Version=1.0.0',
    'FORMAT=application%2Fvnd.mapbox-vector-tile',
    'TileMatrix={z}',
    'TileCol={x}',
    'TileRow={y}',
  ];
  return `?${params.join('&')}`;
}

/**
 *
 * @param {Object} def
 * @param {String} projId
 */
export function mergeBreakpointLayerAttributes(def, projId) {
  const { breakPointLayer } = def;
  if (breakPointLayer) {
    const updatedBreakPointLayer = { ...breakPointLayer, ...breakPointLayer.projections[projId] };
    return { ...def, breakPointLayer: updatedBreakPointLayer };
  } return def;
}

/**
   *
   * @param {*} currentDeg
   * @param {*} currentView
   */
export function saveRotation(currentDeg, currentView) {
  if (Math.abs(currentDeg) === 360) {
    currentView.setRotation(0);
  } else if (Math.abs(currentDeg) >= 360) {
    const newNadVal = (360 - Math.abs(currentDeg)) * (Math.PI / 180);
    if (currentDeg < 0) {
      currentView.setRotation(newNadVal);
    } else {
      currentView.setRotation(-newNadVal);
    }
  }
}
