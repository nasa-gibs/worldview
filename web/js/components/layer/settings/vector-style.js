import { useState } from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../util/scrollbar';
import { isConditional } from '../../../modules/vector-styles/util';

function VectorStyleSelect(props) {
  const {
    activeVectorStyle,
    layer,
    clearStyle,
    setStyle,
    groupName,
    index,
    vectorStyles,
  } = props;

  const [activeVectorStyleState, setActiveVectorStyleState] = useState(activeVectorStyle);

  /**
   * Pass vector style to model after selection
   * @param {String} id | custom VectorStyle Id
   */
  function onChangeVectorStyle(vectorStyleId) {
    setTimeout(() => {
      if (vectorStyleId === layer.id) {
        clearStyle(layer, vectorStyleId, groupName);
      } else {
        setStyle(layer, vectorStyleId, groupName);
      }
    }, 0);
    setActiveVectorStyleState(vectorStyleId);
  }

  /**
   * Apply logic to render correct vectorStyle selection
   * @param {String} id | Legend Id
   */
  function customLegend(styleLayerObject) {
    const description = styleLayerObject['source-description'] || styleLayerObject.id;
    const isConditionalStyling = styleLayerObject.paint ? isConditional(styleLayerObject.paint['line-color'] || styleLayerObject.paint['circle-color'] || styleLayerObject.paint['fill-color']) : false;

    return isConditionalStyling
      ? renderLegendMultiItem(
        styleLayerObject,
        styleLayerObject.id,
        description,
      )
      : renderSelectorItemSingle(
        styleLayerObject,
        styleLayerObject.id,
        description,
        activeVectorStyleState === styleLayerObject.id,
      );
  }

  /**
   * Render classification legend when there are conditionals in the vectorstyles
   * @param {Object} vectorStyle | VectorStyle object
   * @param {String} id | colormap Id
   * @param {String} description | Colormap name
   */

  function renderLegendMultiItem(vectorStyle, vectorStyleId, description) {
    const caseDefaultClassName = 'wv-palette-selector-row ';
    const array = Array.from(vectorStyle.paint['line-color'] || vectorStyle.paint['circle-color'] || vectorStyle.paint['fill-color']);
    array.shift();
    const organizedArray = [];
    let temp = [];
    const chunk = 2;
    // https://stackoverflow.com/a/8495740/4589331
    for (let i = 0, j = array.length; i < j; i += chunk) {
      temp = array.slice(i, i + chunk);
      if (temp.length === 2) {
        const obj = {};
        if (temp[0].length === 3 &&
          typeof temp[0][2] === 'string' &&
          typeof temp[1] === 'string'
        ) {
          [[,, obj.label], obj.color] = temp;
          organizedArray.push(obj);
        } else {
          console.warn('Irregular conditional');
        }
      } else if (temp.length === 1 && typeof temp[0] === 'string') {
        organizedArray.push({ label: 'Default', color: temp[0] });
      } else {
        console.warn('Irregular conditional');
      }
    }
    return organizedArray.map((obj, i) => (
      /* eslint react/no-array-index-key: 1 */
      <div key={vectorStyleId + i} className={caseDefaultClassName}>
        <label>
          <span
            className="wv-palettes-class"
            style={{ backgroundColor: obj.color }}
          >
            &nbsp;
          </span>
          <span className="wv-palette-label">{obj.label}</span>
        </label>
      </div>
    ));
  }

  /**
   * Render classification customs when there is only one
   * Color in colormap
   * @param {Object} vectorStyle | VectorStyle object
   * @param {String} id | colormap Id
   * @param {String} description | Colormap name
   * @param {Boolean} isSelected | is this colormap active
   */
  function renderSelectorItemSingle(vectorStyle, vectorStyleId, description, isSelected) {
    const color = vectorStyle.paint
      ? vectorStyle.paint['line-color'] || vectorStyle.paint['circle-color'] || vectorStyle.paint['fill-color']
      : 'rgb(255, 255, 255)';
    const caseDefaultClassName = 'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    return (
      <div key={vectorStyleId} className={caseDefaultClassName + checkedClassName}>
        <input
          id={`wv-palette-radio-${vectorStyleId}`}
          type="radio"
          name="wv-palette-radio"
          onClick={() => onChangeVectorStyle(vectorStyleId)}
        />
        {isSelected && (
          <span className="dot" />
        )}
        <label htmlFor={`wv-palette-radio-${vectorStyleId}`}>
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

  const vectorStyleId = layer.vectorStyle.id;
  const vectorStyle = vectorStyles[vectorStyleId];
  const vectorStyleLayers = vectorStyle.layers;

  const unqiueLayersSeen = new Set();

  const uniqueStyleLayers = vectorStyleLayers.filter((a) => {
    if (!unqiueLayersSeen.has(a.id)) {
      unqiueLayersSeen.add(a.id);
      return true;
    }
    return false;
  }, Object.create(null));

  return (
    <div
      className="wv-palette-selector settings-component noselect"
      id={`wv-palette-selector${index}`}
    >
      <h2 className="wv-header">Vector Styles</h2>
      {vectorStyleLayers.length}
      <Scrollbar style={{ maxHeight: '200px' }}>
        {uniqueStyleLayers && uniqueStyleLayers.map((styleLayerObject) => {
          if (styleLayerObject && styleLayerObject) {
            const item = customLegend(styleLayerObject);
            return item;
          }
          return false;
        })}
      </Scrollbar>
    </div>
  );
}

VectorStyleSelect.propTypes = {
  activeVectorStyle: PropTypes.string,
  clearStyle: PropTypes.func,
  groupName: PropTypes.string,
  index: PropTypes.number,
  layer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  setStyle: PropTypes.func,
  vectorStyles: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
};

export default VectorStyleSelect;
