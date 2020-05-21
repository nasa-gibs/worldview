import * as olProj from 'ol/proj';
import OlFeature from 'ol/Feature';
import {
  Polygon as OlGeomPolygon
} from 'ol/geom';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import {
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
  Text as OlText
} from 'ol/style';

export function granuleFootprint(map, mapUiEvents, store) {
  const self = {};
  self.currentGranule = {};
  self.vectorLayer = {};

  var vectorSource = new OlVectorSource({
    wrapX: false
  });
  self.getVectorLayer = (text) => new OlVectorLayer({
    source: vectorSource,
    style: [
      new OlStyle({
        fill: new OlStyleFill({
          color: 'rgba(0, 123, 255, 0.25)'
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(0, 123, 255)',
          width: 3
        }),
        text: new OlText({
          textAlign: 'center',
          text: text,
          font: '16px sans-serif',
          fill: new OlStyleFill({ color: 'white' }),
          stroke: new OlStyleStroke({ color: 'black', width: 1 }),
          overflow: true
        })
      })
    ]
  });

  /*
   * Draw granule footprint
   *
   * @method drawFootprint
   * @static
   *
   * @param {array} granuleGeometry - array of granule points
   * @param {string} date - granule date
   * @param {string} projCodeCRS - string of projection CRS code
   *
   * @returns {void}
   */
  self.drawFootprint = (granuleGeometry, date, projCodeCRS) => {
    // console.log(granuleGeometry, date, projCodeCRS);
    // granuleGeometry = [
    //   ['73.512657', '67.650986'],
    //   ['-113.950806', '84.85434'],
    //   ['-35.026161', '68.983681'],
    //   ['27.586159', '59.548096'],
    //   ['73.512657', '67.650986']
    // ];

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
    const flattened = arr => [].concat(...arr);

    var res = flattened(granuleGeometry);
    var points = [];

    // iterate the new array and push a coordinate pair into a new array
    for (var i = 0; i < res[0].length; i += 2) {
      const coord1 = parseFloat(res[i]);
      const coord2 = parseFloat(res[i + 1]);
      if (coord1 && coord2) {
        points.push(olProj.transform([coord1, coord2], 'EPSG:4326', projCodeCRS));
      }
    }

    var feature = new OlFeature({
      geometry: new OlGeomPolygon([points])
    });

    // add the feature vector to the layer vector
    vectorSource.addFeature(feature);
    // add text to vector layer and set current vector layer
    const newVectorLayer = self.getVectorLayer(date);
    self.vectorLayer = newVectorLayer;
    // add layer to map
    map.addLayer(self.vectorLayer);
  };

  return self;
}
