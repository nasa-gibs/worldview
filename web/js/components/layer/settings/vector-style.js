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
    // const legend = getDefaultLegend(layer.id, index);

    return this.renderSelectorItemSingle(
      undefined, // should pass vectorStyles here
      'default_style',
      'Default',
      activeVectorStyle === 'default_style'
    );
  }
  /**
   * Pass palette to model after selection
   * @param {String} id | custom VectorStyle Id
   */
  onChangeVectorStyle(id) {
    const { layer, clearStyle, setStyle, index } = this.props;

    // Applying customs takes a while and
    // it looks more natural to make this async
    // instead of waiting
    setTimeout(function() {
      if (id === 'default_style') {
        clearStyle(layer.id, index);
      } else {
        setStyle(layer.id, id, index);
      }
    }, 0);
    this.setState({ activeVectorStyle: id });
  }
  /**
   * Apply logic to render correct palette selection
   * @param {String} id | Legend Id
   */
  // customLegend(id) {
  //   const {
  //     getDefaultLegend,
  //     getCustomVectorStyle,
  //     layer,
  //     index
  //     // palettesTranslate
  //   } = this.props;
  //   const { activeVectorStyle } = this.state;
  //   var source = getDefaultLegend(layer.id, index);
  //   var target = getCustomVectorStyle(id);
  //   var targetType =
  //     target.colors.length === 1 ? 'classification' : 'continuous';

  //   if (source.type === 'classification' && targetType === 'classification') {
  //     return this.renderSelectorItemSingle(
  //       target,
  //       id,
  //       target.name,
  //       activeVectorStyle === target.id
  //     );
  //   }
  // }

  /**
   * Render classification customs when there is only one
   * Color in colormap
   * @param {Object} palette | VectorStyle object
   * @param {String} id | colormap Id
   * @param {String} description | Colormap name
   * @param {Boolean} isSelected | is this colormap active
   */
  renderSelectorItemSingle(vectorStyle, id, description, isSelected) {
    // const color = palette.classes
    //   ? palette.classes.colors[0]
    //   : palette.colors[0];
    const caseDefaultClassName =
      'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    return (
      <div key={id} className={caseDefaultClassName + checkedClassName}>
        <input
          id={'wv-palette-radio-' + id}
          type="radio"
          name="wv-palette-radio"
          onClick={() => this.onChangeVectorStyle(id)}
        />
        <label htmlFor={'wv-palette-radio-' + id}>
          <span
            className="wv-palettes-class"
          >
            &nbsp;
          </span>
          <span className="wv-palette-label">{description}</span>
        </label>
      </div>
    );
  }
  render() {
    const { index } = this.props;

    return (
      <div
        className="wv-palette-selector settings-component noselect"
        id={'wv-palette-selector' + index}
      >
        <h2 className="wv-header">Vector Style</h2>
        <Scrollbar style={{ maxHeight: '200px' }}>
          {this.renderDefault()}
          {/* Output Color Selects Here */}
        </Scrollbar>
      </div>
    );
  }
}
VectorStyleSelect.propTypes = {
  index: PropTypes.number,
  layer: PropTypes.object,
  clearStyle: PropTypes.func,
  setStyle: PropTypes.func,
  paletteOrder: PropTypes.array,
  palettesTranslate: PropTypes.func,
  getDefaultLegend: PropTypes.func,
  // getCustomVectorStyle: PropTypes.func,
  canvas: PropTypes.object,
  checkerBoard: PropTypes.object,
  activeVectorStyle: PropTypes.string
};

export default VectorStyleSelect;
