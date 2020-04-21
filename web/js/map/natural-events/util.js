import lodashFind from 'lodash/find';
/**
 * Find event in array of events
 * using event id
 *
 * @param  {Array} events Array of Eonet Events
 * @param  {String} id Event Id
 * @return {Object} Eonet Event Object
 */
export default function naturalEventsUtilGetEventById(events, id) {
  return lodashFind(events, (e) => e.id === id);
}
