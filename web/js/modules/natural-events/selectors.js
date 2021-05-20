import { createSelector } from 'reselect';

const getActiveCategories = ({ events }) => events.selectedCategories;
const getEvents = ({ requestedEvents }) => requestedEvents.response;

/**
 * We need to filter the categories on events so that only categories
 * which A) we support and B) are currently selected in the event filter
 * so that an inappropriate icon does not show.  (E.g. event belongs to
 * "Severe Storms" and "Snow" but was returned from a search for "Snow")
 */
// eslint-disable-next-line import/prefer-default-export
export const getEventsFilteredCategories = createSelector(
  [getActiveCategories, getEvents],
  (activeCategories, events) => {
    if (!events) return;
    return events.map((event) => {
      const newEvent = { ...event };
      newEvent.categories = event.categories.filter((c) => activeCategories.some(({ id }) => id === c.id));
      return newEvent;
    });
  },
);
