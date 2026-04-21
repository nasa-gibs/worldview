/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleUp, faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import util from '../../../util/util';
import { GRANULE_HOVERED } from '../../../util/constants';

const { events } = util;

const itemHeight = 30;
const itemMargin = 2;

const getItemStyle = (isDragging, isHover, isLastMovedItem, sortableStyle) => ({
  userSelect: 'none',
  height: itemHeight,
  marginBottom: itemMargin,
  outline: isLastMovedItem ? '1px solid #007BFF' : 'none',
  border: isHover ? '1px solid #eee' : '1px solid #666',
  ...sortableStyle,
  zIndex: isDragging ? 1 : undefined,
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

const checkGranuleDateSorting = (granuleDates) => {
  const dates = granuleDates || [];
  for (let i = 0; i < dates.length - 1; i += 1) {
    if (dates[i] < dates[i + 1]) {
      return false;
    }
  }
  return true;
};

function SortableGranuleItem(props) {
  const {
    date,
    index,
    itemsLength,
    hoveredItem,
    lastMovedItem,
    onMouseEnter,
    onMouseLeave,
    onMoveUp,
    onMoveDown,
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: date });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderDownBtn = () => index < itemsLength - 1 && (
    <button
      type="button"
      className="granule-date-item-down-button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => onMoveDown(e, index, date)}
    >
      <FontAwesomeIcon icon={faArrowCircleDown} fixedWidth widthAuto />
    </button>
  );
  const renderUpBtn = () => index > 0 && (
    <button
      type="button"
      className="granule-date-item-up-button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => onMoveUp(e, index, date)}
    >
      <FontAwesomeIcon icon={faArrowCircleUp} fixedWidth widthAuto />
    </button>
  );

  return (
    <div
      className="granule-date-item"
      onMouseEnter={() => onMouseEnter(date)}
      onMouseLeave={() => onMouseLeave()}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={getItemStyle(
        isDragging,
        hoveredItem === date,
        lastMovedItem === date,
        sortableStyle,
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
  );
}

function GranuleDateList(props) {
  const {
    def,
    granuleCount,
    granuleDates,
    resetGranuleLayerDates,
    granulePlatform,
    screenHeight,
    updateGranuleLayerOptions,
  } = props;

  const [hoveredItem, setHoveredItem] = useState(null);
  const [lastMovedItem, setLastMovedItem] = useState(null);
  const [sorted, setSorted] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const newItems = granuleDates || [];
    setItems(newItems);
    setSorted(checkGranuleDateSorting(newItems));
  }, [granuleDates]);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceIndex = items.indexOf(active.id);
    const destinationIndex = items.indexOf(over.id);
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) return;

    const reorderedItems = arrayMove(items, sourceIndex, destinationIndex);
    setItems(reorderedItems);
    setSorted(checkGranuleDateSorting(reorderedItems));
    updateGranuleLayerOptions(reorderedItems, def, granuleCount);
    setLastMovedItem(active.id);
  };

  const moveUp = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    if (sourceIndex <= 0) return;
    const reorderedItems = arrayMove(items, sourceIndex, sourceIndex - 1);
    setItems(reorderedItems);
    setSorted(checkGranuleDateSorting(reorderedItems));
    updateGranuleLayerOptions(reorderedItems, def, granuleCount);
    setLastMovedItem(granuleDate);
  };

  const moveDown = (e, sourceIndex, granuleDate) => {
    e.preventDefault();
    if (sourceIndex >= items.length - 1) return;
    const reorderedItems = arrayMove(items, sourceIndex, sourceIndex + 1);
    setItems(reorderedItems);
    setSorted(checkGranuleDateSorting(reorderedItems));
    updateGranuleLayerOptions(reorderedItems, def, granuleCount);
    setLastMovedItem(granuleDate);
  };

  const onClickReset = (e) => {
    e.preventDefault();
    resetGranuleLayerDates(def.id);
    setLastMovedItem(null);
  };

  const handleMouseOverItem = (granuleDate) => {
    events.trigger(GRANULE_HOVERED, granulePlatform, granuleDate);
    setHoveredItem(granuleDate);
  };

  const handleMouseLeaveItem = () => {
    events.trigger(GRANULE_HOVERED, granulePlatform, null);
    setHoveredItem(null);
  };

  const maxNumItemsNoScrollNeeded = 8;
  const needsScrollBar = items.length > maxNumItemsNoScrollNeeded;
  const listStyle = useMemo(
    () => getListStyle(needsScrollBar, items, screenHeight),
    [needsScrollBar, items, screenHeight],
  );

  return (
    <div className="layer-granule-date-draggable-list" style={{ paddingLeft: '4px', marginBottom: '14px' }}>
      <h2 className="wv-header">
        Granule Layer Date Order
        <span style={{ float: 'right' }}>
          <Button
            onClick={(e) => onClickReset(e)}
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
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div style={listStyle}>
                {items.map((date, index) => (
                  <SortableGranuleItem
                    key={date}
                    date={date}
                    index={index}
                    itemsLength={items.length}
                    hoveredItem={hoveredItem}
                    lastMovedItem={lastMovedItem}
                    onMouseEnter={handleMouseOverItem}
                    onMouseLeave={handleMouseLeaveItem}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

GranuleDateList.propTypes = {
  def: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  granuleCount: PropTypes.number,
  granuleDates: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  resetGranuleLayerDates: PropTypes.func,
  granulePlatform: PropTypes.string,
  screenHeight: PropTypes.number,
  updateGranuleLayerOptions: PropTypes.func,
};

export default GranuleDateList;

SortableGranuleItem.propTypes = {
  date: PropTypes.string,
  index: PropTypes.number,
  itemsLength: PropTypes.number,
  hoveredItem: PropTypes.string,
  lastMovedItem: PropTypes.string,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
};
