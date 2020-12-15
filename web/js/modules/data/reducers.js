import { assign as lodashAssign } from 'lodash';
import {
  SELECT_PRODUCT,
  DATA_GRANULE_SELECT,
  DATA_GRANULE_UNSELECT,
} from './constants';
import { CHANGE_TAB } from '../sidebar/constants';

export const defaultDataState = {
  selectedProduct: '',
  selectedGranules: {},
  prefer: 'science',
  active: false,
};
export default function reducers(state = defaultDataState, action) {
  switch (action.type) {
    case SELECT_PRODUCT:
      return lodashAssign({}, state, {
        selectedProduct: action.id,
      });
    case DATA_GRANULE_SELECT:
    case DATA_GRANULE_UNSELECT:
      return lodashAssign({}, state, {
        selectedGranules: action.selectedGranules,
      });
    case CHANGE_TAB:
      return lodashAssign({}, state, {
        active: action.activeTab === 'download',
      });
    default:
      return state;
  }
}
