import $ from 'jquery';

import OlGeomMultiPolygon from 'ol/geom/multipolygon';
import OlGeomMultiPoint from 'ol/geom/multipoint';
import OlFormatGeoJSON from 'ol/format/geojson';
import OlGeomPolygon from 'ol/geom/polygon';
import OlGeomPoint from 'ol/geom/point';
import olExtent from 'ol/extent';
import lodashEach from 'lodash/each';
import { cmrRoundTime, cmrGeometry } from './cmr';
import util from '../util/util';
import { dataHelper } from '../edsc';
import { mapIsPolygonValid, mapAdjustAntiMeridian, mapToPolys } from '../map/map';

export function createChain() {
  var self = {};

  self.processes = [];

  self.process = function (results) {
    $.each(results.granules, function (index, granule) {
      delete granule.filtered;
      delete granule.filteredBy;
    });
    $.each(self.processes, function (index, process) {
      $.each(results.granules, function (index2, granule) {
        if (!granule.filtered) {
          var result = process.process(results.meta, granule);
          if (!result) {
            granule.filtered = true;
            granule.filteredBy = process.name;
          }
        }
      });
      if (process.after) {
        process.after(results);
      }
    });

    var newGranules = [];
    var filteredGranules = {};
    $.each(results.granules, function (index, granule) {
      if (!granule.filtered) {
        newGranules.push(granule);
      } else {
        if (!filteredGranules[granule.filteredBy]) {
          filteredGranules[granule.filteredBy] = [];
        }
        filteredGranules[granule.filteredBy].push(granule);
      }
    });

    return {
      meta: results.meta,
      granules: newGranules,
      filtered: filteredGranules
    };
  };

  return self;
};

export function antiMeridianMulti(maxDistance) {
  var self = { name: 'AntiMeridianMulti' };
  self.process = function (meta, granule) {
    var geom = granule.geometry['EPSG:4326'];
    // Semi-hack of ensuring geometry isn't a MultiPolygon since
    // isPolygonValid can't handle it; addresses WV-1574
    if ((!(geom instanceof OlGeomMultiPolygon)) &&
      (!mapIsPolygonValid(geom, maxDistance))) {
      var geomEast = mapAdjustAntiMeridian(geom, 1);
      var geomWest = mapAdjustAntiMeridian(geom, -1);
      var centroidEast = geomEast.getInteriorPoint();
      var centroidWest = geomWest.getInteriorPoint();
      var newGeom =
        new OlGeomMultiPolygon([
          geomEast.getCoordinates(),
          geomWest.getCoordinates()
        ]);
      var newCentroid =
        new OlGeomMultiPoint([
          centroidEast.getCoordinates(),
          centroidWest.getCoordinates()
        ]);
      granule.geometry['EPSG:4326'] = newGeom;
      granule.centroid['EPSG:4326'] = newCentroid;
    }
    return granule;
  };
  return self;
};

export function collectPreferred(prefer) {
  var self = { name: 'CollectPreferred' };
  self.process = function (meta, granule) {
    if (!meta.preferred) {
      meta.preferred = {};
    }
    var preferred =
      (prefer === 'nrt' && granule.nrt) ||
      (prefer === 'science' && !granule.nrt);
    if (preferred) {
      var timeStart = cmrRoundTime(granule.time_start);
      meta.preferred[timeStart] = granule;
    }
    return granule;
  };
  return self;
};

export function collectVersions() {
  var self = { name: 'CollectVersions' };
  self.process = function (meta, granule) {
    if (!meta.versions) {
      meta.versions = {};
    }
    if (granule.version) {
      var timeStart = cmrRoundTime(granule.time_start);
      var previousVersion = meta.versions[timeStart] || 0;
      meta.versions[timeStart] = Math.max(previousVersion,
        granule.version);
    }
    return granule;
  };
  return self;
};

