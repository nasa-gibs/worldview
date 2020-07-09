import * as olProj from 'ol/proj';
import OlFeature from 'ol/Feature';
import {
  Polygon as OlGeomPolygon,
} from 'ol/geom';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import {
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
  Text as OlText,
} from 'ol/style';

export default function granuleFootprint(map) {
  const self = {};
  self.currentGranule = {};
  self.vectorLayer = {};

  const vectorSource = new OlVectorSource({
    wrapX: false,
    useSpatialIndex: false,
  });
  self.getVectorLayer = (text) => new OlVectorLayer({
    className: 'granule-map-footprint',
    source: vectorSource,
    style: [
      new OlStyle({
        stroke: new OlStyleStroke({
          color: 'rgb(0, 123, 255, 0.65)',
          width: 5,
        }),
        text: new OlText({
          textAlign: 'center',
          text,
          font: '16px sans-serif',
          fill: new OlStyleFill({ color: 'white' }),
          stroke: new OlStyleStroke({ color: 'black', width: 1 }),
          overflow: true,
        }),
      }),
    ],
  });

  /*
   * Draw granule footprint
   *
   * @method drawFootprint
   * @static
   *
   * @param {array} granuleGeometry - array of granule points
   *  example: [
   *    ['73.512657', '67.650986'],
   *    ['-113.950806', '84.85434'],
   *    ['-35.026161', '68.983681'],
   *    ['27.586159', '59.548096'],
   *    ['73.512657', '67.650986']
   *  ]
   * @param {string} date - granule date
   * @param {string} projCodeCRS - string of projection CRS code
   *
   * @returns {void}
   */
  self.drawFootprint = (granuleGeometry, date, projCodeCRS) => {
    if (self.currentGranule[date]) {
      return;
    }

    if (!self.currentGranule[date]) {
      self.currentGranule = {};
      map.removeLayer(self.vectorLayer);
      vectorSource.clear();
    }

    if (!granuleGeometry || !date) {
      self.currentGranule = {};
      map.removeLayer(self.vectorLayer);
      vectorSource.clear();
      return;
    }
    self.currentGranule[date] = true;
    const flattened = (arr) => [].concat(...arr);

    const res = flattened(granuleGeometry);
    const points = [];

    // iterate the new array and push a coordinate pair into a new array
    for (let i = 0; i < res[0].length; i += 2) {
      const coord1 = parseFloat(res[i]);
      const coord2 = parseFloat(res[i + 1]);
      if (coord1 && coord2) {
        points.push(olProj.transform([coord1, coord2], 'EPSG:4326', projCodeCRS));
      }
    }

    // create polygon footprint
    const polygonFootprint = new OlGeomPolygon([points]);
    const featureFootprint = new OlFeature({
      geometry: polygonFootprint,
    });

    // add the feature vector to the layer vector
    vectorSource.addFeature(featureFootprint);
    // add text to vector layer and set current vector layer
    const newVectorLayer = self.getVectorLayer(date);
    self.vectorLayer = newVectorLayer;
    // add layer to map
    map.addLayer(self.vectorLayer);
  };

  return self;
}
