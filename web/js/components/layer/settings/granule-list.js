import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Scrollbar from '../../util/scrollbar';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const gridConstant = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  padding: gridConstant * 2,
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

  onDragEnd = (result) => {
    const { items } = this.state;
    const { addGranuleLayerDates, def } = this.props;

    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const reorderedItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );
    addGranuleLayerDates(items, def.id);
    this.setState({
      items: reorderedItems
    });
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
        <h2 className="wv-header">Granule Layer Date Order</h2>
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
                          {item} - {index}
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
  addGranuleLayerDates: PropTypes.func,
  def: PropTypes.object,
  granuleDates: PropTypes.array
};

export default GranuleLayerDateList;
