import {
  TOGGLE,
  OPEN_CUSTOM,
  OPEN_BASIC,
  RENDER_TEMPLATE,
  ABOUT_PAGE_REQUEST,
  CLOSE,
  CHANGE_CURSOR
} from './constants';
import { requestReducer } from '../core/reducers';
import { assign as lodashAssign } from 'lodash';

export const modalState = {
  headerText: '',
  bodyText: '',
  isOpen: false,
  id: '__default__',
  modalClassName: '',
  headerChildren: null,
  bodyHeader: null,
  bodyChildren: null,
  isCustom: false,
  bodyHTML: null,
  customProps: {},
  template: null
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
      return lodashAssign({}, state, {
        isOpen: action.key === state.key ? !state.isOpen : true,
        isCustom: false,
        id: action.key,
        headerText: action.headerText || '',
        bodyText: action.bodyText || '',
        customProps: {},
        template: null
      });
    case OPEN_CUSTOM:
      return lodashAssign({}, state, {
        isOpen: action.key === state.key ? !state.isOpen : true,
        isCustom: true,
        customProps: action.customProps,
        id: action.key,
        headerText: action.headerText || '',
        bodyText: action.bodyText || '',
        template: null
      });
    case RENDER_TEMPLATE:
      return lodashAssign({}, state, {
        isOpen: action.key === state.key ? !state.isOpen : true,
        isCustom: false,
        id: action.key,
        headerText: action.headerText || '',
        bodyText: '',
        template: action.template,
        customProps: {}
      });
    case CLOSE:
      return lodashAssign({}, state, {
        isOpen: false
      });
    default:
      return state;
  }
}
