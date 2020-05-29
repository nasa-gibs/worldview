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
  view.animate({
    zoom: zoom + amount,
    duration: zoomDuration,
    center: centerPoint,
  });
}
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
    `Service=WMTS`,
    `Request=GetTile`,
    `Version=1.0.0`,
    `FORMAT=application%2Fvnd.mapbox-vector-tile`,
    `TileMatrix={z}`,
    `TileCol={x}`,
    `TileRow={y}`,
  ]
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
