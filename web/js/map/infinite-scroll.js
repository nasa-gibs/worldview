import { debounce as lodashDebounce } from 'lodash';
import { clearLayers } from './util';
import util from '../util/util';

export function getActiveDateArray(longitude, centerDate) {
  const isNegative = longitude < 0;
  const numOfDaysOf = Math.abs(Math.abs(longitude) / 360);
  // const remainder = Math.abs(longitude % 360);
  // const nightDateIsOneLeft = isNegative ? remainder > 180 : remainder < 180;

  const numberOfLayersOff = isNegative ? Math.floor(numOfDaysOf) : Math.ceil(numOfDaysOf);
  const amount = isNegative ? -numberOfLayersOff : numberOfLayersOff;
  const newDate = util.dateAdd(centerDate, 'day', -amount);
  const newCenterDate = util.toISOStringDate(newDate);
  // const newNightCenterDate = nightDateIsOneLeft ? util.toISOStringDate(util.dateAdd(centerDate, 'day', 1)) : newCenterDate;
  console.log(newCenterDate);
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
  return {
    dateArray, newCenterX: newCenterX + 180, newCenterDate, // newNightCenterDate,
  };
}
export class InfiniteScroll {
  constructor(props) {
    this.props = props;
    this.state = {
      centerDate: props.startDate,
      currentCenterX: 0,
      view: props.map.getView(),
      isNightMode: false,
    };
    this.onViewChange = this.onViewChange.bind(this);
    this.onPropertyChange = this.onPropertyChange.bind(this);
    this.updateLayers = lodashDebounce(this.updateLayers.bind(this), 100);
    this.init();
  }

  init() {
    const { map, cache, startDate } = this.props;
    const { currentCenterX } = this.state;
    const { dateArray } = getActiveDateArray(currentCenterX, startDate);
    clearLayers(map);
    cache.clear();
    this.setListeners();
    this.renderLayers(dateArray);
  }

  toggleNightMode(isNightMode) {
    const { currentCenterX } = this.state;
    console.log(currentCenterX);
    this.state.isNightMode = isNightMode;
    this.state.currentCenterX = isNightMode ? currentCenterX - 180 : currentCenterX + 180;
  }

  getExtentForCurrentDay() {
    return [this.state.currentCenterX - 180, -90, this.state.currentCenterX + 180, 90];
  }

  updateLayers(centerX) {
    const { startDate, updateDate } = this.props;
    const { centerDate, isNightMode } = this.state;
    const {
      dateArray, newCenterX, newCenterDate,
    } = getActiveDateArray(centerX, startDate);
    this.state.currentCenterX = isNightMode ? newCenterX - 180 : newCenterX;
    this.renderLayers(dateArray);

    if (newCenterDate !== centerDate) {
      this.state.newCenterDate = newCenterDate;
      updateDate(new Date(newCenterDate)); // store.dispatch()
    }
  }

  onViewChange() {
    const { view, currentCenterX, isNightMode } = this.state;
    const centerX = view.getCenter()[0];

    const adjustedCenterX = isNightMode ? centerX : centerX - 180;
    console.log(adjustedCenterX, currentCenterX);
    if (Math.abs(adjustedCenterX - currentCenterX) > 180) {
      this.updateLayers(adjustedCenterX);
    }
  }

  onPropertyChange(e) {
    if (e.key === 'resolution') {
      this.onViewChange();
    }
  }

  setListeners() {
    const { map } = this.props;
    const { view } = this.state;
    map.on('pointerdrag', this.onViewChange);
    view.on('propertychange', this.onPropertyChange);
  }

  unsetListeners() {
    const { map } = this.props;
    const { view } = this.state;
    map.un('pointerdrag', this.onViewChange);
    view.un('propertychange', this.onPropertyChange);
  }

  destroy() {
    const { map } = this.props;
    clearLayers(map);
    this.unsetListeners();
  }

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
