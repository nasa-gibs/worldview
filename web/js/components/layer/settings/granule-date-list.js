/* eslint-disable react/jsx-props-no-spreading */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleUp, faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import util from '../../../util/util';
import { GRANULE_HOVERED } from '../../../util/constants';

const { events } = util;

const itemHeight = 30;
const itemMargin = 2;

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, isHover, isLastMovedItem, draggableStyle) => ({
  userSelect: 'none',
  height: itemHeight,
  marginBottom: itemMargin,
  outline: isLastMovedItem ? '1px solid #007BFF' : 'none',
  border: isHover ? '1px solid #eee' : '1px solid #666',
  ...draggableStyle,
});

const getListStyle = (needsScrollBar, items, screenHeight) => {
  const height = items.length * (itemHeight + itemMargin) + 15;
  const maxHeight = screenHeight - 490;

  return {
    background: 'transparent',
    marginTop: '2px',
    padding: '2px',
    width: '265px',
    height,
    maxHeight,
    overflowY: 'scroll',
    overflowX: 'hidden',
  };
};

class GranuleDateList extends PureComponent {
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
    const { updateGranuleLayerOptions, granuleCount, def } = this.props;
    // dropped granule outside the list
    if (!result.destination) {
      return;
    }
    const reorderedItems = this.reorderItems(
      result.source.index,
      result.destination.index,
    );
    updateGranuleLayerOptions(reorderedItems, def, granuleCount);
    this.setState({
      lastMovedItem: result.draggableId, // granule date
    });
  };

  // move granule item to top of list
  moveUp = (e, sourceIndex, granuleDate) => {
    console.log('uhh');
    e.preventDefault();
    const { updateGranuleLayerOptions, granuleCount, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      sourceIndex - 1,
    );
    updateGranuleLayerOptions(reorderedItems, def, granuleCount);
    this.setState({
      lastMovedItem: granuleDate,
    });
  };

  // move granule item to top of list
  moveDown = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    const { updateGranuleLayerOptions, granuleCount, def } = this.props;
    const reorderedItems = this.reorderItems(
      sourceIndex,
      sourceIndex + 1,
    );
    updateGranuleLayerOptions(reorderedItems, def, granuleCount);
    this.setState({
      lastMovedItem: granuleDate,
    });
  };

  // reorder granule items based on source and target index
  reorderItems = (sourceIndex, destinationIndex) => {
    const { items } = this.state;
    const reorderedItems = reorder(
      items,
      sourceIndex,
      destinationIndex,
    );
    return reorderedItems;
  };

  // reset granule order
  onClickReset = (e) => {
    e.preventDefault();
    const { resetGranuleLayerDates, def } = this.props;
    resetGranuleLayerDates(def.id);
    this.setState({
      lastMovedItem: null,
    });
  };

  // set local granule item state
  setItems = (items) => {
    this.setState({
      items,
    });
  };

  // handle mouse over item
  handleMouseOverItem = (granuleDate) => {
    const { granulePlatform } = this.props;
    events.trigger(GRANULE_HOVERED, granulePlatform, granuleDate);
    this.setState({
      hoveredItem: granuleDate,
    });
  };

  // handle mouse leave item
  handleMouseLeaveItem = () => {
    const { granulePlatform } = this.props;
    events.trigger(GRANULE_HOVERED, granulePlatform, null);
    this.setState({
      hoveredItem: null,
    });
  };

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
  };

  renderDraggableGranule = (date, index) => {
    const {
      items,
      hoveredItem,
      lastMovedItem,
    } = this.state;
    const renderDownBtn = () => index < items.length - 1 && (
      <button
        type="button"
        className="granule-date-item-down-button"
        onClick={(e) => this.moveDown(e, index, date)}
      >
        <FontAwesomeIcon icon={faArrowCircleDown} fixedWidth />
      </button>
    );
    const renderUpBtn = () => index > 0 && (
      <button
        type="button"
        className="granule-date-item-up-button"
        onClick={(e) => this.moveUp(e, index, date)}
      >
        <FontAwesomeIcon icon={faArrowCircleUp} fixedWidth />
      </button>
    );

    return (
      <Draggable
        key={date}
        draggableId={date}
        index={index}
        direction="vertical"
      >
        {(provided, snapshot) => (
          <div
            className="granule-date-item"
            onMouseEnter={() => this.handleMouseOverItem(date)}
            onMouseLeave={() => this.handleMouseLeaveItem()}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getItemStyle(
              snapshot.isDragging,
              hoveredItem === date,
              lastMovedItem === date,
              provided.draggableProps.style,
            )}
          >
            <div className="granule-date monospace">
              {date}
            </div>
            <div className="granule-date-buttons">
              {renderDownBtn()}
              {renderUpBtn()}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  render() {
    const { items, sorted } = this.state;
    const { screenHeight, def } = this.props;
    const maxNumItemsNoScrollNeeded = 8;
    const granuleDateLength = items.length;
    const needsScrollBar = granuleDateLength > maxNumItemsNoScrollNeeded;
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

            <DragDropContext onDragEnd={this.onDragEnd}>
              <Droppable
                droppableId={droppableId}
                direction="vertical"
                type="granule"
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    style={getListStyle(needsScrollBar, items, screenHeight)}
                    {...provided.droppableProps}
                  >
                    {items.map(this.renderDraggableGranule)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

          )
          : (
            <div style={{ marginBottom: '14px', color: '#a0a0a0' }}>
              <p className="granule-date-item-no-granules-available">No granules available.</p>
              <br />
            </div>
          )}
      </div>
    );
  }
}

GranuleDateList.propTypes = {
  def: PropTypes.object,
  granuleCount: PropTypes.number,
  granuleDates: PropTypes.array,
  resetGranuleLayerDates: PropTypes.func,
  granulePlatform: PropTypes.string,
  screenHeight: PropTypes.number,
  toggleHoveredGranule: PropTypes.func,
  updateGranuleLayerOptions: PropTypes.func,
};

export default GranuleDateList;
