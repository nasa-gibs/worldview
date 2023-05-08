import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  clearErrorTiles as clearErrorTilesAction,
  toggleStaticMap as toggleStaticMapAction,
  toggleReadyForKioskAnimation as toggleReadyForKioskAnimationAction,
} from '../../../../modules/ui/actions';
import {
  selectDate as selectDateAction,
  selectInterval as selectIntervalAction,
} from '../../../../modules/date/actions';
import { getNextDateTime } from '../../../../modules/date/util';
import {
  subdailyLayersActive,
  getActiveLayers,
} from '../../../../modules/layers/selectors';
import { toggleGroupVisibility as toggleGroupVisiblityAction } from '../../../../modules/layers/actions';
import {
  formatDate,
  weekAgo,
  threeHoursAgo,
  twentySevenHoursAgo,
  compareDailyDates,
  compareSubdailyDates,
  formatSelectedDate,
} from '../../../util/util';

function TileErrorHandler({ action, ui }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectInterval = (delta, timeScale, customSelected) => { dispatch(selectIntervalAction(delta, timeScale, customSelected)); };
  const toggleStaticMap = (isActive) => { dispatch(toggleStaticMapAction(isActive)); };
  const toggleGroupVisibility = (ids, visible) => { dispatch(toggleGroupVisiblityAction(ids, visible)); };
  const toggleReadyForKioskAnimation = (toggleAnimation) => { dispatch(toggleReadyForKioskAnimationAction(toggleAnimation)); };

  const {
    displayStaticMap,
    isKioskModeActive,
    errorTiles,
    selectedDate,
    date,
    compare,
    isLoading,
    realTimeDate,
    eic,
    map,
    readyForKioskAnimation,
  } = useSelector((state) => ({
    autoplayAnimation: state.animation.autoplay,
    displayStaticMap: state.ui.displayStaticMap,
    isAnimationPlaying: state.animation.isPlaying,
    isKioskModeActive: state.ui.isKioskModeActive,
    errorTiles: state.ui.errorTiles,
    selectedDate: state.date.selected,
    date: state.date,
    compare: state.compare,
    isLoading: state.loading.isLoading,
    realTimeDate: state.date.appNow,
    eic: state.ui.eic,
    map: state.map,
    readyForKioskAnimation: state.ui.readyForKioskAnimation,
  }));
  const { activeString } = compare;
  const hasSubdailyLayers = useSelector((state) => subdailyLayersActive(state));
  const activeLayerIds = useSelector((state) => getActiveLayers(state, activeString).map((layer) => layer.id));

  const {
    dailyTiles, subdailyTiles, blankTiles, kioskTileCount, lastCheckedDate,
  } = errorTiles;

  const lastDateToCheck = weekAgo(realTimeDate);
  const lastTimeToCheck = eic === 'sa' ? twentySevenHoursAgo(realTimeDate) : threeHoursAgo(realTimeDate);

  const dailySafeguardCheck = compareDailyDates(lastDateToCheck, selectedDate);
  const hourlySafeguardCheck = compareSubdailyDates(lastTimeToCheck, selectedDate);

  const errorTileCheck = dailyTiles.length || subdailyTiles.length;
  const blankTileCheck = blankTiles.length;

  useEffect(() => {
    if (!ui.selected || !map.rendered || readyForKioskAnimation) return;

    if (isKioskModeActive && errorTileCheck && dailySafeguardCheck && !isLoading) {
      handleTileErrors();
    } else if (isKioskModeActive && errorTileCheck && (!dailySafeguardCheck || !hourlySafeguardCheck) && !isLoading) {
      handleStaticMap();
    } else if (isKioskModeActive && blankTileCheck && dailySafeguardCheck && eic !== 'sa' && !isLoading) {
      handleTimeChangeForBlankTiles();
      // reminder: we are NOT checking blank tiles when playing subdaily animations
    } else if ((!errorTileCheck && !blankTileCheck && !readyForKioskAnimation) || (eic === 'sa' && !errorTileCheck && !readyForKioskAnimation)) {
      readyForAnimation();
    } else {
      clearErrorTiles();
    }
  }, [action]);

  const handleStaticMap = () => {
    toggleStaticMap(true);
    toggleGroupVisibility(activeLayerIds, false);
  };

  const readyForAnimation = () => {
    toggleReadyForKioskAnimation(true);
    clearErrorTiles();
  };

  // we don't need to include the readyForAnimation function here until we are checking a tile for blank tiles that we plan on animating
  const handleTimeChangeForBlankTiles = () => {
    const blankTilesOnCurentDate = blankTiles.filter((tile) => tile.date === formatSelectedDate(selectedDate)).length;
    if (!blankTilesOnCurentDate) return clearErrorTiles();
    const blankTilesPercentage = (blankTiles.length / kioskTileCount) * 100;
    if (blankTilesPercentage >= 50) {
      const state = { date, compare };
      const prevDate = getNextDateTime(state, '-1');
      const prevDateObj = new Date(prevDate);
      selectDate(prevDateObj);
    }
    clearErrorTiles();
  };

  const handleTimeChangeForErrors = (tiles, isSubdaily) => {
    const currentDate = formatDate(selectedDate, isSubdaily);
    const errorTilesOnCurrentDate = tiles.filter((tile) => currentDate === tile.date).length;
    if (errorTilesOnCurrentDate) {
      const state = { date, compare };
      if (hasSubdailyLayers && !isSubdaily) selectInterval(1, 3, false);
      const prevDate = getNextDateTime(state, '-1');
      const prevDateObj = new Date(prevDate);
      selectDate(prevDateObj);
    } else if ((lastCheckedDate === selectedDate && !readyForKioskAnimation && eic === 'da') || (eic === 'sa')) {
      readyForAnimation();
    } else {
      clearErrorTiles();
    }

    if (!hourlySafeguardCheck || !dailySafeguardCheck) return handleStaticMap();
  };

  const handleTileErrors = () => {
    if (dailyTiles.length) return handleTimeChangeForErrors(dailyTiles, false);
    if (subdailyTiles.length && hourlySafeguardCheck) return handleTimeChangeForErrors(subdailyTiles, true);
    if ((!hourlySafeguardCheck || !dailySafeguardCheck) && !displayStaticMap) return handleStaticMap();
  };

  return null;
}

export default TileErrorHandler;

TileErrorHandler.propTypes = {
  action: PropTypes.object,
  ui: PropTypes.object,
};
