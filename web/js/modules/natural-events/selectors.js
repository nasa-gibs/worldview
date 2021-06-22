import { createSelector } from 'reselect';
import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';

const getActiveCategories = ({ events }) => events.selectedCategories;
const getEvents = ({ requestedEvents }) => requestedEvents.response;
const getProjection = ({ proj }) => proj.selected;

/**
 * Since the EONET API bounding box parameter only accepts a geographic coordinate format
 * the bounding box extents we send during the API call may return events outside of the
 * visible extent in polar projections within the app. We filter out any geometries
 * for an event that are outside the extent (to prevent tracks from extending beyond extent)
 * and filter out any events that have no visible geometries in the current extent.
 *
 * We also need to filter the categories on events so that only categories
 * which A) we support and B) are currently selected in the event filter
 * so that an inappropriate icon does not show.  (E.g. event belongs to
 * "Severe Storms" and "Snow" but was returned from a search for "Snow")
 */
// eslint-disable-next-line import/prefer-default-export
export const getFilteredEvents = createSelector(
  [getActiveCategories, getEvents, getProjection],
  (activeCategories, events, projection) => {
    if (!events) return;
    const filterGeoms = ({ coordinates }) => {
      const { crs, maxExtent } = projection;
      const coords = transform(coordinates, 'EPSG:4326', crs);
      return containsCoordinate(maxExtent, coords);
    };
    return events
      .reduce((filteredEvents, event) => {
        const filteredGeometries = event.geometry.filter(filterGeoms);
        if (filteredGeometries.length) {
          const newEvent = {
            ...event,
            geometry: filteredGeometries,
          };
          filteredEvents.push(newEvent);
        }
        return filteredEvents;
      }, [])
      .map((event) => {
        const newEvent = { ...event };
        newEvent.categories = event.categories.filter(
          (c) => activeCategories.some(({ id }) => id === c.id),
        );
        return newEvent;
      });
  },
);