export function connectSwaths(projection) {
  var startTimes = {};
  var endTimes = {};
  var self = { name: 'ConnectSwaths' };

  self.process = function (meta, granule) {
    if (!granule.centroid[projection]) return;
    var timeStart = roundTime(granule.time_start);
    var timeEnd = roundTime(granule.time_end);
    if (startTimes[timeStart]) {
      console.warn('Discarding duplicate start time', timeStart,
        granule, startTimes[timeStart]);
      return;
    }
    if (endTimes[timeEnd]) {
      console.warn('Discarding duplicate end time', timeEnd,
        granule, endTimes[timeEnd]);
      return;
    }
    var swath = [granule];
    startTimes[timeStart] = swath;
    endTimes[timeEnd] = swath;
    combineSwath(swath);
    return granule;
  };

  self.after = function (results) {
    results.meta.swaths = [];
    $.each(startTimes, function (index, swath) {
      if (swath.length > 1) {
        results.meta.swaths.push(swath);
      }
    });
  };

  var combineSwath = function (swath) {
    var combined = false;
    var maxDistance = Number.POSITIVE_INFINITY;
    var thisTimeStart = roundTime(swath[0].time_start); // The time_start of the first granule in a swath
    var thisTimeEnd = roundTime(swath[swath.length - 1].time_end); // The time_end of the last granule in a swath
    var otherSwath = endTimes[thisTimeStart]; // Looks like the problem is that this never gets defined for VIIRS data
    // Can this swath be added to the end of other swath?
    if (otherSwath) {
      var otherGranule = otherSwath[otherSwath.length - 1];
      var otherTimeStart = roundTime(otherSwath[0].time_start);
      var otherTimeEnd = roundTime(otherSwath[otherSwath.length - 1].time_end);
      if (connectionAllowed(swath[0], otherGranule, maxDistance)) {
        delete startTimes[thisTimeStart];
        delete endTimes[thisTimeEnd];
        delete startTimes[otherTimeStart];
        delete endTimes[otherTimeEnd];
        var combinedSwath = otherSwath.concat(swath);
        var newTimeStart = roundTime(combinedSwath[0].time_start);
        var newTimeEnd = roundTime(combinedSwath[combinedSwath.length - 1].time_end);
        startTimes[newTimeStart] = combinedSwath;
        endTimes[newTimeEnd] = combinedSwath;
        combined = true;
        swath = combinedSwath;
      }
    } else {
      console.log('No other swath!');
    }
    if (combined) combineSwath(swath);
  };

  // Connection is allowed as long as there is at least one path between
  // centroids that is less than the max distance
  var connectionAllowed = function (g1, g2, maxDistance) {
    var polys1 = mapToPolys(g1.geometry[projection]);
    var polys2 = mapToPolys(g2.geometry[projection]);
    var allowed = false;
    $.each(polys1, function (index, poly1) {
      $.each(polys2, function (index, poly2) {
        var x1 = poly1.getInteriorPoint().getCoordinates()[0];
        var x2 = poly2.getInteriorPoint().getCoordinates()[0];
        if (Math.abs(x2 - x1) < maxDistance) {
          allowed = true;
          return false;
        }
      });
    });
    return allowed;
  };
  var roundTime = function (timeString) {
    return cmrRoundTime(timeString);
  };
  return self;
};

export function dateTimeLabel(time) {
  var self = { name: 'DateTimeLabel' };
  self.process = function (meta, granule) {
    var timeStart = util.toISOStringDate(
      util.parseTimestampUTC(granule.time_start)
    );
    var hmStart = util.toISOStringTimeHM(
      util.parseTimestampUTC(granule.time_start)
    );
    var timeEnd = granule.time_end ? util.toISOStringTimeHM(
      util.parseTimestampUTC(granule.time_end)
    ) : false;
    granule.label = `${timeStart}: ${hmStart}${timeEnd ? '-' + timeEnd : ''} UTC`;
    return granule;
  };
  return self;
};

export function dividePolygon() {
  var self = { name: 'DividePolygon' };
  self.process = function (meta, granule) {
    if (granule.geometry['EPSG:4326'].getPolygons) {
      return granule;
    }
    var ring = granule.geometry['EPSG:4326'].getLinearRing(0);
    var coords = ring.getCoordinates();
    var latlons = [];
    lodashEach(coords, function (coord) {
      var latlon = new dataHelper.LatLng(coord[1], coord[0]);
      latlons.push(latlon);
    });
    var result = dataHelper.sphericalPolygon.dividePolygon(latlons);
    var newPolys = result.interiors;
    var resultMultiPoly = [];
    lodashEach(newPolys, function (newPoly) {
      var resultPoly = [];
      lodashEach(newPoly, function (newCoord) {
        resultPoly.push([newCoord.lng, newCoord.lat]);
      });
      resultMultiPoly.push(resultPoly);
    });
    granule.geometry['EPSG:4326'] =
      new OlGeomMultiPolygon([resultMultiPoly]);
    return granule;
  };
  return self;
};

export function extentFilter(projection, extent) {
  var self = { name: 'ExtentFilter' };
  self.process = function (meta, granule) {
    var geom = granule.geometry[projection];
    if (!geom) return;
    var mbr = geom.getExtent();
    if (olExtent.intersects(extent, mbr)) {
      return granule;
    }
  };
  if (!extent) throw new Error('No extent');
  return self;
};

