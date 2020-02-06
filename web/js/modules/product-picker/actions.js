import {
  UPDATE_PRODUCT_PICKER,
  UPDATE_LIST_SCROLL_TOP,
  RESET_STATE
} from './constants';

export function updateProductPicker(value) {
  return {
    type: UPDATE_PRODUCT_PICKER,
    value
  };
}

export function updateListScrollTop(value) {
  return {
    type: UPDATE_LIST_SCROLL_TOP,
    value
  };
}

export function resetProductPickerState() {
  return {
    type: RESET_STATE
  };
}
