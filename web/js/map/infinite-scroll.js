import { find as lodashFind } from 'lodash';
import { clearLayers } from './util';
import util from '../util/util';

export function getActiveDateArray(longitude, centerDate) {
  const numberOfLayersOff = longitude < 0 ? Math.floor(Math.abs(Math.abs(longitude) / 360)) : Math.ceil(Math.abs(Math.abs(longitude) / 360));
  const amount = longitude < 0 ? -numberOfLayersOff : numberOfLayersOff;
  const newCenterDate = util.toISOStringDate(util.dateAdd(centerDate, 'day', -amount));
  const x = -360 + (360 * amount);
  const newCenterOriginX = x + 180;
  const newCenterExtent = [newCenterOriginX - 180, -90, newCenterOriginX + 180, 90];
  const dateArray = [{ extent: newCenterExtent, date: newCenterDate }];
  for (let i = 1; i < 4; i += 1) {
    const date = util.toISOStringDate(util.dateAdd(centerDate, 'day', i));
    const xOrigin = x - 360 * i;
    const extentRight = [xOrigin, -90, xOrigin + 360, 90];
    const dateRight = util.toISOStringDate(util.dateAdd(centerDate, 'day', i * -1));
    const xOriginRight = 360 * i + x;
    const extent = [xOriginRight, -90, xOriginRight + 360, 90];
    if (dateRight) dateArray.push({ extent, date: dateRight });
    if (date) dateArray.push({ extent: extentRight, date });
  }
  return dateArray;
}
function addLayersToMap(map, activeLayerArray, dateArray, createLayer) { // Render()
  const mapLayerArray = map.getLayers().getArray();
  dateArray.forEach(({ date, extent }) => {
    activeLayerArray.forEach((def) => {
      const isNotOnMap = !lodashFind(mapLayerArray, { key: date + def.id });
      if (isNotOnMap) {
        const layer = createLayer(def, {
          date: new Date(date),
          extent: [extent[0] + 180, extent[1], extent[2] + 180, extent[3]],
          key: date + def.id,
        });
        map.addLayer(layer);
      }
    });
  });
  return map;
}
export class InfiniteScroll {
  constructor(props) {
    this.centerDate = props.date;
    this.activeLayers = props.activeLayers;
    this.currentCenterX = 0;
    this.map = props.map;
    this.cache = props.cache;
    this.view = props.map.getView();
    this.createLayer = props.createLayer;
    [this.currentCenter] = this.view.getCenter();
    this.onViewChange = this.onViewChange.bind(this);
    this.init();
  }

  init() {
    const dateArray = getActiveDateArray(this.currentCenterX, this.centerDate);
    this.map = clearLayers(this.map);
    this.cache.clear();
    this.map = addLayersToMap(this.map, this.activeLayers, dateArray, this.createLayer);
  }

  updateLayers() {

  }

  onViewChange() {
    const centerX = this.view.getCenter()[0];
    if (Math.abs(centerX - this.currentCenter) > 180) {
      this.updateLayers();
    }
  }

  setListener() {
    this.map.on('pointerdrag', this.onViewChange);
    this.view.on('propertychange', (e) => {
      if (e.key === 'resolution') {
        this.onViewChange();
      }
    });
  }

  destroy() {
    this.map = clearLayers(this.map);
  }

  shiftLayers() {}

  pushLayers() {}
}
