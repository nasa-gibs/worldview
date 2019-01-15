import React from 'react';
import PropTypes from 'prop-types';
import lodashEach from 'lodash/each';
import {
  Modal,
  ModalHeader,
  ModalBody,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap';

import Palette from './palette';
import Opacity from './opacity';
import Threshold from './threshold';

class LayerSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0,
      isOpen: props.isOpen,
      palettedAllowed: props.palettedAllowed,
      layer: props.layer,
      title: props.title
    };
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
      canvas,
      palettesTranslate,
      setRange,
      checkerboard
    } = this.props;
    const { layer, activeIndex } = this.state;
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
              clearCustom={clearCustom}
              getDefaultLegend={getDefaultLegend}
              getCustomPalette={getCustomPalette}
              palettesTranslate={palettesTranslate}
              activePalette={palette.custom || '__default'}
              checkerboard={checkerboard}
              layer={layer}
              canvas={canvas}
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
      canvas,
      checkerboard,
      paletteOrder
    } = this.props;
    const { layer } = this.state;
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
          checkerboard={checkerboard}
          layer={layer}
          canvas={canvas}
          index={0}
          paletteOrder={paletteOrder}
        />
      </React.Fragment>
    );
  }
  render() {
    const { setOpacity, customPalettesIsActive, close } = this.props;
    const { isOpen, layer, palettedAllowed } = this.state;

    const customPalettes =
      customPalettesIsActive && palettedAllowed ? this.renderCustoms() : '';
    return (
      <Modal
        id="wv-layers-options-dialog"
        className="wv-layers-options-dialog"
        modalClassName="layer-settings-modal"
        isOpen={isOpen}
        toggle={close}
        backdrop={false}
        modalTransition={{ timeout: 150 }}
      >
        {layer.id ? (
          <React.Fragment>
            <ModalHeader id={'wv-options-header-' + layer.id} toggle={close}>
              {layer.title}
            </ModalHeader>
            <ModalBody id={'wv-options-body-' + layer.id}>
              <Opacity
                start={Math.ceil(layer.opacity * 100)}
                setOpacity={setOpacity}
                layer={layer}
              />
              {customPalettes}
            </ModalBody>
          </React.Fragment>
        ) : (
          ''
        )}
      </Modal>
    );
  }
}
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
  checkerboard: PropTypes.object,
  customPalettesIsActive: PropTypes.bool,
  close: PropTypes.func,
  isOpen: PropTypes.bool,
  palettedAllowed: PropTypes.bool,
  layer: PropTypes.object,
  title: PropTypes.string
};

export default LayerSettings;
