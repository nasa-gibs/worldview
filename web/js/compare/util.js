import util from '../util/util';
export function getCompareObjects(models) {
  if (!models.layers.activeB) return {};
  var obj = {};
  obj.a = {
    dateString: util.toISOStringDate(models.date.selected),
    layers: models.layers.get(
      { group: 'all', proj: 'all' },
      models.layers['active']
    )
  };
  obj.b = {
    dateString: util.toISOStringDate(models.date.selectedB),
    layers: models.layers.get(
      { group: 'all', proj: 'all' },
      models.layers['activeB']
    )
  };
  return obj;
}
