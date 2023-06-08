import React, { useState } from 'react';
import PropTypes from 'prop-types';
import lodashIndexOf from 'lodash/indexOf';
import { drawPaletteOnCanvas } from '../../../modules/palettes/util';
import util from '../../../util/util';
import Scrollbar from '../../util/scrollbar';

function PaletteSelect (props) {
  const {
    activePalette: initialActivePalette,
    canvas,
    clearCustomPalette,
    getCustomPalette,
    getDefaultLegend,
    groupName,
    index,
    layer,
    paletteOrder,
    palettesTranslate,
    setCustomPalette,
  } = props;

  const [activePalette, setActivePalette] = useState(initialActivePalette);

  const renderDefault = () => {
    const legend = getDefaultLegend(layer.id, index);
    if (legend.type === 'continuous' || legend.type === 'discrete') {
      return renderSelectorItemScale(
        legend.colors,
        '__default',
        legend,
        activePalette === '__default',
      );
    }
    return renderSelectorItemSingle(
      legend,
      '__default',
      'Default',
      activePalette === '__default',
    );
  };

  /**
   * Clears the custom palette if Id is set to __default
   * @param {String} id | colormap Id
   */
  const onChangePalette = (id) => {
    if (id === '__default') {
      clearCustomPalette(layer.id, index, groupName);
    } else {
      setCustomPalette(layer.id, id, index, groupName);
    }
    setActivePalette(id);
  };

  /**
   * Renders as renderSelectorItemScale or renderSelectorItemSingle depending on if
   * the source type is continuous or discrete.
   * @param {String} id | colormap Id
   */
  const customLegend = (id) => {
    const source = getDefaultLegend(layer.id, index);
    const target = getCustomPalette(id);
    const targetType = target.colors.length === 1 ? 'classification' : 'continuous';

    if ((source.type === 'continuous' && targetType === 'continuous')
       || (source.type === 'discrete' && targetType === 'continuous')) {
      const translated = palettesTranslate(source.colors, target.colors);
      return renderSelectorItemScale(
        translated,
        id,
        target,
        activePalette === target.id,
      );
    }
    if (source.type === 'classification' && targetType === 'classification') {
      return renderSelectorItemSingle(
        target,
        id,
        target.name,
        activePalette === target.id,
      );
    }
  };

  /**
   * Render customs palette options
   * @param {Object} palette | Palette object
   * @param {String} id | colormap Id
   * @param {Object} legend | Legend Object
   * @param {Boolean} isSelected | is this colormap active
   */
  const renderSelectorItemScale = (palette, id, legend, isSelected) => {
    const caseDefaultClassName = 'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    const ctx = canvas.getContext('2d');
    drawPaletteOnCanvas(
      ctx,
      palette,
      canvas.width,
      canvas.height,
    );
    const dataURL = canvas.toDataURL('image/png');
    return (
      <div key={id} className={caseDefaultClassName + checkedClassName}>
        <input
          id={`wv-palette-radio-${id}`}
          type="radio"
          name="wv-palette-radio"
          onClick={() => onChangePalette(id)}
        />
        <label htmlFor={`wv-palette-radio-${id}`}>
          <img src={dataURL} />
          <span className="wv-palette-label">{legend.name || 'Default'}</span>
        </label>
      </div>
    );
  };

  /**
   * Render classification customs when there is only one
   * Color in colormap
   * @param {Object} palette | Palette object
   * @param {String} id | colormap Id
   * @param {String} description | Colormap name
   * @param {Boolean} isSelected | is this colormap active
   */
  const renderSelectorItemSingle = (palette, id, description, isSelected) => {
    const color = palette.classes
      ? palette.classes.colors[0]
      : palette.colors[0];
    const caseDefaultClassName = 'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    const isInvisible = color === '00000000';

    return (
      <div key={id} className={caseDefaultClassName + checkedClassName}>
        <input
          id={`wv-palette-radio-${id}`}
          type="radio"
          name="wv-palette-radio"
          onClick={() => onChangePalette(id)}
        />
        <label htmlFor={`wv-palette-radio-${id}`}>
          <span
            className={isInvisible ? 'checkerbox-bg wv-palettes-class' : 'wv-palettes-class'}
            style={isInvisible ? null : { backgroundColor: util.hexToRGBA(color) }}
          >
            &nbsp;
          </span>
          <span className="wv-palette-label">{description}</span>
        </label>
      </div>
    );
  };

  const recommended = layer.palette.recommended || [];

  return (
    <div
      className="wv-palette-selector settings-component noselect"
      id={`wv-palette-selector${index}`}
    >
      <h2 className="wv-header">Color Palette</h2>
      <Scrollbar style={{ maxHeight: '200px' }}>
        {renderDefault()}
        {
          // eslint-disable-next-line array-callback-return
          paletteOrder.map((id) => {
            if (lodashIndexOf(recommended, id) < 0) {
              const item = customLegend(id);
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

PaletteSelect.propTypes = {
  activePalette: PropTypes.string,
  canvas: PropTypes.object,
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
