import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import lodashFind from 'lodash/find';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import googleTagManager from 'googleTagManager';
import { getDefaultEventDate } from '../../modules/natural-events/util';
import util from '../../util/util';
import EventIcon from './event-icon';
import { formatDisplayDate } from '../../modules/date/util';
import MonospaceDate from '../util/monospace-date';

function Event (props) {
  const {
    defaultEventLayer,
    deselectEvent,
    event,
    eventLayers,
    highlightEvent,
    isSelected,
    isHighlighted,
    layers,
    removeGroup,
    selectedDate,
    selectEvent,
    sources,
    toggleGroupVisibility,
    toggleVisibility,
    unHighlightEvent,
  } = props;
  const dateString = formatDisplayDate(event.geometry[0].date);
  const itemClass = isSelected || isHighlighted
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
   */
  function onEventSelect(date) {
    if (isSelected && (!date || date === selectedDate)) {
      const layersToHide = [];
      layers.forEach((layer) => {
        if (layer.group === 'overlays' && layer.layergroup !== 'Reference') {
          layersToHide.push(layer.id);
        }
      });
      toggleGroupVisibility(layersToHide, false);
      removeGroup(eventLayers);
      toggleVisibility(defaultEventLayer, true);
      deselectEvent();
    } else {
      const selectedEventDate = date || getDefaultEventDate(event);
      toggleVisibility(defaultEventLayer, false);
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
   * @param {Boolean} isHighlighting | Is the action to highlight
   */
  function onEventHighlight(isHighlighting) {
    if (!isHighlighting) {
      unHighlightEvent();
    } else {
      const selectedEventDate = getDefaultEventDate(event);
      highlightEvent(event.id, selectedEventDate);
    }
  }

  /**
   *
   * @param {Object} geometry | Geometry object containing magnitude data
   * @returns Magnitude data output
   */
  function magnitudeOutput({ magnitudeUnit, magnitudeValue }) {
    if (!magnitudeUnit || !magnitudeValue) return;
    const formattedunit = magnitudeUnit === 'kts' ? ' kts' : ' NM';
    return (
      <p className="magnitude">
        {formattedunit === ' NM' ? 'Surface Area: ' : 'Wind Speed: '}
        {magnitudeValue.toLocaleString()}
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
              <li key={`${event.id}-${date}`} className="date">

                {selectedDate === date ? (
                  <span
                    className="active"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatDisplayDate(date)}
                  </span>
                )
                  : (
                    <a
                      className="'date item-selected"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventSelect(date);
                      }}
                    >
                      {formatDisplayDate(date)}
                    </a>
                  )}
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
      onMouseEnter={(e) => {
        onEventHighlight(true);
      }}
      onMouseLeave={(e) => {
        onEventHighlight(false);
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
  defaultEventLayer: PropTypes.string,
  deselectEvent: PropTypes.func,
  event: PropTypes.object,
  eventLayers: PropTypes.array,
  highlightEvent: PropTypes.func,
  isSelected: PropTypes.bool,
  isHighlighted: PropTypes.bool,
  layers: PropTypes.array,
  removeGroup: PropTypes.func,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  sources: PropTypes.array,
  toggleGroupVisibility: PropTypes.func,
  toggleVisibility: PropTypes.func,
  unHighlightEvent: PropTypes.func,
};

export default Event;
