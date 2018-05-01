import lodashFind from 'lodash/find';
/**
 * Find event in array of events
 * using event id
 *
 * @param  {Array} events Array of Eonet Events
 * @param  {String} id Event Id
 * @return {Object} Eonet Event Object
 */
export function naturalEventsUtilGetEventById (events, id) {
  return lodashFind(events, function (e) {
    return e.id === id;
  });
};
