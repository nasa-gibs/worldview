import OlGeomPolygon from 'ol/geom/Polygon';
import util from '../../util/util';

export const REL_DATA = 'http://esipfed.org/ns/fedsearch/1.1/data#';
export const REL_METADATA = 'http://esipfed.org/ns/fedsearch/1.1/metadata#';
export const REL_BROWSE = 'http://esipfed.org/ns/fedsearch/1.1/browse#';
export const DATA_EXTS = ['hdf', 'he5', 'h5', 'hdf5', 'nc', 'bz2'];

export function dataCmrClient(spec, store) {
  // Abort query after 45 seconds
  const QUERY_TIMEOUT = spec.timeout || 45 * 1000;
  const self = {};
  const ns = self;

  const ajaxOptions = {
    url: 'https://cmr.earthdata.nasa.gov/search/',
    headers: {
      'Client-Id': 'Worldview',
    },
    traditional: true,
    dataType: 'json',
    timeout: QUERY_TIMEOUT,
  };

  const init = function() {
    ns.ajax = util.ajaxCache(100);
  };

  self.submit = function(parameters) {
    const queryParameters = $.extend(true, {}, ajaxOptions, parameters);
    const startTimeDelta = parameters.startTimeDelta || 0;
    const endTimeDelta = parameters.endTimeDelta || 0;
    const t = parameters.time;
    let searchType = 'granules.json';
    if (parameters.search) {
      searchType = parameters.search;
    }
    queryParameters.url += searchType;
    if (t) {
      let startTime = new Date(
        Date.UTC(
          t.getUTCFullYear(),
          t.getUTCMonth(),
          t.getUTCDate(),
          0,
          0 + startTimeDelta,
          0,
        ),
      );
      let endTime = new Date(
        Date.UTC(
          t.getUTCFullYear(),
          t.getUTCMonth(),
          t.getUTCDate(),
          23,
          59 + endTimeDelta,
          59,
        ),
      );
      startTime = startTime.toISOString();
      endTime = endTime.toISOString();
      queryParameters.data.temporal = `${startTime},${endTime}`;
    }
    queryParameters.data.pageSize = '1000';
    const deferred = $.Deferred();
    ns.ajax
      .submit(queryParameters)
      .done((data) => {
        deferred.resolve(data.feed.entry);
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        deferred.reject(jqXHR, textStatus, errorThrown);
      });
    return deferred.promise();
  };

  init();
  return self;
}

export function dataCmrGeometry(result) {
  const self = {};
  self.polygons = [];

  const init = function() {
    if (result.polygons) {
      initFromPolygons(result.polygons);
    } else if (result.boxes) {
      initFromBoxes(result.boxes);
    } else {
      throw new Error('Unable to find spatial field');
    }
  };

  self.toOpenLayers = function() {
    const olPolygons = [];
    $.each(self.polygons, (index, polygon) => {
      const olRings = [];
      $.each(polygon, (index, ring) => {
        const olPoints = [];
        $.each(ring, (index, point) => {
          const p = [point.x, point.y];
          olPoints.push(p);
        });
        olRings.push(olPoints);
      });
      olPolygons.push(new OlGeomPolygon(olRings));
    });
    return olPolygons[0];
  };

  var initFromPolygons = function(cmrPolygons) {
    $.each(cmrPolygons, (index, cmrPolygon) => {
      const rings = [];
      $.each(cmrPolygon, (index, cmrRing) => {
        const ring = [];
        const parts = cmrRing.split(' ');
        for (let i = 0; i < parts.length; i += 2) {
          const y = parseFloat(parts[i]);
          const x = parseFloat(parts[i + 1]);
          ring.push({
            x,
            y,
          });
        }
        rings.push(ring);
      });
      self.polygons.push(rings);
    });
  };

  var initFromBoxes = function(cmrBoxes) {
    $.each(cmrBoxes, (index, cmrBox) => {
      const ring = [];
      const fields = cmrBox.split(' ');
      const ymin = parseFloat(fields[0]);
      const xmin = parseFloat(fields[1]);
      const ymax = parseFloat(fields[2]);
      const xmax = parseFloat(fields[3]);
      ring.push({
        x: xmin,
        y: ymin,
      });
      ring.push({
        x: xmax,
        y: ymin,
      });
      ring.push({
        x: xmax,
        y: ymax,
      });
      ring.push({
        x: xmin,
        y: ymax,
      });
      ring.push({
        x: xmin,
        y: ymin,
      });

      self.polygons.push([ring]);
    });
  };

  init();
  return self;
}

export function dataCmrMockClient(suffix, store) {
  const state = store.getState();
  let endpoint;
  let results;

  const self = {};

  const init = function() {
    if (!suffix) {
      throw new Error('No mock CMR suffix specified');
    }
    endpoint = `mock/cmr.cgi-${suffix}`;
  };

  self.submit = function(parameters) {
    console.warn('Mocking CMR query', endpoint);
    const deferred = $.Deferred();
    if (!results) {
      $.getJSON(endpoint, (data) => {
        try {
          results = adjustResults(parameters, data);
          deferred.resolve(results.feed.entry);
        } catch (error) {
          util.error(error);
        }
      }).fail((jqXHR, textStatus, errorThrown) => {
        deferred.reject(jqXHR, textStatus, errorThrown);
      });
    } else {
      deferred.resolve(results.feed.entry);
    }
    return deferred.promise();
  };

  var adjustResults = function(parameters, data) {
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    const day = state.date[activeDateStr];
    // Mock data was retrieved for Aug 6, 2013
    const resultsDay = new Date(Date.UTC(2013, 7, 6));
    const diffDays = (day - resultsDay) / (1000 * 60 * 60 * 24);

    $.each(data.feed.entry, (index, entry) => {
      const timeStart = util.parseTimestampUTC(entry.time_start);
      timeStart.setUTCDate(timeStart.getUTCDate() + diffDays);
      entry.time_start = timeStart.toISOString();

      const timeEnd = util.parseTimestampUTC(entry.time_end);
      timeEnd.setUTCDate(timeEnd.getUTCDate() + diffDays);
      entry.time_end = timeEnd.toISOString();
    });

    return data;
  };

  init();

  return self;
}

export function dataCmrRoundTime(timeString) {
  const time = util.parseTimestampUTC(timeString);
  if (time.getUTCMilliseconds() >= 500) {
    time.setUTCSeconds(time.getUTCSeconds() + 1);
  }
  time.setUTCMilliseconds(0);
  return time.toISOString();
}
