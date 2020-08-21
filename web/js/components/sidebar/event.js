import React from 'react';
import PropTypes from 'prop-types';
import lodashFind from 'lodash/find';
import googleTagManager from 'googleTagManager';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import util from '../../util/util';

class Event extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  /**
   * Return date list for selected event
   */
  getDateLists() {
    const { event, isSelected, selectedDate } = this.props;
    if (event.geometry.length > 1) {
      return (
        <ul
          className="dates"
          style={!isSelected ? { display: 'none' } : { display: 'block' }}
        >
          {event.geometry.map((geometry, index) => {
            const date = geometry.date.split('T')[0];
            return (
              <li key={`${event.id}-${date}`} className="dates">
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                    this.onClick(date);
                  }}
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
  onClick(date) {
    const {
      selectEvent,
      event,
      deselectEvent,
      isSelected,
      selectedDate,
    } = this.props;
    if (isSelected && (!date || date === selectedDate)) {
      deselectEvent();
    } else {
      selectEvent(event.id, date);
      googleTagManager.pushEvent({
        event: 'natural_event_selected',
        natural_events: {
          category: event.categories[0].title,
        },
      });
    }
  }

  /**
   * Return reference list for an event
   */
  getReferenceList() {
    const { sources, event, isSelected } = this.props;
    if (!isSelected) return;

    const references = Array.isArray(event.sources)
      ? event.sources
      : [event.sources];
    if (references.length > 0) {
      return references.map((reference) => {
        const source = lodashFind(sources, {
          id: reference.id,
        });
        if (reference.url) {
          return (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="natural-event-link"
              href={reference.url}
              key={`${event.id}-${reference.id}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} />
              {` ${source.title}`}
            </a>
          );
        }
        return `${source.title} `;
      });
    }
  }

  render() {
    const { event, isVisible, isSelected } = this.props;
    const eventDate = util.parseDateUTC(event.geometry[0].date);
    let dateString = `${util.giveWeekDay(eventDate)
    }, ${
      util.giveMonth(eventDate)
    } ${
      eventDate.getUTCDate()}`;
    if (eventDate.getUTCFullYear() !== util.today().getUTCFullYear()) {
      dateString += `, ${eventDate.getUTCFullYear()}`;
    }
    return (
      <li
        className={
          isSelected
            ? 'item-selected selectorItem item item-visible'
            : isVisible
              ? 'selectorItem item'
              : 'selectorItem item hidden'
        }
        onClick={(e) => {
          e.stopPropagation();
          this.onClick();
        }}
        id={`sidebar-event-${util.encodeId(event.id)}`}
      >
        <i
          className={`event-icon event-icon-${event.categories[0].slug}`}
          title={event.categories[0].title}
        />
        <h4
          className="title"
          dangerouslySetInnerHTML={{
            __html: `${event.title}<br />${dateString}`,
          }}
        />
        <p className="subtitle">{this.getReferenceList()}</p>

        {this.getDateLists()}
      </li>
    );
  }
}
Event.propTypes = {
  deselectEvent: PropTypes.func,
  event: PropTypes.object,
  isSelected: PropTypes.bool,
  isVisible: PropTypes.bool,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  sources: PropTypes.array,
};

export default Event;
