import util from '../../util/util';
import {
  OPEN_BASIC,
  OPEN_CUSTOM,
  TOGGLE,
  RENDER_TEMPLATE,
  CLOSE,
} from './constants';
import { requestAction } from '../core/actions';

export function openBasicContent(modalHeader, bodyText) {
  return {
    type: OPEN_BASIC,
    headerText: modalHeader,
    bodyText,
    key: util.encodeId(`__BASIC_MODAL__${modalHeader}`),
  };
}
export function openCustomContent(key, params) {
  return {
    type: OPEN_CUSTOM,
    key,
    customProps: params,
  };
}
export function toggleCustomContent(key, params) {
  return (dispatch, getState) => {
    const modalState = getState().modal;
    const { id, isOpen } = modalState;
    if (id === key && isOpen) {
      dispatch({
        type: CLOSE,
      });
    } else {
      dispatch({
        type: OPEN_CUSTOM,
        key,
        customProps: params,
      });
    }
  };
}

export function renderTemplate(headerText, template) {
  return {
    type: RENDER_TEMPLATE,
    key: util.encodeId(template),
    template,
    headerText,
  };
}
export function requestTemplate(pageActionName, location, type) {
  return (dispatch) => requestAction(dispatch, pageActionName, location);
}
export function onToggle() {
  return {
    type: TOGGLE,
  };
}
export function onClose() {
  return {
    type: CLOSE,
  };
}
