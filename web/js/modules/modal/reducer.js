import { TOGGLE, OPEN_CUSTOM, OPEN_BASIC } from './constants';
import { assign as lodashAssign } from 'lodash';

const modalState = {
  headerText: 'header Text',
  bodyText: 'Body Text',
  isOpen: true,
  key: '__default__',
  ModalClassName: '',
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
      return lodashAssign({}, state, {
        isOpen: action.key === state.key ? !state.isOpen : true,
        isCustom: false,
        key: action.key,
        headerText: action.headerText,
        bodyText: action.bodyText
      });
    case OPEN_CUSTOM:
      return lodashAssign({}, state, {
        isOpen: action.key === state.key ? !state.isOpen : true,
        isCustom: true,
        key: action.key,
        headerText: action.headerText,
        bodyText: action.bodyText
      });
    default:
      return state;
  }
}
