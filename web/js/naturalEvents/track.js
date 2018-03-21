import OlFeature from 'ol/feature';
import OlGeomPoint from 'ol/geom/point';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';
import OlStyleFill from 'ol/style/fill';
import OlStyleStroke from 'ol/style/stroke';
import OlStyleCircle from 'ol/style/circle';
import OlStyleStyle from 'ol/style/style';
import OlGeomMultiLineString from 'ol/geom/multilinestring';
import lodashEach from 'lodash/each';

export function naturalEventsTrackLayer(featuresArray, styles) {
  return new OlLayerVector({
    source: new OlSourceVector({
      features: featuresArray
    }),
    style: function(feature) {
      return styles[feature.get('type')];
    }

  });
};
export function naturalEventsTrackPoint(coords, date, eventID) {
  return new OlFeature({
    type: 'geoMarker',
    geometry: new OlGeomPoint(coords),
    date: date,
    eventType: eventID
  });
};
export function naturalEventsTrackLine(coordinateArray) {
  return new OlFeature({
    type: 'line',
    geometry: new OlGeomMultiLineString(coordinateArray)
  });
};
export function naturalEventsTrackStyle() {
  return {
    'geoMarker': new OlStyleStyle({
      image: new OlStyleCircle({
        radius: 4,
        snapToPixel: false,
        fill: new OlStyleFill({ color: 'white' }),
        stroke: new OlStyleStroke({
          color: 'white',
          width: 2
        })
      })
    }),
    'line': new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: 'white',
        width: 1
      })
    })
  };
};

export function naturalEventsTrackCreate(eventObj) {
  var olTrackFeatures = [];
  var coordinateArray = [];
  var eventTrackStyles;
  var olTrackLineFeature;

  lodashEach(eventObj.geometries, function (geometry, index) {
    var date = geometry.date.split('T')[0];
    var coordinates = geometry.coordinates;
    olTrackFeatures.push(naturalEventsTrackPoint(coordinates, date, eventObj.id));
    if (index !== 0) {
      coordinateArray.push([olTrackFeatures[index - 1].getGeometry().getCoordinates(), coordinates]);
    }
  });

  eventTrackStyles = naturalEventsTrackStyle();
  olTrackLineFeature = naturalEventsTrackLine(coordinateArray);
  console.log(olTrackLineFeature, olTrackFeatures[0]);
  olTrackFeatures.push(olTrackLineFeature);

  return naturalEventsTrackLayer(olTrackFeatures, eventTrackStyles);
};
