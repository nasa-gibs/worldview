import util from '../../util/util';
import { OPEN_BASIC, OPEN_CUSTOM, TOGGLE, RENDER_TEMPLATE } from './constants';
import { requestAction } from '../core/actions';

export function openBasicContent(modalHeader, bodyText) {
  return {
    type: OPEN_BASIC,
    headerText: modalHeader,
    bodyText: bodyText,
    key: util.encodeId('__BASIC_MODAL__' + modalHeader)
  };
}
export function openCustomContent(key, params) {
  return {
    type: OPEN_CUSTOM,
    key: key,
    customProps: params
  };
}
export function renderTemplate(headerText, template) {
  return {
    type: RENDER_TEMPLATE,
    key: util.encodeId(template),
    template: template,
    headerText: headerText
  };
}
export function requestTemplate(pageActionName, location, type) {
  return dispatch => {
    return requestAction(dispatch, pageActionName, location);
  };
}
export function onToggle() {
  return {
    type: TOGGLE
  };
}
