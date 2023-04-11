import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getNumberStepsBetween, getNextDateTime } from '../../../modules/date/util';
import { getSelectedDate } from '../../../modules/date/selectors';
import { promiseImageryForTime } from '../../../modules/map/util';
import { setPreload } from '../../../modules/date/actions';

function BufferQuickAnimate(props) {
  const {
    action,
    date,
    dateCompareState,
    lastPreloadDate,
    preloaded,
    promiseImageryState,
    setPreload,
  } = props;

  useEffect(() => {
    if (action.value) {
      bufferQuickAnimate(action.value);
    }
  }, [action]);

  async function bufferQuickAnimate(arrowDown) {
    const BUFFER_SIZE = 8;
    const preloadPromises = [];
    const selectedDate = getSelectedDate(dateCompareState);
    const dateState = { date };
    const currentBuffer = preloaded ? getNumberStepsBetween(dateState, selectedDate, lastPreloadDate) : 0;

    if (currentBuffer >= BUFFER_SIZE) {
      return;
    }

    const currentDate = preloaded ? lastPreloadDate : selectedDate;
    const direction = arrowDown === 'right' ? 1 : -1;
    let nextDate = getNextDateTime(dateCompareState, direction, currentDate);

    for (let step = 1; step <= BUFFER_SIZE; step += 1) {
      preloadPromises.push(promiseImageryForTime(promiseImageryState, nextDate));
      if (step !== BUFFER_SIZE) {
        nextDate = getNextDateTime(dateCompareState, direction, nextDate);
      }
    }
    await Promise.all(preloadPromises);
    setPreload(true, nextDate);
  }

  return null;
}

const mapStateToProps = (state) => {
  const {
    date, map, proj, embed, compare, layers, palettes, vectorStyles,
  } = state;
  const dateCompareState = { date, compare };
  const { preloaded, lastPreloadDate } = date;
  const promiseImageryState = {
    map, proj, embed, compare, layers, palettes, vectorStyles,
  };

  return {
    date,
    dateCompareState,
    lastPreloadDate,
    preloaded,
    promiseImageryState,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setPreload: (preloaded, lastPreloadDate) => {
    dispatch(setPreload(preloaded, lastPreloadDate));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BufferQuickAnimate);

BufferQuickAnimate.propTypes = {
  action: PropTypes.object,
  date: PropTypes.object,
  dateCompareState: PropTypes.object,
  lastPreloadDate: PropTypes.object,
  preloaded: PropTypes.bool,
  promiseImageryState: PropTypes.object,
  setPreload: PropTypes.func,
};
