import {
  SELECT_PRODUCT,
  DATA_GRANULE_SELECT,
  DATA_QUERY,
  DATA_GRANULE_UNSELECT
} from './constants';
import { requestAction } from '../core/actions';
import update from 'immutability-helper';

export function selectProduct(id) {
  return (dispatch, getState) => {
    if (getState().data.selectedProduct !== id) {
      dispatch({
        type: SELECT_PRODUCT,
        id: id
      });
    }
  }
}
export function dataQuery(location) {
  return (dispatch, getData) => {
    return requestAction(dispatch, DATA_QUERY, location, 'application/json');
  };
}
export function toggleGranule(granule) {
  const id = granule.id;
  return (dispatch, getData) => {
    let selectedGranules = getData().data.selectedGranules;
    if (selectedGranules[id]) {
      selectedGranules = update(selectedGranules, {
        $unset: [id]
      });
      dispatch({
        type: DATA_GRANULE_UNSELECT,
        selectedGranules: selectedGranules,
        granule: granule
      });
    } else {
      selectedGranules = update(selectedGranules, {
        [id]: { $set: granule }
      });
      dispatch({
        type: DATA_GRANULE_SELECT,
        granule: granule,
        selectedGranules: selectedGranules
      });
    }
  };
}
