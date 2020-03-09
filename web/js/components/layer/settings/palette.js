import React from 'react';
import PropTypes from 'prop-types';
import lodashIndexOf from 'lodash/indexOf';
import { drawPaletteOnCanvas } from '../../../modules/palettes/util';
import util from '../../../util/util';
import Scrollbar from '../../util/scrollbar';

class PaletteSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activePalette: props.activePalette,
    };
  }

  /**
   * Render default legend option
   */
  renderDefault() {
    const { layer, index, getDefaultLegend } = this.props;
    const { activePalette } = this.state;
    const legend = getDefaultLegend(layer.id, index);
    if (legend.type === 'continuous' || legend.type === 'discrete') {
      return this.renderSelectorItemScale(
        legend.colors,
        '__default',
        legend,
        activePalette === '__default',
      );
    }
    return this.renderSelectorItemSingle(
      legend,
      '__default',
      'Default',
      activePalette === '__default',
    );
  }

  /**
   * Pass palette to model after selection
   * @param {String} id | custom Palette Id
   */
  onChangePalette(id) {
    const {
      layer, clearCustomPalette, setCustomPalette, groupName, index,
    } = this.props;

    // Applying customs takes a while and
    // it looks more natural to make this async
    // instead of waiting
    if (id === '__default') {
      clearCustomPalette(layer.id, index, groupName);
    } else {
      setCustomPalette(layer.id, id, index, groupName);
    }
    this.setState({ activePalette: id });
  }

  /**
   * Apply logic to render correct palette selection
   * @param {String} id | Legend Id
   */
  customLegend(id) {
    const {
      getDefaultLegend,
      getCustomPalette,
      layer,
      index,
      palettesTranslate,
    } = this.props;
    const { activePalette } = this.state;
    const source = getDefaultLegend(layer.id, index);
    const target = getCustomPalette(id);
    const targetType = target.colors.length === 1 ? 'classification' : 'continuous';

    if (
      (source.type === 'continuous' && targetType === 'continuous')
      || (source.type === 'discrete' && targetType === 'continuous')
    ) {
      const translated = palettesTranslate(source.colors, target.colors);
      return this.renderSelectorItemScale(
        translated,
        id,
        target,
        activePalette === target.id,
      );
    }
    if (source.type === 'classification' && targetType === 'classification') {
      return this.renderSelectorItemSingle(
        target,
        id,
        target.name,
        activePalette === target.id,
      );
    }
  }

  /**
   * Render customs palette options
   * @param {Object} palette | Palette object
   * @param {String} id | colormap Id
   * @param {Object} legend | Legend Object
   * @param {Boolean} isSelected | is this colormap active
   */
  renderSelectorItemScale(palette, id, legend, isSelected) {
    const { canvas, checkerBoard } = this.props;
    const caseDefaultClassName = 'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    const ctx = canvas.getContext('2d');
    drawPaletteOnCanvas(
      ctx,
      checkerBoard,
      palette,
      canvas.width,
      canvas.height,
    );
    return (
      <div key={id} className={caseDefaultClassName + checkedClassName}>
        <input
          id={`wv-palette-radio-${id}`}
          type="radio"
          name="wv-palette-radio"
          onClick={() => this.onChangePalette(id)}
        />
        <label htmlFor={`wv-palette-radio-${id}`}>
          <img src={this.props.canvas.toDataURL('image/png')} />
          <span className="wv-palette-label">{legend.name || 'Default'}</span>
        </label>
      </div>
    );
  }

  /**
   * Render classification customs when there is only one
   * Color in colormap
   * @param {Object} palette | Palette object
   * @param {String} id | colormap Id
   * @param {String} description | Colormap name
   * @param {Boolean} isSelected | is this colormap active
   */
  renderSelectorItemSingle(palette, id, description, isSelected) {
    const color = palette.classes
      ? palette.classes.colors[0]
      : palette.colors[0];
    const caseDefaultClassName = 'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    return (
      <div key={id} className={caseDefaultClassName + checkedClassName}>
        <input
          id={`wv-palette-radio-${id}`}
          type="radio"
          name="wv-palette-radio"
          onClick={() => this.onChangePalette(id)}
        />
        <label htmlFor={`wv-palette-radio-${id}`}>
          <span
            className="wv-palettes-class"
            style={{ backgroundColor: util.hexToRGB(color) }}
          >
            &nbsp;
          </span>
          <span className="wv-palette-label">{description}</span>
        </label>
      </div>
    );
  }

  render() {
    const { index, layer, paletteOrder } = this.props;
    const recommended = layer.palette.recommended || [];

    return (
      <div
        className="wv-palette-selector settings-component noselect"
        id={`wv-palette-selector${index}`}
      >
        <h2 className="wv-header">Color Palette</h2>
        <Scrollbar style={{ maxHeight: '200px' }}>
          {this.renderDefault()}
          {
            // eslint-disable-next-line array-callback-return
            paletteOrder.map((id) => {
              if (lodashIndexOf(recommended, id) < 0) {
                const item = this.customLegend(id);
                if (item) {
                  return item;
                }
              }
            })
          }
        </Scrollbar>
      </div>
    );
  }
}
PaletteSelect.propTypes = {
  activePalette: PropTypes.string,
  canvas: PropTypes.object,
  checkerBoard: PropTypes.object,
  clearCustomPalette: PropTypes.func,
  getCustomPalette: PropTypes.func,
  getDefaultLegend: PropTypes.func,
  groupName: PropTypes.string,
  index: PropTypes.number,
  layer: PropTypes.object,
  paletteOrder: PropTypes.array,
  palettesTranslate: PropTypes.func,
  setCustomPalette: PropTypes.func,
};

export default PaletteSelect;
