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
  Style as OlStyle
} from 'ol/style';

export function granuleFootprint(map, mapUiEvents, store) {
  const self = {};

  var vectorSource = new OlVectorSource({
    wrapX: false
  });
  var vectorLayer = new OlVectorLayer({
    source: vectorSource,
    style: [
      new OlStyle({
        fill: new OlStyleFill({
          // color: 'rgba(181, 158, 50, 0.25)'
          color: 'rgba(0, 123, 255, 0.25)'
        }),
        stroke: new OlStyleStroke({
          color: 'rgb(0, 123, 255)',
          width: 3
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
   * @param {string} projCodeCRS - string of projection CRS code
   *
   * @returns {void}
   */
  self.drawFootprint = (granuleGeometry, projCodeCRS) => {
    // granuleGeometry = [
    //   ['73.512657', '67.650986'],
    //   ['-113.950806', '84.85434'],
    //   ['-35.026161', '68.983681'],
    //   ['27.586159', '59.548096'],
    //   ['73.512657', '67.650986']
    // ];

    if (!granuleGeometry) {
      map.removeLayer(vectorLayer);
      vectorSource.clear();
      return;
    }
    const flattened = arr => [].concat(...arr);

    var res = flattened(granuleGeometry);
    var points = [];

    // iterate the new array and push a coordinate pair into a new array
    for (var i = 0; i < res[0].length; i += 2) {
      points.push(olProj.transform([res[i], res[i + 1]], 'EPSG:4326', projCodeCRS));
    }

    var feature = new OlFeature({
      geometry: new OlGeomPolygon([points])
    });

    // add the feature vector to the layer vector
    vectorSource.addFeature(feature);
    // add layer to map
    map.addLayer(vectorLayer);
  };

  return self;
}
