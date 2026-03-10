import { useState } from 'react';
import { connect } from 'react-redux';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  toggleGroupCollapsed as toggleGroupCollapsedAction,
} from '../../modules/layers/actions';
import util from '../../util/util';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

function SortableOverlayGroup(props) {
  const {
    group,
    compareState,
    activeLayersMap,
    overlaysLength,
    toggleCollapse,
    isEmbedModeActive,
    isAnimating,
  } = props;

  const { groupName, layers, collapsed } = group;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: groupName,
    disabled: isEmbedModeActive || isAnimating,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : undefined,
  };

  if (!layers) return null;
  const layersForGroup = layers.map((id) => activeLayersMap[id]);
  return (
    <li
      id={`${compareState}-${util.cleanId(groupName)}`}
      ref={setNodeRef}
      style={style}
    >
      <LayerList
        title={groupName}
        groupId={groupName}
        collapsed={collapsed}
        toggleCollapse={toggleCollapse}
        compareState={compareState}
        layerSplit={overlaysLength}
        layers={layersForGroup}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          ref: setActivatorNodeRef,
        }}
      />
    </li>
  );
}

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
  } = props;

  const [overlaysCollapsed, toggleOverlaysCollapsed] = useState(false);
  const [baselayersCollapsed, toggleBaselayersCollapsed] = useState(false);

  /**
   * Update layer group order after drag/drop
   * @param {*} result
   */
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceIndex = overlayGroups.findIndex(({ groupName }) => groupName === active.id);
    const destinationIndex = overlayGroups.findIndex(({ groupName }) => groupName === over.id);
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) return;

    const newGroups = arrayMove(overlayGroups, sourceIndex, destinationIndex);
    const newLayers = newGroups
      .flatMap(({ layers }) => layers)
      .map((id) => activeLayersMap[id])
      .concat(baselayers);
    reorderOverlayGroups(newLayers, newGroups);
  };

  const renderOverlayGroups = () => (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={overlayGroups.map(({ groupName }) => groupName)}
        strategy={verticalListSortingStrategy}
      >
        <ul>
          {overlayGroups.map((group, idx) => (
            <SortableOverlayGroup
              key={group.groupName}
              group={group}
              compareState={compareState}
              activeLayersMap={activeLayersMap}
              overlaysLength={overlays.length}
              toggleCollapse={toggleCollapse}
              isEmbedModeActive={isEmbedModeActive}
              isAnimating={isAnimating}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
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
    <div id="layers-scroll-container" style={scrollContainerStyles}>
      <div className="layer-container sidebar-panel">

        {groupOverlays
          ? renderOverlayGroups()
          : !shouldHideForEmbedNoOverlays && (
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
  );
}

const mapStateToProps = (state, ownProps) => {
  const { compareState } = ownProps;
  const {
    compare, embed, layers, animation, screenSize,
  } = state;
  const isCompareActive = compare.active;
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
    isEmbedModeActive,
    isMobile,
    breakpoints: screenSize.breakpoints,
    screenWidth: screenSize.screenWidth,
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

SortableOverlayGroup.propTypes = {
  group: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  compareState: PropTypes.string,
  activeLayersMap: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  overlaysLength: PropTypes.number,
  toggleCollapse: PropTypes.func,
  isEmbedModeActive: PropTypes.bool,
  isAnimating: PropTypes.bool,
};

LayersContainer.propTypes = {
  activeLayersMap: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  baselayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  compareState: PropTypes.string,
  groupOverlays: PropTypes.bool,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  isAnimating: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  overlayGroups: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  overlays: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  reorderOverlayGroups: PropTypes.func,
  toggleCollapse: PropTypes.func,
};
