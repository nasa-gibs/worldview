import React from 'react';
import PropTypes from 'prop-types';
import { each as lodashEach } from 'lodash';
import {
  TabContent, TabPane, Nav, NavItem, NavLink,
} from 'reactstrap';
import { connect } from 'react-redux';
import Opacity from './opacity';
import Palette from './palette';
import OrbitTracks from './orbit-tracks-toggle';
import VectorStyle from './vector-style';
import PaletteThreshold from './palette-threshold';

import {
  palettesTranslate,
} from '../../../modules/palettes/util';
import {
  getDefaultLegend,
  getCustomPalette,
  getPaletteLegends,
  getPalette,
  getPaletteLegend,
  isPaletteAllowed,
} from '../../../modules/palettes/selectors';
import {
  setThresholdRangeAndSquash,
  setCustomPalette,
  clearCustomPalette,
  setToggledClassification,
  refreshDisabledClassification,
} from '../../../modules/palettes/actions';
import {
  setFilterRange,
  setStyle,
  clearStyle,
} from '../../../modules/vector-styles/actions';

import {
  getVectorStyle,
} from '../../../modules/vector-styles/selectors';
import { setOpacity } from '../../../modules/layers/actions';
import ClassificationToggle from './classification-toggle';

class LayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0,
    };
    this.canvas = document.createElement('canvas');
    this.canvas.width = 120;
    this.canvas.height = 10;
  }

  /**
   * Render multicolormap layers inside a tab pane
   * @param {object} paletteLegends | legend object
   */
  renderMultiColormapCustoms(paletteLegends) {
    const {
      clearCustomPalette,
      getPalette,
      paletteOrder,
      getDefaultLegend,
      getCustomPalette,
      setCustomPalette,
      palettesTranslate,
      groupName,
      setThresholdRange,
      layer,
      toggleClassification,
      toggleAllClassifications,
      screenHeight,
    } = this.props;
    const { activeIndex } = this.state;
    const navElements = [];
    const paneElements = [];
    lodashEach(paletteLegends, (legend, i) => {
      const activeClass = activeIndex === i ? 'active' : '';
      const dualStr = paletteLegends.length === 2 ? ' dual' : '';
      const navItemEl = (
        <NavItem
          key={`${legend.id}nav`}
          className={`settings-customs-title ${activeClass}${dualStr}`}
        >
          <NavLink onClick={() => this.setState({ activeIndex: i })}>
            {legend.title}
          </NavLink>
        </NavItem>
      );
      const palette = getPalette(layer.id, i);
      const max = legend.colors.length - 1;
      const start = palette.min ? legend.refs.indexOf(palette.entries.refs[palette.min]) : 0;
      const end = palette.max ? legend.refs.indexOf(palette.entries.refs[palette.max]) : max;
      let paneItemEl;
      if (legend.type === 'classification' && legend.colors.length > 1) {
        paneItemEl = (
          <TabPane key={`${legend.id}pane`} tabId={i}>
            <ClassificationToggle
              height={Math.ceil(screenHeight / 3)}
              palette={palette}
              toggle={(classIndex) => toggleClassification(layer.id, classIndex, i, groupName)}
              legend={legend}
              toggleAll={(disabledArray) => { toggleAllClassifications(layer.id, disabledArray, i, groupName); }}
            />
          </TabPane>
        );
      } else if (
        legend.type !== 'continuous'
        && legend.type !== 'discrete'
        && legend.colors.length > 1
      ) {
        paneItemEl = (
          <TabPane key={`${legend.id}pane`} tabId={i}>
            No customizations available for this palette.
          </TabPane>
        );
      } else {
        paneItemEl = (
          <TabPane key={`${legend.id}pane`} tabId={i}>
            {legend.type !== 'classification' ? (
              <PaletteThreshold
                key={`${layer.id + i}_threshold`}
                legend={legend}
                setRange={setThresholdRange}
                min={0}
                max={max}
                start={start}
                groupName={groupName}
                end={end}
                layerId={layer.id}
                squashed={!!palette.squash}
                index={i}
                palette={palette}
              />
            ) : null}

            <Palette
              setCustomPalette={setCustomPalette}
              groupName={groupName}
              clearCustomPalette={clearCustomPalette}
              getDefaultLegend={getDefaultLegend}
              getCustomPalette={getCustomPalette}
              palettesTranslate={palettesTranslate}
              activePalette={palette.custom || '__default'}
              layer={layer}
              canvas={this.canvas}
              index={i}
              paletteOrder={paletteOrder}
            />
          </TabPane>
        );
      }

      paneElements.push(paneItemEl);
      navElements.push(navItemEl);
    });
    return (
      <>
        <Nav tabs>{navElements}</Nav>
        <TabContent activeTab={activeIndex}>{paneElements}</TabContent>
      </>
    );
  }

  /**
   * Render Opacity, threshold, and custom palette options
   */
  renderCustomPalettes() {
    const {
      setCustomPalette,
      clearCustomPalette,
      getDefaultLegend,
      getCustomPalette,
      palettesTranslate,
      getPaletteLegends,
      getPalette,
      getPaletteLegend,
      setThresholdRange,
      paletteOrder,
      groupName,
      layer,
      toggleClassification,
      toggleAllClassifications,
      screenHeight,
    } = this.props;
    const paletteLegends = getPaletteLegends(layer.id);
    if (!paletteLegends) return '';
    const len = paletteLegends.length;
    const palette = getPalette(layer.id, 0);
    const legend = getPaletteLegend(layer.id, 0);
    const max = palette.legend.colors.length - 1;
    const start = palette.min ? legend.refs.indexOf(palette.entries.refs[palette.min]) : 0;
    const end = palette.max ? legend.refs.indexOf(palette.entries.refs[palette.max]) : max;
    if (len > 1) {
      return this.renderMultiColormapCustoms(paletteLegends);
    } if (legend.type === 'classification' && legend.colors.length > 1) {
      return (
        <ClassificationToggle
          height={Math.ceil(screenHeight / 2)}
          palette={palette}
          toggle={(classIndex) => toggleClassification(layer.id, classIndex, 0, groupName)}
          legend={legend}
          toggleAll={(disabledArray) => { toggleAllClassifications(layer.id, disabledArray, 0, groupName); }}
        />
      );
    }
    return (
      <>
        {legend.type !== 'classification'
          && (
            <PaletteThreshold
              key={`${layer.id}0_threshold`}
              legend={legend}
              setRange={setThresholdRange}
              min={0}
              max={max}
              start={start}
              layerId={layer.id}
              end={end}
              squashed={!!palette.squash}
              groupName={groupName}
              index={0}
              palette={palette}
            />
          )}
        <Palette
          setCustomPalette={setCustomPalette}
          clearCustomPalette={clearCustomPalette}
          getDefaultLegend={getDefaultLegend}
          getCustomPalette={getCustomPalette}
          palettesTranslate={palettesTranslate}
          activePalette={palette.custom || '__default'}
          layer={layer}
          canvas={this.canvas}
          groupName={groupName}
          index={0}
          paletteOrder={paletteOrder}
        />
      </>
    );
  }

  /**
   * Render Opacity, threshold, and custom palette options
   */
  renderVectorStyles() {
    const {
      setStyle,
      clearStyle,
      groupName,
      layer,
      vectorStyles,
    } = this.props;
    let customStyle;
    if (layer.custom && layer.custom[0]) {
      [customStyle] = layer.custom;
    }
    return (
      <>
        <VectorStyle
          setStyle={setStyle}
          clearStyle={clearStyle}
          activeVectorStyle={customStyle || layer.id}
          layer={layer}
          index={0}
          groupName={groupName}
          vectorStyles={vectorStyles}
        />
      </>
    );
  }

  render() {
    let renderCustomizations;
    const {
      setOpacity,
      customPalettesIsActive,
      layer,
      palettedAllowed,
    } = this.props;

    if (layer.type !== 'vector') {
      renderCustomizations = customPalettesIsActive && palettedAllowed && layer.palette
        ? this.renderCustomPalettes()
        : '';
    } else {
      renderCustomizations = ''; // this.renderVectorStyles(); for future
    }

    if (!layer.id) return '';
    return (
      <>
        <Opacity
          start={Math.ceil(layer.opacity * 100)}
          setOpacity={setOpacity}
          layer={layer}
        />
        {renderCustomizations}
        {layer.tracks && layer.tracks.length && <OrbitTracks layer={layer} />}
      </>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const {
    config, palettes, compare, browser,
  } = state;
  const { custom } = palettes;
  const groupName = compare.activeString;

  return {
    paletteOrder: config.paletteOrder,
    groupName,
    screenHeight: browser.screenHeight,
    customPalettesIsActive: !!config.features.customPalettes,
    palettedAllowed: isPaletteAllowed(ownProps.layer.id, config),
    palettesTranslate,
    getDefaultLegend: (layerId, index) => getDefaultLegend(layerId, index, state),
    getCustomPalette: (id) => getCustomPalette(id, custom),
    getPaletteLegend: (layerId, index) => getPaletteLegend(layerId, index, groupName, state),

    getPaletteLegends: (layerId) => getPaletteLegends(layerId, groupName, state),
    getPalette: (layerId, index) => getPalette(layerId, index, groupName, state),
    getVectorStyle: (layerId, index) => getVectorStyle(layerId, index, groupName, state),
    vectorStyles: config.vectorStyles,
  };
}
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
  setThresholdRange: (layerId, min, max, squash, index, groupName) => {
    dispatch(
      setThresholdRangeAndSquash(layerId, { min, max, squash }, index, groupName),
    );
  },
  setFilterRange: (layerId, min, max, index, groupName) => {
    dispatch(
      setFilterRange(layerId, { min, max }, index, groupName),
    );
  },
  setCustomPalette: (layerId, paletteId, index, groupName) => {
    dispatch(setCustomPalette(layerId, paletteId, index, groupName));
  },
  clearCustomPalette: (layerId, index, groupName) => {
    dispatch(clearCustomPalette(layerId, index, groupName));
  },
  setStyle: (layer, vectorStyleId, groupName) => {
    dispatch(setStyle(layer, vectorStyleId, groupName));
  },
  clearStyle: (layer, vectorStyleId, groupName) => {
    dispatch(clearStyle(layer, vectorStyleId, groupName));
  },
  setOpacity: (id, opacity) => {
    dispatch(setOpacity(id, opacity));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerSettings);

LayerSettings.defaultProps = {
  layer: { id: null, name: null },
  palettedAllowed: false,
};
LayerSettings.propTypes = {
  clearCustomPalette: PropTypes.func,
  clearStyle: PropTypes.func,
  customPalettesIsActive: PropTypes.bool,
  getCustomPalette: PropTypes.func,
  getDefaultLegend: PropTypes.func,
  getPalette: PropTypes.func,
  getPaletteLegend: PropTypes.func,
  getPaletteLegends: PropTypes.func,
  groupName: PropTypes.string,
  layer: PropTypes.object,
  palettedAllowed: PropTypes.bool,
  paletteOrder: PropTypes.array,
  palettesTranslate: PropTypes.func,
  screenHeight: PropTypes.number,
  setCustomPalette: PropTypes.func,
  setOpacity: PropTypes.func,
  setStyle: PropTypes.func,
  setThresholdRange: PropTypes.func,
  toggleClassification: PropTypes.func,
  toggleAllClassifications: PropTypes.func,
  vectorStyles: PropTypes.object,
};
