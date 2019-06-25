import React from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../util/scrollbar';

class VectorStyleSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeVectorStyle: props.activeVectorStyle
    };
  }

  /**
   * Pass vector style to model after selection
   * @param {String} id | custom VectorStyle Id
   */
  onChangeVectorStyle(vectorStyleId) {
    const { layer, clearStyle, setStyle, groupName } = this.props;
    // Applying customs takes a while and
    // it looks more natural to make this async
    // instead of waiting
    setTimeout(function() {
      if (vectorStyleId === layer.id) {
        clearStyle(layer, vectorStyleId, groupName);
      } else {
        setStyle(layer, vectorStyleId, groupName);
      }
    }, 0);
    this.setState({ activeVectorStyle: vectorStyleId });
  }
  /**
   * Apply logic to render correct vectorStyle selection
   * @param {String} id | Legend Id
   */
  customLegend(styleLayerObject) {
    const { activeVectorStyle } = this.state;
    var description = styleLayerObject['source-description'] || styleLayerObject.id;

    return this.renderSelectorItemSingle(
      styleLayerObject,
      styleLayerObject.id,
      description,
      activeVectorStyle === styleLayerObject.id
    );
  }

  /**
   * Render classification customs when there is only one
   * Color in colormap
   * @param {Object} vectorStyle | VectorStyle object
   * @param {String} id | colormap Id
   * @param {String} description | Colormap name
   * @param {Boolean} isSelected | is this colormap active
   */
  renderSelectorItemSingle(vectorStyle, vectorStyleId, description, isSelected) {
    const color = vectorStyle.paint
      ? vectorStyle.paint['line-color'] || vectorStyle.paint['circle-color']
      : 'rgb(255, 255, 255)';
    const caseDefaultClassName =
      'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    return (
      <div key={vectorStyleId} className={caseDefaultClassName + checkedClassName}>
        <input
          id={'wv-palette-radio-' + vectorStyleId}
          type="radio"
          name="wv-palette-radio"
          onClick={() => this.onChangeVectorStyle(vectorStyleId)}
        />
        <label htmlFor={'wv-palette-radio-' + vectorStyleId}>
          <span
            className="wv-palettes-class"
            style={{ backgroundColor: color }}
          >
            &nbsp;
          </span>
          <span className="wv-palette-label">{description}</span>
        </label>
      </div>
    );
  }
  render() {
    const { index, vectorStyles, layer } = this.props;
    var vectorStyleId = layer.vectorStyle.id;
    var vectorStyle = vectorStyles[vectorStyleId];
    var vectorStyleLayers = vectorStyle['layers'];

    var uniqueStyleLayers = vectorStyleLayers.filter(function (a) {
      if (!this[a.id]) {
        this[a.id] = true;
        return true;
      }
    }, Object.create(null));
    return (
      <div
        className="wv-palette-selector settings-component noselect"
        id={'wv-palette-selector' + index}
      >
        <h2 className="wv-header">Vector Style</h2>
        <Scrollbar style={{ maxHeight: '200px' }}>
          {uniqueStyleLayers.map(styleLayerObject => {
            if (styleLayerObject && styleLayerObject) {
              var item = this.customLegend(styleLayerObject);
              return item;
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
  clearStyle: PropTypes.func,
  setStyle: PropTypes.func,
  paletteOrder: PropTypes.array,
  palettesTranslate: PropTypes.func,
  getDefaultLegend: PropTypes.func,
  getCustomVectorStyle: PropTypes.func,
  canvas: PropTypes.object,
  checkerBoard: PropTypes.object,
  activeVectorStyle: PropTypes.string,
  vectorStyles: PropTypes.object,
  groupName: PropTypes.string
};

export default VectorStyleSelect;
