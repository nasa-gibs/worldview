import update from 'immutability-helper';
import {
  SELECT_PRODUCT,
  DATA_GRANULE_SELECT,
  DATA_QUERY,
  DATA_GRANULE_UNSELECT,
} from './constants';
import { requestAction } from '../core/actions';

export function selectProduct(id) {
  return (dispatch, getState) => {
    if (getState().data.selectedProduct !== id) {
      dispatch({
        type: SELECT_PRODUCT,
        id,
      });
    }
  };
}
export function dataQuery(location) {
  return (dispatch, getData) => requestAction(dispatch, DATA_QUERY, location, 'application/json');
}
export function toggleGranule(granule) {
  const { id } = granule;
  return (dispatch, getData) => {
    let { selectedGranules } = getData().data;
    if (selectedGranules[id]) {
      selectedGranules = update(selectedGranules, {
        $unset: [id],
      });
      dispatch({
        type: DATA_GRANULE_UNSELECT,
        selectedGranules,
        granule,
      });
    } else {
      selectedGranules = update(selectedGranules, {
        [id]: { $set: granule },
      });
      dispatch({
        type: DATA_GRANULE_SELECT,
        granule,
        selectedGranules,
      });
    }
  };
}
