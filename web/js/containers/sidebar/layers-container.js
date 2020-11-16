/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers, getActiveLayers, getActiveOverlayGroups } from '../../modules/layers/selectors';
import {
  reorderLayerGroups as reorderLayerGroupsAction,
  toggleOverlayGroups as toggleOverlayGroupsAction,
} from '../../modules/layers/actions';
import Scrollbars from '../../components/util/scrollbar';
import Switch from '../../components/util/switch';

function LayersContainer (props) {
  const {
    overlayGroups,
    overlays,
    baselayers,
    groupOverlays,
    isActive,
    compareState,
    height,
    layerSplit,
    reorderLayerGroups,
    toggleOverlayGroups,
  } = props;

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
    const newLayers = newGroups.flatMap(({ layers }) => layers).concat(baselayers);
    reorderLayerGroups(newLayers, newGroups);
  };

  const renderLayerList = (group, idx) => {
    const { groupName, layers } = group;
    const layersForGroup = layers.map(({ id }) => overlays.find((o) => o.id === id));
    return layers && ((
      <Draggable
        key={groupName}
        draggableId={groupName}
        index={idx}
      >
        {(provided) => (
          <li
            id={`${compareState}-${groupName}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <LayerList
              title={groupName}
              groupId={groupName}
              compareState={compareState}
              layerSplit={layerSplit}
              layers={layersForGroup}
            />
          </li>
        )}
      </Draggable>
    ));
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

  return isActive && (
    <>
      <Switch
        id="layer-group-toggle"
        label="Group Overlays"
        active={groupOverlays}
        toggle={toggleOverlayGroups}
      />
      <Scrollbars style={{ maxHeight: `${height}px` }}>
        <div className="layer-container sidebar-panel">

          {groupOverlays ? renderOverlayGroups() : (
            <LayerList
              title="Overlays"
              groupId="overlays"
              compareState={compareState}
              layers={overlays}
              layerSplit={layerSplit}
            />
          )}

          <LayerList
            title="Base Layers"
            groupId="baselayers"
            compareState={compareState}
            layers={baselayers}
            layerSplit={layerSplit}
          />
        </div>
      </Scrollbars>
    </>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { compareState } = ownProps;
  const { proj, layers } = state;
  const { groupOverlays } = layers[compareState];
  const activeLayers = getActiveLayers(state);
  const layerObj = getLayers(activeLayers, { proj: proj.id, group: 'all' });
  const overlayGroups = groupOverlays ? getActiveOverlayGroups(state) : [];

  return {
    baselayers: layerObj.baselayers,
    overlays: layerObj.overlays,
    overlayGroups,
    groupOverlays,
    layerSplit: layerObj.overlays.length,
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderLayerGroups: (layers, groups) => {
    dispatch(reorderLayerGroupsAction(layers, groups));
  },
  toggleOverlayGroups: () => {
    dispatch(toggleOverlayGroupsAction());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayersContainer);

LayersContainer.propTypes = {
  baselayers: PropTypes.array,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  compareState: PropTypes.string,
  layerSplit: PropTypes.number,
  overlayGroups: PropTypes.array,
  overlays: PropTypes.array,
  reorderLayerGroups: PropTypes.func,
  groupOverlays: PropTypes.bool,
  toggleOverlayGroups: PropTypes.func,
};
