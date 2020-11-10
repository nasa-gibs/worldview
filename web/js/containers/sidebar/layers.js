import React from 'react';
import { connect } from 'react-redux';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers } from '../../modules/layers/selectors';
import Scrollbars from '../../components/util/scrollbar';

const getGroupedLayers = (layers) => {
  const allLayerGroups = {};
  layers.forEach((layer) => {
    const { layergroup } = layer;
    if (layergroup && layergroup.length) {
      // TODO just using first group in array for now
      const [groupName] = layergroup;
      if (allLayerGroups[groupName]) {
        allLayerGroups[groupName].push(layer);
      } else {
        allLayerGroups[groupName] = [layer];
      }
    }
  });
  return allLayerGroups;
};

function Layers (props) {
  const {
    overlays,
    baselayers,
    isActive,
    compareState,
    height,
    layerSplit,
  } = props;
  const outterClass = 'layer-container sidebar-panel';

  return isActive && (
    <Scrollbars style={{ maxHeight: `${height}px` }}>
      <div className={outterClass}>
        <DragDropContext onDragEnd={() => { console.log('dropped'); }}>
          <Droppable
            droppableId="layerGroup"
            type="overlayGroups"
            direction="vertical"
          >
            {(provided, snapshot) => (
              <ul
                id=""
                ref={provided.innerRef}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...provided.droppableProps}
              >
                {Object.keys(overlays).map((groupName) => (
                  <LayerList
                    key={groupName}
                    title={groupName}
                    groupId={groupName}
                    compareState={compareState}
                    layerSplit={layerSplit}
                    layers={overlays[groupName]}
                  />
                ))}
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
  const { layers, proj } = state;
  const { compareState } = ownProps;
  const componentLayers = layers[compareState];
  const layerObj = getLayers(componentLayers, { proj: proj.id, group: 'all' });
  const overlays = getGroupedLayers(layerObj.overlays);

  return {
    baselayers: layerObj.baselayers,
    overlays,
    layerSplit: layerObj.overlays.length,
  };
};

export default connect(
  mapStateToProps,
  null,
)(Layers);

Layers.propTypes = {
  baselayers: PropTypes.array,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  compareState: PropTypes.string,
  layerSplit: PropTypes.number,
  overlays: PropTypes.object,
};
