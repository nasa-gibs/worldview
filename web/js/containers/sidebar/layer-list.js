import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import { get as lodashGet } from 'lodash';
import Layer from './layer';
import {
  replaceSubGroup,
  getZotsForActiveLayers,
  getTitles,
  memoizedAvailable as availableSelector,
} from '../../modules/layers/selectors';
import { reorderLayers } from '../../modules/layers/actions';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

class LayerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      palettes: {},
    };
    this.promises = {};
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  /**
   * Get Palette and setState with promise results when palette is retrieved
   * @param {Object} layer | Layer
   * @param {Function} palettePromise | Retrieve palette
   */
  getPalette(layer, palettePromise) {
    const { renderedPalettes } = this.props;
    if (renderedPalettes[layer.id]) {
      return renderedPalettes[layer.id];
    } if (this.promises[layer.id]) {
      return null;
    } if (layer.palette) {
      this.promises[layer.id] = true;
      const promise = palettePromise(layer.id);
      promise.then((palette) => {
        const { palettes } = this.state;
        delete this.promises[layer.id];
        palettes[layer.id] = palette;
        this.setState({
          palettes,
        });
      });
    }
    return null;
  }

  /**
   * Update Layer order after drag
   * @param {Object} result | Result of layer drag
   */
  onDragEnd(result) {
    const {
      layerGroupName,
      groupId,
      reorderLayers,
      layerSplit,
      activeLayers,
      layers,
    } = this.props;
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
      groupId,
      layerSplit,
    );
    reorderLayers(newLayers);
  }

  render() {
    const {
      groupId,
      title,
      layerGroupName,
      zots,
      layers,
      runningLayers,
      projId,
      checkerBoardPattern,
      getNames,
      available,
    } = this.props;
    return (
      <div className="layer-group-case">
        <h3 className="head">{title}</h3>

        <DragDropContext onDragEnd={this.onDragEnd}>
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
                {...provided.droppableProps}
              >
                {layers.map((object, i) => (
                  <Layer
                    layer={object}
                    groupId={groupId}
                    layerGroupName={layerGroupName}
                    isInProjection={!!object.projections[projId]}
                    key={object.id}
                    index={i}
                    layerClasses="item productsitem"
                    zot={zots[object.id]}
                    names={getNames(object.id)}
                    checkerBoardPattern={checkerBoardPattern}
                    isDisabled={!available(object.id)}
                    isVisible={object.visible}
                    runningObject={
                      runningLayers && runningLayers[object.id]
                        ? runningLayers[object.id]
                        : null
                    }
                  />
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }
}
LayerList.propTypes = {
  activeLayers: PropTypes.array,
  available: PropTypes.func,
  checkerBoardPattern: PropTypes.object,
  getNames: PropTypes.func,
  groupId: PropTypes.string,
  layerGroupName: PropTypes.string,
  layers: PropTypes.array,
  layerSplit: PropTypes.number,
  projId: PropTypes.string,
  renderedPalettes: PropTypes.string,
  reorderLayers: PropTypes.func,
  runningLayers: PropTypes.object,
  title: PropTypes.string,
  zots: PropTypes.object,
};

function mapStateToProps(state, ownProps) {
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
}

const mapDispatchToProps = (dispatch) => ({
  reorderLayers: (newLayerArray) => {
    dispatch(reorderLayers(newLayerArray));
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerList);
