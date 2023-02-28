/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isMobileOnly, isTablet } from 'react-device-detect';
// import googleTagManager from 'googleTagManager';
import LayerList from './layer-list';
import {
  getAllActiveOverlaysBaselayers,
  getActiveOverlayGroups,
  getActiveLayersMap,
  getFilteredOverlayGroups,
} from '../../modules/layers/selectors';
import {
  reorderOverlayGroups as reorderOverlayGroupsAction,
  toggleOverlayGroups as toggleOverlayGroupsAction,
  toggleGroupCollapsed as toggleGroupCollapsedAction,
} from '../../modules/layers/actions';
// import Checkbox from '../../components/util/checkbox';
// import util from '../../util/util';
// import Button from '../../components/util/button';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

function ChartingLayerMenu (props) {
  const {
    activeLayersWithPalettes,
    height,
    isActive,
    isEmbedModeActive,
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
    paddingBottom: '4px',
  };

  return isActive && (
    <div id="layers-scroll-container" style={scrollContainerStyles}>
      <div className="layer-container sidebar-panel">

        {/* {groupOverlays ? renderOverlayGroups() : !shouldHideForEmbedNoOverlays && ( */}
        <LayerList
          title="Overlays"
          groupId="overlays"
          // compareState={compareState}
          // collapsed={overlaysCollapsed}
          // toggleCollapse={() => toggleOverlaysCollapsed(!overlaysCollapsed)}
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
    compare, charting, embed, layers, animation, screenSize,
  } = state;
  const isCompareActive = compare.active;
  const isChartingActive = charting.active;
  const { isEmbedModeActive } = embed;
  const isMobile = screenSize.isMobileDevice;
  const { groupOverlays } = layers[compareState];
  const activeLayersMap = getActiveLayersMap(state);
  let { baselayers, overlays } = getAllActiveOverlaysBaselayers(state);
  let overlayGroups = groupOverlays ? getActiveOverlayGroups(state) : [];
  if (isEmbedModeActive) {
    // remove hidden layers and reference layers overlay group
    baselayers = baselayers.filter((layer) => layer.visible);
    overlays = overlays.filter((layer) => layer.visible && layer.layergroup !== 'Reference');
    overlayGroups = getFilteredOverlayGroups(overlayGroups, overlays);
  }
  const activeLayersWithPalettes = overlays.filter((layer) => layer.hasOwnProperty('palette'));

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
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderOverlayGroups: (layers, groups) => {
    dispatch(reorderOverlayGroupsAction(layers, groups));
  },
  toggleOverlayGroups: () => {
    setTimeout(() => {
      dispatch(toggleOverlayGroupsAction());
    });
  },
  toggleCollapse: (groupName, collapsed) => {
    dispatch(toggleGroupCollapsedAction(groupName, collapsed));
  },
  addLayers: (isPlaying) => {
    const modalClassName = isMobileOnly || isTablet ? 'custom-layer-dialog-mobile custom-layer-dialog light' : 'custom-layer-dialog light';
    if (isPlaying) {
      dispatch(stopAnimationAction());
    }
    dispatch(
      openCustomContent('LAYER_PICKER_COMPONENT', {
        headerText: null,
        modalClassName,
        backdrop: true,
        CompletelyCustomModal: SearchUiProvider,
        wrapClassName: '',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingLayerMenu);

ChartingLayerMenu.propTypes = {
  activeLayersWithPalettes: PropTypes.array,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  overlays: PropTypes.array,
};
