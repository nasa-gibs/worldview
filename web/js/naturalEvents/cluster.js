import superCluster from 'supercluster';
import lodashRound from 'lodash/round';
import lodashEach from 'lodash/each';

export function naturalEventsCreateClusterObject () {
  return superCluster({
    radius: 60,
    maxZoom: 16,
    initial: function() {
      return {
        startDate: null,
        endDate: null
      };
    },
    map: function(props) {
      return {
        startDate: props.date,
        endDate: props.date
      };
    },
    reduce: function(accumulated, properties) {
      var newDate = properties.startDate;
      var pastStartDate = accumulated.startDate;
      var pastEndDate = accumulated.endDate;
      if (!pastEndDate) {
        accumulated.startDate = newDate;
        accumulated.endDate = newDate;
      } else {
        accumulated.startDate = Date.parse(new Date(pastStartDate)) > Date.parse(new Date(newDate)) ? newDate : pastStartDate;
        accumulated.endDate = Date.parse(new Date(pastEndDate)) < Date.parse(new Date(newDate)) ? newDate : pastEndDate;
      }
    }

  });
};

export function naturalEventsPointToGeoJSON(id, coordinates, date) {
  return {
    type: 'Feature',
    properties: {
      id: id + '-' + date,
      event_id: id,
      date: date
    },
    geometry: {
      type: 'Point',
      coordinates: coordinates
    }
  };
};
export function sortCluster(clusterArray) {
  lodashEach(clusterArray, (point) => {
    clusterArray.sort(function(a, b) {
      var firstDate = a.properties.date || a.properties.startDate;
      var secondDate = b.properties.date || b.properties.startDate;

      return new Date(secondDate) - new Date(firstDate);
    });
  });
};

export function naturalEventsGetClusterPoints(superClusterObj, pointArray, zoomLevel) {
  superClusterObj.load(pointArray);
  return superClusterObj.getClusters([-180, -90, 180, 90], lodashRound(zoomLevel));
};

export function naturalEventsClusterAppend(tooltipEl, dateString) {
  var textNode = document.createTextNode(dateString);

  tooltipEl.appendChild(textNode);
  tooltipEl.classList.add('track-marker-date-range');

  return tooltipEl;
}
