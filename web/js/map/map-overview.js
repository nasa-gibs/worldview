import OverviewMap from 'ol/control/OverviewMap';
import OlView from 'ol/View';
import * as olProj from 'ol/proj';
import OlLineString from 'ol/geom/LineString';
import Cache from 'cachai';
import OlFeature from 'ol/Feature';
import OlVectorLayer from 'ol/layer/Vector';
import OlVectorSource from 'ol/source/Vector';
import OlFill from 'ol/style/Fill';
import OlText from 'ol/style/Text';
import OlStyle from 'ol/style/Style';
import { getLine } from './util';
import util from '../util/util';

const font = '15px Open Sans Bold Arial, Unicode MS Bold';
const defaultExtent = [-180, -90, 180, 90];

const getStyle = (text, isLeft) => new OlStyle({
  text: new OlText({
    textAlign: isLeft ? 'right' : 'left',
    font,
    text, // date String,
    fill: new OlFill({ color: 'white' }),
    offsetX: isLeft ? -10 : 10,
  }),
});

export function getDatelineTextStyle(feature) {
  const leftText = feature.get('leftText');
  const rightText = feature.get('rightText');
  return [getStyle(leftText, true), getStyle(rightText, false)];
}

function createTextVectorLayer(source) {
  return new OlVectorLayer({
    source,
    zIndex: Infinity,
    wrapX: false,
    opacity: 1,
    style: getDatelineTextStyle,
  });
}
function createFeatureForText(date, x) {
  return new OlFeature({
    geometry: new OlLineString([[x, 300], [x, -300]]),
    leftText: util.toISOStringDate(util.dateAdd(date, 'day', 1)),
    rightText: util.toISOStringDate(date),
  });
}

export function getOverviewControl(def, date, projCRS, createLayer) {
  const minimapLineLayer1 = getLine([[-180, 300], [-180, -300]], 4, 'white', 0, [2, 5]);
  const minimapLineLayer2 = getLine([[180, 300], [180, -300]], 4, 'white', 0, [2, 5]);
  const feature1 = createFeatureForText(date, -180);
  const feature2 = createFeatureForText(util.dateAdd(date, 'day', -1), 180);
  const textLayerSource = new OlVectorSource({
    features: [
      feature1,
      feature2,
    ],
    wrapX: false,
  });
  const textLayer = createTextVectorLayer(textLayerSource);
  const backgroundLayer = createLayer(def, {
    matrixIds: [2, 3, 4, 5, 6, 7, 8],
    resolutions: [0.140625, 0.0703125, 0.03515625, 0.017578125, 0.0087890625, 0.00439453125, 0.002197265625],
    date,
    matrixLimit: '500m',
    extent: [-180, -90, 180, 90],
    isOverview: true,
  });
  backgroundLayer.setVisible(true);
  const map = new OverviewMap({
  // see in overviewmap-custom.html to see the custom CSS used
    className: 'ol-overviewmap ol-custom-overviewmap',
    layers: [
      minimapLineLayer1,
      minimapLineLayer2,
      backgroundLayer,
      textLayer,
    ],
    view: new OlView({
      projection: olProj.get(projCRS),
      resolutions: [1],
    }),

    collapseLabel: '\u00BB',
    label: '\u00AB',
    collapsed: false,

  });
  map.cache = new Cache();
  map.cache.setItem(`${util.toISOStringDate(date)}_-180`, feature1);
  map.cache.setItem(`${util.toISOStringDate(util.dateAdd(date, 'day', -1))}_180`, feature2);

  map.updateFeatures = (newDate, newExtent) => {
    const x1 = newExtent[0];
    const x2 = newExtent[2];
    const date1 = newDate;
    const date2 = util.dateAdd(newDate, 'day', -1);
    const key1 = `${util.toISOStringDate(date1)}_${x1}`;
    const key2 = `${util.toISOStringDate(date2)}_${x2}`;
    const featurePropArray = [
      { key: key1, x: x1, date: date1 },
      { key: key2, x: x2, date: date2 },
    ];
    featurePropArray.forEach((featureProps) => {
      const { key, x, date } = featureProps;
      const cachedFeature = map.cache.getItem(key);
      if (!cachedFeature) {
        const feature = createFeatureForText(date, x);
        textLayerSource.addFeature(feature);
        map.cache.setItem(key, true);
      }
    });
  };
  map.updateDate = (newDate) => {
    textLayerSource.clear(); // remove all features from text layer
    map.cache.clear(); // clear feature cache
    map.updateFeatures(newDate, defaultExtent);
  };
  return map;
}
