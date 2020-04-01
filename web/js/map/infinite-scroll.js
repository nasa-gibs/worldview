import { clearLayers } from './util';
import util from '../util/util';

export function getActiveDateArray(longitude, centerDate) {
  const numberOfLayersOff = longitude < 0 ? Math.floor(Math.abs(Math.abs(longitude) / 360)) : Math.ceil(Math.abs(Math.abs(longitude) / 360));
  const amount = longitude < 0 ? -numberOfLayersOff : numberOfLayersOff;
  const newCenterDate = util.toISOStringDate(util.dateAdd(centerDate, 'day', -amount));
  const x = -360 + (360 * amount);
  const newCenterX = x + 180;
  const newCenterExtent = [newCenterX - 180, -90, newCenterX + 180, 90];
  const dateArray = [{ extent: newCenterExtent, date: newCenterDate }];
  for (let i = 1; i < 3; i += 1) {
    const date = util.toISOStringDate(util.dateAdd(newCenterDate, 'day', i));
    const xOrigin = x - 360 * i;
    const extentRight = [xOrigin, -90, xOrigin + 360, 90];
    const dateRight = util.toISOStringDate(util.dateAdd(newCenterDate, 'day', i * -1));
    const xOriginRight = 360 * i + x;
    const extent = [xOriginRight, -90, xOriginRight + 360, 90];
    if (dateRight) dateArray.push({ extent, date: dateRight });
    if (date) dateArray.push({ extent: extentRight, date });
  }
  return { dateArray, newCenterX };
}
export class InfiniteScroll {
  constructor(props) {
    this.props = props;
    this.state = {
      centerDate: props.date,
      currentCenterX: 0,
      view: props.map.getView(),
    };
    this.onViewChange = this.onViewChange.bind(this);
    this.init();
  }

  init() {
    const { map, cache } = this.props;
    const { centerDate, currentCenterX } = this.state;
    const { dateArray } = getActiveDateArray(currentCenterX, centerDate);
    clearLayers(map);
    cache.clear();
    this.setListeners();
    this.renderLayers(dateArray);
  }

  updateLayers(centerX) {
    const { centerDate } = this.state;
    const { dateArray, newCenterX } = getActiveDateArray(centerX, centerDate);
    this.state.currentCenterX = newCenterX;
    this.renderLayers(dateArray);
  }

  onViewChange() {
    const { view, currentCenterX } = this.state;
    const centerX = view.getCenter()[0];
    if (Math.abs(centerX - currentCenterX) > 180) {
      this.updateLayers(centerX);
    }
  }

  setListeners() {
    const { map } = this.props;
    const { view } = this.state;
    map.on('pointerdrag', this.onViewChange);
    view.on('propertychange', (e) => {
      if (e.key === 'resolution') {
        this.onViewChange();
      }
    });
  }

  destroy() {
    const { map } = this.props;
    clearLayers(map);
  }

  shiftLayers() {}

  pushLayers() {}

  renderLayers(dateArray) { // Render()
    const {
      activeLayers,
      cache,
      map,
      getLayerKey,
      createLayer,
    } = this.props;

    dateArray.forEach(({ date, extent }) => {
      activeLayers.forEach((def) => {
        const options = {
          date: new Date(date),
          extent: [extent[0] + 180, extent[1], extent[2] + 180, extent[3]],
        };
        const isNotOnMap = !cache.getItem(getLayerKey(def, options));
        if (isNotOnMap) {
          const layer = createLayer(def, options);
          map.addLayer(layer);
          layer.setVisible(def.visible); // for some reason layers aren't being set to visible
        }
      });
    });
    return map;
  }
}
