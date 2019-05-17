import React from 'react';
import PropTypes from 'prop-types';
import { each as lodashEach } from 'lodash';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import { connect } from 'react-redux';
import Palette from './palette';
import Opacity from './opacity';
import Threshold from './threshold';
import {
  getCheckerboard,
  palettesTranslate
} from '../../../modules/palettes/util';
import {
  getDefaultLegend,
  getCustomPalette,
  getLegends,
  getPalette,
  getLegend
} from '../../../modules/palettes/selectors';
import {
  setRangeAndSquash,
  setCustom,
  clearCustom
} from '../../../modules/palettes/actions';
import { setOpacity } from '../../../modules/layers/actions';

class LayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0
    };
    this.canvas = document.createElement('canvas');
    this.checkerboard = getCheckerboard();
  }
  /**
   * Render multicolormap layers inside a tab pane
   * @param {object} legends | legend object
   */
  renderMultiColormapCustoms(legends) {
    const {
      clearCustom,
      getPalette,
      paletteOrder,
      getDefaultLegend,
      getCustomPalette,
      setCustom,
      palettesTranslate,
      groupName,
      setRange,
      layer
    } = this.props;
    const { activeIndex } = this.state;
    let navElements = [];
    let paneElements = [];
    lodashEach(legends, (legend, i) => {
      const activeClass = activeIndex === i ? 'active' : '';
      const dualStr = legends.length === 2 ? ' dual' : '';
      const navItemEl = (
        <NavItem
          key={legend.id + 'nav'}
          className={'settings-customs-title ' + activeClass + dualStr}
        >
          <NavLink onClick={() => this.setState({ activeIndex: i })}>
            {legend.title}
          </NavLink>
        </NavItem>
      );
      let palette = getPalette(layer.id, i);
      let max = legend.colors.length - 1;
      let start = palette.min || 0;
      let end = palette.max || max;
      let paneItemEl;
      if (
        legend.type !== 'continuous' &&
        legend.type !== 'discrete' &&
        legend.colors.length > 1
      ) {
        paneItemEl = (
          <TabPane key={legend.id + 'pane'} tabId={i}>
            No customizations available for this palette.
          </TabPane>
        );
      } else {
        paneItemEl = (
          <TabPane key={legend.id + 'pane'} tabId={i}>
            {legend.type !== 'classification' ? (
              <Threshold
                legend={legend}
                setRange={setRange}
                min={0}
                max={max}
                start={start}
                groupName={groupName}
                end={end}
                layerId={layer.id}
                squashed={!!palette.squash}
                index={i}
              />
            ) : (
              ''
            )}
            <Palette
              setCustom={setCustom}
              groupName={groupName}
              clearCustom={clearCustom}
              getDefaultLegend={getDefaultLegend}
              getCustomPalette={getCustomPalette}
              palettesTranslate={palettesTranslate}
              activePalette={palette.custom || '__default'}
              checkerboard={this.checkerboard}
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
      <React.Fragment>
        <Nav tabs>{navElements}</Nav>
        <TabContent activeTab={activeIndex}>{paneElements}</TabContent>
      </React.Fragment>
    );
  }
  /**
   * Render Opacity, threshold, and custom palette options
   */
  renderCustoms() {
    const {
      setCustom,
      clearCustom,
      getDefaultLegend,
      getCustomPalette,
      palettesTranslate,
      getLegends,
      getPalette,
      getLegend,
      setRange,
      paletteOrder,
      groupName,
      layer
    } = this.props;
    const legends = getLegends(layer.id);
    if (!legends) return '';
    const len = legends.length;
    const palette = getPalette(layer.id, 0);
    const legend = getLegend(layer.id, 0);
    const max = palette.legend.colors.length - 1;
    const start = palette.min || 0;
    const end = palette.max || max;
    if (len > 1) {
      return this.renderMultiColormapCustoms(legends);
    } else if (legend.type === 'classification' && legend.colors.length > 1) {
      return '';
    }

    return (
      <React.Fragment>
        {legend.type !== 'classification' ? (
          <Threshold
            legend={legend}
            setRange={setRange}
            min={0}
            max={max}
            start={start}
            layerId={layer.id}
            end={end}
            squashed={!!palette.squash}
            groupName={groupName}
            index={0}
          />
        ) : (
          ''
        )}
        <Palette
          setCustom={setCustom}
          clearCustom={clearCustom}
          getDefaultLegend={getDefaultLegend}
          getCustomPalette={getCustomPalette}
          palettesTranslate={palettesTranslate}
          activePalette={palette.custom || '__default'}
          checkerboard={this.checkerboard}
          layer={layer}
          canvas={this.canvas}
          groupName={groupName}
          index={0}
          paletteOrder={paletteOrder}
        />
      </React.Fragment>
    );
  }
  render() {
    const {
      setOpacity,
      customPalettesIsActive,
      layer,
      palettedAllowed
    } = this.props;
    const customPalettes =
      customPalettesIsActive && palettedAllowed && layer.palette
        ? this.renderCustoms()
        : '';

    if (!layer.id) return '';
    return (
      <React.Fragment>
        <Opacity
          start={Math.ceil(layer.opacity * 100)}
          setOpacity={setOpacity}
          layer={layer}
        />
        {customPalettes}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { config, palettes, compare } = state;
  const { supported, custom } = palettes;
  const groupName = compare.activeString;

  return {
    paletteOrder: config.paletteOrder,
    groupName,
    customPalettesIsActive: !!config.features.customPalettes,
    palettedAllowed: supported,
    palettesTranslate,
    getDefaultLegend: (layerId, index) => {
      return getDefaultLegend(layerId, index, state);
    },
    getCustomPalette: id => {
      return getCustomPalette(id, custom);
    },
    getLegend: (layerId, index) => {
      return getLegend(layerId, index, groupName, state);
    },

    getLegends: layerId => {
      return getLegends(layerId, groupName, state);
    },
    getPalette: (layerId, index) => {
      return getPalette(layerId, index, groupName, state);
    }
  };
}
const mapDispatchToProps = dispatch => ({
  setRange: (layerId, min, max, squash, index, groupName) => {
    dispatch(
      setRangeAndSquash(layerId, { min, max, squash }, index, groupName)
    );
  },
  setCustom: (layerId, paletteId, index, groupName) => {
    dispatch(setCustom(layerId, paletteId, index, groupName));
  },
  clearCustom: (layerId, index, groupName) => {
    dispatch(clearCustom(layerId, index, groupName));
  },
  setOpacity: (id, opacity) => {
    dispatch(setOpacity(id, opacity));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LayerSettings);

LayerSettings.defaultProps = {
  palettedAllowed: false,
  layer: { id: null, name: null },
  isOpen: false,
  title: null
};
LayerSettings.propTypes = {
  index: PropTypes.number,
  setOpacity: PropTypes.func,
  clearCustom: PropTypes.func,
  getPalette: PropTypes.func,
  paletteOrder: PropTypes.array,
  getDefaultLegend: PropTypes.func,
  getCustomPalette: PropTypes.func,
  getLegends: PropTypes.func,
  getLegend: PropTypes.func,
  setCustom: PropTypes.func,
  canvas: PropTypes.object,
  palettesTranslate: PropTypes.func,
  setRange: PropTypes.func,
  customPalettesIsActive: PropTypes.bool,
  close: PropTypes.func,
  isOpen: PropTypes.bool,
  palettedAllowed: PropTypes.bool,
  layer: PropTypes.object,
  title: PropTypes.string,
  groupName: PropTypes.string
};
