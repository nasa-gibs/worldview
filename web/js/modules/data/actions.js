import { SELECT_PRODUCT } from './constants';
export function selectProduct(id) {
  return {
    type: SELECT_PRODUCT,
    id: id
  };
}
