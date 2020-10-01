import OlPoint from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import OlFeature from 'ol/Feature';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import * as olProj from 'ol/proj';
import { containsXY } from 'ol/extent';

export function animateCoordinates(map, coordinates, zoom) {
  const { ui } = map;
  const { proj } = ui.selected;
  let targetCoordinates = coordinates;
  if (proj !== 'geographic') {
    targetCoordinates = polarCoordinatesTransform(coordinates, proj);
  }
  ui.animate.fly(targetCoordinates, zoom);
}

function polarCoordinatesTransform(coordinates, proj) {
  const projObj = {
    arctic: 'EPSG:3413',
    antarctic: 'EPSG:3031',
  };
  return olProj.transform(coordinates, 'EPSG:4326', projObj[proj]);
}

export function areCoordinatesWithinExtent(map, config, coordinates) {
  const { projections } = config;
  const { selected } = map.ui;
  const projMaxExtent = projections[selected.proj].maxExtent;

  let coordinatesWithinExtent;
  let transformedCoordinates;
  if (selected.proj !== 'geographic') {
    transformedCoordinates = polarCoordinatesTransform(coordinates, selected.proj);
    coordinatesWithinExtent = containsXY(projMaxExtent, transformedCoordinates[0], transformedCoordinates[1]);
  } else {
    coordinatesWithinExtent = containsXY(projMaxExtent, coordinates[0], coordinates[1]);
  }
  return {
    coordinatesWithinExtent,
    transformedCoordinates,
  };
}

export function addCoordinatesMarker(activeMarker, config, map, coordinates, reverseGeocodeResults) {
  const { selected } = map.ui;

  removeCoordinatesMarker(activeMarker, map);

  const { coordinatesWithinExtent, transformedCoordinates } = areCoordinatesWithinExtent(map, config, coordinates);
  if (!coordinatesWithinExtent) {
    return false;
  }

  const marker = createPin(coordinates, transformedCoordinates, reverseGeocodeResults, 'testerMarker', true);
  selected.addLayer(marker);
  selected.renderSync();
  return marker;
}

export function removeCoordinatesMarker(activeMarker, map) {
  const { selected } = map.ui;
  if (activeMarker) {
    activeMarker.setMap(null);
    selected.removeLayer(activeMarker);
  }
}

const createPin = function(coordinates, transformedCoordinates = false, reverseGeocodeResults = {}, id, isSelected, category = { slug: 'test', title: 'cat' }, title) {
  const overlayEl = document.createElement('div');
  const icon = document.createElement('i');
  overlayEl.className = 'marker';
  if (isSelected) overlayEl.classList.add('marker-selected');
  icon.className = `event-icon event-icon-${category.slug}`;
  icon.title = title || category.title;
  overlayEl.appendChild(icon);

  const [longitude, latitude] = coordinates;
  const iconFeature = new OlFeature({
    geometry: new OlPoint(transformedCoordinates || coordinates),
    reverseGeocodeResults,
    latitude,
    longitude,
    population: 4000,
    rainfall: 500,
  });

  const iconStyle = new Style({
    image: new Icon({
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      scale: 0.5,
      src: 'images/map-pin.png',
    }),
  });

  iconFeature.setStyle(iconStyle);
  iconFeature.setId('coordinates-map-maker');
  const vectorSource = new OlSourceVector({
    wrapX: false,
    features: [iconFeature],
  });

  const vectorLayer = new OlLayerVector({
    source: vectorSource,
  });

  return vectorLayer;
};

const GEOCODE_OPTIONS = {
  urlBase: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
  requestOptions: {
    method: 'GET',
    redirect: 'follow',
  },
};

export async function suggest(val) {
  const { requestOptions, urlBase } = GEOCODE_OPTIONS;

  try {
    const response = await fetch(`${urlBase}suggest?text=${val}&f=json`, requestOptions);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}

export async function processMagicKey(magicKey) {
  const { requestOptions, urlBase } = GEOCODE_OPTIONS;

  try {
    const response = await fetch(`${urlBase}findAddressCandidates?f=json&magicKey=${magicKey}=`, requestOptions);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}

export async function reverseGeocode(coordinates) {
  const { requestOptions, urlBase } = GEOCODE_OPTIONS;
  console.log(`${urlBase}reverseGeocode?location=${coordinates}&f=json`);
  try {
    const response = await fetch(`${urlBase}reverseGeocode?location=${coordinates}&f=json`, requestOptions);

    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}
