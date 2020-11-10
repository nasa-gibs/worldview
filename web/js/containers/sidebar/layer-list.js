import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get as lodashGet } from 'lodash';
import Layer from './layer';
import {
  replaceSubGroup,
  getZotsForActiveLayers,
  getTitles,
  memoizedAvailable as availableSelector,
} from '../../modules/layers/selectors';
import { reorderLayers as reorderLayersAction } from '../../modules/layers/actions';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function LayerList(props) {
  const {
    layerGroupName,
    reorderLayers,
    layerSplit,
    activeLayers,
    layers,
    zots,
    runningLayers,
    projId,
    getNames,
    available,
    groupId,
    title,
  } = props;

  const [collapsed, toggleCollapse] = useState(false);

  /**
   * Update Layer order after drag
   * @param {Object} result | Result of layer drag
   */
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || source.index === destination.index) {
      return;
    }
    const regex = new RegExp(`-${layerGroupName}$`);
    const layerId = draggableId.replace(regex, '');
    const newLayerArray = reorder(layers, source.index, destination.index);

    // In the new ordering, find the layer right after the layer that just
    // moved. Leave null if moved to the end of the list.
    let nextLayerId = null;
    const nextIndex = destination.index + 1;
    if (nextIndex < newLayerArray.length) {
      nextLayerId = newLayerArray[nextIndex].id;
    }
    const newLayers = replaceSubGroup(
      layerId,
      nextLayerId,
      activeLayers,
      layerSplit,
    );
    reorderLayers(newLayers);
  };

  const renderLayer = (layer, index) => {
    const { id, projections, visible } = layer;

    return (
      <Layer
        layer={layer}
        layerGroupName={layerGroupName}
        isInProjection={!!projections[projId]}
        key={id}
        index={index}
        layerClasses="item productsitem"
        zot={zots[id]}
        names={getNames(id)}
        isDisabled={!available(id)}
        isVisible={visible}
        runningObject={runningLayers && runningLayers[id]}
      />
    );
  };

  return (
    <div className="layer-group-case">
      <h3 className="layer-group-title">{`${title} (${layers.length})`}</h3>
      <FontAwesomeIcon
        className="layer-group-collapse"
        icon={!collapsed ? 'caret-down' : 'caret-left'}
        onClick={() => toggleCollapse(!collapsed)}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        {!collapsed && (
          <Droppable
            droppableId={`${layerGroupName}-${groupId}`}
            type={`layerSubGroup${groupId}`}
            direction="vertical"
          >
            {(provided, snapshot) => (
              <ul
                id={groupId}
                className="category"
                ref={provided.innerRef}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...provided.droppableProps}
              >
                {layers.map(renderLayer)}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        )}
      </DragDropContext>
    </div>
  );
}

LayerList.propTypes = {
  activeLayers: PropTypes.array,
  available: PropTypes.func,
  getNames: PropTypes.func,
  groupId: PropTypes.string,
  layerGroupName: PropTypes.string,
  layers: PropTypes.array,
  layerSplit: PropTypes.number,
  projId: PropTypes.string,
  reorderLayers: PropTypes.func,
  runningLayers: PropTypes.object,
  title: PropTypes.string,
  zots: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => {
  const { layerGroupName } = ownProps;
  const {
    proj, config, map,
  } = state;
  const { runningLayers } = state.layers;
  const { id } = proj;
  const activeLayers = state.layers[layerGroupName];
  const zots = lodashGet(map, 'ui.selected')
    ? getZotsForActiveLayers(state)
    : {};
  return {
    zots,
    activeLayers,
    runningLayers,
    projId: id,
    getNames: (layerId) => getTitles(config, layerId, id),
    available: (layerId) => availableSelector(state)(layerId),
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderLayers: (newLayerArray) => {
    dispatch(reorderLayersAction(newLayerArray));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerList);
