import React from 'react';
import PropTypes from 'prop-types';
// import { Scrollbars } from 'react-custom-scrollbars';
import Event from './event';
import Scrollbars from '../../util/scrollbar';

class Events extends React.Component {
  render() {
    const {
      events,
      selectEvent,
      selectedEvent,
      visibleEvents,
      sources,
      height,
      deselectEvent,
      tabTypes
    } = this.props;
    if (!tabTypes.events) return null;
    return (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div id="wv-events">
          <span
            className="events-loading-text"
            style={!events.length ? { display: 'block' } : { display: 'none' }}
          >
            Loading...
          </span>
          <div
            className="wv-eventslist sidebar-panel"
            style={events.length ? { display: 'block' } : { display: 'none' }}
          >
            <ul id="wv-eventscontent" className="content map-item-list">
              {events.map(event => (
                <Event
                  key={event.id}
                  event={event}
                  selectEvent={selectEvent}
                  deselectEvent={deselectEvent}
                  selectedDate={
                    selectedEvent.id === event.id &&
                    (visibleEvents.all || visibleEvents[event.id])
                      ? selectedEvent.date
                      : null
                  }
                  isVisible={visibleEvents.all || visibleEvents[event.id]}
                  sources={sources}
                />
              ))}
            </ul>
          </div>
        </div>
      </Scrollbars>
    );
  }
}
Events.propTypes = {
  events: PropTypes.array,
  sources: PropTypes.array,
  selectEvent: PropTypes.func,
  selectedEvent: PropTypes.object,
  visibleEvents: PropTypes.object,
  height: PropTypes.number,
  deselectEvent: PropTypes.func,
  tabTypes: PropTypes.object
};

export default Events;
