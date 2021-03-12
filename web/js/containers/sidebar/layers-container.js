/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import {
  getAllActiveOverlaysBaselayers, getActiveOverlayGroups, getActiveLayersMap,
} from '../../modules/layers/selectors';
import {
  reorderOverlayGroups as reorderOverlayGroupsAction,
  toggleOverlayGroups as toggleOverlayGroupsAction,
  toggleGroupCollapsed as toggleGroupCollapsedAction,
} from '../../modules/layers/actions';
import Checkbox from '../../components/util/checkbox';
import util from '../../util/util';

function LayersContainer (props) {
  const {
    activeLayersMap,
    baselayers,
    compareState,
    groupOverlays,
    height,
    isActive,
    isCompareActive,
    isMobile,
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

  const maxHeight = isCompareActive && isMobile ? height - 94 : height;
  const scrollContainerStyles = {
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto',
    paddingBottom: '4px',
    minHeight: '100px',
  };

  return isActive && (
    <>
      <div id="layers-scroll-container" style={scrollContainerStyles}>
        <div className="layer-container sidebar-panel">

          {groupOverlays ? renderOverlayGroups() : (
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
        </div>
      </div>
      <div className="group-overlays-checkbox">
        <Checkbox
          id="group-overlays-checkbox"
          checked={groupOverlays}
          onCheck={toggleOverlayGroups}
          label="Group Similar Layers"
        />
      </div>
    </>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { compareState } = ownProps;
  const { browser, compare, layers } = state;
  const isCompareActive = compare.active;
  const isMobile = browser.lessThan.medium;
  const { groupOverlays } = layers[compareState];
  const { baselayers, overlays } = getAllActiveOverlaysBaselayers(state);
  const overlayGroups = groupOverlays ? getActiveOverlayGroups(state) : [];

  return {
    isCompareActive,
    isMobile,
    baselayers,
    overlays,
    overlayGroups,
    groupOverlays,
    activeLayersMap: getActiveLayersMap(state),
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
  isCompareActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  overlayGroups: PropTypes.array,
  overlays: PropTypes.array,
  reorderOverlayGroups: PropTypes.func,
  toggleCollapse: PropTypes.func,
  toggleOverlayGroups: PropTypes.func,
};
