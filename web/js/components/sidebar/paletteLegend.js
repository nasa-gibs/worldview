import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';
import { drawSidebarPaletteOnCanvas, drawTicksOnCanvas } from '../../modules/palettes/util';
import lodashIsNumber from 'lodash/isNumber';
import { Tooltip } from 'reactstrap';
import { getOrbitTrackTitle } from '../../modules/layers/util';

class PaletteLegend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRunningData: props.isRunningData,
      colorHex: props.colorHex,
      isHoveringCanvas: props.isHoveringCanvas,
      width: this.props.width
    };
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (
      props.colorHex !== this.state.colorHex ||
      props.isRunningData !== this.state.isRunningData
    ) {
      this.setState({
        isRunningData: props.isRunningData,
        colorHex: props.colorHex
      });
    }
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  /**
   * Get percent of selected point position in parent
   */
  getPercent(len, index) {
    var segmentWidth;
    var location;
    const { width } = this.state;
    if (len < 250) {
      segmentWidth = width / len;
      location = segmentWidth * index + 0.5 * segmentWidth;
      return lodashIsNumber(location / width) ? location / width : 0;
    } else {
      return lodashIsNumber(index / len) ? index / len : 0;
    }
  }

  /**
   * OnMouseMove get correct canvas Data
   * @param {Object} canvas | Element
   * @param {Object} e | Event Object
   */
  onHoverColorbar(canvas, e) {
    e.preventDefault();
    e.stopPropagation();
    var boundingRec = e.target.getBoundingClientRect();
    var x = e.clientX - boundingRec.left;
    var y = e.clientY - boundingRec.top;
    var rgba = canvas.current.getContext('2d').getImageData(x, y, 1, 1).data;
    var hex = util.rgbaToHex(rgba[0], rgba[1], rgba[2]);

    this.setState({
      colorHex: hex
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
      isHoveringLegend: true
    });
  }

  /**
   * Find wanted legend object from Hex
   * @param {Object} legend
   * @param {String} hex
   * @param {Number} acceptableDifference
   */
  getLegendObject(legend, hex, acceptableDifference) {
    var units = legend.units || '';
    for (var i = 0, len = legend.colors.length; i < len; i++) {
      if (util.hexColorDelta(legend.colors[i], hex) < acceptableDifference) {
        // If the two colors are close
        return {
          label: units ? legend.tooltips[i] + ' ' + units : legend.tooltips[i],
          len: len,
          index: i
        };
      }
    }
    return null;
  }

  /**
   * Update state on MouseOut
   */
  hideValue(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      isRunningData: false,
      isHoveringLegend: false
    });
  }

  /**
   * Style Canvas bases on updates to legend or canvas-width
   */
  updateCanvas() {
    const { checkerBoardPattern, height, width, paletteLegends } = this.props;

    paletteLegends.forEach((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        const ctxStr = 'canvas_' + index;
        if (this[ctxStr]) {
          const newWidth = this[ctxStr].current.getBoundingClientRect().width;
          if (newWidth !== this.state.width) {
            // If scrollbar appears canvas width changes.
            // This value is needed for calculating running data offsets
            this.setState({ width: newWidth });
          }
          const ctx = this[ctxStr].current.getContext('2d');
          drawSidebarPaletteOnCanvas(
            ctx,
            checkerBoardPattern,
            colorMap.colors,
            width,
            height
          );
          drawTicksOnCanvas(
            ctx,
            colorMap,
            width,
            height
          );
        }
      }
    });
  }

  /**
   * Redraw canvas with selected colormap
   * @param {*} ctxStr | String of wanted cavnas
   * @param {*} checkerBoardPattern | Background for canvas threshold
   * @param {*} colors | array of color values
   */
  drawOnCanvas(ctx, checkerBoardPattern, colors) {
    const { height, width } = this.props;
    ctx.fillStyle = checkerBoardPattern;
    ctx.fillRect(0, 0, width, height);

    if (colors) {
      var bins = colors.length;
      var binWidth = width / bins;
      var drawWidth = Math.ceil(binWidth);
      colors.forEach((color, i) => {
        ctx.fillStyle = util.hexToRGBA(color);
        ctx.fillRect(Math.floor(binWidth * i), 0, drawWidth, height);
      });
    }
  }

  /**
   * @param {Number} index | Selected label Index
   * @param {Number} boxWidth | Width of Each label box
   * @param {Number} textWidth | Label width
   * @param {Number} width | Case width
   */
  getClassLabelStyle(index, boxWidth, textWidth, width, rowEndIndex) {
    var halfTextWidth = textWidth / 2 || 0;
    var xOffset = boxWidth * (index - rowEndIndex) + boxWidth / 2 || 0;

    if (halfTextWidth > xOffset) {
      return { textAlign: 'left', visibility: 'visible' };
    } else if (xOffset + halfTextWidth > width) {
      return { textAlign: 'right', visibility: 'visible' };
    }
    return {
      marginLeft: xOffset - halfTextWidth + 'px',
      visibility: 'visible',
      textAlign: 'left'
    };
  }

  /**
   * @param {Number} xOffset | X px Location of running-data
   * @param {Number} textWidth | px width of text calculated with canvas
   * @param {Number} width | Case width
   */
  getRunningLabelStyle(xOffset, textWidth, width) {
    if (!xOffset || !textWidth || !width) return { left: '0' };
    var halfTextWidth = textWidth / 2 || 0;
    if (halfTextWidth > xOffset) {
      return { left: '0' };
    } else if (xOffset + halfTextWidth > width) {
      return { right: '0' };
    }
    return { left: Math.floor(xOffset - halfTextWidth) + 'px' };
  }

  /**
   * Render scale-type paletteLegends
   * @param {Object} legend
   * @param {Number} index
   * @param {Boolean} isMoreThanOneColorBar
   */
  renderScale(legend, index, isMoreThanOneColorBar) {
    const { layer, width, getPalette, isMobile } = this.props;
    const { isRunningData, colorHex, isHoveringLegend } = this.state;
    const palette = getPalette(layer.id, index);
    var percent, textWidth, xOffset, legendObj;
    var toolTipLength = legend.tooltips.length;
    if (isRunningData && colorHex && this.state.width > 0) {
      legendObj = this.getLegendObject(legend, colorHex, 5); // {label,len,index}
      if (legendObj) {
        percent = this.getPercent(legendObj.len, legendObj.index);
        textWidth = util.getTextWidth(legendObj.label, '10px Open Sans');
        xOffset = Math.floor(this.state.width * percent);
      }
    }
    var min = legend.minLabel || legend.tooltips[0];
    var max = legend.maxLabel || legend.tooltips[toolTipLength];
    min = palette.min ? legend.tooltips[legend.refs.indexOf(palette.entries.refs[palette.min])] : min;
    max = palette.max ? legend.tooltips[legend.refs.indexOf(palette.entries.refs[palette.max])] : max;

    min = legend.units ? min + ' ' + legend.units : min;
    max = legend.units ? max + ' ' + legend.units : max;
    return (
      <div
        className={
          legendObj ? 'wv-running wv-palettes-legend' : 'wv-palettes-legend'
        }
        id={layer.id + '_' + legend.id + '_' + index}
        key={layer.id + '_' + legend.id + '_' + index}
      >
        {isMoreThanOneColorBar ? (
          <div className="wv-palettes-title">{legend.title}</div>
        ) : (
          ''
        )}
        <div className="colorbar-case">
          <canvas
            className="wv-palettes-colorbar"
            id={layer.id + '-' + legend.id + index + 'colorbar'}
            width={width}
            height={24}
            ref={this['canvas_' + index]}
            onMouseEnter={!isMobile ? this.onMouseEnter.bind(this) : null}
            onMouseLeave={!isMobile ? this.hideValue.bind(this) : null}
            onMouseMove={
              !isMobile
                ? this.onHoverColorbar.bind(this, this['canvas_' + index])
                : null
            }
          />
          <div
            className="wv-running-bar"
            style={{
              top: 7,
              left: isHoveringLegend ? 0 : xOffset > 0 ? xOffset + 0.5 : 0,
              visibility: legendObj && !isHoveringLegend ? 'visible' : 'hidden'
            }}
          />
        </div>
        <div className="wv-palettes-min">{min}</div>
        <div className="wv-palettes-max"> {max}</div>
        <span
          className="wv-running-label"
          style={
            isRunningData
              ? this.getRunningLabelStyle(xOffset, textWidth, this.state.width)
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
    const { isRunningData, colorHex } = this.state;
    const { layer, parentLayer, layerGroupName } = this.props;
    const activeKeyObj = isRunningData && colorHex && this.getLegendObject(legend, colorHex, 5);
    const legendClass = activeKeyObj
      ? 'wv-running wv-palettes-legend wv-palettes-classes'
      : 'wv-palettes-legend wv-palettes-classes';
    const singleKey = legend.colors.length === 1;
    const legendTooltip = legend.tooltips && legend.tooltips.length ? legend.tooltips[0] : '';
    const trackLabel = layer.track && legendTooltip
      ? `${legendTooltip} - ${getOrbitTrackTitle(layer)}`
      : getOrbitTrackTitle(layer);

    return (
      <div className={legendClass} key={legend.id + '_' + legendIndex}>
        {legend.colors.map((color, keyIndex) => {
          const isActiveKey = activeKeyObj && activeKeyObj.index === keyIndex;
          const palletteClass = isActiveKey ? 'wv-active wv-palettes-class' : 'wv-palettes-class';
          const isSubLayer = !!parentLayer;
          const parentLayerId = isSubLayer ? parentLayer.id : '';
          const keyId = layer.id + '-' + legend.id + '-color-' + keyIndex + parentLayerId + layerGroupName;
          const keyLabel = activeKeyObj ? activeKeyObj.label : '';
          const tooltipText = singleKey
            ? layer.track ? trackLabel : legendTooltip
            : keyLabel;

          return (
            <React.Fragment key={keyId}>
              <span
                id={keyId}
                className={palletteClass}
                style={{ backgroundColor: util.hexToRGBA(color) }}
                onMouseMove={this.onMove.bind(this, color)}
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

              {(
                <Tooltip
                  placement={singleKey ? 'right' : 'bottom'}
                  isOpen={isActiveKey}
                  target={keyId}>
                  {tooltipText}
                </Tooltip>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  /**
   * Loop through colormaps and render correct legend type
   */
  renderPaletteLegends() {
    const { paletteLegends } = this.props;
    return paletteLegends.map((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        this['canvas_' + index] = React.createRef();
        return this.renderScale(colorMap, index, paletteLegends.length > 1);
      } else if (colorMap.type === 'classification') {
        return this.renderClasses(colorMap, index);
      }
    });
  }

  render() {
    const { paletteId, layer, isCustomPalette } = this.props;
    const { isHoveringLegend } = this.state;
    const customClass = isCustomPalette ? ' is_custom' : '';
    if (!layer.palette) return;
    return (
      <div
        className={
          isHoveringLegend
            ? 'active-lengend wv-palettes-panel' + customClass
            : 'wv-palettes-panel' + customClass
        }
        datalayer={layer.id}
        id={paletteId + '_panel'}
      >
        {this.renderPaletteLegends()}
      </div>
    );
  }
}
PaletteLegend.defaultProps = {
  isRunningData: false,
  isHoveringLegend: false,
  isRunningDataEnabled: true,
  width: 231,
  height: 12
};
PaletteLegend.propTypes = {
  checkerBoardPattern: PropTypes.object,
  colorHex: PropTypes.string,
  getPalette: PropTypes.func,
  height: PropTypes.number,
  isCustomPalette: PropTypes.bool,
  isHoveringCanvas: PropTypes.bool,
  isHoveringLegend: PropTypes.bool,
  isMobile: PropTypes.bool,
  isRunningData: PropTypes.bool,
  isRunningDataEnabled: PropTypes.bool,
  isSubLayer: PropTypes.bool,
  layer: PropTypes.object,
  layerGroupName: PropTypes.string,
  paletteId: PropTypes.string,
  paletteLegends: PropTypes.array,
  parentLayer: PropTypes.object,
  width: PropTypes.number
};

export default PaletteLegend;
