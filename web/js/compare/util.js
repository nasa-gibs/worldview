import util from '../util/util';
const DEFAULT_COMPARE_OBJ = {};
export function getCompareObjects(models) {
  if (!models.layers.activeB) return DEFAULT_COMPARE_OBJ;
  var obj = {};
  obj.a = {
    dateString: util.toISOStringDate(models.date.selected),
    layers: models.layers.get({ group: 'all' }, models.layers['active'])
  };
  obj.b = {
    dateString: util.toISOStringDate(models.date.selectedB),
    layers: models.layers.get({ group: 'all' }, models.layers['activeB'])
  };
  return obj;
}
export function getActiveLayerGroupString(abIsActive, isCompareA) {
  return isCompareA ? 'active' : 'activeB';
}
export function getActiveDateString(abIsActive, isCompareA) {
  return isCompareA ? 'selected' : 'selectedB';
}
