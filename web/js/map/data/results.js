import OlGeomMultiPolygon from 'ol/geom/MultiPolygon';
import OlGeomMultiPoint from 'ol/geom/MultiPoint';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlGeomPolygon from 'ol/geom/Polygon';
import OlGeomPoint from 'ol/geom/Point';
import * as olExtent from 'ol/extent';
import lodashEach from 'lodash/each';
import { dataCmrRoundTime, dataCmrGeometry } from './cmr';
import util from '../../util/util';
import { dataHelper } from '../../edsc';
import {
  CRS_WGS_84,
  mapIsPolygonValid,
  mapAdjustAntiMeridian,
  mapToPolys,
} from '../map';

export function dataResultsAntiMeridianMulti(maxDistance) {
  const self = {};
  self.name = 'AntiMeridianMulti';

  self.process = function(meta, granule) {
    const geom = granule.geometry[CRS_WGS_84];
    // Semi-hack of ensuring geometry isn't a MultiPolygon since
    // isPolygonValid can't handle it; addresses WV-1574
    if (
      !(geom instanceof OlGeomMultiPolygon)
      && !mapIsPolygonValid(geom, maxDistance)
    ) {
      const geomEast = mapAdjustAntiMeridian(geom, 1);
      const geomWest = mapAdjustAntiMeridian(geom, -1);
      const centroidEast = geomEast.getInteriorPoint();
      const centroidWest = geomWest.getInteriorPoint();
      const newGeom = new OlGeomMultiPolygon([
        geomEast.getCoordinates(),
        geomWest.getCoordinates(),
      ]);
      const newCentroid = new OlGeomMultiPoint([
        centroidEast.getCoordinates(),
        centroidWest.getCoordinates(),
      ]);
      granule.geometry[CRS_WGS_84] = newGeom;
      granule.centroid[CRS_WGS_84] = newCentroid;
    }
    return granule;
  };

  return self;
}

