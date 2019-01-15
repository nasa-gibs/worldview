import { CHANGE_PROJECTION } from './constants';

export function changeProjection(id) {
  return {
    type: CHANGE_PROJECTION,
    id: id
  };
}
