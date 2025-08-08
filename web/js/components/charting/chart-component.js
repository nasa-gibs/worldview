import React, { useEffect, useRef } from 'react';
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

  const mapInstanceRef = useRef(null);

  const {
    data,
    unit,
    startDate,
    endDate,
    numRangeDays,
    isTruncated,
    title,
    STEP_NUM,
    coordinates,
  } = liveData;

  const format = util.getCoordinateFormat();

  const startDateObj = new Date(startDate);
  const startDateFormatted = `${startDateObj.getFullYear()}-${`0${startDateObj.getMonth() + 1}`.slice(-2)}-${`0${startDateObj.getDate()}`.slice(-2)}`;
  const endDateObj = new Date(endDate);
  const endDateFormatted = `${endDateObj.getFullYear()}-${`0${endDateObj.getMonth() + 1}`.slice(-2)}-${`0${endDateObj.getDate()}`.slice(-2)}`;

  // Arbitrary array of colors to use
  const lineColors = ['#A3905D', '#82CA9D', 'orange', 'pink', 'green', 'red', 'yellow', 'aqua', 'maroon'];
  const formattedUnit = unit ? ` (${unit})` : '';

  function formatToThreeDigits(str) {
    if (parseFloat(str).toFixed(3).split('.')[0].length > 4) {
      return Number(parseFloat(str).toFixed(3)).toPrecision(3);
    }
    return parseFloat(str).toFixed(3);
  }

  /**
   * Return an array of provided min & max values buffered by 10%
   * @param {number} min | the lowest mean value of the collected data
   * @param {number} max | the highest mean value of the collected data
   */
  function bufferYAxisMinAndMax(min, max) {
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
      // Establish mean min & max values for chart rendering
      if (axisData[i].mean < lowestMin || lowestMin === undefined) {
        lowestMin = axisData[i].mean;
      }
      if (axisData[i].mean > highestMax || highestMax === undefined) {
        highestMax = axisData[i].mean;
      }
    }

    return bufferYAxisMinAndMax(lowestMin, highestMax);
  }

  function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label" style={{ color: 'gray' }}>
            {label}
          </p>
          <p className="label" style={{ color: '#000' }}>
            <span className="custom-data-rect" style={{ backgroundColor: payload[0].color }} />
            {`${payload[0].name}${formattedUnit}: `}
            <b>
              {formatToThreeDigits(payload[0].value)}
            </b>
          </p>
        </div>
      );
    }

    return null;
  }

  const yAxisValuesArr = getYAxisValues(data);

  /**
   * Extracts each key from the provided object & returns the list, removing 'name' from the collection
   * @param {Object} chartData
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
    const chartLineName = getLineNames(chartData);

    const chartLinesArr = chartLineName.map((id, index) => (
      <Line
        type="linear"
        key={id}
        dataKey={chartLineName[index]}
        stroke={lineColors[index]}
      />
    ));
    return chartLinesArr;
  }

  /**
   * Processes each date in the chart data, computes & returns the averages as "quick statistics"
   * @param {Object} chartData
   */
  function getQuickStatistics(chartData) {
    const count = chartData.length;
    let minTotal = 0;
    let maxTotal = 0;
    let meanTotal = 0;
    let medianTotal = 0;
    let stddevTotal = 0;

    for (let i = 0; i < chartData.length; i += 1) {
      meanTotal += chartData[i].mean;
      minTotal += chartData[i].min;
      maxTotal += chartData[i].max;
      medianTotal += chartData[i].median;
      stddevTotal += chartData[i].stddev;
    }

    return (
      <>
        <div className="charting-statistics-container">
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Median:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(medianTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Mean:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(meanTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Min:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(minTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Max:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(maxTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Stdev:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(stddevTotal / count)}
            </span>
          </div>
        </div>
      </>
    );
  }

  useEffect(() => {
    const boxFeature = new OlFeature({
      geometry: fromExtent(coordinates),
    });
    boxFeature.setStyle(new OlStyle({
      stroke: new OlStyleStroke({
        color: 'rgba(255, 255, 255, .6)',
        width: 1,
      }),
      fill: new OlStyleFill({
        color: 'rgba(255, 255, 255, .3)',
      }),
    }));
    const boxLayer = new OlVectorLayer({
      source: new OlVectorSource({
        features: [boxFeature],
      }),
    });

    const createLayerWrapper = async () => {
      const backgroundLayerGroup = await createLayer(overviewMapLayerDef);
      backgroundLayerGroup.setVisible(true);

      const layersList = [];
      backgroundLayerGroup.getLayers().getArray().forEach((layer) => {
        layersList.push(new OlLayerTile({
          source: layer.getSource(),
        }));
      });
      const copiedLayerGroup = new OlLayerGroup({
        layers: layersList,
      });

      mapInstanceRef.current = new OlMap({
        view: new OlView({
          center: mapView.getCenter(),
          zoom: mapView.getZoom(),
          projection: mapView.getProjection(),
        }),
        layers: [copiedLayerGroup, boxLayer],
        target: 'charting-minimap-inner',
        interactions: [],
        controls: [],
      });

      const minimapView = mapInstanceRef.current.getView();
      minimapView.fit(boxFeature.getGeometry().getExtent(), { padding: [75, 75, 75, 75] });
    };

    createLayerWrapper();

    return () => {
      mapInstanceRef.current.setTarget(null);
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
            data={data}
            margin={{
              top: 20,
              right: 10,
              left: 30,
              bottom: 10,
            }}
          >
            <Tooltip content={CustomTooltip} />
            {' '}
            {getLineChart(data)}
            <XAxis dataKey="name" stroke="#a6a5a6" />
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
            <Legend formatter={() => `${title}`} />
          </LineChart>
          <div className="charting-disclaimer">
            <strong className="charting-disclaimer-pre">Note: </strong>
            <span>Numerical analyses performed on imagery should only be used for initial basic exploratory purposes.</span>
            {isTruncated
            && (
              <div className="charting-disclaimer-lower">
                <FontAwesomeIcon
                  icon="exclamation-triangle"
                  className="wv-alert-icon"
                  size="1x"
                  widthAuto
                />
                <i className="charting-disclaimer-block">
                  As part of this beta feature release, the number of data points plotted between
                  <b>
                    {` ${startDate} `}
                  </b>
                  and
                  <b>
                    {` ${endDate} `}
                  </b>
                  have been reduced from
                  <b>
                    {` ${numRangeDays} days `}
                  </b>
                  to
                  <b>
                    {` ${STEP_NUM} days`}
                  </b>
                  .
                </i>
              </div>
            )}
          </div>
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
            {getQuickStatistics(data)}
          </div>
          <div id="charting-minimap-container">
            <div id="charting-minimap-inner" />
          </div>
          <div id="charting-dates-container">
            <h3>
              &nbsp;
            </h3>
            <br />
            <div className="charting-dates-inner">
              <div className="charting-dates-header dates-center">
                <h3>
                  <b>
                    Dates
                  </b>
                </h3>
              </div>
              <div>Start:</div>
              <div className="dates-mono">{startDateFormatted}</div>
              <div>End:</div>
              <div className="dates-mono">{endDateFormatted}</div>
            </div>
          </div>
          <div id="charting-coordinates-container">
            <h3>
              <b>
                Coordinates
              </b>
            </h3>
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
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  const {
    map,
    layers,
  } = state;

  const {
    ui,
  } = map;

  const layerId = 'Coastlines_15m';

  return {
    mapView: ui.selected.getView(),
    createLayer: ui.createLayer,
    overviewMapLayerDef: layers.layerConfig[layerId],
  };
};

ChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default connect(
  mapStateToProps,
)(ChartComponent);
