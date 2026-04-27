import { useState, useEffect, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import lodashIsNumber from 'lodash/isNumber';
import lodashIsEqual from 'lodash/isEqual';
import { Tooltip } from 'reactstrap';
import VisibilitySensor from '../util/visibility-sensor';
import { connect } from 'react-redux';
import usePrevious from '../../util/customHooks';
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

function PaletteLegend(props) {
  const {
    isRunningData,
    colorHex,
    width,
    height,
    getPalette,
    layer,
    parentLayer,
    compareState,
    toggleAllClassifications,
    isDistractionFreeModeActive,
    paletteLegends,
    globalTemperatureUnit,
    isEmbedModeActive,
    isMobile,
    palettes,
    paletteId,
    isCustomPalette,
    showingVectorHand,
    showingChartingIcon,
  } = props;

  const [isRunningDataState, setIsRunningDataState] = useState(isRunningData);
  const [colorHexState, setColorHexState] = useState(colorHex);
  const [widthState, setWidthState] = useState(width);
  const [scrollContainerEl, setScrollContainerEl] = useState(null);
  const [isHoveringLegend, setIsHoveringLegend] = useState(false);

  const prevColorHex = usePrevious(colorHex);
  const prevIsRunningData = usePrevious(isRunningData);
  const prevLayer = usePrevious(layer);
  const prevPaletteLegends = usePrevious(paletteLegends);
  const prevWidth = usePrevious(widthState);
  const prevDistractionFree = usePrevious(isDistractionFreeModeActive);

  const palettesArrayRef = useRef([]);

  useEffect(() => {
    if (layer.disabled === undefined) {
      // There is not a previous instance, so check the palette defaults
      const palette = getPalette();
      if (palette.disabled && palette.disabled.length > 0) {
        const disabledIntArr = palette.disabled.map((str) => Number(str));
        toggleAllClassifications(layer.id, disabledIntArr, 0, compareState);
      }
    }

    updateCanvas();
    setScrollContainerEl(document.querySelector('#layers-scroll-container'));
  }, []);

  useEffect(() => {
    if (prevColorHex !== colorHex) {
      setColorHexState(colorHex);
    }
  }, [colorHex]);

  useEffect(() => {
    if (prevIsRunningData !== isRunningData) {
      setIsRunningDataState(isRunningData);
    }
  }, [isRunningData]);

  useEffect(() => {
    // Updates when layer options/settings changed, if ZOT changes the width of the palette,
    // or distraction free mode exit
    const layerChange = !lodashIsEqual(layer, prevLayer);
    const paletteLegendsChange = !lodashIsEqual(paletteLegends, prevPaletteLegends);
    const widthChange = prevWidth !== widthState;
    const distractionFreeChange = prevDistractionFree && !isDistractionFreeModeActive;
    if (layerChange || widthChange || distractionFreeChange || paletteLegendsChange) {
      updateCanvas();
    }
  }, [layer, paletteLegends, widthState, isDistractionFreeModeActive]);

  /**
   * Get percent of selected point position in parent
   */
  const getPercent = (len, index) => {
    let segmentWidth;
    let location;
    if (len < 250) {
      segmentWidth = widthState / len;
      location = segmentWidth * index + 0.5 * segmentWidth;
      return lodashIsNumber(location / widthState) ? location / widthState : 0;
    }
    return lodashIsNumber(index / len) ? index / len : 0;
  };

  /**
   * OnMouseMove get correct canvas Data
   * @param {Object} canvas | Element
   * @param {Object} e | Event Object
   */
  const onHoverColorbar = (canvas, e) => {
    e.preventDefault();
    e.stopPropagation();
    const boundingRec = e.target.getBoundingClientRect();
    const x = e.clientX - boundingRec.left;
    const y = e.clientY - boundingRec.top;
    const rgba = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    const hex = util.rgbaToHex(rgba[0], rgba[1], rgba[2]);

    setColorHexState(hex);
  };

  /**
   * On Mouse Enter update State
   * @param {*} e
   */
  const onMouseEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRunningDataState(true);
    setIsHoveringLegend(true);
  };

  /**
   * Update state on MouseOut
   */
  const hideValue = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRunningDataState(false);
    setIsHoveringLegend(false);
  };

  /**
   * Style Canvas bases on updates to legend or canvas-width
   */
  const updateCanvas = () => {
    paletteLegends.forEach((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        const ctxStr = `canvas_${index}`;
        if (palettesArrayRef.current[ctxStr]) {
          const newWidth = palettesArrayRef.current[ctxStr].getBoundingClientRect().width;

          if (newWidth && newWidth !== widthState) {
            // If scrollbar appears canvas width changes.
            // This value is needed for calculating running data offsets
            setWidthState(newWidth);
          }
          const ctx = palettesArrayRef.current[ctxStr].getContext('2d');
          drawSidebarPaletteOnCanvas(
            ctx,
            colorMap.colors,
            widthState,
            height,
          );
          drawTicksOnCanvas(
            ctx,
            colorMap,
            widthState,
            height,
          );
        }
      }
    });
  };

  /**
   * Finds the legend object that corresponds to a given hex color.
   *
   * @param {Object} legend - The legend object containing colors and tooltips.
   * @param {string[]} legend.colors - Array of hex color strings in the legend.
   * @param {string[]} legend.tooltips - Array of tooltip strings corresponding to colors.
   * @param {string} [legend.units] - Optional units for the legend values.
   * @param {string} hex - The hex color to match against the legend.
   * @param {number} acceptableDifference - The maximum allowed difference between colors.
   *                                        Lower values require closer color matches.
   *
   * @returns {Object|null} The matched legend object or null if no match is found.
   *
   */
  const getLegendObject = (legend, hex, acceptableDifference) => {
    const units = legend.units || '';

    const { needsConversion, legendTempUnit } = checkTemperatureUnitConversion(
      units,
      globalTemperatureUnit,
    );
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
  };

  /**
   * Render scale-type paletteLegends
   * @param {Object} legend
   * @param {Number} index
   * @param {Boolean} isMoreThanOneColorBar
   */
  const renderScale = (legend, index, isMoreThanOneColorBar) => {
    const palette = getPalette(layer.id, index);
    let percent;
    let textWidth;
    let xOffset;
    let legendObj;
    const toolTipLength = legend.tooltips.length;

    if (isRunningDataState && colorHexState && widthState > 0) {
      const isContinuousVectorLayer = layer.colormapType === 'continuous' && layer.type === 'vector';
      const acceptableDifference = isContinuousVectorLayer ? 1 : 3;
      legendObj = getLegendObject(legend, colorHexState, acceptableDifference); // {label,len,index}
      if (legendObj) {
        percent = getPercent(legendObj.len, legendObj.index);
        textWidth = util.getTextWidth(legendObj.label, '10px Open Sans');

        xOffset = Math.floor(widthState * percent);
        if (isEmbedModeActive) {
          // adjust xOffset per css scale transform
          xOffset = Math.floor(xOffset / 0.75);
        }
      }
    }

    const units = legend.units || '';
    const {
      needsConversion,
      legendTempUnit,
    } = checkTemperatureUnitConversion(units, globalTemperatureUnit);
    let min = legend.minLabel || legend.tooltips[0];
    let max = legend.maxLabel || legend.tooltips[toolTipLength];
    min = palette.min
      ? legend.tooltips[legend.refs.indexOf(palette.entries.refs[palette.min])]
      : min;
    max = palette.max
      ? legend.tooltips[legend.refs.indexOf(palette.entries.refs[palette.max])]
      : max;

    if (needsConversion) {
      min = `${convertPaletteValue(min, legendTempUnit, globalTemperatureUnit)}`;
      max = `${convertPaletteValue(max, legendTempUnit, globalTemperatureUnit)}`;
    } else {
      min = units ? `${min} ${units}` : min;
      max = units ? `${max} ${units}` : max;
    }
    const mobileColorbarStyle = isMobile
      ? {
        width: '100%',
        maxWidth: '100%',
        marginRight: '0',
        marginLeft: '0',
      }
      : null;

    const translateXOffset = xOffset > 0 ? xOffset + 0.5 : 0;
    return (
      <div
        className={
          legendObj ? 'wv-running wv-palettes-legend' : 'wv-palettes-legend'
        }
        id={`${util.encodeId(layer.id)}_${util.encodeId(legend.id)}_${index}`}
        key={`${layer.id}_${legend.id}_${index}`}
      >
        {isMoreThanOneColorBar
          ? (
            <div className="wv-palettes-title">{legend.title}</div>
          )
          : ''}
        <div className="colorbar-case">
          <canvas
            className="wv-palettes-colorbar"
            id={`${util.encodeId(layer.id)}-${util.encodeId(legend.id)}${index}colorbar`}
            style={mobileColorbarStyle}
            width={widthState}
            height={24}
            ref={el => { palettesArrayRef.current[`canvas_${index}`] = el; }}
            onMouseEnter={!isMobile ? onMouseEnter : null}
            onMouseLeave={!isMobile ? hideValue : null}
            onMouseMove={
              !isMobile
                ? (event) => onHoverColorbar(palettesArrayRef.current[`canvas_${index}`], event)
                : null
            }
          />
          <div
            className="wv-running-bar"
            style={{
              top: 7,
              transform: `translateX(${isHoveringLegend ? 0 : translateXOffset}px)`,
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
            isRunningDataState
              ? getRunningLabelStyle(xOffset, textWidth, widthState)
              : { display: 'none' }
          }
        >
          {legendObj ? legendObj.label : ''}
        </span>
      </div>
    );
  };

  /**
   * Update label & Location on Mousemove
   * @param {String} color | Hex
   * @param {Object} e | Event Object
   */
  const onMove = (color, e) => {
    e.preventDefault();
    e.stopPropagation();
    setColorHexState(color);
  };

  /**
   * Render a legend of class type
   * @param {Object} legend | Legend Object
   * @param {Number} index | Legend Index
   */
  const renderClasses = (legend, legendIndex) => {
    const activeKeyObj = isRunningDataState && colorHexState &&
      getLegendObject(legend, colorHexState, 5);
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
        {() => (
          <div className={legendClass} key={`${legend.id}_${legendIndex}`}>
            {legend.colors.map((color, keyIndex) => {
              const isActiveKey = activeKeyObj?.index === keyIndex;
              let palletteClass = isActiveKey ? 'wv-active wv-palettes-class' : 'wv-palettes-class';
              const isSubLayer = !!parentLayer;
              const parentLayerId = isSubLayer ? `-${parentLayer.id}` : '';
              const keyId = `${util.encodeId(legend.id)}-color${util.encodeId(parentLayerId)}-${util.encodeId(layer.id)}-${compareState}${keyIndex}`;
              const keyLabel = activeKeyObj ? activeKeyObj.label : '';
              const inActive = palette.disabled && palette.disabled.includes(keyIndex);
              const trackLabelOrLegendTooltip = layer.track ? trackLabel : legendTooltip;
              const tooltipText = singleKey ? trackLabelOrLegendTooltip : keyLabel;
              const isInvisible = color === '00000000';
              palletteClass = isInvisible ? `${palletteClass} checkerbox-bg` : palletteClass;
              let legendColor = color;
              const customColor = palette.custom;
              if (palette.custom !== undefined && palette.custom !== '') {
                [legendColor] = palettes.custom[customColor].colors;
              }

              return (
                <Fragment key={keyId}>
                  <span
                    id={keyId}
                    className={inActive ? `${palletteClass} disabled-classification` : palletteClass}
                    style={isInvisible ? null : { backgroundColor: util.hexToRGBA(legendColor) }}
                    onMouseMove={(event) => onMove(legendColor, event)}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={hideValue}
                    dangerouslySetInnerHTML={{ __html: '&nbsp' }}
                  />

                  {singleKey && !isSubLayer && (
                    <div className="wv-running-category-label-case">
                      <span className="wv-running-category-label">
                        {layer.track ? trackLabel : legendTooltip}
                      </span>
                    </div>
                  )}

                  {!isInvisible && (
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
                </Fragment>
              );
            })}
          </div>
        )}
      </VisibilitySensor>
    );
  };

  /**
   * Loop through colormaps and render correct legend type
   */
  const renderPaletteLegends = () => {
    return paletteLegends.map((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        return renderScale(colorMap, index, paletteLegends.length > 1);
      } if (colorMap.type === 'classification') {
        return renderClasses(colorMap, index);
      }
      return undefined;
    });
  };

  const customPaletteClassName = isCustomPalette ? ' is_custom' : '';
  const customClass = (showingVectorHand && layer.id.includes('AERONET')) || showingChartingIcon ? ' bottomspace-palette' : customPaletteClassName;

  return !layer.palette
    ? undefined
    : (
      <div
        className={
          isHoveringLegend
            ? `active-legend wv-palettes-panel${customClass}`
            : `wv-palettes-panel${customClass}`
        }
        id={`${paletteId}_panel`}
      >
        {renderPaletteLegends()}
      </div>
    );
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
  layer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  compareState: PropTypes.string,
  paletteId: PropTypes.string,
  paletteLegends: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  palettes: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  parentLayer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  showingVectorHand: PropTypes.bool,
  showingChartingIcon: PropTypes.bool,
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
