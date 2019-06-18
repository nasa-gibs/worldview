import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Layer from './layer';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import {
  replaceSubGroup,
  getZotsForActiveLayers,
  getTitles,
  available
} from '../../modules/layers/selectors';
import { reorderLayers } from '../../modules/layers/actions';
import { get as lodashGet } from 'lodash';

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
      layers: props.layers
    };
    this.promises = {};
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
    } else if (this.promises[layer.id]) {
      return null;
    } else if (layer.palette) {
      this.promises[layer.id] = true;
      let promise = palettePromise(layer.id);
      promise.then(palette => {
        var palettes = this.state.palettes;
        delete this.promises[layer.id];
        palettes[layer.id] = palette;
        this.setState({
          palettes: palettes
        });
      });
    }
    return null;
  }
  /**
   * Update Layer order after drag
   * @param {Function} replaceSubGroup | Replace a products subgroup (Baselayer or Overlay) with new order
   * @param {Object} result | Result of layer drag
   */
  onDragEnd(replaceSubGroup, result) {
    const {
      layerGroupName,
      groupId,
      reorderLayers,
      layerSplit,
      activeLayers,
      layers
    } = this.props;
    if (!result.destination) {
      return;
    }
    if (result.source.index === result.destination.index) {
      return;
    }
    const regex = new RegExp('-' + layerGroupName + '$');
    const layerId = result.draggableId.replace(regex, '');
    const newLayerArray = reorder(
      layers,
      result.source.index,
      result.destination.index
    );
    // In the new ordering, find the layer right after the layer that just
    // moved. Leave null if moved to the end of the list.
    let nextLayerId = null;
    const nextIndex = result.destination.index + 1;
    if (nextIndex < newLayerArray.length) {
      nextLayerId = newLayerArray[nextIndex].id;
    }
    const newLayers = replaceSubGroup(
      layerId,
      nextLayerId,
      activeLayers,
      groupId,
      layerSplit
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
      available
    } = this.props;
    return (
      <div className="layer-group-case">
        <h3 className="head">{title}</h3>
        <DragDropContext onDragEnd={this.onDragEnd.bind(this, replaceSubGroup)}>
          <Droppable
            droppableId={layerGroupName + '-' + groupId}
            type="layerSubGroup"
            direction="vertical"
          >
            {(provided, snapshot) => {
              return (
                <ul id={groupId} className="category" ref={provided.innerRef}>
                  {layers.map((object, i) => (
                    <Layer
                      layer={object}
                      groupId={groupId}
                      layerGroupName={layerGroupName}
                      isInProjection={!!object.projections[projId]}
                      key={i}
                      index={i}
                      layerClasses="item productsitem"
                      zot={zots[object.id] ? zots[object.id].value : null}
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
              );
            }}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }
}
LayerList.propTypes = {
  layers: PropTypes.array,
  groupId: PropTypes.string,
  title: PropTypes.string,
  layerGroupName: PropTypes.string,
  renderedPalettes: PropTypes.string,
  runningLayers: PropTypes.object,
  projId: PropTypes.string,
  checkerBoardPattern: PropTypes.object,
  getNames: PropTypes.func,
  available: PropTypes.func,
  zots: PropTypes.object,
  reorderLayers: PropTypes.func,
  layerSplit: PropTypes.number,
  activeLayers: PropTypes.array
};
function mapStateToProps(state, ownProps) {
  const {
    layers,
    groupId,
    title,
    layerGroupName,
    checkerBoardPattern,
    layerSplit
  } = ownProps;
  const { proj, compare, config, map } = state;
  const { runningLayers } = state.layers;
  const { id } = proj;
  const activeDateString = compare.isCompareA ? 'selected' : 'selectedB';
  const activeLayers = state.layers[layerGroupName];
  const zots = lodashGet(map, 'ui.selected')
    ? getZotsForActiveLayers(config, proj, map, activeLayers)
    : {};
  return {
    zots,
    layers,
    groupId,
    title,
    layerGroupName,
    activeLayers,
    runningLayers,
    projId: id,
    checkerBoardPattern,
    layerSplit,
    getNames: (layerId, proj) => {
      return getTitles(state.config, layerId, proj, state);
    },
    available: id => {
      const date = state.date[activeDateString];
      return available(id, date, layers, state.config, state);
    }
  };
}
const mapDispatchToProps = dispatch => ({
  reorderLayers: newLayerArray => {
    dispatch(reorderLayers(newLayerArray));
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LayerList);
