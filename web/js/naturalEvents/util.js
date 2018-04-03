import lodashFind from 'lodash/find';

export function getEventById (events, id) {
  return lodashFind(events, function (e) {
    return e.id === id;
  });
};
