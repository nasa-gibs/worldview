import React from 'react';
import PropTypes from 'prop-types';
import lodashIsNumber from 'lodash/isNumber';
import lodashIsEqual from 'lodash/isEqual';
import { Tooltip } from 'reactstrap';
import VisibilitySensor from 'react-visibility-sensor/visibility-sensor';
import { connect } from 'react-redux';
import { getOrbitTrackTitle } from '../../modules/layers/util';
import {
  drawSidebarPaletteOnCanvas,
  drawTicksOnCanvas,
} from '../../modules/palettes/util';
import {
  checkTemperatureUnitConversion,
  convertPaletteValue,
} from '../../modules/settings/util';
import util from '../../util/util';
import {
  setToggledClassification,
  refreshDisabledClassification,
} from '../../modules/palettes/actions';

/**
   * @param {Number} xOffset | X px Location of running-data
   * @param {Number} textWidth | px width of text calculated with canvas
   * @param {Number} width | Case width
   */
const getRunningLabelStyle = (xOffset, textWidth, width) => {
  if (!xOffset || !textWidth || !width) return { transform: 'translateX(0)' };
  const halfTextWidth = textWidth / 2 || 0;
  if (halfTextWidth > xOffset) {
    return { transform: 'translateX(0)' };
  } if (xOffset + halfTextWidth > width) {
    return { right: '0' };
  }
  return { transform: `translateX(${Math.floor(xOffset - halfTextWidth)}px)` };
};


// `translateX(${isHoveringLegend ? 0 : xOffset > 0 ? xOffset + 0.5 : 0}px)`,

