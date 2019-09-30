import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Scrollbar from '../../util/scrollbar';

const gridConstant = 8;

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  userSelect: 'none',
  padding: gridConstant / 2,
  height: gridConstant * 3,
  margin: `0 0 ${gridConstant}px 0`,
  background: isDragging ? '#00457B' : 'grey',
  ...draggableStyle
});

const getListStyle = needsScrollBar => ({
  background: '#CCCCCC',
  marginTop: '2px',
  padding: gridConstant,
  width: needsScrollBar ? '262px' : '100%'
});

class GranuleLayerDateList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      items: this.props.granuleDates
      // items: ["2019-01-01T23:06:00Z", "2019-01-01T23:00:00Z", "2019-01-01T22:54:00Z", "2019-01-01T22:48:00Z", "2019-01-01T22:42:00Z", "2019-01-01T22:36:00Z", "2019-01-01T22:30:00Z", "2019-01-01T22:24:00Z", "2019-01-01T22:18:00Z", "2019-01-01T22:12:00Z", "2019-01-01T22:06:00Z", "2019-01-01T22:00:00Z", "2019-01-01T21:54:00Z", "2019-01-01T21:48:00Z", "2019-01-01T21:42:00Z", "2019-01-01T21:36:00Z", "2019-01-01T21:30:00Z", "2019-01-01T21:24:00Z", "2019-01-01T21:18:00Z", "2019-01-01T21:12:00Z", "2019-01-01T21:06:00Z"]
    };
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  // handle update on complete granule item drag
  onDragEnd = (result) => {
    const { updateGranuleLayerDates, def } = this.props;
    // dropped granule outside the list
    if (!result.destination) {
      return;
    }
    const reorderedItems = this.reorderItems(
      result.source.index,
      result.destination.index
    );
    updateGranuleLayerDates(reorderedItems, def.id);
    this.setItems(reorderedItems);
  }

  // move granule item to top of list
  moveToTop = (e, sourceIndex) => {
    e.preventDefault();
    const { updateGranuleLayerDates, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      0
    );
    updateGranuleLayerDates(reorderedItems, def.id);
    this.setItems(reorderedItems);
  }

  // reorder granule items based on source and target index
  reorderItems = (sourceIndex, destinationIndex) => {
    const { items } = this.state;
    const reorderedItems = reorder(
      items,
      sourceIndex,
      destinationIndex
    );
    return reorderedItems;
  }

  // reset granule order
  onClickReset = (e) => {
    e.preventDefault();
    const { resetGranuleLayerDates, def } = this.props;
    resetGranuleLayerDates(def.id);
  }

  // set local granule item state
  setItems = (items) => {
    this.setState({
      items: items
    });
  }

  componentDidMount() {
    this.setItems(this.props.granuleDates);
  }

  componentDidUpdate() {
    this.setItems(this.props.granuleDates);
  }

  render() {
    const { items } = this.state;
    const { def } = this.props;
    const maxNumItemsNoScrollNeeded = 8;
    const granuleDateLength = items.length;
    const needsScrollBar = granuleDateLength > maxNumItemsNoScrollNeeded;
    const droppableId = `droppable-granule-date-list-${def.id}`;
    return (
      <div className="layer-granule-date-draggable-list">
        <h2 className="wv-header">
          Granule Layer Date Order
          <span style={{ float: 'right' }}>
            <button onClick={(e) => this.onClickReset(e)}>RESET</button>
          </span>
        </h2>
        <Scrollbar style={{ maxHeight: '500px' }} needsScrollBar={needsScrollBar} >
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable droppableId={droppableId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={getListStyle(needsScrollBar)}
                >
                  {items.map((item, index) => (
                    <Draggable key={item} draggableId={item} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                        >
                          <div>
                            {item}
                          </div>
                          <div>
                            {index > 0
                              ? <button
                                style={{ background: '#555', color: '#eee' }}
                                onClick={(e) => this.moveToTop(e, index)}>
                                  TO TOP
                              </button>
                              : null
                            }
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Scrollbar>
      </div>
    );
  }
}

GranuleLayerDateList.propTypes = {
  def: PropTypes.object,
  granuleDates: PropTypes.array,
  resetGranuleLayerDates: PropTypes.func,
  updateGranuleLayerDates: PropTypes.func
};

export default GranuleLayerDateList;
