/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers, getActiveLayers, getGroupedOverlays } from '../../modules/layers/selectors';
import {
  reorderLayerGroups as reorderLayerGroupsAction,
  toggleLayerGroups as toggleLayerGroupsAction,
} from '../../modules/layers/actions';
import Scrollbars from '../../components/util/scrollbar';
import Switch from '../../components/util/switch';

function LayersContainer (props) {
  const {
    overlayGroups,
    overlays,
    baselayers,
    showGroups,
    isActive,
    compareState,
    height,
    layerSplit,
    reorderLayerGroups,
    toggleLayerGroups,
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
    const newList = Array.from(overlayGroups);
    const [removed] = newList.splice(source.index, 1);
    newList.splice(destination.index, 0, removed);
    const newLayers = newList.flatMap((group) => group.layers).concat(baselayers);
    const newGroups = newList.map((g) => g.groupName);

    reorderLayerGroups(newLayers, newGroups);
  };

  const renderLayerList = (group, idx) => {
    const { groupName, layers } = group;
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
              layers={layers}
            />
          </li>
        )}
      </Draggable>
    ));
  };

  const renderLayerGroups = () => (
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
        label="Toggle Groups"
        active={showGroups}
        toggle={toggleLayerGroups}
      />
      <Scrollbars style={{ maxHeight: `${height}px` }}>
        <div className="layer-container sidebar-panel">

          {showGroups ? renderLayerGroups() : (
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
  const { proj, layers } = state;
  const { showGroups } = layers;
  const activeLayers = getActiveLayers(state);
  const layerObj = getLayers(activeLayers, { proj: proj.id, group: 'all' });
  const overlayGroups = showGroups ? getGroupedOverlays(state) : [];

  return {
    baselayers: layerObj.baselayers,
    overlays: layerObj.overlays,
    overlayGroups,
    showGroups,
    layerSplit: layerObj.overlays.length,
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderLayerGroups: (layers, groups) => {
    dispatch(reorderLayerGroupsAction(layers, groups));
  },
  toggleLayerGroups: () => {
    dispatch(toggleLayerGroupsAction());
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
  showGroups: PropTypes.bool,
  toggleLayerGroups: PropTypes.func,
};
