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
      const navItemEl = (
        <NavItem className={'settings-customs-title ' + activeClass}>
          <NavLink onClick={() => this.setState({ activeIndex: i })}>
            {legend.title}
          </NavLink>
        </NavItem>
      );
      let palette = getPalette(layer.id, i);
      let max = palette.entries.values.length - 1;
      let start = palette.min || 0;
      let end = palette.max || max;
      let paneItemEl = (
        <TabPane tabId={i}>
          <Threshold
            legend={legend}
            setRange={setRange}
            min={0}
            max={max}
            start={start}
            end={end}
            layerId={layer.id}
            squashed={palette.squash}
          />
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
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
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
    const max = palette.entries.values.length - 1;
    const start = palette.min || 0;
    const end = palette.max || max;

    if (len > 1) {
      return this.renderMultiColormapCustoms(legends);
    }

    return (
      <React.Fragment>
        <Threshold
          legend={legend}
          setRange={setRange}
          min={0}
          max={max}
          start={start}
          layerId={layer.id}
          end={end}
          squashed={palette.squash}
        />
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
    const { setOpacity, customPalettesIsActive } = this.props;
    const { isOpen, layer, palettedAllowed } = this.state;
    const customPalettes =
      customPalettesIsActive && palettedAllowed ? this.renderCustoms() : '';
    return (
      <Modal
        id="wv-layers-options-dialog"
        className="wv-layers-options-dialog"
        modalClassName="layer-settings-modal"
        isOpen={isOpen}
        toggle={this.toggle.bind(this)}
        backdrop={false}
      >
        {layer.id ? (
          <React.Fragment>
            <ModalHeader toggle={this.toggle.bind(this)}>
              {layer.title}
            </ModalHeader>
            <ModalBody>
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
  setOpacity: PropTypes.func
};

export default LayerSettings;
