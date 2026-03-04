/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import {
  getAllActiveOverlaysBaselayers,
  getActiveOverlayGroups,
  getActiveLayersMap,
  getFilteredOverlayGroups,
} from '../../modules/layers/selectors';
import {
  updateActiveChartingLayerAction,
} from '../../modules/charting/actions';

function ChartingLayerMenu (props) {
  const {
    activeLayersWithPalettes,
    height,
    isActive,
    isEmbedModeActive,
    updateActiveChartingLayer,
    renderedPalettes,
    activeChartingLayer,
  } = props;

  let minHeight = '100px';
  let maxHeight = height;

  if (isEmbedModeActive) {
    minHeight = '25px';
    maxHeight = '55vh';
  } else {
    maxHeight += 'px';
  }
  const scrollContainerStyles = {
    minHeight,
    maxHeight,
    overflowY: 'auto',
  };

  useEffect(() => {
    if (!activeChartingLayer && Object.keys(renderedPalettes).length > 0) {
      updateActiveChartingLayer(activeLayersWithPalettes
        .filter((layer) => !layer.shouldHide)[0].id);
    }
  }, [renderedPalettes]);

  return isActive && (
    <div id="layers-scroll-container" style={scrollContainerStyles}>
      <div className="layer-container sidebar-panel">
        <LayerList
          title="Overlays"
          groupId="overlays"
          layers={activeLayersWithPalettes}
          layerSplit={activeLayersWithPalettes.length}
          showDropdownBtn={false}
        />
      </div>
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { compareState } = ownProps;
  const {
    compare, charting, embed, layers, animation, screenSize, palettes,
  } = state;
  const isCompareActive = compare.active;
  const isChartingActive = charting.active;
  const activeChartingLayer = charting.activeLayer;
  const { isEmbedModeActive } = embed;
  const isMobile = screenSize.isMobileDevice;
  const { groupOverlays } = layers[compareState];
  const activeLayersMap = getActiveLayersMap(state);
  let { baselayers, overlays } = getAllActiveOverlaysBaselayers(state);
  let overlayGroups = groupOverlays ? getActiveOverlayGroups(state) : [];
  const renderedPalettes = palettes.rendered;
  if (isEmbedModeActive) {
    // remove hidden layers and reference layers overlay group
    baselayers = baselayers.filter((layer) => layer.visible);
    overlays = overlays.filter((layer) => layer.visible && layer.layergroup !== 'Reference');
    overlayGroups = getFilteredOverlayGroups(overlayGroups, overlays);
  }
  const activeLayersWithPalettes = overlays.map((layer) => ({ ...layer, shouldHide: !(Object.prototype.hasOwnProperty.call(layer, 'palette') && renderedPalettes[layer.palette.id] && renderedPalettes[layer.palette.id].maps[0].type === 'continuous' && layer.layerPeriod === 'Daily') || layer.disableCharting }));

  return {
    isAnimating: animation.isPlaying,
    isCompareActive,
    isChartingActive,
    isEmbedModeActive,
    isMobile,
    baselayers,
    overlays,
    overlayGroups,
    groupOverlays,
    activeLayersMap,
    activeLayersWithPalettes,
    renderedPalettes,
    activeChartingLayer,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateActiveChartingLayer: (layersId) => {
    dispatch(updateActiveChartingLayerAction(layersId));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingLayerMenu);

ChartingLayerMenu.propTypes = {
  activeLayersWithPalettes: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  height: PropTypes.number,
  isActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  updateActiveChartingLayer: PropTypes.func,
  renderedPalettes: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  activeChartingLayer: PropTypes.string,
};
