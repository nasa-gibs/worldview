import React from 'react';
import PropTypes from 'prop-types';
import lodashIndexOf from 'lodash/indexOf';
import util from '../../../util/util';
import Scrollbar from '../../util/scrollbar';

class VectorStyleSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeVectorStyle: props.activeVectorStyle
    };
  }

  /**
   * Render default legend option
   */
  renderDefault() {
    const { layer, index, getDefaultLegend } = this.props;
    const { activeVectorStyle } = this.state;
    const legend = getDefaultLegend(layer.id, index);

    return this.renderSelectorItemSingle(
      legend,
      'default_style',
      'Default',
      activeVectorStyle === 'default_style'
    );
  }
  /**
   * Pass palette to model after selection
   * @param {String} id | custom Palette Id
   */
  onChangePalette(id) {
    const { layer, clearCustom, setCustom, index } = this.props;

    // Applying customs takes a while and
    // it looks more natural to make this async
    // instead of waiting
    setTimeout(function() {
      if (id === 'default_style') {
        clearCustom(layer.id, index);
      } else {
        setCustom(layer.id, id, index);
      }
    }, 0);
    this.setState({ activeVectorStyle: id });
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
      index
      // palettesTranslate
    } = this.props;
    const { activeVectorStyle } = this.state;
    var source = getDefaultLegend(layer.id, index);
    var target = getCustomPalette(id);
    var targetType =
      target.colors.length === 1 ? 'classification' : 'continuous';

    if (source.type === 'classification' && targetType === 'classification') {
      return this.renderSelectorItemSingle(
        target,
        id,
        target.name,
        activeVectorStyle === target.id
      );
    }
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
    const caseDefaultClassName =
      'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    return (
      <div key={id} className={caseDefaultClassName + checkedClassName}>
        <input
          id={'wv-palette-radio-' + id}
          type="radio"
          name="wv-palette-radio"
          onClick={() => this.onChangePalette(id)}
        />
        <label htmlFor={'wv-palette-radio-' + id}>
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
        id={'wv-palette-selector' + index}
      >
        <h2 className="wv-header">Vector Style</h2>
        <Scrollbar style={{ maxHeight: '200px' }}>
          {this.renderDefault()}
          {paletteOrder.map(id => {
            if (lodashIndexOf(recommended, id) < 0) {
              var item = this.customLegend(id);
              if (item) {
                return item;
              }
            }
          })}
        </Scrollbar>
      </div>
    );
  }
}
VectorStyleSelect.propTypes = {
  index: PropTypes.number,
  layer: PropTypes.object,
  clearCustom: PropTypes.func,
  setCustom: PropTypes.func,
  paletteOrder: PropTypes.array,
  palettesTranslate: PropTypes.func,
  getDefaultLegend: PropTypes.func,
  getCustomPalette: PropTypes.func,
  canvas: PropTypes.object,
  checkerBoard: PropTypes.object,
  activeVectorStyle: PropTypes.string
};

export default VectorStyleSelect;
