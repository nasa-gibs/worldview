import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import lodashFind from 'lodash/find';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getDefaultEventDate } from '../../modules/natural-events/util';
import util from '../../util/util';
import EventIcon from './event-icon';
import { formatDisplayDate } from '../../modules/date/util';
import MonospaceDate from '../util/monospace-date';

function Event (props) {
  const {
    deselectEvent,
    event,
    isSelected,
    selectedDate,
    selectEvent,
    sources,
  } = props;
  const dateString = formatDisplayDate(event.geometry[0].date);
  const itemClass = isSelected
    ? 'item-selected event item'
    : 'event item';

  const elRef = useRef();
  useLayoutEffect(() => {
    setTimeout(() => {
      if (!elRef || !elRef.current || !isSelected) return;
      elRef.current.scrollIntoView();
    });
  }, [isSelected]);

  /**
   *
   * @param {String} date | Date of event clicked
   * @param {Boolean} isSelected | Is this event already selected
   * @param {Object} e | Event Object
   */
  function onEventSelect(date) {
    if (isSelected && (!date || date === selectedDate)) {
      deselectEvent();
    } else {
      const selectedEventDate = date || getDefaultEventDate(event);
      selectEvent(event.id, selectedEventDate);
      googleTagManager.pushEvent({
        event: 'natural_event_selected',
        natural_events: {
          category: event.categories[0].title,
        },
      });
    }
  }

  /**
   *
   * @param {Object} geometry | Geometry object containing magnitude data
   * @returns Magnitude data output
   */
  function magnitudeOutput({ magnitudeUnit = null, magnitudeValue = null }) {
    const unit = magnitudeUnit || null;
    let value = magnitudeValue ? magnitudeValue.toLocaleString() : null;
    if (!unit && !value) return;

    const formattedunit = unit === 'kts' ? ' kts' : ' NM';
    value = value.toLocaleString();
    return (
      <p className="magnitude">

        {formattedunit === ' NM' ? 'Surface Area: ' : 'Wind Speed: '}
        {value}
        {formattedunit}
        {formattedunit === ' NM' && (
          <sup>2</sup>
        )}
      </p>
    );
  }

  /**
   * Return date list for selected event
   */
  function renderDateLists() {
    if (event.geometry.length > 1) {
      return (
        <ul
          className="dates"
          style={!isSelected ? { display: 'none' } : { display: 'block' }}
        >
          {event.geometry.map((geometry, index) => {
            const date = util.toISOStringDate(geometry.date);
            return (
              <li key={`${event.id}-${date}`} className="dates">
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventSelect(date);
                  }}
                  className={
                    selectedDate === date
                      ? 'date item-selected active'
                      : 'date item-selected '
                  }
                >
                  {formatDisplayDate(date)}
                </a>
                {magnitudeOutput(geometry)}
              </li>
            );
          })}
        </ul>
      );
    }
  }

  /**
   * Return reference list for an event
   */
  function renderReferenceList() {
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
              <FontAwesomeIcon icon="external-link-alt" />
              {` ${source.title}`}
            </a>
          );
        }
        return `${source.title} `;
      });
    }
  }

  return (
    <li
      id={`sidebar-event-${util.encodeId(event.id)}`}
      ref={(node) => { elRef.current = node; }}
      className={itemClass}
      onClick={(e) => {
        e.stopPropagation();
        onEventSelect();
      }}
    >
      <EventIcon id={`${event.id}-list`} category={event.categories[0].title} />
      <h4
        className="title"
      >
        {event.title}
        {' '}
        <br />
        {' '}
        {!isSelected && (
          <MonospaceDate date={dateString} />
        )}
      </h4>
      {isSelected && (<p className="subtitle">{renderReferenceList()}</p>)}
      {renderDateLists()}
    </li>
  );
}

Event.propTypes = {
  deselectEvent: PropTypes.func,
  event: PropTypes.object,
  isSelected: PropTypes.bool,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  sources: PropTypes.array,
};

export default Event;
