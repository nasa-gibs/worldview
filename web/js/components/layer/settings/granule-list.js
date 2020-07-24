import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleUp, faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
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
  outline: isLastMovedItem ? '4px solid #007BFF' : 'none',
  ...draggableStyle,
});

const getListStyle = (needsScrollBar) => ({
  background: '#CCCCCC',
  marginTop: '2px',
  padding: gridConstant,
  width: needsScrollBar ? '262px' : '100%',
});

class GranuleLayerDateList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hoveredItem: null,
      lastMovedItem: null,
      sorted: true,
      items: [],
    };
    this.onDragEnd = this.onDragEnd.bind(this);
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

  // handle update on complete granule item drag
  onDragEnd = (result) => {
    const { updateGranuleLayerDates, granuleCount, def } = this.props;
    // dropped granule outside the list
    if (!result.destination) {
      return;
    }
    const reorderedItems = this.reorderItems(
      result.source.index,
      result.destination.index,
    );
    updateGranuleLayerDates(reorderedItems, def.id, granuleCount);
    this.setState({
      lastMovedItem: result.draggableId, // granule date
    });
  }

  // move granule item to top of list
  moveToTop = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    const { updateGranuleLayerDates, granuleCount, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      0,
    );
    updateGranuleLayerDates(reorderedItems, def.id, granuleCount);
    this.setState({
      lastMovedItem: granuleDate,
    });
  }

  // move granule item to top of list
  moveUp = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    const { updateGranuleLayerDates, granuleCount, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      sourceIndex - 1,
    );
    updateGranuleLayerDates(reorderedItems, def.id, granuleCount);
    this.setState({
      lastMovedItem: granuleDate,
    });
  }

  // move granule item to top of list
  moveDown = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    const { updateGranuleLayerDates, granuleCount, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      sourceIndex + 1,
    );
    updateGranuleLayerDates(reorderedItems, def.id, granuleCount);
    this.setState({
      lastMovedItem: granuleDate,
    });
  }

  // reorder granule items based on source and target index
  reorderItems = (sourceIndex, destinationIndex) => {
    const { items } = this.state;
    const reorderedItems = reorder(
      items,
      sourceIndex,
      destinationIndex,
    );
    return reorderedItems;
  }

  // reset granule order
  onClickReset = (e) => {
    e.preventDefault();
    const { resetGranuleLayerDates, def } = this.props;
    resetGranuleLayerDates(def.id);
    this.setState({
      lastMovedItem: null,
    });
  }

  // set local granule item state
  setItems = (items) => {
    this.setState({
      items,
    });
  }

  // handle mouse over item
  handleMouseOverItem = (granuleDate) => {
    const { satelliteInstrumentGroup, toggleHoveredGranule } = this.props;
    toggleHoveredGranule(satelliteInstrumentGroup, granuleDate);
    this.setState({
      hoveredItem: granuleDate,
    });
  }

  // handle mouse leave item
  handleMouseLeaveItem = () => {
    const { satelliteInstrumentGroup, toggleHoveredGranule } = this.props;
    toggleHoveredGranule(satelliteInstrumentGroup, null);
    this.setState({
      hoveredItem: null,
    });
  }

  // determine if grnaule dates are in order - used for RESET button toggle
  checkGranuleDateSorting = (granuleDates) => {
    const { sorted } = this.state;
    let isSorted = true;
    for (let i = 0; i < granuleDates.length - 1; i += 1) {
      if (granuleDates[i] < granuleDates[i + 1]) {
        isSorted = false;
        break;
      }
    }
    if (sorted !== isSorted) {
      this.setState({
        sorted: isSorted,
      });
    }
  }

  render() {
    const {
      items,
      sorted,
      hoveredItem,
      lastMovedItem,
    } = this.state;
    const { def, screenHeight } = this.props;
    const maxNumItemsNoScrollNeeded = 8;
    const granuleDateLength = items.length;
    const needsScrollBar = granuleDateLength > maxNumItemsNoScrollNeeded;
    const scrollBarMaxHeight = `${screenHeight - 490}px`;
    const droppableId = `droppable-granule-date-list-${def.id}`;
    return (
      <div className="layer-granule-date-draggable-list" style={{ paddingLeft: '4px', marginBottom: '14px' }}>
        <h2 className="wv-header">
          Granule Layer Date Order
          <span style={{ float: 'right' }}>
            <Button
              onClick={(e) => this.onClickReset(e)}
              className="granule-list-reset-button"
              block={false}
              style={{ lineHeight: '6px' }}
              disabled={sorted}
              color={sorted ? 'secondary' : 'primary'}
            >
              RESET
            </Button>
          </span>
        </h2>
        {items.length > 0
          ? (
            <Scrollbar style={{ maxHeight: scrollBarMaxHeight }} needsScrollBar={needsScrollBar}>
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
                              className="granule-date-item"
                              onMouseEnter={() => this.handleMouseOverItem(item)}
                              onMouseLeave={() => this.handleMouseLeaveItem()}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={getItemStyle(
                                snapshot.isDragging,
                                hoveredItem === item,
                                lastMovedItem === item,
                                provided.draggableProps.style,
                              )}
                            >
                              <div>
                                {item}
                              </div>
                              <div>
                                {index < items.length - 1
                                  ? (
                                    <button
                                      type="button"
                                      className="granule-date-item-down-button"
                                      onClick={(e) => this.moveDown(e, index, item)}
                                    >
                                      <FontAwesomeIcon icon={faArrowCircleDown} fixedWidth />
                                    </button>
                                  )
                                  : null}
                                {index > 0
                                  ? (
                                    <button
                                      type="button"
                                      className="granule-date-item-up-button"
                                      onClick={(e) => this.moveUp(e, index, item)}
                                    >
                                      <FontAwesomeIcon icon={faArrowCircleUp} fixedWidth />
                                    </button>
                                  )
                                  : null}
                                {index > 0
                                  ? (
                                    <button
                                      type="button"
                                      className="granule-date-item-top-button"
                                      onClick={(e) => this.moveToTop(e, index, item)}
                                    >
                                      TOP
                                    </button>
                                  )
                                  : null}
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
          )
          : (
            <>
              <div style={{ marginBottom: '14px', color: '#a0a0a0' }}>
                <p className="granule-date-item-no-granules-available">No granules available.</p>
                <br />
              </div>
            </>
          )}
      </div>
    );
  }
}

GranuleLayerDateList.propTypes = {
  def: PropTypes.object,
  granuleCount: PropTypes.number,
  granuleDates: PropTypes.array,
  resetGranuleLayerDates: PropTypes.func,
  satelliteInstrumentGroup: PropTypes.string,
  screenHeight: PropTypes.number,
  toggleHoveredGranule: PropTypes.func,
  updateGranuleLayerDates: PropTypes.func,
};

export default GranuleLayerDateList;
