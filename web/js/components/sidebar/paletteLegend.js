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
    const {
      isDistractionFreeModeActive,
      layer,
      width,
      paletteLegends,
    } = this.props;
    // Updates when layer options/settings changed, if ZOT changes the width of the palette, or distraction free mode exit
    const layerChange = !lodashIsEqual(layer, prevProps.layer);
    const paletteLegendsChange = !lodashIsEqual(paletteLegends, prevProps.paletteLegends);
    const widthChange = prevProps.width !== width;
    const distractionFreeChange = prevProps.isDistractionFreeModeActive && !isDistractionFreeModeActive;
    if (layerChange || widthChange || distractionFreeChange || paletteLegendsChange) {
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
              const isActiveKey = activeKeyObj?.index === keyIndex;
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
              if (palette.custom !== undefined && palette.custom !== '') {
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
      paletteId, layer, isCustomPalette, showingVectorHand, showingChartingIcon,
    } = this.props;
    const { isHoveringLegend } = this.state;
    const customClass = (showingVectorHand && layer.id.includes('AERONET')) || showingChartingIcon ? ' bottomspace-palette' : isCustomPalette ? ' is_custom' : '';
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
