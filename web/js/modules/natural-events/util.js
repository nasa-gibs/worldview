import { get } from 'lodash';
import update from 'immutability-helper';

export function parseEvent(eventString) {
  const values = eventString.split(',');
  let id = values[0] || '';
  let date = values[1] || '';
  id = id.match(/^EONET_[0-9]+/i) ? values[0] : '';
  date = date.match(/\d{4}-\d{2}-\d{2}/) ? values[1] : null;
  return {
    selected: {
      id,
      date,
    },
    active: true,
    showAll: true,
  };
}
export function serializeEvent(currentItemState) {
  const eventId = get(currentItemState, 'selected.id');
  const eventDate = get(currentItemState, 'selected.date');
  const eventsTabActive = currentItemState.active;
  return eventsTabActive && eventDate && eventId
    ? [eventId, eventDate].join(',')
    : eventId && eventsTabActive
      ? eventId
      : eventsTabActive
        ? 'true'
        : undefined;
}

export function parseEventFilterDates(eventFilterDatesString) {
  const [selectedStartDate, selectedEndDate] = eventFilterDatesString.split(',');
  return {
    start: selectedStartDate,
    end: selectedEndDate,
  };
}

export function serializeEventFilterDates(currentItemState) {
  const selectedStartDate = get(currentItemState, 'start');
  const selectedEndDate = get(currentItemState, 'end');
  return selectedStartDate && selectedEndDate && `${selectedStartDate},${selectedEndDate}`;
}

export function serializeCategories(categories, state) {
  const eventsTabActive = state.events.active;
  return eventsTabActive ? categories.map(({ id }) => id) : undefined;
}

export function mapLocationToEventFilterState(parameters, stateFromLocation, state) {
  const allCategories = state.config.naturalEvents.categories;
  const selectedIds = parameters.efc
    ? parameters.efc.split(',')
    : allCategories.map(({ id }) => id);
  const selectedCategories = !allCategories.length
    ? []
    : selectedIds.map((id) => allCategories.find((c) => c.id === id));
  const [selectedStartDate, selectedEndDate] = parameters.efd
    ? parameters.efd.split(',')
    : [undefined, undefined];
  return update(stateFromLocation, {
    events: {
      selectedCategories: {
        $set: selectedCategories,
      },
      selectedDates: {
        start: { $set: selectedStartDate },
        end: { $set: selectedEndDate },
      },
    },
  });
}
