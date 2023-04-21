import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  clearErrorTiles as clearErrorTilesAction,
  toggleStaticMap,
} from '../../../modules/ui/actions';
import {
  selectDate as selectDateAction,
  selectInterval as selectIntervalAction,
} from '../../../modules/date/actions';
import { getNextDateTime } from '../../../modules/date/util';
import {
  subdailyLayersActive,
  getActiveLayers,
  getActiveLayersMap,
} from '../../../modules/layers/selectors';
// import { removeGroup as removeGroupActtion } from '../../../modules/layers/actions';
import {
  clearLayers,
  countTiles,
  formatDate,
  weekAgo,
  threeHoursAgo,
  compareDailyDates,
  compareSubdailyDates,
} from '../../util/util';

function TileErrorHandler({ action, ui }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectInterval = (delta, timeScale, customSelected) => { dispatch(selectIntervalAction(delta, timeScale, customSelected)); };
  const toggleStaticMapAction = (isActive) => { dispatch(toggleStaticMap(isActive)); };

  const {
    isKioskModeActive, errorTiles, selectedDate, date, compare, isLoading, realTimeDate,
  } = useSelector((state) => ({
    isKioskModeActive: state.ui.isKioskModeActive,
    errorTiles: state.ui.errorTiles,
    selectedDate: state.date.selected,
    date: state.date,
    compare: state.compare,
    isLoading: state.loading.isLoading,
    realTimeDate: state.date.appNow,
  }));
  const { activeString } = compare;
  const hasSubdailyLayers = useSelector((state) => subdailyLayersActive(state));
  const layersMap = useSelector((state) => getActiveLayersMap(state));
  const activeLayers = useSelector((state) => getActiveLayers(state, activeString));

  const { dailyTiles, subdailyTiles } = errorTiles;

  const lastDateToCheck = weekAgo(realTimeDate);
  const lastTimeToCheck = threeHoursAgo(realTimeDate);

  const dailySafeguardCheck = compareDailyDates(lastDateToCheck, selectedDate);
  const hourlySafeguardCheck = compareSubdailyDates(lastTimeToCheck, selectedDate);

  const errorTileCheck = dailyTiles.length || subdailyTiles.length;

  useEffect(() => {
    if (isKioskModeActive && errorTileCheck && dailySafeguardCheck && !isLoading) {
      handleTileErrors();
      // add isActive for static map to check if it is false
    } else if (isKioskModeActive && errorTileCheck && !dailySafeguardCheck && !isLoading) {
      handleStaticMap();
    }
  }, [action]);

  const handleStaticMap = () => {
    clearLayers(ui);
    toggleStaticMapAction(true);

    console.log('layersMap', layersMap);
    console.log('activeLayers', activeLayers);

    // const layersForGroup = layers.map((id) => activeLayersMap[id]);
    // const groupLayerIds = layers.map(({ id }) => id);
    // console.log('layersForGroup', layersForGroup)
    // console.log('groupLayerIds', groupLayerIds)
  };

  const handleTimeChange = (tiles, isSubdaily) => {
    const currentDate = formatDate(selectedDate, isSubdaily);
    const errorTilesOnCurrentDate = tiles.filter((tile) => currentDate === tile.date).length;
    if (errorTilesOnCurrentDate) {
      const state = { date, compare };
      if (hasSubdailyLayers && !isSubdaily) selectInterval(1, 3, false);
      const prevDate = getNextDateTime(state, '-1');
      const prevDateObj = new Date(prevDate);
      clearErrorTiles();
      selectDate(prevDateObj);
    }
  };

  const handleTileErrors = () => {
    const { totalExpectedTileCount, totalLoadedTileCount } = countTiles(ui);
    const percentageOfLoadedTiles = (totalLoadedTileCount / totalExpectedTileCount) * 100;
    if (percentageOfLoadedTiles >= 75) return;
    console.log(totalExpectedTileCount, totalLoadedTileCount, percentageOfLoadedTiles, '%');

    if (dailyTiles.length) handleTimeChange(dailyTiles, false);
    if (subdailyTiles.length && hourlySafeguardCheck) handleTimeChange(subdailyTiles, true);
    clearErrorTiles();
  };

  return null;
}

export default TileErrorHandler;

TileErrorHandler.propTypes = {
  action: PropTypes.object,
};
