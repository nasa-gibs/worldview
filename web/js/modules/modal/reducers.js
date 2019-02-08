import {
  TOGGLE,
  OPEN_CUSTOM,
  OPEN_BASIC,
  RENDER_TEMPLATE,
  ABOUT_PAGE_REQUEST
} from './constants';
import { requestReducer } from '../core/reducers';
import { assign as lodashAssign } from 'lodash';
import update from 'immutability-helper';

const modalState = {
  headerText: '',
  bodyText: '',
  isOpen: false,
  id: '__default__',
  modalClassName: '',
  headerChildren: null,
  bodyHeader: null,
  bodyChildren: null,
  isCustom: false,
  bodyHTML: null
};
export function modalAboutPage(state = {}, action) {
  return requestReducer(ABOUT_PAGE_REQUEST, state, action);
}
export function modalReducer(state = modalState, action) {
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
      return update(state, {
        isOpen: { $set: action.key === state.key ? !state.isOpen : true },
        isCustom: { $set: true },
        id: { $set: action.key },
        headerText: { $set: action.headerText },
        bodyText: { $set: action.bodyText }
      });
    case RENDER_TEMPLATE:
      return update(state, {
        isOpen: { $set: action.key === state.key ? !state.isOpen : true },
        isCustom: { $set: false },
        id: { $set: action.key },
        headerText: { $set: action.headerText },
        bodyText: { $set: null },
        template: { $set: action.template }
      });
    default:
      return state;
  }
}
