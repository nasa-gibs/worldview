import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearErrorTiles as clearErrorTilesAction } from '../../../modules/ui/actions';
import { selectDate as selectDateAction } from '../../../modules/date/actions';
import { getNextDateTime } from '../../../modules/date/util';

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function TileErrorsHandler({ tileErrorAction }) {
  const dispatch = useDispatch();
  const clearErrorTiles = () => { dispatch(clearErrorTilesAction()); };
  const selectDate = (date) => { dispatch(selectDate(date)); };

  const { isKioskModeActive, errorTiles, appDate, date, compare, } = useSelector((state) => ({
    isKioskModeActive: state.ui.isKioskModeActive,
    errorTiles: state.ui.errorTiles,
    appDate: state.date.appNow,
    date: state.date,
    compare: state.compare,
  }));

  useEffect(() => {
    if (isKioskModeActive && errorTiles.length) {
      handleErrorTiles();
    }
  }, [tileErrorAction]);


  const handleErrorTiles = () => {
    // console.log('I need to handle some tile errors', errorTiles);
    const currentDate = formatDate(appDate)
    let errorTilesOnCurrentDate = 0
    errorTiles.map((tile) => {
      if (currentDate === tile.date) errorTilesOnCurrentDate += 1
    })
    if (errorTilesOnCurrentDate > 4){
       console.log('wow there are ', errorTilesOnCurrentDate, ' on ', appDate)
       const state = { date, compare }
       const prevDate = getNextDateTime(state, '-1',)
       console.log(prevDate)
    }
    clearErrorTiles();
  };

  return null;
}

export default TileErrorsHandler;
