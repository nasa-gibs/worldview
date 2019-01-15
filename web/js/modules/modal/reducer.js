import { TOGGLE, OPEN_CUSTOM, OPEN_BASIC } from './constants';
import { assign as lodashAssign } from 'lodash';
import update from 'immutability-helper';

const modalState = {
  headerText: 'header Text',
  bodyText: 'Body Text',
  isOpen: false,
  id: '__default__',
  modalClassName: '',
  headerChildren: null,
  bodyHeader: null,
  bodyChildren: null,
  isCustom: false
};

export default function modalReducer(state = modalState, action) {
  switch (action.type) {
    case TOGGLE:
      return lodashAssign({}, state, {
        isOpen: !state.isOpen
      });
    case OPEN_BASIC:
      return Object.assign({}, state, {
        isOpen: action.key === state.key ? !state.isOpen : true,
        isCustom: false,
        id: action.key,
        headerText: action.headerText,
        bodyText: action.bodyText
      });
    case OPEN_CUSTOM:
      console.log(action, state);
      return update(state, {
        isOpen: { $set: action.key === state.key ? !state.isOpen : true },
        isCustom: { $set: true },
        id: { $set: action.key },
        headerText: { $set: action.headerText },
        bodyText: { $set: action.bodyText }
      });
    default:
      return state;
  }
}
