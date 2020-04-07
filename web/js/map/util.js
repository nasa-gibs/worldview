import OlStyle from 'ol/style/Style';
import OlStroke from 'ol/style/Stroke';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OlFeature from 'ol/Feature';
import LineString from 'ol/geom/LineString';

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
  for (let i = 0, len = array.length; i < len; i++) {
    const layerGroup = array[i];
    if (layerGroup.get('group') === layerGroupString) {
      group = layerGroup;
      break;
    }
  }
  return group;
}
export function clearLayers(map) {
  const layersArray = map.getLayers().getArray();
  layersArray.forEach((layer) => {
    map.removeLayer(layer);
  });
  return map;
}
function getLineStyle(color, width, lineDash) {
  return new OlStyle({
    stroke: new OlStroke({
      color,
      width,
      lineDash: lineDash || undefined,
    }),
  });
}
export function getLine(coordinateArray, width, color, opacity, lineDash) {
  return new VectorLayer({
    source: new VectorSource({
      features: [new OlFeature({
        geometry: new LineString(coordinateArray),
      })],
    }),
    zIndex: Infinity,
    opacity: opacity || 1,
    wrapX: true,
    style: [getLineStyle('black', width, lineDash), getLineStyle(color, width / 2, lineDash)],
  });
}
