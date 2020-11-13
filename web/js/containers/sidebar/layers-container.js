/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers, getActiveLayers, getGroupedOverlays } from '../../modules/layers/selectors';
import { reorderLayerGroups as reorderLayerGroupsAction } from '../../modules/layers/actions';
import Scrollbars from '../../components/util/scrollbar';

function LayersContainer (props) {
  const {
    overlayGroups,
    baselayers,
    isActive,
    compareState,
    height,
    layerSplit,
    reorderLayerGroups,
  } = props;
  const outterClass = 'layer-container sidebar-panel';

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

  return isActive && (
    <Scrollbars style={{ maxHeight: `${height}px` }}>
      <div className={outterClass}>

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

        <LayerList
          title="Base Layers"
          groupId="baselayers"
          compareState={compareState}
          layers={baselayers}
          layerSplit={layerSplit}
        />
      </div>
    </Scrollbars>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { proj } = state;
  const activeLayers = getActiveLayers(state);
  const layerObj = getLayers(activeLayers, { proj: proj.id, group: 'all' });
  const overlayGroups = getGroupedOverlays(state);

  return {
    baselayers: layerObj.baselayers,
    overlayGroups,
    layerSplit: layerObj.overlays.length,
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderLayerGroups: (layers, groups) => {
    dispatch(reorderLayerGroupsAction(layers, groups));
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
  reorderLayerGroups: PropTypes.func,
};