export function dataResultsChain() {
  const self = {};

  self.processes = [];

  self.process = function(results) {
    $.each(results.granules, (index, granule) => {
      delete granule.filtered;
      delete granule.filteredBy;
    });
    $.each(self.processes, (index, process) => {
      $.each(results.granules, (index2, granule) => {
        if (!granule.filtered) {
          const result = process.process(results.meta, granule);
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

    const newGranules = [];
    const filteredGranules = {};
    $.each(results.granules, (index, granule) => {
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
      filtered: filteredGranules,
    };
  };

  return self;
}

export function dataResultsCollectPreferred(prefer) {
  const self = {};

  self.name = 'CollectPreferred';

  self.process = function(meta, granule) {
    if (!meta.preferred) {
      meta.preferred = {};
    }
    const preferred = (prefer === 'nrt' && granule.nrt)
      || (prefer === 'science' && !granule.nrt);
    if (preferred) {
      const timeStart = dataCmrRoundTime(granule.time_start);
      meta.preferred[timeStart] = granule;
    }
    return granule;
  };

  return self;
}

export function dataResultsCollectVersions() {
  const self = {};

  self.name = 'CollectVersions';

  self.process = function(meta, granule) {
    if (!meta.versions) {
      meta.versions = {};
    }
    if (granule.version) {
      const timeStart = dataCmrRoundTime(granule.time_start);
      const previousVersion = meta.versions[timeStart] || 0;
      meta.versions[timeStart] = Math.max(previousVersion, granule.version);
    }
    return granule;
  };

  return self;
}

export function dataResultsConnectSwaths(projection, delta) {
  const MAX_DISTANCE_GEO = 270;
  const startTimes = {};
  const endTimes = {};

  const self = {};
  self.name = 'ConnectSwaths';

  self.process = function(meta, granule) {
    if (!granule.centroid[projection]) {
      return;
    }
    const timeStart = roundTime(granule.time_start);
    const timeEnd = roundTime(granule.time_end);

    if (startTimes[timeStart]) {
      console.warn(
        'Discarding duplicate start time',
        timeStart,
        granule,
        startTimes[timeStart],
      );
      return;
    }
    if (endTimes[timeEnd]) {
      console.warn(
        'Discarding duplicate end time',
        timeEnd,
        granule,
        endTimes[timeEnd],
      );
      return;
    }
    const swath = [granule];
    startTimes[timeStart] = swath;
    endTimes[timeEnd] = swath;

    combineSwath(swath, delta);
    return granule;
  };

  self.after = function(results) {
    results.meta.swaths = [];
    $.each(startTimes, (index, swath) => {
      if (swath.length > 1) {
        results.meta.swaths.push(swath);
      }
    });
  };

  const combineSwath = function(swath, delta) {
    let combined = false;

    const maxDistance = projection === CRS_WGS_84 ? MAX_DISTANCE_GEO : Number.POSITIVE_INFINITY;
    const thisTimeStart = roundTime(swath[0].time_start);
    const thisTimeEnd = roundTime(swath[swath.length - 1].time_end);

    // MODIS data is easily combined by matching up the end time of
    // one granule to the start time of another granule because they
    // are the same value. VIIRS start and end times differ by a
    // minute. Use the delta value to adjust as needed.
    delta = delta || 0;
    const thisTimeStartDate = util.parseTimestampUTC(thisTimeStart);
    thisTimeStartDate.setUTCSeconds(thisTimeStartDate.getUTCSeconds() + delta);
    const thisTimeStartDelta = thisTimeStartDate.toISOString(thisTimeStartDate);
    const otherSwath = endTimes[thisTimeStartDelta];

    // Can this swath be added to the end of other swath?
    if (otherSwath) {
      const otherGranule = otherSwath[otherSwath.length - 1];
      const otherTimeStart = roundTime(otherSwath[0].time_start);
      const otherTimeEnd = roundTime(otherSwath[otherSwath.length - 1].time_end);

      if (connectionAllowed(swath[0], otherGranule, maxDistance)) {
        // Remove entries for this swath
        delete startTimes[thisTimeStart];
        delete endTimes[thisTimeEnd];

        // Remove entries for other swath
        delete startTimes[otherTimeStart];
        delete endTimes[otherTimeEnd];

        // Combine swaths
        const newSwath = otherSwath.concat(swath);

        const newTimeStart = roundTime(newSwath[0].time_start);
        const newTimeEnd = roundTime(newSwath[newSwath.length - 1].time_end);

        startTimes[newTimeStart] = newSwath;
        endTimes[newTimeEnd] = newSwath;
        combined = true;
        swath = newSwath;
      }
    }

    if (combined) {
      combineSwath(swath);
    }
  };

  // Connection is allowed as long as there is at least one path between
  // centroids that is less than the max distance
  const connectionAllowed = function(g1, g2, maxDistance) {
    const polys1 = mapToPolys(g1.geometry[projection]);
    const polys2 = mapToPolys(g2.geometry[projection]);
    let allowed = false;
    $.each(polys1, (index, poly1) => {
      $.each(polys2, (index, poly2) => {
        const x1 = poly1.getInteriorPoint().getCoordinates()[0];
        const x2 = poly2.getInteriorPoint().getCoordinates()[0];
        if (Math.abs(x2 - x1) < maxDistance) {
          allowed = true;
          return false;
        }
      });
    });
    return allowed;
  };

  const roundTime = function(timeString) {
    return dataCmrRoundTime(timeString);
  };

  return self;
}

export function dataResultsDateTimeLabel(time) {
  const self = {};

  self.name = 'DateTimeLabel';

  self.process = function(meta, granule) {
    const timeStart = util.parseTimestampUTC(granule.time_start);

    // Some granules may not have an end time
    if (granule.time_end) {
      const timeEnd = util.parseTimestampUTC(granule.time_end);
      granule.label = `${util.toISOStringDate(timeStart)
      }: ${
        util.toHourMinutes(timeStart)
      }-${
        util.toHourMinutes(timeEnd)
      } UTC`;
    } else {
      granule.label = `${util.toISOStringDate(timeStart)
      }: ${
        util.toHourMinutes(timeStart)
      } UTC`;
    }

    return granule;
  };

  return self;
}

export function dataResultsDensify() {
  // var MAX_DISTANCE = 5;
  const self = {};

  self.name = 'Densify';

  self.process = function(meta, granule) {
    // There is a bug exposed here discovered when switching to OL3. Since this
    // function isn't needed for any of the data that we have, just skip it
    // for now and fix it later.
    return granule;

    /*
    var geom = granule.geometry[CRS_WGS_84];
    var newGeom = null;
    if ( geom.getPolygons ) {
        var polys = [];
        lodashEach(geom.getPolygons(), function(poly) {
            polys.push(densifyPolygon(poly));
        });
        newGeom = new OlGeomMultiPolygon([polys]);
    } else {
        var ring = densifyPolygon(geom);
        newGeom = new ol.geom.Polygon([ring]);
    }
    granule.geometry[CRS_WGS_84] = newGeom;
    return granule;
    */
  };

  /*
  var densifyPolygon = function (poly) {
    // Get the outer ring and then get an array of all the points
    var ring = poly.getLinearRing(0)
      .getCoordinates();
    var points = [];
    var end;
    for (var i = 0; i < ring.length - 2; i++) {
      var start = ring[i];
      end = ring[i + 1];
      var distance = mapDistance2D(start, end);
      var numPoints = Math.floor(distance / MAX_DISTANCE);
      points.push(lodashClone(start));
      for (var j = 1; j < numPoints - 1; j++) {
        var d = j / numPoints;
        // This is what REVERB does, so we will do the same
        var p = mapInterpolate2D(start, end, d);
        points.push(p);
      }
    }
    points.push(lodashClone(end));
    return points;
  };
  */

  return self;
}

export function dataResultsDividePolygon() {
  const self = {};

  self.name = 'DividePolygon';

  self.process = function(meta, granule) {
    if (granule.geometry['EPSG:4326'].getPolygons) {
      return granule;
    }
    const ring = granule.geometry['EPSG:4326'].getLinearRing(0);
    const coords = ring.getCoordinates();
    const latlons = [];
    lodashEach(coords, (coord) => {
      const latlon = new dataHelper.LatLng(coord[1], coord[0]);
      latlons.push(latlon);
    });
    const result = dataHelper.sphericalPolygon.dividePolygon(latlons);
    const newPolys = result.interiors;
    const resultMultiPoly = [];
    lodashEach(newPolys, (newPoly) => {
      const resultPoly = [];
      lodashEach(newPoly, (newCoord) => {
        resultPoly.push([newCoord.lng, newCoord.lat]);
      });
      resultMultiPoly.push(resultPoly);
    });
    granule.geometry['EPSG:4326'] = new OlGeomMultiPolygon([resultMultiPoly]);
    return granule;
  };

  return self;
}

export function dataResultsExtentFilter(projection, extent) {
  const self = {};

  self.name = 'ExtentFilter';

  self.process = function(meta, granule) {
    const geom = granule.geometry[projection];
    if (!geom) {
      return granule;
    }
    const mbr = geom.getExtent();
    if (olExtent.intersects(extent, mbr)) {
      return granule;
    }
  };

  if (!extent) {
    throw new Error('No extent');
  }

  return self;
}

export function dataResultsGeometryFromCMR(densify) {
  const self = {};

  self.name = 'GeometryFromCMR';

  self.process = function(meta, granule) {
    if (!granule.geometry) {
      granule.geometry = {};
    }
    if (!granule.centroid) {
      granule.centroid = {};
    }

    if (!granule.geometry[CRS_WGS_84]) {
      const cmrGeom = dataCmrGeometry(granule, densify);
      const geom = cmrGeom.toOpenLayers();
      const centroid = geom.getInteriorPoint();
      granule.geometry[CRS_WGS_84] = geom;
      granule.centroid[CRS_WGS_84] = centroid;
    }
    return granule;
  };

  return self;
}

export function dataResultsGeometryFromMODISGrid(projection) {
  const parser = new OlFormatGeoJSON();

  const self = {};

  self.name = 'GeoemtryFromMODISGrid';

  self.process = function(meta, granule) {
    if (!granule.geometry) {
      granule.geometry = {};
      granule.centroid = {};
    }

    if (!granule.geometry[projection]) {
      const json = meta.grid[granule.hv];
      if (!json) {
        return;
      }
      const grid = meta.grid[granule.hv];
      const geom = parser.readGeometry(meta.grid[granule.hv].geometry);
      const centroid = new OlGeomPoint([
        grid.properties.CENTER_X,
        grid.properties.CENTER_Y,
      ]);

      granule.geometry[projection] = geom;
      granule.centroid[projection] = centroid;
    }
    return granule;
  };

  return self;
}

export function dataResultsOfflineFilter() {
  const self = {};

  self.name = 'OfflineFilter';

  self.process = function(meta, granule) {
    if (granule.online_access_flag === false) {
      return null;
    }
    return granule;
  };

  return self;
}

export function dataResultsModisGridIndex() {
  const self = {};

  self.name = 'MODISGridIndex';

  self.process = function(meta, granule) {
    const id = granule.producer_granule_id;
    const matches = id.match(/\.h(\d+)v(\d+)\./);
    granule.h = parseInt(matches[1], 10);
    granule.v = parseInt(matches[2], 10);
    granule.hv = `h${granule.h}v${granule.v}`;
    return granule;
  };

  self.after = function(results) {
    results.meta.grid = {};
    $.each(results.meta.gridFetched.features, (index, feature) => {
      const key = `h${feature.properties.H}v${feature.properties.V}`;
      results.meta.grid[key] = feature;
    });
  };

  return self;
}

export function dataResultsModisGridLabel() {
  const self = {};

  self.name = 'MODISGridLabel';

  self.process = function(meta, granule) {
    granule.label = `h${granule.h} - ` + `v${granule.v}`;

    const timeStart = util.parseTimestampUTC(granule.time_start);
    const date = util.toISOStringDate(timeStart);

    granule.downloadLabel = `${date}: h${granule.h}-${granule.v}`;

    return granule;
  };

  return self;
}

export function dataResultsOrbitFilter(spec) {
  const self = {};

  self.name = 'OrbitFilter';

  self.process = function(meta, granule) {
    if (spec) {
      const regex = new RegExp(spec.regex);
      const text = granule[spec.field];
      const result = text.match(regex);
      if (result && result[1] === spec.match) {
        return granule;
      }
    } else {
      return granule;
    }
  };

  return self;
}

export function dataResultsPreferredFilter(prefer) {
  const self = {};

  self.name = 'PreferredFilter';

  self.process = function(meta, granule) {
    const timeStart = dataCmrRoundTime(granule.time_start);
    if (meta.preferred[timeStart]) {
      if (prefer === 'nrt' && !granule.nrt) {
        return;
      }
      if (prefer === 'science' && granule.nrt) {
        return;
      }
    }
    return granule;
  };

  return self;
}

export function dataResultsProductLabel(name) {
  const self = {};

  self.name = 'ProductLabel';

  self.process = function(meta, granule) {
    granule.label = name;
    return granule;
  };

  return self;
}

export function dataResultsTagButtonScale(scale) {
  const self = {};

  self.name = 'TagButtonScale';

  self.process = function(meta, granule) {
    granule.buttonScale = scale;
    return granule;
  };

  return self;
}

export function dataResultsTagList(spec) {
  const self = {};

  self.name = 'TagList';

  self.process = function(meta, granule) {
    return granule;
  };

  self.after = function(results) {
    results.meta.showList = true;
  };

  return self;
}

export function dataResultsTagNRT(spec) {
  const self = {};

  self.name = 'TagNRT';

  self.process = function(meta, granule) {
    // Exit now if this product doesn't have information about NRT
    if (!spec) {
      return granule;
    }
    let isNRT;
    if (spec.by === 'value') {
      isNRT = granule[spec.field] === spec.value;
    } else if (spec.by === 'regex') {
      const re = new RegExp(spec.value);
      isNRT = re.test(granule[spec.field]);
    } else {
      throw new Error(`Unknown TagNRT method: ${spec.by}`);
    }
    if (isNRT) {
      granule.nrt = true;
      meta.nrt = true;
    }
    return granule;
  };

  return self;
}

export function dataResultsTagProduct(product) {
  const self = {};

  self.name = 'TagProduct';

  self.process = function(meta, granule) {
    granule.product = product;
    return granule;
  };

  return self;
}

// FIXME: Code copy and pasted from TagNRT, maybe consoldate this?
export function dataResultsTagURS(spec) {
  const self = {};

  self.name = 'TagURS';

  self.process = function(meta, granule) {
    // Exit now if this product doesn't have information about NRT
    if (!spec) {
      return granule;
    }
    let isURS;
    if (spec.by === 'constant') {
      isURS = spec.value;
    } else if (spec.by === 'value') {
      isURS = granule[spec.field] === spec.value;
    } else if (spec.by === 'regex') {
      const re = new RegExp(spec.value);
      isURS = re.test(granule[spec.field]);
    } else {
      throw new Error(`Unknown TagURS method: ${spec.by}`);
    }
    granule.urs = isURS;
    if (isURS) {
      meta.urs = meta.urs ? meta.urs += 1 : 1;
    }
    return granule;
  };

  return self;
}

export function dataResultsTagVersion() {
  const self = {};

  self.name = 'TagVersion';

  self.process = function(meta, granule) {
    let match = granule.dataset_id.match('V(\\d{3})(\\d*)');
    if (match) {
      const major = match[1];
      const minor = match[2] || 0;
      granule.version = parseFloat(`${major}.${minor}`);
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
}

const versionRegex = {
  // Form of MOD04_L2.A2016137.2105.061.2017326151115.hdf
  // Using periods as delimiters, version is the 4th field
  MODISProducerGranuleID: '[^\\.]+\\.[^\\.]+\\.[^\\.]+\\.([^\\.]+)\\.',
};

const versionParsers = {
  // MODIS uses version numbers like 4, 5, 6 as major versions but
  // 41, 51, 61 for minor versions. This function multiplies values
  // less than 10 for easy comparision (40, 41, 50, 51, 60, 61).
  // Will there ever be a collection 10?
  MODIS: (strVersion) => {
    let version = Number.parseFloat(strVersion);
    if (version < 10) {
      version *= 10;
    }
    return version;
  },
};

export function dataResultsTagVersionRegex(spec) {
  const self = {};

  self.name = 'TagVersionRegex';

  self.process = function(meta, granule) {
    // Continue if not used
    if (!spec) {
      return granule;
    }
    let regex = versionRegex[spec.namedRegex];
    if (!regex) {
      regex = spec.regex;
    }
    if (!regex) {
      console.warn('no regex', granule);
      return granule;
    }
    const value = granule[spec.field];
    if (!value) {
      console.warn(`no value for ${spec.field}`, granule);
      return granule;
    }
    const match = value.match(regex);
    if (match) {
      let version = null;
      const strVersion = match[1];
      // If a parsing function is not named, just convert from float
      if (spec.parseVersion) {
        const parser = versionParsers[spec.parseVersion];
        if (!parser) {
          console.warn('no such parser', spec.parseVersion);
          return granule;
        }
        version = parser(strVersion);
      } else {
        version = Number.parseFloat(strVersion);
      }

      if (version === null) {
        console.warn('version not assigned', strVersion, granule);
      } else if (Number.isNaN(version)) {
        console.warn('version is not a number', strVersion, granule);
      } else {
        granule.version = version;
      }
    }
    return granule;
  };

  return self;
}

export function dataResultsTimeFilter(spec) {
  let westZone = null;
  let eastZone = null;
  let maxDistance = null;
  let timeOffset;
  const self = {};

  self.name = 'TimeFilter';

  const init = function() {
    const zeroedTime = spec.time.setUTCHours(0);
    westZone = new Date(zeroedTime).setUTCMinutes(spec.westZone);
    eastZone = new Date(zeroedTime).setUTCMinutes(spec.eastZone);
    maxDistance = spec.maxDistance;
    timeOffset = spec.timeOffset || 0;
  };

  self.process = function(meta, granule) {
    let geom = granule.geometry[CRS_WGS_84];
    const time = util.parseTimestampUTC(granule.time_start);
    time.setUTCMinutes(time.getUTCMinutes() + timeOffset);

    // Semi-hack of ensuring geometry isn't a MultiPolygon since
    // isPolygonValid can't handle it; addresses WV-1574
    if (
      !(geom instanceof OlGeomMultiPolygon)
      && !mapIsPolygonValid(geom, maxDistance)
    ) {
      const adjustSign = time < eastZone ? 1 : -1;
      geom = mapAdjustAntiMeridian(geom, adjustSign);
      granule.geometry[CRS_WGS_84] = geom;
      granule.centroid[CRS_WGS_84] = geom.getInteriorPoint();
    }

    const x = granule.centroid[CRS_WGS_84].getCoordinates()[0];
    if (time < eastZone && x < 0) {
      return;
    }
    if (time > westZone && x > 0) {
      return;
    }
    return granule;
  };

  init();
  return self;
}

export function dataResultsTimeLabel(time) {
  const self = {};

  self.name = 'TimeLabel';

  self.process = function(meta, granule) {
    const timeStart = util.parseTimestampUTC(granule.time_start);

    // Sometimes an end time is not provided by CMR
    let timeEnd;
    if (granule.time_end) {
      timeEnd = util.parseTimestampUTC(granule.time_end);
    }

    const diff = Math.floor(
      (timeStart.getTime() - time.setUTCHours(0)) / (1000 * 60 * 60 * 24),
    );

    let suffix = '';
    if (diff !== 0) {
      if (diff < 0) {
        suffix = ` (${diff} day)`;
      } else {
        suffix = ` (+${diff} day)`;
      }
    }
    const displayStart = util.toHourMinutes(timeStart);
    let displayEnd = null;
    if (timeEnd) {
      displayEnd = util.toHourMinutes(timeEnd);
    } else {
      displayEnd = '?';
    }
    granule.label = `${displayStart} - ${displayEnd} UTC${suffix}`;

    granule.downloadLabel = `${util.toISOStringDate(timeStart)
    }: ${
      displayStart
    }-${
      displayEnd
    } UTC`;

    return granule;
  };

  return self;
}

export function dataResultsTitleLabel() {
  const self = {};

  self.name = 'TitleLabel';

  self.process = function(meta, granule) {
    granule.label = granule.title || '';
    return granule;
  };

  return self;
}

export function dataResultsTransform(projection) {
  const self = {};

  self.name = 'Transform';

  self.process = function(meta, granule) {
    if (granule.geometry[projection]) {
      return granule;
    }
    const geom = granule.geometry[CRS_WGS_84];
    const projGeom = geom.clone().transform(CRS_WGS_84, projection);
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
}

export function dataResultsVersionFilter() {
  const self = {};

  self.name = 'VersionFilter';

  self.process = function(meta, granule) {
    if (granule.version) {
      const timeStart = dataCmrRoundTime(granule.time_start);
      if (meta.versions[timeStart]) {
        if (meta.versions[timeStart] !== granule.version) {
          return;
        }
      }
    }
    return granule;
  };

  return self;
}

export function dataResultsVersionFilterExact(version) {
  const self = {};

  self.name = 'versionFilterExact';

  self.process = function(meta, granule) {
    if (granule.version && granule.version === version) {
      return granule;
    }
  };

  return self;
}
