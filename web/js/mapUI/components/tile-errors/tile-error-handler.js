import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { clearErrorTiles as clearErrorTilesAction } from '../../../modules/ui/actions';
import {
  selectDate as selectDateAction,
  selectInterval as selectIntervalAction,
} from '../../../modules/date/actions';
import { getNextDateTime } from '../../../modules/date/util';
import { subdailyLayersActive } from '../../../modules/layers/selectors';

// updating timezone for subdaily times
function convertTimestamp(timestamp) {
  const date = new Date(timestamp);
  // add 4 hours to the time
  date.setHours(date.getHours() + 4);
  // set the seconds to 0
  date.setSeconds(0);
  // round down the minutes to the nearest multiple of 10
  const roundedMinutes = Math.floor(date.getMinutes() / 10) * 10;
  // format the updated date back to a string
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(roundedMinutes).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

function formatDate(dateString, hasSubdailyLayers) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (hasSubdailyLayers) {
    const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    const adjustedTimezone = convertTimestamp(timestamp);
    return adjustedTimezone;
  }

  return `${year}-${month}-${day}T00:00:00`;
}

// gets a week ago from real time date
function weekAgo(realTimeDate) {
  const inputDate = new Date(realTimeDate);
  const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  const earlierDate = new Date(inputDate.getTime() - oneWeekInMilliseconds);
  const earlierDateString = earlierDate.toString();
  return earlierDateString;
}

// safe gaurd agaisnt stepping back too far, we only want to go back 7 days for daily layers
function compareDailyDates(lastDateToCheck, selectedDate) {
  const lastDate = new Date(lastDateToCheck);
  const selected = new Date(selectedDate);
  lastDate.setHours(0, 0, 0, 0);
  selected.setHours(0, 0, 0, 0);
  return selected > lastDate;
}

// safe gaurd agaisnt stepping back too far, we only want to go back 23 hours for subdaily
function compareSubdailyDates(lastDateToCheck, selectedDate) {
  const lastDate = new Date(lastDateToCheck);
  const selected = new Date(selectedDate);
  const lastDateHour = lastDate.getHours();
  const selectedDateHour = selected.getHours();
  // check if the hour value in selectedDate is exactly one hour more than lastDateToCheck
  // also, handle the case where selectedDateHour is 0 and lastDateHour is 23
  if (selectedDateHour === (lastDateHour + 1) % 24) {
    return false;
  }
  return true;
}

function TileErrorHandler({ action }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectInterval = (delta, timeScale, customSelected) => { dispatch(selectIntervalAction(delta, timeScale, customSelected)); };

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
  const hasSubdailyLayers = useSelector((state) => subdailyLayersActive(state));

  // 7 days ago from real time date
  const lastDateToCheck = weekAgo(realTimeDate);

  // true === safe (date is younger than last date to check)
  const dailySafeguardCheck = compareDailyDates(lastDateToCheck, selectedDate);
  const hourlySafeguardCheck = compareSubdailyDates(lastDateToCheck, selectedDate);

  useEffect(() => {
    if (isKioskModeActive && errorTiles.length && dailySafeguardCheck && hourlySafeguardCheck && !isLoading) {
      sortErrorTiles();
    }
  }, [action]);

  // sorting tiles for daily & subdaily
  function sortErrorTiles() {
    const dailyTiles = [];
    const subdailyTiles = [];

    errorTiles.forEach((tile) => {
      if (tile.layerPeriod !== 'Subdaily') {
        dailyTiles.push(tile);
      } else {
        subdailyTiles.push(tile);
      }
    });

    if (dailyTiles.length) {
      handleErrorTilesDaily(dailyTiles, subdailyTiles);
    } else {
      handleErrorTilesSubdaily(subdailyTiles);
    }
  }

  const handleErrorTilesDaily = (dailyTiles, subdailyTiles) => {
    const currentDate = formatDate(selectedDate, false);
    const errorTilesOnCurrentDate = dailyTiles.filter((tile) => currentDate === tile.date).length;
    if (errorTilesOnCurrentDate > 1) {
      const state = { date, compare };
      if (hasSubdailyLayers) {
        selectInterval(1, 3, false);
      }
      const prevDate = getNextDateTime(state, '-1');
      const prevDateObj = new Date(prevDate);
      clearErrorTiles();
      selectDate(prevDateObj);
    } else {
      handleErrorTilesSubdaily(subdailyTiles);
    }
  };

  const handleErrorTilesSubdaily = (subdailyTiles) => {
    const currentDate = formatDate(selectedDate, true);
    const errorTilesOnCurrentDate = subdailyTiles.filter((tile) => currentDate === tile.date).length;
    if (errorTilesOnCurrentDate > 1) {
      const state = { date, compare };
      const prevDate = getNextDateTime(state, '-1');
      const prevDateObj = new Date(prevDate);
      clearErrorTiles();
      selectDate(prevDateObj);
    } else {
      clearErrorTiles();
    }
  };

  return null;
}

export default TileErrorHandler;

TileErrorHandler.propTypes = {
  action: PropTypes.object,
};
