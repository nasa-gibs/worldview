import util from '../util/util';
export function getCompareObjects(models) {
  let obj = {};
  obj.a = {
    dateString: util.toISOStringDate(models.date.selectedA),
    layers: models.layers.get({ group: 'all' }, models.layers['activeA'])
  };
  obj.b = {
    dateString: util.toISOStringDate(models.date.selectedB),
    layers: models.layers.get({ group: 'all' }, models.layers['activeB'])
  };
  return obj;
}
export function getActiveLayerGroupString(abIsActive, isCompareA) {
  console.log(abIsActive, isCompareA);
  return !abIsActive ? 'active' : isCompareA ? 'activeA' : 'activeB';
}
export function getActiveDateString(abIsActive, isCompareA) {
  return !abIsActive ? 'selected' : isCompareA ? 'selectedA' : 'selectedB';
}
