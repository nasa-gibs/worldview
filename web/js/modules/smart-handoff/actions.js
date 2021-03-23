import {
  SELECT_COLLECTION,
} from './constants';

export default function selectCollection(conceptId, layerId) {
  return {
    type: SELECT_COLLECTION,
    conceptId,
    layerId,
  };
}