export function geometryFromCMR(densify) {
  var self = { name: 'GeometryFromCMR' };
  self.process = function (meta, granule) {
    if (!granule.geometry) granule.geometry = {};
    if (!granule.centroid) granule.centroid = {};
    if (!granule.geometry['EPSG:4326']) {
      var cmrGeom = cmrGeometry(granule, densify);
      var geom = cmrGeom.toOpenLayers();
      var centroid = geom.getInteriorPoint();
      granule.geometry['EPSG:4326'] = geom;
      granule.centroid['EPSG:4326'] = centroid;
    }
    return granule;
  };
  return self;
};

export function geometryFromMODISGrid(projection) {
  var self = { name: 'GeoemtryFromMODISGrid' };
  var parser = new OlFormatGeoJSON();
  self.process = function (meta, granule) {
    if (!granule.geometry) {
      granule.geometry = {};
      granule.centroid = {};
    }
    if (!granule.geometry[projection]) {
      var json = meta.grid[granule.hv];
      if (!json) return;
      var grid = meta.grid[granule.hv];
      var geom = parser.readGeometry(meta.grid[granule.hv].geometry);
      var centroid = new OlGeomPoint([
        grid.properties.CENTER_X,
        grid.properties.CENTER_Y
      ]);
      granule.geometry[projection] = geom;
      granule.centroid[projection] = centroid;
    }
    return granule;
  };
  return self;
};

export function modisGridIndex() {
  var self = { name: 'MODISGridIndex' };
  self.process = function (meta, granule) {
    var id = granule.producer_granule_id;
    var matches = id.match(/\.h(\d+)v(\d+)\./);
    granule.h = parseInt(matches[1], 10);
    granule.v = parseInt(matches[2], 10);
    granule.hv = `h${granule.h}v${granule.v}`;
    return granule;
  };
  self.after = function (results) {
    results.meta.grid = {};
    $.each(results.meta.gridFetched.features, function (index, feature) {
      var key = `h${feature.properties.H}v${feature.properties.V}`;
      results.meta.grid[key] = feature;
    });
  };
  return self;
};

export function modisGridLabel() {
  var self = { name: 'MODISGridLabel' };
  self.process = function (meta, granule) {
    granule.label = `h${granule.h} - v${granule.v}`;
    var timeStart = util.parseTimestampUTC(granule.time_start);
    var date = util.toISOStringDate(timeStart);
    granule.downloadLabel = `${date}: h${granule.h}-${granule.v}`;
    return granule;
  };
  return self;
};

export function orbitFilter(spec) {
  var self = { name: 'OrbitFilter' };
  self.process = function (meta, granule) {
    if (spec) {
      var regex = new RegExp(spec.regex);
      var text = granule[spec.field];
      var result = text.match(regex);
      if (result && result[1] === spec.match) {
        return granule;
      }
    } else {
      return granule;
    }
  };
  return self;
};

export function preferredFilter(prefer) {
  var self = { name: 'PreferredFilter' };
  self.process = function (meta, granule) {
    var timeStart = cmrRoundTime(granule.time_start);
    if (meta.preferred[timeStart]) {
      if (prefer === 'nrt' && !granule.nrt) return;
      if (prefer === 'science' && granule.nrt) return;
    }
    return granule;
  };
  return self;
};

export function productLabel(name) {
  var self = { name: 'ProductLabel' };
  self.process = function (meta, granule) {
    granule.label = name;
    return granule;
  };
  return self;
};

export function tagList(spec) {
  var self = { name: 'TagList' };
  self.process = function (meta, granule) {
    return granule;
  };
  self.after = function (results) {
    results.meta.showList = true;
  };
  return self;
};

export function tagNRT(spec) {
  var self = { name: 'TagNRT' };
  self.process = function (meta, granule) {
    // Exit now if this product doesn't have information about NRT
    if (!spec) return granule;
    var isNRT;
    if (spec.by === 'value') {
      isNRT = granule[spec.field] === spec.value;
    } else if (spec.by === 'regex') {
      var re = new RegExp(spec.value);
      isNRT = re.test(granule[spec.field]);
    } else {
      throw new Error('Unknown TagNRT method: ' + spec.by);
    }
    if (isNRT) {
      granule.nrt = true;
      meta.nrt = true;
    }
    return granule;
  };
  return self;
};

export function tagProduct(product) {
  var self = { name: 'TagProduct' };
  self.process = function (meta, granule) {
    granule.product = product;
    return granule;
  };
  return self;
};

