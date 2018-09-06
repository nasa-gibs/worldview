import React from 'react';
import PropTypes from 'prop-types';
import Layer from './layer';
import { SidebarContext } from '../provider';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import lodashIsEqual from 'lodash/isEqual';

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
  }
  componentWillReceiveProps(props) {
    if (!lodashIsEqual(props.layers, this.state.layers)) {
      this.setState({ layers: props.layers });
    }
  }
  /**
   * Get Palette and setState with promise results when palette is retrieved
   * @param {Object} layer | Layer
   * @param {Function} palettePromise | Retrieve palette
   */
  getPalette(layer, palettePromise) {
    if (this.state.palettes[layer.id]) {
      return this.state.palettes[layer.id];
    } else if (layer.palette) {
      palettePromise(layer.id).then(palette => {
        var palettes = this.state.palettes;
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
    const { layerGroupName, groupId } = this.props;
    const { layers } = this.state;
    if (!result.destination) {
      return;
    }
    if (result.source.index === result.destination.index) {
      return;
    }

    const newLayerArray = reorder(
      layers,
      result.source.index,
      result.destination.index
    );

    replaceSubGroup(newLayerArray, layerGroupName, groupId);
    this.setState({ layers: newLayerArray });
  }
  render() {
    const { groupId, title, layerGroupName } = this.props;
    const { layers } = this.state;
    return (
      <SidebarContext.Consumer>
        {context => (
          <div className="layer-group-case">
            <h3 className="head">{title}</h3>
            <DragDropContext
              onDragEnd={this.onDragEnd.bind(this, context.replaceSubGroup)}
            >
              <Droppable
                droppableId={layerGroupName + '-' + groupId}
                type="layerSubGroup"
                direction="vertical"
              >
                {(provided, snapshot) => {
                  return (
                    <ul
                      id={groupId}
                      className="category"
                      ref={provided.innerRef}
                    >
                      {layers.map((object, i) => {
                        return object.projections[context.projection] ? (
                          <Layer
                            layer={object}
                            groupId={groupId}
                            layerGroupName={layerGroupName}
                            getLegend={context.getLegend}
                            key={i}
                            index={i}
                            layerClasses="item productsitem"
                            zot={
                              context.zotsObject[object.id]
                                ? context.zotsObject[object.id].value
                                : null
                            }
                            isMobile={context.isMobile}
                            names={context.getNames(object.id)}
                            checkerBoardPattern={context.checkerBoardPattern}
                            palette={this.getPalette(
                              object,
                              context.palettePromise
                            )}
                            isDisabled={
                              !context.getAvailability(
                                object.id,
                                undefined,
                                layerGroupName
                              )
                            }
                            isVisible={object.visible}
                            updateLayer={context.updateLayer}
                            runningObject={
                              context.runningLayers &&
                              context.runningLayers[object.id]
                                ? context.runningLayers[object.id]
                                : null
                            }
                          />
                        ) : (
                          ''
                        );
                      })}
                      {provided.placeholder}
                    </ul>
                  );
                }}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </SidebarContext.Consumer>
    );
  }
}
LayerList.propTypes = {
  layers: PropTypes.array,
  groupId: PropTypes.string,
  title: PropTypes.string,
  layerGroupName: PropTypes.string
};

export default LayerList;
