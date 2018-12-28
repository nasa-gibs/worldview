import util from '../../util/util';
import { OPEN_BASIC, OPEN_CUSTOM, TOGGLE } from './constants';

export function openBasicContent(modalHeader, bodyText) {
  return {
    type: OPEN_BASIC,
    headerText: modalHeader,
    bodyText: bodyText,
    key: util.encodeId(' __BASIC_MODAL__' + modalHeader)
  };
}
export function openCustomContent(key) {
  return {
    type: OPEN_CUSTOM,
    key: key
  };
}
export function onToggle() {
  return {
    type: TOGGLE
  };
}
