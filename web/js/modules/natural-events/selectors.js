import { createSelector } from 'reselect';
import {
  get as lodashGet,
} from 'lodash';

const getEvents = ({ requestedEvents }) => (requestedEvents
  ? requestedEvents.response
  : []
);

// eslint-disable-next-line import/prefer-default-export
export const getEventCategories = createSelector(
  [getEvents],
  (events) => (events || []).reduce((categories, event) => {
    const categoryTitle = lodashGet(event, 'categories[0].title');
    if (categories.indexOf(categoryTitle) === -1) {
      categories.push(categoryTitle);
    }
    return categories;
  }, []),
);
