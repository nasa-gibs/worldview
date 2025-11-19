import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { connect } from 'react-redux';
import {
  LineChart, Line, XAxis, YAxis, Legend, Tooltip,
} from 'recharts';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerTile from 'ol/layer/Tile';
import OlFeature from 'ol/Feature';
import { fromExtent } from 'ol/geom/Polygon';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import { getCenter } from 'ol/extent';
import { inAndOut } from 'ol/easing';
import {
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';
import util from '../../util/util';

function ChartComponent (props) {
  const {
    liveData,
    mapView,
    createLayer,
    overviewMapLayerDef,
  } = props;

  const [errorCollapsed, setErrorCollapsed] = useState(true);
  const mapInstanceRef = useRef(null);

  const {
    data,
    unit,
    startDate,
    endDate,
    numRangeDays,
    isTruncated,
    title,
    numPoints,
    coordinates,
    errors,
  } = liveData;

  // Normalize error days input robustly
  const errorDaysArr = useMemo(() => {
    const raw = errors?.error_days;
    if (Array.isArray(raw)) return raw.map((s) => String(s));
    if (raw == null) return [];
    if (typeof raw !== 'string') return [String(raw)];

    const trimmed = raw.trim();

    // Try JSON parse if looks like an array; tolerate single quotes
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const jsonish = trimmed.replace(/'/g, '"');
        const arr = JSON.parse(jsonish);
        if (Array.isArray(arr)) return arr.map((s) => String(s));
      } catch { /* ignore */ }
    }

    // Fallback: strip brackets, split on comma, strip surrounding quotes
    return trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => String(s).trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }, [errors]);

  const errorDatesDisplay = useMemo(
    () => errorDaysArr
      .map((item) => {
        const dateStr = typeof item === 'string'
          ? item
          : item && typeof item === 'object' && 'date' in item ? item.date : String(item || '');
        return (dateStr || '').split('T')[0];
      })
      .filter(Boolean)
      .join(', \u00A0\u00A0'),
    [errorDaysArr],
  );

  const format = util.getCoordinateFormat();

  // Colors / sizes
  const lineColors = ['#A3905D', '#82CA9D', 'orange', 'pink', 'green', 'red', 'yellow', 'aqua', 'maroon'];
  const pointSizes = [3, 2, 1.5, 1.25];
  const formattedUnit = unit ? ` (${unit})` : '';

  function formatToThreeDigits(str) {
    if (!Number.isFinite(Number(str))) return '';
    if (parseFloat(str).toFixed(3).split('.')[0].length > 4) {
      return Number(parseFloat(str).toFixed(3)).toPrecision(3);
    }
    return parseFloat(str).toFixed(3);
  }

  // Normalize X-axis label to a date string (YYYY-MM-DD)
  function normalizeDateLabel(datum) {
    const raw = datum?.name ?? datum?.date ?? datum?.time ?? '';
    const s = String(raw || '');
    if (!s) return '';
    return s.includes('T') ? s.split('T')[0] : s;
  }

  // Prepare data; convert non-finite mean to null to create gaps
  const dataWithLabels = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d, idx) => {
      const meanVal = Number.isFinite(d?.mean) ? d.mean : null;
      return {
        ...d,
        mean: meanVal,
        dateLabel: normalizeDateLabel(d),
        _idx: idx,
        isGap: meanVal === null,
      };
    });
  }, [data]);

  // Build evenly spaced major/minor ticks on a numeric index axis
  const axisTicksConfig = useMemo(() => {
    const len = dataWithLabels.length;
    if (len <= 1) {
      return { ticks: [0], labelStep: 1, minorCount: 0 };
    }
    const n = len - 1;

    // Desired major intervals by size
    const desiredIntervals = len > 200 ? 10 : len > 120 ? 9 : len > 80 ? 8 : len > 40 ? 7 : 6;

    // Pick a divisor of n closest to desiredIntervals for consistent spacing
    const divisors = [];
    for (let i = 1; i <= n; i += 1) {
      if (n % i === 0) divisors.push(i);
    }
    let intervals = divisors[0];
    for (let i = 1; i < divisors.length; i += 1) {
      if (Math.abs(divisors[i] - desiredIntervals) < Math.abs(intervals - desiredIntervals)) {
        intervals = divisors[i];
      }
    }
    intervals = intervals || desiredIntervals; // fallback (should not happen for n>=1)
    const labelStep = Math.max(1, Math.round(n / intervals)); // integer if intervals is divisor

    // Minor tick count by size (consistent between majors)
    const minorCount = len > 200 ? 10 : len > 120 ? 8 : len > 60 ? 6 : len > 30 ? 4 : 2;

    // For very small ranges, show every point as a major (no minors)
    if (len <= 12) {
      return {
        ticks: Array.from({ length: len }, (_, i) => i),
        labelStep: 1,
        minorCount: 0,
      };
    }

    // Build ticks: constant count of minors between majors across the axis
    const minorStep = labelStep / (minorCount + 1); // can be fractional
    const totalSteps = intervals * (minorCount + 1);
    const ticks = Array.from({ length: totalSteps + 1 }, (_, k) => k * minorStep);

    // Guarantee last tick is exactly n (avoid FP drift)
    ticks[ticks.length - 1] = n;
    // Ensure first tick is 0
    ticks[0] = 0;

    return { ticks, labelStep, minorCount };
  }, [dataWithLabels.length]);

  function CustomXAxisTick({ x, y, payload }) {
    const v = Number(payload?.value ?? NaN);
    if (!Number.isFinite(v)) return null;

    const { labelStep } = axisTicksConfig;
    const isMajor = Math.abs((v / labelStep) - Math.round(v / labelStep)) < 1e-6;
    const idx = Math.max(0, Math.min(dataWithLabels.length - 1, Math.round(v)));
    const label = dataWithLabels[idx]?.dateLabel || '';

    if (isMajor && label) {
      const isFirst = idx === 0;
      const isLast = idx === dataWithLabels.length - 1;
      return (
        <g transform={`translate(${x}, ${y})`}>
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#a6a5a6" />
          <text
            x={0}
            y={0}
            dy={16}
            textAnchor="middle"
            fill="#a6a5a6"
            style={{
              transform: isLast ? 'translateX(-8px)' : isFirst ? 'translateX(8px)' : 'none',
            }}
          >
            {label}
          </text>
        </g>
      );
    }
    // Minor tick mark
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1="0" y1="-4" x2="0" y2="-8" stroke="#a6a5a6" />
      </g>
    );
  }

  /**
   * Return buffered min/max for Y axis
   */
  function bufferYAxisMinAndMax(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
    const yAxisMin = Math.floor(min * 4) / 4;
    const yAxisMax = Math.ceil(max * 4) / 4;
    return [yAxisMin - yAxisMin * 0.1, yAxisMax + yAxisMax * 0.1];
  }

  /**
   * Process the data & determine the min & max MEAN values to establish the Y Axis Scale
   * @param {Object} axisData
   */
  function getYAxisValues(axisData) {
    let lowestMin;
    let highestMax;
    for (let i = 0; i < axisData.length; i += 1) {
      const m = axisData[i].mean;
      if (m != null && Number.isFinite(m)) {
        if (lowestMin === undefined || m < lowestMin) lowestMin = m;
        if (highestMax === undefined || m > highestMax) highestMax = m;
      }
    }
    if (lowestMin === undefined || highestMax === undefined) {
      return [0, 1];
    }
    return bufferYAxisMinAndMax(lowestMin, highestMax);
  }

  function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    const dateLabel = p?.payload?.dateLabel || '';
    const value = p?.value;
    const isGap = p?.payload?.isGap || value == null || !Number.isFinite(value);

    return (
      <div className="custom-tooltip">
        <p className="label" style={{ color: 'gray' }}>{dateLabel}</p>
        {isGap ? (
          <p className="label" style={{ color: '#000' }}>No data</p>
        ) : (
          <p className="label" style={{ color: '#000' }}>
            <span className="custom-data-rect" style={{ backgroundColor: p.color }} />
            {`${p.name}${formattedUnit}: `}
            <b>{formatToThreeDigits(value)}</b>
          </p>
        )}
      </div>
    );
  }

  const yAxisValuesArr = getYAxisValues(dataWithLabels);

  /**
   * Extracts each key from the provided object & returns the list, removing 'name' from the collection
   * @param {Object} obj
   */
  function getLineNames(obj) {
    // Add additional fields to the chart here!!
    const linesToInclude = ['mean'];
    return Object.keys(obj[0]).filter((val) => linesToInclude.indexOf(val) > -1);
  }

  /**
   * Return an array of Recharts Line objects
   * @param {Object} chartData
   */
  function getLineChart(chartData) {
    if (!chartData.length) return null;
    const chartLineName = getLineNames(chartData);

    function CustomizedDot(props) {
      const {
        cx, cy, fill, stroke, payload,
      } = props;
      if (payload?.isGap) return null;
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
      if (!Number.isFinite(payload?.mean)) return null;

      // Determine a safe radius based on dataset length with clamping + fallback
      const len = Number.isFinite(chartData?.length) && chartData.length > 0 ? chartData.length : 1;
      const idxBase = Math.max(Math.floor(len / 26), 1) - 1;
      const idx = Math.min(pointSizes.length - 1, Math.max(0, idxBase));
      const radius = pointSizes[idx] ?? 2;
      const transformFunc = `translate(${radius + 1} ${radius + 1})`;

      return (
        <svg x={cx - radius - 1} y={cy - radius - 1}>
          <g transform={transformFunc}>
            <circle r={radius + 0.5} fill={stroke} />
            <circle r={radius - 0.5} fill={fill} />
          </g>
        </svg>
      );
    }

    return chartLineName.map((id, index) => (
      <Line
        type="linear"
        key={id}
        dataKey={chartLineName[index]}
        stroke={lineColors[index]}
        dot={<CustomizedDot />}
        // Break lines at gaps (mean null)
        connectNulls={false}
        isAnimationActive={false}
      />
    ));
  }

  /**
   * Processes each date in the chart data, computes & returns the averages as "quick statistics"
   * @param {Object} chartData
   */
  function getQuickStatistics(chartData) {
    let count = 0;
    let minTotal = 0;
    let maxTotal = 0;
    let meanTotal = 0;
    let medianTotal = 0;
    let stddevTotal = 0;

    for (let i = 0; i < chartData.length; i += 1) {
      const row = chartData[i];
      const valid = Number.isFinite(row.mean)
        && Number.isFinite(row.min)
        && Number.isFinite(row.max)
        && Number.isFinite(row.median)
        && Number.isFinite(row.stddev);
      if (valid) {
        meanTotal += row.mean;
        minTotal += row.min;
        maxTotal += row.max;
        medianTotal += row.median;
        stddevTotal += row.stddev;
        count += 1;
      }
    }

    if (count === 0) {
      return (
        <div className="charting-statistics-container">
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">No valid data</span>
          </div>
        </div>
      );
    }

    return (
      <div className="charting-statistics-container">
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">Median:</span>
          <span className="charting-statistics-value">{formatToThreeDigits(medianTotal / count)}</span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">Mean:</span>
          <span className="charting-statistics-value">{formatToThreeDigits(meanTotal / count)}</span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">Min:</span>
          <span className="charting-statistics-value">{formatToThreeDigits(minTotal / count)}</span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">Max:</span>
          <span className="charting-statistics-value">{formatToThreeDigits(maxTotal / count)}</span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">Stdev:</span>
          <span className="charting-statistics-value">{formatToThreeDigits(stddevTotal / count)}</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const boxFeature = new OlFeature({ geometry: fromExtent(coordinates) });
    boxFeature.setStyle(new OlStyle({
      stroke: new OlStyleStroke({ color: 'rgba(255, 255, 255, .6)', width: 1 }),
      fill: new OlStyleFill({ color: 'rgba(255, 255, 255, .3)' }),
    }));
    const boxLayer = new OlVectorLayer({
      source: new OlVectorSource({ features: [boxFeature] }),
    });

    const createLayerWrapper = async () => {
      const backgroundLayerGroup = await createLayer(overviewMapLayerDef);
      backgroundLayerGroup.setVisible(true);

      const layersList = [];
      backgroundLayerGroup.getLayers().getArray().forEach((layer) => {
        layersList.push(new OlLayerTile({ source: layer.getSource() }));
      });
      const copiedLayerGroup = new OlLayerGroup({ layers: layersList });
      mapInstanceRef.current = new OlMap({
        view: new OlView({
          center: mapView.getCenter(),
          zoom: mapView.getZoom(),
          projection: mapView.getProjection(),
        }),
        layers: [copiedLayerGroup, boxLayer],
        target: 'charting-minimap-inner',
        interactions: [],
      });

      const minimapView = mapInstanceRef.current.getView();
      minimapView.fit(boxFeature.getGeometry().getExtent(), { padding: [50, 50, 50, 50] });

      mapInstanceRef.current.on('moveend', () => {
        const boxCenter = getCenter(boxFeature.getGeometry().getExtent());
        const minimapCenter = minimapView.getCenter();
        if (boxCenter[0] === minimapCenter[0] && boxCenter[1] === minimapCenter[1]) return;
        minimapView.animate({ center: boxCenter, duration: 350, easing: inAndOut });
      });
    };

    createLayerWrapper();

    return () => {
      mapInstanceRef.current?.setTarget(null);
      mapInstanceRef.current = null;
    };
  }, [overviewMapLayerDef]);

  return (
    <div className="charting-chart-container">
      <div className="charting-chart-inner">
        <div className="charting-chart-text">
          <LineChart
            width={600}
            height={300}
            data={dataWithLabels}
            margin={{
              top: 20,
              right: 30, // extra to prevent last label cutoff
              left: 35,
              bottom: 10,
            }}
          >
            <Tooltip content={CustomTooltip} />
            {getLineChart(dataWithLabels)}
            <XAxis
              type="number"
              dataKey="_idx"
              domain={[0, Math.max(dataWithLabels.length - 1, 0)]}
              ticks={axisTicksConfig.ticks}
              tick={<CustomXAxisTick />}
              interval={0}
              tickLine={false}
              height={55}
              padding={{ left: 5, right: 15 }}
            />
            <YAxis
              type="number"
              stroke="#a6a5a6"
              domain={yAxisValuesArr}
              tickFormatter={(tick) => formatToThreeDigits(tick)}
              label={{
                value: `mean${formattedUnit}`,
                angle: -90,
                position: 'center',
                dx: -40,
              }}
            />
            <Legend
              formatter={() => `${title}`}
              wrapperStyle={{ paddingTop: '7px' }}
            />
          </LineChart>
        </div>
        <div className="charting-stat-text">
          <div id="charting-stats-container">
            <h3>
              <b>
                Average Statistics
                {formattedUnit}
              </b>
            </h3>
            <br />
            {getQuickStatistics(dataWithLabels)}
          </div>
          <div id="charting-minimap-container">
            <div id="charting-minimap-inner" />
          </div>
          <div />
          <div id="charting-coordinates-container">
            <h3><b>Coordinates</b></h3>
            <br />
            <div className="charting-coordinates-inner">
              <div />
              <div className="coordinate-center coordinate-subheader">Latitude</div>
              <div className="coordinate-center coordinate-subheader">Longitude</div>
              <div>Top Right:</div>
              <div className="coordinate-mono">{util.formatCoordinate([coordinates[2], coordinates[3]], format).split(', ')[0]}</div>
              <div className="coordinate-mono">{util.formatCoordinate([coordinates[2], coordinates[3]], format).split(', ')[1]}</div>
              <div>Bottom Left:</div>
              <div className="coordinate-mono">{util.formatCoordinate([coordinates[0], coordinates[1]], format).split(', ')[0]}</div>
              <div className="coordinate-mono">{util.formatCoordinate([coordinates[0], coordinates[1]], format).split(', ')[1]}</div>
            </div>
          </div>
        </div>
        <div className="charting-disclaimer">
          <strong className="charting-disclaimer-pre">Note: </strong>
          <span>Numerical analyses performed on imagery should only be used for initial basic exploratory purposes.</span>
          {isTruncated && (
            <div className="charting-disclaimer-upper">
              <FontAwesomeIcon icon="exclamation-triangle" className="wv-alert-icon" size="1x" widthAuto />
              <i className="charting-disclaimer-block">
                As part of this beta feature release, the number of data points plotted between
                <b>{` ${startDate} `}</b>
                and
                <b>{` ${endDate} `}</b>
                have been reduced from
                <b>{` ${numRangeDays} `}</b>
                to
                <b>{` ${numPoints}`}</b>
                .
              </i>
            </div>
          )}
          {errors && errors.error_count > 0 && (
            <div className="charting-disclaimer-lower">
              <FontAwesomeIcon icon="exclamation-triangle" className="wv-alert-icon" size="1x" widthAuto />
              <i className="charting-disclaimer-block">
                {`${errors.error_count} `}
                {errors.error_count === 1
                  ? 'requested date has no data and is represented as a gap in the chart.'
                  : 'requested dates have no data and are represented as gaps in the chart.'}
              </i>
              {!errorCollapsed && (
                <div className="charting-disclaimer-dates">
                  <i className="charting-disclaimer-block">{errorDatesDisplay}</i>
                </div>
              )}
              <div className="error-expand-button">
                <span
                  className="error-expand-button-inner"
                  onClick={() => setErrorCollapsed(!errorCollapsed)}
                >
                  {errorCollapsed ? 'more' : 'less'}
                  <FontAwesomeIcon
                    className="layer-group-collapse"
                    icon={!errorCollapsed ? 'caret-up' : 'caret-down'}
                    widthAuto
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  const { map, layers } = state;
  const { ui } = map;
  const layerId = 'Coastlines_15m';
  return {
    mapView: ui.selected.getView(),
    createLayer: ui.createLayer,
    overviewMapLayerDef: layers.layerConfig[layerId],
  };
};

ChartComponent.propTypes = {
  liveData: PropTypes.object,
  mapView: PropTypes.object,
  createLayer: PropTypes.func,
  overviewMapLayerDef: PropTypes.object,
};

export default connect(
  mapStateToProps,
)(ChartComponent);
