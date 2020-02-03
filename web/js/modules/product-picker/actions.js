import {
  UPDATE_PRODUCT_PICKER
} from './constants';

export function updateProductPicker(value) {
  return {
    type: UPDATE_PRODUCT_PICKER,
    value
  };
}