class PaletteLegend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRunningData: props.isRunningData,
      colorHex: props.colorHex,
      width: props.width,
      scrollContainerEl: null,
    };
  }

  componentDidMount() {
    const {
      getPalette, layer, compareState, toggleAllClassifications,
    } = this.props;
    if (layer.disabled === undefined) {
      // There is not a previous instance, so check the palette defaults
      const palette = getPalette();
      if (palette.disabled && palette.disabled.length > 0) {
        const disabledIntArr = palette.disabled.map((str) => Number(str));
        toggleAllClassifications(layer.id, disabledIntArr, 0, compareState);
      }
    }

    this.updateCanvas();
    this.setState(() => ({
      scrollContainerEl: document.querySelector('#layers-scroll-container'),
    }));
  }

  UNSAFE_componentWillReceiveProps(props) {
    const { colorHex, isRunningData } = this.state;
    if (props.colorHex !== colorHex || props.isRunningData !== isRunningData) {
      this.setState({
        isRunningData: props.isRunningData,
        colorHex: props.colorHex,
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { isDistractionFreeModeActive, layer, width } = this.props;
    // Updates when layer options/settings changed, if ZOT changes the width of the palette, or distraction free mode exit
    const layerChange = !lodashIsEqual(layer, prevProps.layer);
    const widthChange = prevProps.width !== width;
    const distractionFreeChange = prevProps.isDistractionFreeModeActive && !isDistractionFreeModeActive;
    if (layerChange || widthChange || distractionFreeChange) {
      this.updateCanvas();
    }
  }

  /**
   * Get percent of selected point position in parent
   */
  getPercent(len, index) {
    let segmentWidth;
    let location;
    const { width } = this.state;
    if (len < 250) {
      segmentWidth = width / len;
      location = segmentWidth * index + 0.5 * segmentWidth;
      return lodashIsNumber(location / width) ? location / width : 0;
    }
    return lodashIsNumber(index / len) ? index / len : 0;
  }

  /**
   * OnMouseMove get correct canvas Data
   * @param {Object} canvas | Element
   * @param {Object} e | Event Object
   */
  onHoverColorbar(canvas, e) {
    e.preventDefault();
    e.stopPropagation();
    const boundingRec = e.target.getBoundingClientRect();
    const x = e.clientX - boundingRec.left;
    const y = e.clientY - boundingRec.top;
    const rgba = canvas.current.getContext('2d').getImageData(x, y, 1, 1).data;
    const hex = util.rgbaToHex(rgba[0], rgba[1], rgba[2]);

    this.setState({
      colorHex: hex,
    });
  }

  /**
   * On Mouse Enter update State
   * @param {*} e
   */
  onMouseEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      isRunningData: true,
      isHoveringLegend: true,
    });
  }

  /**
   * Update state on MouseOut
   */
  hideValue(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      isRunningData: false,
      isHoveringLegend: false,
    });
  }

  /**
   * Style Canvas bases on updates to legend or canvas-width
   */
  updateCanvas() {
    const {
      height, width, paletteLegends,
    } = this.props;

    paletteLegends.forEach((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        const ctxStr = `canvas_${index}`;
        if (this[ctxStr]) {
          const newWidth = this[ctxStr].current.getBoundingClientRect().width;
          // eslint-disable-next-line react/destructuring-assignment
          if (newWidth && newWidth !== this.state.width) {
            // If scrollbar appears canvas width changes.
            // This value is needed for calculating running data offsets
            this.setState({ width: newWidth });
          }
          const ctx = this[ctxStr].current.getContext('2d');
          drawSidebarPaletteOnCanvas(
            ctx,
            colorMap.colors,
            width,
            height,
          );
          drawTicksOnCanvas(
            ctx,
            colorMap,
            width,
            height,
          );
        }
      }
    });
  }

  /**
   * Find wanted legend object from Hex
   * @param {Object} legend
   * @param {String} hex
   * @param {Number} acceptableDifference
   */
  getLegendObject(legend, hex, acceptableDifference) {
    const { globalTemperatureUnit } = this.props;
    const units = legend.units || '';

    const { needsConversion, legendTempUnit } = checkTemperatureUnitConversion(units, globalTemperatureUnit);
    for (let i = 0, len = legend.colors.length; i < len; i += 1) {
      if (util.hexColorDelta(legend.colors[i], hex) < acceptableDifference) {
        const tooltipRange = legend.tooltips[i];
        // If the two colors are close
        let label;
        if (needsConversion) {
          label = convertPaletteValue(tooltipRange, legendTempUnit, globalTemperatureUnit);
        } else {
          label = units ? `${tooltipRange} ${units}` : tooltipRange;
        }
        return {
          label,
          len,
          index: i,
        };
      }
    }
    return null;
  }

  /**
   * Render scale-type paletteLegends
   * @param {Object} legend
   * @param {Number} index
   * @param {Boolean} isMoreThanOneColorBar
   */
  renderScale(legend, index, isMoreThanOneColorBar) {
    const {
      layer, width, getPalette, isEmbedModeActive, isMobile, globalTemperatureUnit,
    } = this.props;
    const {
      isRunningData, colorHex, isHoveringLegend,
    } = this.state;
    const palette = getPalette(layer.id, index);
    let percent;
    let textWidth;
    let xOffset;
    let legendObj;
    const toolTipLength = legend.tooltips.length;
    // eslint-disable-next-line react/destructuring-assignment
    if (isRunningData && colorHex && this.state.width > 0) {
      legendObj = this.getLegendObject(legend, colorHex, 3); // {label,len,index}
      if (legendObj) {
        percent = this.getPercent(legendObj.len, legendObj.index);
        textWidth = util.getTextWidth(legendObj.label, '10px Open Sans');
        // eslint-disable-next-line react/destructuring-assignment
        xOffset = Math.floor(this.state.width * percent);
        if (isEmbedModeActive) {
          // adjust xOffset per css scale transform
          xOffset = Math.floor(xOffset / 0.75);
        }
      }
    }

    const units = legend.units || '';
    const { needsConversion, legendTempUnit } = checkTemperatureUnitConversion(units, globalTemperatureUnit);
    let min = legend.minLabel || legend.tooltips[0];
    let max = legend.maxLabel || legend.tooltips[toolTipLength];
    min = palette.min ? legend.tooltips[legend.refs.indexOf(palette.entries.refs[palette.min])] : min;
    max = palette.max ? legend.tooltips[legend.refs.indexOf(palette.entries.refs[palette.max])] : max;

    if (needsConversion) {
      min = `${convertPaletteValue(min, legendTempUnit, globalTemperatureUnit)}`;
      max = `${convertPaletteValue(max, legendTempUnit, globalTemperatureUnit)}`;
    } else {
      min = units ? `${min} ${units}` : min;
      max = units ? `${max} ${units}` : max;
    }
    const mobileColorbarStyle = isMobile ? {
      width: '100%',
      maxWidth: '100%',
      marginRight: '0',
      marginLeft: '0',
    } : null;
    return (
      <div
        className={
          legendObj ? 'wv-running wv-palettes-legend' : 'wv-palettes-legend'
        }
        id={`${util.encodeId(layer.id)}_${util.encodeId(legend.id)}_${index}`}
        key={`${layer.id}_${legend.id}_${index}`}
      >
        {isMoreThanOneColorBar ? (
          <div className="wv-palettes-title">{legend.title}</div>
        )
          : ''}
        <div className="colorbar-case">
          <canvas
            className="wv-palettes-colorbar"
            id={`${util.encodeId(layer.id)}-${util.encodeId(legend.id)}${index}colorbar`}
            style={mobileColorbarStyle}
            width={width}
            height={24}
            ref={this[`canvas_${index}`]}
            onMouseEnter={!isMobile ? this.onMouseEnter.bind(this) : null}
            onMouseLeave={!isMobile ? this.hideValue.bind(this) : null}
            onMouseMove={
              !isMobile
                ? this.onHoverColorbar.bind(this, this[`canvas_${index}`])
                : null
            }
          />
          <div
            className="wv-running-bar"
            style={{
              top: 7,
              transform: `translateX(${isHoveringLegend ? 0 : xOffset > 0 ? xOffset + 0.5 : 0}px)`,
              visibility: legendObj && !isHoveringLegend ? 'visible' : 'hidden',
            }}
          />
        </div>
        <div className="wv-palettes-min">{min}</div>
        <div className="wv-palettes-max">
          {' '}
          {max}
        </div>
        <span
          className="wv-running-label"
          style={
            isRunningData
              ? getRunningLabelStyle(xOffset, textWidth, width)
              : { display: 'none' }
          }
        >
          {legendObj ? legendObj.label : ''}
        </span>
      </div>
    );
  }

  /**
   * Update label & Location on Mousemove
   * @param {String} color | Hex
   * @param {Object} e | Event Object
   */
  onMove(color, e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ colorHex: color });
  }

  /**
   * Render a legend of class type
   * @param {Object} legend | Legend Object
   * @param {Number} index | Legend Index
   */
  renderClasses(legend, legendIndex) {
    const { isRunningData, colorHex, scrollContainerEl } = this.state;
    const {
      layer, parentLayer, compareState, getPalette, palettes,
    } = this.props;
    const activeKeyObj = isRunningData && colorHex && this.getLegendObject(legend, colorHex, 5);
    const legendClass = activeKeyObj
      ? 'wv-running wv-palettes-legend wv-palettes-classes'
      : 'wv-palettes-legend wv-palettes-classes';
    const singleKey = legend.colors.length === 1;
    const legendTooltip = legend.tooltips && legend.tooltips.length ? legend.tooltips[0] : '';
    const trackLabel = layer.track && legendTooltip
      ? `${legendTooltip} - ${getOrbitTrackTitle(layer)}`
      : getOrbitTrackTitle(layer);
    const palette = getPalette(layer.id, legendIndex);
    return (
      <VisibilitySensor
        key={`${legend.id}-${legendIndex}vis-sensor`}
        containment={scrollContainerEl}
        partialVisibility
      >
        {({ isVisible }) => (
          <div className={legendClass} key={`${legend.id}_${legendIndex}`}>
            {legend.colors.map((color, keyIndex) => {
              const isActiveKey = activeKeyObj && activeKeyObj.index === keyIndex;
              let palletteClass = isActiveKey ? 'wv-active wv-palettes-class' : 'wv-palettes-class';
              const isSubLayer = !!parentLayer;
              const parentLayerId = isSubLayer ? `-${parentLayer.id}` : '';
              const keyId = `${util.encodeId(legend.id)}-color${util.encodeId(parentLayerId)}-${util.encodeId(layer.id)}-${compareState}${keyIndex}`;
              const keyLabel = activeKeyObj ? activeKeyObj.label : '';
              const inActive = palette.disabled && palette.disabled.includes(keyIndex);
              const tooltipText = singleKey
                ? layer.track ? trackLabel : legendTooltip
                : keyLabel;
              const isInvisible = color === '00000000';
              palletteClass = isInvisible ? `${palletteClass} checkerbox-bg` : palletteClass;
              let legendColor = color;
              const customColor = palette.custom;
              if (palette.custom !== undefined) {
                [legendColor] = palettes.custom[customColor].colors;
              }

              return (
                <React.Fragment key={keyId}>
                  <span
                    id={keyId}
                    className={inActive ? `${palletteClass} disabled-classification` : palletteClass}
                    style={isInvisible ? null : { backgroundColor: util.hexToRGBA(legendColor) }}
                    onMouseMove={this.onMove.bind(this, legendColor)}
                    onMouseEnter={this.onMouseEnter.bind(this)}
                    onMouseLeave={this.hideValue.bind(this)}
                    dangerouslySetInnerHTML={{ __html: '&nbsp' }}
                  />

                  {singleKey && !isSubLayer && (
                    <div className="wv-running-category-label-case">
                      <span className="wv-running-category-label">
                        {layer.track ? trackLabel : legendTooltip}
                      </span>
                    </div>
                  )}

                  {isVisible && (
                    <Tooltip
                      id="center-align-tooltip"
                      placement={singleKey ? 'right' : 'bottom'}
                      isOpen={isActiveKey}
                      className="wv-palette-tooltip"
                      target={keyId}
                    >
                      {tooltipText}
                    </Tooltip>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </VisibilitySensor>
    );
  }

  /**
   * Loop through colormaps and render correct legend type
   */
  renderPaletteLegends() {
    const { paletteLegends } = this.props;
    // eslint-disable-next-line array-callback-return
    return paletteLegends.map((colorMap, index) => {
      if (colorMap.id.includes('AERONET')) {
        const colors = [
          'fffdcdff',
          'fffcc7ff',
          'fffbc1ff',
          'fffabcff',
          'fff9b7ff',
          'fff8b2ff',
          'fff7adff',
          'fff6a7ff',
          'fff5a2ff',
          'fff49dff',
          'fff398ff',
          'fff293ff',
          'fff090ff',
          'ffef8dff',
          'ffee8aff',
          'ffec87ff',
          'ffeb84ff',
          'ffea81ff',
          'ffe87eff',
          'ffe77bff',
          'ffe678ff',
          'ffe576ff',
          'ffe373ff',
          'ffe271ff',
          'ffe16eff',
          'ffdf6cff',
          'ffde6aff',
          'ffdd67ff',
          'ffdb65ff',
          'ffda62ff',
          'ffd960ff',
          'ffd85eff',
          'ffd65bff',
          'ffd459ff',
          'ffd257ff',
          'ffd055ff',
          'ffcf53ff',
          'ffcd50ff',
          'ffcb4eff',
          'ffc94cff',
          'ffc74aff',
          'ffc648ff',
          'ffc346ff',
          'ffc144ff',
          'ffbe42ff',
          'ffbc40ff',
          'ffb93eff',
          'ffb73cff',
          'ffb43aff',
          'ffb238ff',
          'ffaf36ff',
          'ffad35ff',
          'ffaa33ff',
          'ffa832ff',
          'ffa531ff',
          'ffa32fff',
          'ffa12eff',
          'ff9e2dff',
          'ff9c2bff',
          'ff992aff',
          'ff9729ff',
          'ff9528ff',
          'ff9227ff',
          'ff9026ff',
          'ff8e25ff',
          'ff8c25ff',
          'ff8a24ff',
          'ff8723ff',
          'ff8523ff',
          'ff8322ff',
          'ff8121ff',
          'ff7f21ff',
          'ff7c20ff',
          'ff791fff',
          'ff761fff',
          'ff731eff',
          'ff701eff',
          'ff6d1dff',
          'ff6a1cff',
          'ff671cff',
          'ff641bff',
          'ff621bff',
          'ff5e1aff',
          'ff5b19ff',
          'ff5818ff',
          'ff5518ff',
          'ff5217ff',
          'ff4e16ff',
          'ff4b16ff',
          'ff4815ff',
          'ff4514ff',
          'ff4214ff',
          'fe3f13ff',
          'fd3c13ff',
          'fc3a12ff',
          'fb3712ff',
          'fa3512ff',
          'f93211ff',
          'f82f11ff',
          'f72d10ff',
          'f62a10ff',
          'f52810ff',
          'f3260fff',
          'f2240fff',
          'f0220eff',
          'ef200eff',
          'ee1e0dff',
          'ec1c0dff',
          'eb1a0cff',
          'e9180cff',
          'e8160bff',
          'e7140bff',
          'e5120bff',
          'e3110bff',
          'e1100bff',
          'df0e0bff',
          'dd0d0bff',
          'db0c0bff',
          'd90a0bff',
          'd7090bff',
          'd5080bff',
          'd3070cff',
          'd0060cff',
          'ce050cff',
          'cc040cff',
          'c9040cff',
          'c7030dff',
          'c5020dff',
          'c2020dff',
          'c0010dff',
          'be000dff',
          'bc000eff',
          'b8000eff',
          'b5000eff',
          'b2000eff',
          'ae000eff',
          'ab000eff',
          'a8000eff',
          'a4000eff',
          'a1000eff',
          '9e000eff',
          '9b000eff',
          '98000eff',
          '95000eff',
          '92000eff',
          '8f000eff',
          '8c000eff',
          '89000eff',
          '86000eff',
          '83000eff',
          '80000eff',
          '7d000eff',
        ];
        const tooltips = [
          '< 0.000',
          '0 – 0.005',
          '0.005 – 0.010',
          '0.010 – 0.015',
          '0.015 – 0.020',
          '0.020 – 0.025',
          '0.025 – 0.030',
          '0.030 – 0.035',
          '0.035 – 0.040',
          '0.040 – 0.045',
          '0.045 – 0.050',
          '0.050 – 0.055',
          '0.055 – 0.060',
          '0.060 – 0.065',
          '0.065 – 0.070',
          '0.070 – 0.075',
          '0.075 – 0.080',
          '0.080 – 0.085',
          '0.085 – 0.090',
          '0.090 – 0.095',
          '0.095 – 0.1',
          '0.1 – 0.105',
          '0.105 – 0.110',
          '0.110 – 0.115',
          '0.115 – 0.120',
          '0.120 – 0.125',
          '0.125 – 0.130',
          '0.130 – 0.135',
          '0.135 – 0.140',
          '0.140 – 0.145',
          '0.145 – 0.150',
          '0.150 – 0.155',
          '0.155 – 0.160',
          '0.160 – 0.165',
          '0.165 – 0.170',
          '0.170 – 0.175',
          '0.175 – 0.180',
          '0.180 – 0.185',
          '0.185 – 0.190',
          '0.190 – 0.195',
          '0.195 – 0.2',
          '0.2 – 0.205',
          '0.205 – 0.210',
          '0.210 – 0.215',
          '0.215 – 0.220',
          '0.220 – 0.225',
          '0.225 – 0.230',
          '0.230 – 0.235',
          '0.235 – 0.240',
          '0.240 – 0.245',
          '0.245 – 0.250',
          '0.250 – 0.255',
          '0.255 – 0.260',
          '0.260 – 0.265',
          '0.265 – 0.270',
          '0.270 – 0.275',
          '0.275 – 0.280',
          '0.280 – 0.285',
          '0.285 – 0.290',
          '0.290 – 0.295',
          '0.295 – 0.3',
          '0.3 – 0.305',
          '0.305 – 0.310',
          '0.310 – 0.315',
          '0.315 – 0.320',
          '0.320 – 0.325',
          '0.325 – 0.330',
          '0.330 – 0.335',
          '0.335 – 0.340',
          '0.340 – 0.345',
          '0.345 – 0.350',
          '0.350 – 0.355',
          '0.355 – 0.360',
          '0.360 – 0.365',
          '0.365 – 0.370',
          '0.370 – 0.375',
          '0.375 – 0.380',
          '0.380 – 0.385',
          '0.385 – 0.390',
          '0.390 – 0.395',
          '0.395 – 0.4',
          '0.4 – 0.405',
          '0.405 – 0.410',
          '0.410 – 0.415',
          '0.415 – 0.420',
          '0.420 – 0.425',
          '0.425 – 0.430',
          '0.430 – 0.435',
          '0.435 – 0.440',
          '0.440 – 0.445',
          '0.445 – 0.450',
          '0.450 – 0.455',
          '0.455 – 0.460',
          '0.460 – 0.465',
          '0.465 – 0.470',
          '0.470 – 0.475',
          '0.475 – 0.480',
          '0.480 – 0.485',
          '0.485 – 0.490',
          '0.490 – 0.495',
          '0.495 – 0.5',
          '0.5 – 0.505',
          '0.505 – 0.510',
          '0.510 – 0.515',
          '0.515 – 0.520',
          '0.520 – 0.525',
          '0.525 – 0.530',
          '0.530 – 0.535',
          '0.535 – 0.540',
          '0.540 – 0.545',
          '0.545 – 0.550',
          '0.550 – 0.555',
          '0.555 – 0.560',
          '0.560 – 0.565',
          '0.565 – 0.570',
          '0.570 – 0.575',
          '0.575 – 0.580',
          '0.580 – 0.585',
          '0.585 – 0.590',
          '0.590 – 0.595',
          '0.595 – 0.6',
          '0.6 – 0.605',
          '0.605 – 0.610',
          '0.610 – 0.615',
          '0.615 – 0.620',
          '0.620 – 0.625',
          '0.625 – 0.630',
          '0.630 – 0.635',
          '0.635 – 0.640',
          '0.640 – 0.645',
          '0.645 – 0.650',
          '0.650 – 0.655',
          '0.655 – 0.660',
          '0.660 – 0.665',
          '0.665 – 0.670',
          '0.670 – 0.675',
          '0.675 – 0.680',
          '0.680 – 0.685',
          '0.685 – 0.690',
          '0.690 – 0.695',
          '0.695 – 0.7',
          '0.7 – 1.130',
          '1.130 – 1.560',
          '1.560 – 1.990',
          '1.990 – 2.420',
          '2.420 – 2.850',
          '2.850 – 3.280',
          '3.280 – 3.710',
          '3.710 – 4.140',
          '4.140 – 4.570',
          '4.570 – 5',
          '5.000',
        ];
        const refs = [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '18',
          '19',
          '20',
          '21',
          '22',
          '23',
          '24',
          '25',
          '26',
          '27',
          '28',
          '29',
          '30',
          '31',
          '32',
          '33',
          '34',
          '35',
          '36',
          '37',
          '38',
          '39',
          '40',
          '41',
          '42',
          '43',
          '44',
          '45',
          '46',
          '47',
          '48',
          '49',
          '50',
          '51',
          '52',
          '53',
          '54',
          '55',
          '56',
          '57',
          '58',
          '59',
          '60',
          '61',
          '62',
          '63',
          '64',
          '65',
          '66',
          '67',
          '68',
          '69',
          '70',
          '71',
          '72',
          '73',
          '74',
          '75',
          '76',
          '77',
          '78',
          '79',
          '80',
          '81',
          '82',
          '83',
          '84',
          '85',
          '86',
          '87',
          '88',
          '89',
          '90',
          '91',
          '92',
          '93',
          '94',
          '95',
          '96',
          '97',
          '98',
          '99',
          '100',
          '101',
          '102',
          '103',
          '104',
          '105',
          '106',
          '107',
          '108',
          '109',
          '110',
          '111',
          '112',
          '113',
          '114',
          '115',
          '116',
          '117',
          '118',
          '119',
          '120',
          '121',
          '122',
          '123',
          '124',
          '125',
          '126',
          '127',
          '128',
          '129',
          '130',
          '131',
          '132',
          '133',
          '134',
          '135',
          '136',
          '137',
          '138',
          '139',
          '140',
          '141',
          '142',
          '143',
          '144',
          '145',
          '146',
          '147',
          '148',
          '149',
          '150',
          '151',
          '152',
        ];
        const ticks = [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
        ];
        colorMap.colors = colors;
        colorMap.tooltips = tooltips;
        colorMap.refs = refs;
        colorMap.ticks = ticks;
        colorMap.type = 'continuous';
        colorMap.maxLabel = '5.0';
        colorMap.minLabel = '< 0.0';
      }
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        this[`canvas_${index}`] = React.createRef();
        return this.renderScale(colorMap, index, paletteLegends.length > 1);
      } if (colorMap.type === 'classification') {
        return this.renderClasses(colorMap, index);
      }
    });
  }

  render() {
    const {
      paletteId, layer, isCustomPalette, showingVectorHand,
    } = this.props;
    const { isHoveringLegend } = this.state;
    const customClass = showingVectorHand && layer.id.includes('AERONET') ? ' vector-palette' : isCustomPalette ? ' is_custom' : '';
    if (!layer.palette) return;
    return (
      <div
        className={
          isHoveringLegend
            ? `active-legend wv-palettes-panel${customClass}`
            : `wv-palettes-panel${customClass}`
        }
        datalayer={layer.id}
        id={`${paletteId}_panel`}
      >
        {this.renderPaletteLegends()}
      </div>
    );
  }
}
PaletteLegend.defaultProps = {
  isRunningData: false,
  width: 231,
  height: 12,
};
PaletteLegend.propTypes = {
  colorHex: PropTypes.string,
  getPalette: PropTypes.func,
  height: PropTypes.number,
  globalTemperatureUnit: PropTypes.string,
  isCustomPalette: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isRunningData: PropTypes.bool,
  layer: PropTypes.object,
  compareState: PropTypes.string,
  paletteId: PropTypes.string,
  paletteLegends: PropTypes.array,
  palettes: PropTypes.object,
  parentLayer: PropTypes.object,
  width: PropTypes.number,
  toggleAllClassifications: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
  toggleClassification: (layerId, classIndex, index, groupName) => {
    dispatch(
      setToggledClassification(layerId, classIndex, index, groupName),
    );
  },
  toggleAllClassifications: (layerId, disabledArray, index, groupName) => {
    dispatch(
      refreshDisabledClassification(layerId, disabledArray, index, groupName),
    );
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(PaletteLegend);
