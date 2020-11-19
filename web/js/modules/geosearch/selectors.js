import OlPoint from 'ol/geom/Point';
import OlFeature from 'ol/Feature';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import {
  Style as OlStyle,
  Icon as OlIcon,
} from 'ol/style';
import { containsXY } from 'ol/extent';
import { coordinatesCRSTransform } from '../projection/util';

// animate coordinates marker
export function animateCoordinates(map, config, coordinates, zoom) {
  const { projections } = config;
  const { selected } = map.ui;
  const { proj } = selected;
  const { crs } = projections[proj];

  let [x, y] = coordinates;
  if (proj !== 'geographic') {
    [x, y] = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
  }
  map.ui.animate.fly([x, y], zoom);
}

// check if coordinates are within selected map extent
export function areCoordinatesWithinExtent(map, config, coordinates) {
  const { projections } = config;
  const { selected } = map.ui;
  const { proj } = selected;
  const { maxExtent, crs } = projections[proj];

  let [x, y] = coordinates;
  if (proj !== 'geographic') {
    const transformedXY = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
    [x, y] = transformedXY;
  }
  const coordinatesWithinExtent = containsXY(maxExtent, x, y);
  return coordinatesWithinExtent;
}

// add coordinates marker
export function addCoordinatesMarker(activeMarker, config, map, coordinates, reverseGeocodeResults) {
  const { projections } = config;
  const { selected } = map.ui;
  const { proj } = selected;
  const { crs } = projections[proj];

  // remove any markers
  removeCoordinatesMarker(activeMarker, map);

  // only add marker within current map extent
  const coordinatesWithinExtent = areCoordinatesWithinExtent(map, config, coordinates);
  if (!coordinatesWithinExtent) {
    return false;
  }

  // transform coordinates if not CRS EPSG:4326
  let transformedCoordinates = false;
  if (proj !== 'geographic') {
    transformedCoordinates = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
  }

  // create Ol vector layer map pin
  const marker = createPin(coordinates, transformedCoordinates, reverseGeocodeResults);
  selected.addLayer(marker);
  selected.renderSync();
  return marker;
}

// remove coordinates tooltip from all projections
export function removeCoordinatesOverlayFromAllProjections(proj) {
  const mapProjections = Object.keys(proj);
  mapProjections.forEach((mapProjection) => {
    const mapOverlays = proj[mapProjection].getOverlays().getArray();
    const coordinatesTooltipOverlay = mapOverlays.filter((overlay) => {
      const { id } = overlay;
      return id && id.includes('coordinates-map-marker');
    });
    if (coordinatesTooltipOverlay.length > 0) {
      proj[mapProjection].removeOverlay(coordinatesTooltipOverlay[0]);
    }
  });
}

// remove coordinates marker
export function removeCoordinatesMarker(activeMarker, map) {
  const { selected, proj } = map.ui;
  // remove marker
  if (activeMarker) {
    activeMarker.setMap(null);
    selected.removeLayer(activeMarker);
  }
  // remove tooltip from all projections
  removeCoordinatesOverlayFromAllProjections(proj);
}

// create Ol vector layer map pin
const createPin = function(coordinates, transformedCoordinates = false, reverseGeocodeResults = {}) {
  const [longitude, latitude] = coordinates;
  const iconFeature = new OlFeature({
    geometry: new OlPoint(transformedCoordinates || coordinates),
    reverseGeocodeResults,
    latitude,
    longitude,
  });

  const iconStyle = new OlStyle({
    image: new OlIcon({
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      scale: 0.5,
      src: 'images/map-pin.png',
    }),
  });

  iconFeature.setStyle(iconStyle);
  iconFeature.setId('coordinates-map-marker');

  const vectorSource = new OlSourceVector({
    wrapX: false,
    features: [iconFeature],
  });
  const vectorLayer = new OlLayerVector({
    source: vectorSource,
  });

  return vectorLayer;
};
