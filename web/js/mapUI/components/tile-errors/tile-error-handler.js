import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { clearErrorTiles as clearErrorTilesAction } from '../../../modules/ui/actions';
import { selectDate as selectDateAction } from '../../../modules/date/actions';
import { getNextDateTime } from '../../../modules/date/util';
import { subdailyLayersActive } from '../../../modules/layers/selectors';


function formatDate(dateString, hasSubdailyLayers) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (hasSubdailyLayers) {
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day}`;
}

function TileErrorHandler({ action }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDateAction(date)); };

  const {
    isKioskModeActive, errorTiles, selectedDate, date, compare, isLoading,
  } = useSelector((state) => ({
    isKioskModeActive: state.ui.isKioskModeActive,
    errorTiles: state.ui.errorTiles,
    selectedDate: state.date.selected,
    date: state.date,
    compare: state.compare,
    isLoading: state.loading.isLoading,
  }));

  const hasSubdailyLayers = useSelector((state) => subdailyLayersActive(state));

  useEffect(() => {
    if (isKioskModeActive && errorTiles.length && !isLoading) {
      if (hasSubdailyLayers) {
        handleErrorTilesSubdaily();
      } else {
        handleErrorTiles();
      }
    }
  }, [action]);

  const handleErrorTiles = () => {
    const currentDate = formatDate(selectedDate, false);
    const errorTilesOnCurrentDate = errorTiles.filter((tile) => currentDate === tile.date).length;
    console.log('There are ', errorTilesOnCurrentDate, ' on ', selectedDate);
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

  const handleErrorTilesSubdaily = () => {
    const currentDate = formatDate(selectedDate, true);
    console.log(currentDate);
    console.log(errorTiles);
  };

  return null;
}

export default TileErrorHandler;

TileErrorHandler.propTypes = {
  action: PropTypes.object,
};
