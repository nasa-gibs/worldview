import React from 'react';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import lodashFind from 'lodash/find';
import googleTagManager from 'googleTagManager';

class Event extends React.Component {
  /**
   * Return date list for selected event
   */
  getDateLists() {
    const { event, selectedDate } = this.props;
    if (event.geometries.length > 1) {
      return (
        <ul
          className="dates"
          style={!selectedDate ? { display: 'none' } : { display: 'block' }}
        >
          {event.geometries.map((geometry, index) => {
            var date = geometry.date.split('T')[0];
            return (
              <li key={event.id + '-' + date} className="dates">
                <a
                  onClick={this.onClick.bind(this, date, null)}
                  className={
                    selectedDate === date
                      ? 'date item-selected active'
                      : 'date item-selected '
                  }
                >
                  {date}
                </a>
              </li>
            );
          })}
        </ul>
      );
    }
  }
  /**
   *
   * @param {String} date | Date of event clicked
   * @param {Boolean} isSelected | Is this event already selected
   * @param {Object} e | Event Object
   */
  onClick(date, isSelected, e) {
    e.preventDefault();
    e.stopPropagation();
    const { selectEvent, event, deselectEvent } = this.props;
    if (isSelected) {
      deselectEvent();
    } else {
      selectEvent(event.id, date);
      googleTagManager.pushEvent({
        event: 'natural_event_selected',
        natural_events: {
          category: event.categories[0].title
        }
      });
    }
  }
  /**
   * Return reference list for an event
   */
  getReferenceList() {
    const { sources, event, selectedDate } = this.props;
    if (!selectedDate) return;
    const references = Array.isArray(event.sources)
      ? event.sources
      : [event.sources];
    if (references.length > 0) {
      return references.map(reference => {
        const source = lodashFind(sources, {
          id: reference.id
        });
        if (reference.url) {
          return (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="natural-event-link"
              href={reference.url}
              key={event.id + '-' + reference.id}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <i className="fa fa-external-link-alt fa-1" />{' '}
              {' ' + source.title}
            </a>
          );
        } else {
          return source.title + ' ';
        }
      });
    }
  }
  render() {
    const { event, selectedDate, isVisible } = this.props;
    const eventDate = util.parseDateUTC(event.geometries[0].date);
    var dateString =
      util.giveWeekDay(eventDate) +
      ', ' +
      util.giveMonth(eventDate) +
      ' ' +
      eventDate.getUTCDate();
    if (eventDate.getUTCFullYear() !== util.today().getUTCFullYear()) {
      dateString += ', ' + eventDate.getUTCFullYear();
    }
    return (
      <li
        className={
          selectedDate
            ? 'item-selected selectorItem item item-visible'
            : isVisible
              ? 'selectorItem item'
              : 'selectorItem item hidden'
        }
        onClick={this.onClick.bind(this, null, !!selectedDate)}
        id={'sidebar-event-' + util.encodeId(event.id)}
      >
        <i
          className={'event-icon event-icon-' + event.categories[0].slug}
          title={event.categories[0].title}
        />
        <h4
          className="title"
          dangerouslySetInnerHTML={{
            __html: event.title + '<br />' + dateString
          }}
        />
        <p className="subtitle">{this.getReferenceList()}</p>

        {this.getDateLists()}
      </li>
    );
  }
}
Event.propTypes = {
  event: PropTypes.object,
  selectedDate: PropTypes.string,
  isVisible: PropTypes.bool,
  deselectEvent: PropTypes.func,
  selectEvent: PropTypes.func,
  sources: PropTypes.array
};

export default Event;
