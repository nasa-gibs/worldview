import { get } from 'lodash';

export function eventParse(state) {
  const values = state.split(',');
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
