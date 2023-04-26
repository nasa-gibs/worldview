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
} from '../../../modules/layers/selectors';
import { removeGroup as removeGroupAction } from '../../../modules/layers/actions';
import {
  countTiles,
  formatDate,
  weekAgo,
  threeHoursAgo,
  compareDailyDates,
  compareSubdailyDates,
  formatSelectedDate,
} from '../../util/util';

function TileErrorHandler({ action, ui }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectInterval = (delta, timeScale, customSelected) => { dispatch(selectIntervalAction(delta, timeScale, customSelected)); };
  const toggleStaticMapAction = (isActive) => { dispatch(toggleStaticMap(isActive)); };
  const removeGroup = (ids) => { dispatch(removeGroupAction(ids)); };

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
  const activeLayerIds = useSelector((state) => getActiveLayers(state, activeString).map((layer) => layer.id));

  const { dailyTiles, subdailyTiles, blankTiles } = errorTiles;

  const lastDateToCheck = weekAgo(realTimeDate);
  const lastTimeToCheck = threeHoursAgo(realTimeDate);

  const dailySafeguardCheck = compareDailyDates(lastDateToCheck, selectedDate);
  const hourlySafeguardCheck = compareSubdailyDates(lastTimeToCheck, selectedDate);

  const errorTileCheck = dailyTiles.length || subdailyTiles.length;
  const blankTileCheck = blankTiles.length;

  useEffect(() => {
    if (isKioskModeActive && errorTileCheck && dailySafeguardCheck && !isLoading) {
      handleTileErrors();
    } else if (isKioskModeActive && errorTileCheck && !dailySafeguardCheck && !isLoading) {
      handleStaticMap();
    } else if (isKioskModeActive && blankTileCheck && dailySafeguardCheck && !isLoading) {
      handleTimeChangeForBlankTiles();
    }
  }, [action]);

  const handleStaticMap = () => {
    toggleStaticMapAction(true);
    removeGroup(activeLayerIds);
  };

  const handleTimeChangeForBlankTiles = () => {
    const { totalExpectedTileCount } = countTiles(ui);
    // console.log('totalExpectedTileCount', totalExpectedTileCount, 'blankTilesCount', blankTiles.length, 'percentage: ', (blankTiles.length / totalExpectedTileCount) * 100, '%', blankTiles[0].date)
    const blankTilesOnCurentDate = blankTiles.filter((tile) => tile.date === formatSelectedDate(selectedDate)).length;
    if (!blankTilesOnCurentDate) return;
    const blankTilesPercentage = (blankTiles.length / totalExpectedTileCount) * 100;
    if (blankTilesPercentage >= 50) {
      const state = { date, compare };
      const prevDate = getNextDateTime(state, '-1');
      const prevDateObj = new Date(prevDate);
      clearErrorTiles();
      selectDate(prevDateObj);
    }
  };

  const handleTimeChangeForErrors = (tiles, isSubdaily) => {
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
    // right now this only checks the most base layer, does it need to check all of them
    // console.log(totalExpectedTileCount, totalLoadedTileCount, percentageOfLoadedTiles, '%')
    if (percentageOfLoadedTiles >= 75) return;

    if (dailyTiles.length) handleTimeChangeForErrors(dailyTiles, false);
    if (subdailyTiles.length && hourlySafeguardCheck) handleTimeChangeForErrors(subdailyTiles, true);
    clearErrorTiles();
  };

  return null;
}

export default TileErrorHandler;

TileErrorHandler.propTypes = {
  action: PropTypes.object,
};
