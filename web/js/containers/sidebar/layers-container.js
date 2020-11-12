/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers, getActiveLayers } from '../../modules/layers/selectors';
import Scrollbars from '../../components/util/scrollbar';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getGroupedLayers = (layers) => {
  const allGroupsMap = {};
  layers.forEach((layer) => {
    const { layergroup } = layer;
    if (layergroup && layergroup.length) {
      // TODO just using first group in array for now
      const [groupName] = layergroup;
      if (allGroupsMap[groupName]) {
        allGroupsMap[groupName].push(layer);
      } else {
        allGroupsMap[groupName] = [layer];
      }
    }
  });
  return Object.keys(allGroupsMap).map((group) => ({
    groupName: group,
    layers: allGroupsMap[group],
  }));
};

function LayersContainer (props) {
  const {
    overlayGroups,
    baselayers,
    isActive,
    compareState,
    height,
    layerSplit,
  } = props;
  const outterClass = 'layer-container sidebar-panel';

  const renderLayerList = (group, idx) => {
    const { groupName, layers } = group;
    return ((
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
    reorder(overlayGroups, source.index, destination.index);
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
                // eslint-disable-next-line react/jsx-props-no-spreading
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
  const overlayGroups = getGroupedLayers(layerObj.overlays);

  return {
    baselayers: layerObj.baselayers,
    overlayGroups,
    layerSplit: layerObj.overlays.length,
  };
};

export default connect(
  mapStateToProps,
  null,
)(LayersContainer);

LayersContainer.propTypes = {
  baselayers: PropTypes.array,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  compareState: PropTypes.string,
  layerSplit: PropTypes.number,
  overlayGroups: PropTypes.array,
};
