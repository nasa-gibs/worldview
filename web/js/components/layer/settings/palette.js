import React from 'react';
import PropTypes from 'prop-types';
import lodashIndexOf from 'lodash/indexOf';
import { drawPaletteOnCanvas } from '../../../palettes/util';
import util from '../../../util/util';
import Scrollbar from '../../util/scrollbar';

class OpacitySelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activePalette: props.activePalette
    };
  }
  renderDefault() {
    const { layer, index, getDefaultLegend } = this.props;
    const { activePalette } = this.state;
    const legend = getDefaultLegend(layer.id, index);
    if (legend.type === 'continuous' || legend.type === 'discrete') {
      return this.renderSelectorItemScale(
        legend.colors,
        '__default',
        legend,
        activePalette === '__default'
      );
    } else {
      return this.renderSelectorItemSingle(
        legend,
        '__default',
        'Default',
        activePalette === '__default'
      );
    }
  }
  onChangePalette(id) {
    const { layer, clearCustom, setCustom, index } = this.props;

    setTimeout(function() {
      if (id === '__default') {
        clearCustom(layer.id, index);
      } else {
        setCustom(layer.id, id, index);
      }
    }, 0);
    this.setState({ activePalette: id });
  }
  customLegend(id) {
    const {
      getDefaultLegend,
      getCustomPalette,
      layer,
      index,
      palettesTranslate
    } = this.props;
    const { activePalette } = this.state;
    var source = getDefaultLegend(layer.id, index);
    var target = getCustomPalette(id);
    var targetType =
      target.colors.length === 1 ? 'classification' : 'continuous';

    if (
      (source.type === 'continuous' && targetType === 'continuous') ||
      (source.type === 'discrete' && targetType === 'continuous')
    ) {
      var translated = palettesTranslate(source.colors, target.colors);
      return this.renderSelectorItemScale(
        translated,
        id,
        target,
        activePalette === target.id
      );
    }
    if (source.type === 'classification' && targetType === 'classification') {
      return this.renderSelectorItemSingle(
        target,
        id,
        target.name,
        activePalette === target.id
      );
    }
  }
  renderSelectorItemScale(palette, id, legend, isSelected) {
    const { canvas, checkerBoard } = this.props;
    const caseDefaultClassName =
      'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    const ctx = canvas.getContext('2d');
    drawPaletteOnCanvas(
      ctx,
      checkerBoard,
      legend.colors,
      canvas.width,
      canvas.height
    );
    return (
      <div className={caseDefaultClassName + checkedClassName}>
        <input
          id={'wv-palette-radio-' + id}
          type="radio"
          name="wv-palette-radio"
          onClick={() => this.onChangePalette(id)}
        />
        <label htmlFor={'wv-palette-radio-' + id}>
          <img src={this.props.canvas.toDataURL('image/png')} />
          <span className="wv-palette-label">{legend.name || 'Default'}</span>
        </label>
      </div>
    );
  }
  renderSelectorItemSingle(palette, id, description, isSelected) {
    const color = palette.classes
      ? palette.classes.colors[0]
      : palette.colors[0];
    const caseDefaultClassName =
      'wv-palette-selector-row wv-checkbox wv-checkbox-round gray ';
    const checkedClassName = isSelected ? 'checked' : '';
    return (
      <div className={caseDefaultClassName + checkedClassName}>
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
        className="wv-palette-selector settings-component"
        id={'wv-palette-selector' + index}
      >
        <h2 className="wv-header">Color Palette</h2>
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
OpacitySelect.propTypes = {
  index: PropTypes.number
};

export default OpacitySelect;