export function tagURS(spec) {
  var self = { name: 'TagURS' };
  self.process = function (meta, granule) {
    // Exit now if this product doesn't have information about NRT
    if (!spec) return granule;
    var isURS;
    if (spec.by === 'constant') {
      isURS = spec.value;
    } else if (spec.by === 'value') {
      isURS = granule[spec.field] === spec.value;
    } else if (spec.by === 'regex') {
      var re = new RegExp(spec.value);
      isURS = re.test(granule[spec.field]);
    } else {
      throw new Error('Unknown TagURS method: ' + spec.by);
    }
    granule.urs = isURS;
    if (isURS) meta.urs = (meta.urs) ? meta.urs += 1 : 1;
    return granule;
  };
  return self;
};

export function tagVersion() {
  var self = { name: 'TagVersion' };
  self.process = function (meta, granule) {
    var match = granule.dataset_id.match('V(\\d{3})(\\d*)');
    if (match) {
      var major = match[1];
      var minor = match[2] || 0;
      granule.version = parseFloat(major + '.' + minor);
      return granule;
    }
    match = granule.dataset_id.match('V([\\d\\.]+)');
    if (match) {
      granule.version = parseFloat(match[1]);
      return granule;
    }
    return granule;
  };
  return self;
};

export function timeFilter(spec) {
  var westZone = null;
  var eastZone = null;
  var maxDistance = null;
  var timeOffset;
  var self = { name: 'TimeFilter' };
  var init = function () {
    westZone = new Date(spec.time.getTime()).setUTCMinutes(spec.westZone);
    eastZone = new Date(spec.time.getTime()).setUTCMinutes(spec.eastZone);
    maxDistance = spec.maxDistance;
    timeOffset = spec.timeOffset || 0;
  };
  self.process = function (meta, granule) {
    var geom = granule.geometry['EPSG:4326'];
    var time = util.parseTimestampUTC(granule.time_start);
    time.setUTCMinutes(time.getUTCMinutes() + timeOffset);
    // Semi-hack of ensuring geometry isn't a MultiPolygon since
    // isPolygonValid can't handle it; addresses WV-1574
    if ((!(geom instanceof OlGeomMultiPolygon)) &&
      (!mapIsPolygonValid(geom, maxDistance))) {
      var adjustSign = (time < eastZone) ? 1 : -1;
      geom = mapAdjustAntiMeridian(geom, adjustSign);
      granule.geometry['EPSG:4326'] = geom;
      granule.centroid['EPSG:4326'] = geom.getInteriorPoint();
    }
    var x = granule.centroid['EPSG:4326'].getCoordinates()[0];
    if (time < eastZone && x < 0) return;
    if (time > westZone && x > 0) return;
    return granule;
  };
  init();
  return self;
};

export function timeLabel(time) {
  var self = { name: 'TimeLabel' };
  self.process = function (meta, granule) {
    var timeStart = util.parseTimestampUTC(granule.time_start);
    // Sometimes an end time is not provided by CMR
    var timeEnd;
    if (granule.time_end) timeEnd = util.parseTimestampUTC(granule.time_end);
    var diff = Math.floor(
      (timeStart.getTime() - time.getTime()) / (1000 * 60 * 60 * 24)
    );
    var suffix = (diff !== 0) ? ` (${diff < 0 ? diff : '+' + diff} day)` : '';
    var displayStart = util.toISOStringTimeHM(timeStart);
    var startTime = util.toISOStringDate(timeStart);
    var displayEnd = null;
    if (timeEnd) {
      displayEnd = util.toISOStringTimeHM(timeEnd);
    } else {
      displayEnd = '?';
    }
    granule.label = `${displayStart} - ${displayEnd} UTC${suffix}`;
    granule.downloadLabel = `${startTime}: ${displayStart}-${displayEnd} UTC`;
    return granule;
  };
  return self;
};

export function transform(projection) {
  var self = { name: 'Transform' };
  self.process = function (meta, granule) {
    if (granule.geometry[projection]) return granule;
    var geom = granule.geometry['EPSG:4326'];
    var projGeom = geom.clone().transform('EPSG:4326', projection);
    granule.geometry[projection] = projGeom;
    if (projGeom instanceof OlGeomPolygon) {
      granule.centroid[projection] = projGeom.getInteriorPoint();
    } else {
      // Assuming that projGeom is a OlGeomMultiPolygon
      granule.centroid[projection] = projGeom.getInteriorPoints().getPoint(0);
    }
    return granule;
  };
  return self;
};

export function versionFilter() {
  var self = { name: 'VersionFilter' };
  self.process = function (meta, granule) {
    if (granule.version) {
      var timeStart = cmrRoundTime(granule.time_start);
      if (meta.versions[timeStart]) {
        if (meta.versions[timeStart] !== granule.version) return;
      }
    }
    return granule;
  };
  return self;
};

export function versionFilterExact(version) {
  var self = { name: 'versionFilterExact' };
  self.process = function (meta, granule) {
    if (granule.version && granule.version === version) return granule;
  };
  return self;
};
