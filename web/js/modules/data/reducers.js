import {
  SELECT_PRODUCT,
  DATA_GRANULE_SELECT,
  DATA_GRANULE_UNSELECT
} from './constants';
import { assign as lodashAssign } from 'lodash';
export const defaultDataState = {
  selectedProduct: '',
  selectedGranules: {},
  prefer: 'science'
};
export default function dataDownloadReducer(state = defaultDataState, action) {
  switch (action.type) {
    case SELECT_PRODUCT:
      return lodashAssign({}, state, {
        selectedProduct: action.id
      });
    case DATA_GRANULE_SELECT:
    case DATA_GRANULE_UNSELECT:
      return lodashAssign({}, state, {
        selectedGranules: action.selectedGranules
      });
    default:
      return state;
  }
}
