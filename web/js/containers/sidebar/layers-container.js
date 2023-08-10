/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { isMobileOnly, isTablet } from 'react-device-detect';
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
import Checkbox from '../../components/util/checkbox';
import util from '../../util/util';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

function LayersContainer (props) {
  const {
    activeLayersMap,
    baselayers,
    compareState,
    groupOverlays,
    height,
    isActive,
    isEmbedModeActive,
    isAnimating,
    overlayGroups,
    overlays,
    reorderOverlayGroups,
    toggleCollapse,
    toggleOverlayGroups,
  } = props;

  const [overlaysCollapsed, toggleOverlaysCollapsed] = useState(false);
  const [baselayersCollapsed, toggleBaselayersCollapsed] = useState(false);

  /**
   * Update layer group order after drag/drop
   * @param {*} result
   */
  const onDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination || source.index === destination.index) {
      return;
    }
    const newGroups = Array.from(overlayGroups);
    const [removed] = newGroups.splice(source.index, 1);
    newGroups.splice(destination.index, 0, removed);
    const newLayers = newGroups
      .flatMap(({ layers }) => layers)
      .map((id) => activeLayersMap[id])
      .concat(baselayers);
    reorderOverlayGroups(newLayers, newGroups);
  };

  const renderLayerList = (group, idx) => {
    const { groupName, layers, collapsed } = group;
    const layersForGroup = layers.map((id) => activeLayersMap[id]);
    return layers && (
      <Draggable
        key={groupName}
        draggableId={groupName}
        index={idx}
        isDragDisabled={isEmbedModeActive || isAnimating}
      >
        {(provided) => (
          <li
            id={`${compareState}-${util.cleanId(groupName)}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
          >
            <LayerList
              title={groupName}
              groupId={groupName}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              compareState={compareState}
              layerSplit={overlays.length}
              layers={layersForGroup}
              dragHandleProps={provided.dragHandleProps}
            />
          </li>
        )}
      </Draggable>
    );
  };

  const renderOverlayGroups = () => (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="layerGroup"
        type="overlayGroups"
        direction="vertical"
      >
        {(provided, snapshot) => (
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {overlayGroups.map(renderLayerList)}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );

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
  const shouldHideForEmbedNoOverlays = isEmbedModeActive && overlays.length === 0;
  const shouldHideForEmbedNoBaseLayers = isEmbedModeActive && baselayers.length === 0;
  return isActive && (
    <>
      <div id="layers-scroll-container" style={scrollContainerStyles}>
        <div className="layer-container sidebar-panel">

          {groupOverlays ? renderOverlayGroups() : !shouldHideForEmbedNoOverlays && (
            <LayerList
              title="Overlays"
              groupId="overlays"
              compareState={compareState}
              collapsed={overlaysCollapsed}
              toggleCollapse={() => toggleOverlaysCollapsed(!overlaysCollapsed)}
              layers={overlays}
              layerSplit={overlays.length}
            />
          )}

          {!shouldHideForEmbedNoBaseLayers && (
          <div className="layer-group-baselayers">
            <LayerList
              title="Base Layers"
              groupId="baselayers"
              collapsed={baselayersCollapsed}
              toggleCollapse={() => toggleBaselayersCollapsed(!baselayersCollapsed)}
              compareState={compareState}
              layers={baselayers}
              layerSplit={overlays.length}
            />
          </div>
          )}
        </div>
      </div>
      { !isEmbedModeActive && (
        <div className="product-buttons">
          <div className="layers-add-container">
            <Checkbox
              id="group-overlays-checkbox"
              checked={groupOverlays}
              onCheck={toggleOverlayGroups}
              label="Group Similar Layers"
            />
          </div>
        </div>
      )}
    </>
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
)(LayersContainer);

LayersContainer.propTypes = {
  activeLayersMap: PropTypes.object,
  baselayers: PropTypes.array,
  compareState: PropTypes.string,
  groupOverlays: PropTypes.bool,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  isAnimating: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isChartingActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  overlayGroups: PropTypes.array,
  overlays: PropTypes.array,
  reorderOverlayGroups: PropTypes.func,
  toggleCollapse: PropTypes.func,
  toggleOverlayGroups: PropTypes.func,
  breakpoints: PropTypes.object,
  isPlaying: PropTypes.bool,
  screenWidth: PropTypes.number,
  addLayers: PropTypes.func,
};
