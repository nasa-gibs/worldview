import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from 'reactstrap';
import Scrollbar from '../../util/scrollbar';

const gridConstant = 8;

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, isHover, isLastMovedItem, draggableStyle) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  userSelect: 'none',
  paddingLeft: gridConstant / 2,
  height: gridConstant * 3,
  margin: `0 0 ${gridConstant}px 0`,
  background: isDragging ? '#00457B' : isHover ? '#0087f1' : 'grey',
  outline: isLastMovedItem ? '3px solid #007BFF' : 'none',
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
      hoveredItem: null,
      lastMovedItem: null,
      sorted: true,
      items: this.props.granuleDates
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
    // this.setItems(reorderedItems);
  }

  // move granule item to top of list
  moveToTop = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    const { updateGranuleLayerDates, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      0
    );
    updateGranuleLayerDates(reorderedItems, def.id);
    // this.setItems(reorderedItems);
    this.setState({
      lastMovedItem: granuleDate
    });
  }


    // move granule item to top of list
    moveUp = (e, sourceIndex, granuleDate) => {
      e.preventDefault();
      const { updateGranuleLayerDates, def } = this.props;
      const reorderedItems = this.reorderItems(
        sourceIndex,
        sourceIndex - 1
      );
      updateGranuleLayerDates(reorderedItems, def.id);
      this.setState({
        lastMovedItem: granuleDate
      });
    }


      // move granule item to top of list
    moveDown = (e, sourceIndex, granuleDate) => {
      e.preventDefault();
      const { updateGranuleLayerDates, def } = this.props;
      const reorderedItems = this.reorderItems(
        sourceIndex,
        sourceIndex + 1
      );
      updateGranuleLayerDates(reorderedItems, def.id);
      this.setState({
        lastMovedItem: granuleDate
      });
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

  // handle mouse over item
  handleMouseOverItem = (granuleDate, index) => {

    this.setState({
      hoveredItem: granuleDate
    });
  }

  // handle mouse leave item
  handleMouseLeaveItem = (granuleDate, index) => {

    this.setState({
      hoveredItem: null
    });
  }

  // determine if grnaule dates are in order - used for RESET button toggle
  checkGranuleDateSorting = (granuleDates) => {
    let sorted = true;
    for (let i = 0; i < granuleDates.length - 1; i++) {
      if (granuleDates[i] < granuleDates[i + 1]) {
        sorted = false;
        break;
      }
    }
    if (this.state.sorted !== sorted) {
      this.setState({
        sorted
      });
    }
  }

  componentDidMount() {
    const { granuleDates } = this.props;
    this.setItems(granuleDates);
    this.checkGranuleDateSorting(granuleDates);
  }

  componentDidUpdate(prevProps) {
    const { granuleDates } = this.props;
    if (JSON.stringify(granuleDates) !== JSON.stringify(prevProps.granuleDates)) {
      this.setItems(granuleDates);
      this.checkGranuleDateSorting(granuleDates);
    }
  }

  render() {
    const { items, sorted } = this.state;
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
            <Button onClick={(e) => this.onClickReset(e)}
              block={false} style={{ lineHeight: '6px' }}
              disabled={sorted}
              color={sorted ? 'secondary' : 'primary'}>
              RESET
            </Button>
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
                        <div className="granule-date-item"
                          onMouseEnter={() => this.handleMouseOverItem(item, index)}
                          onMouseLeave={() => this.handleMouseLeaveItem(item, index)}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            this.state.hoveredItem === item,
                            this.state.lastMovedItem === item,
                            provided.draggableProps.style
                          )}
                        >
                          <div>
                            {item}
                          </div>
                          <div>
                            {index < items.length - 1
                              ? <button
                                style={{ background: '#555', color: '#eee' }}
                                onClick={(e) => this.moveDown(e, index, item)}>
                                {'\u2BC6'}
                              </button>
                              : null
                            }
                            {index > 0
                              ? <button
                                style={{ background: '#555', color: '#eee' }}
                                onClick={(e) => this.moveUp(e, index, item)}>
                                {'\u2BC5'}
                              </button>
                              : null
                            }
                            {index > 0
                              ? <button
                                style={{ background: '#555', color: '#eee' }}
                                onClick={(e) => this.moveToTop(e, index, item)}>
                                  TOP
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
