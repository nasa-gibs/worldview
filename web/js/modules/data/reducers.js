import { SELECT_PRODUCT } from './constants';
import { assign as lodashAssign } from 'lodash';
const initDataState = {
  selectedProduct: '',
  selectedGranules: {}
};
export default function dataDownloadReducer(state = initDataState, action) {
  switch (action.type) {
    case SELECT_PRODUCT:
      return lodashAssign({}, state, {
        selectedProduct: action.id
      });
    default:
      return state;
  }
}
