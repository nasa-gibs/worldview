import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import { getActiveLayers } from '../../../modules/layers/selectors';
import DateRangeTileCheck from './date-range-tile-check';

function AnimationTileCheck(props) {
  const {
    startDate,
    endDate,
    interval,
    delta,
    isPlaying,
  } = props;

  const { activeString } = useSelector((state) => ({
    activeString: state.compare.activeString,
  }));
  const activeLayers = useSelector((state) => getActiveLayers(state, activeString).map((layer) => layer));

  const [frameDates, setFrameDates] = useState([]);

  useEffect(() => {
    if (isPlaying) getFrameDates();
  }, [isPlaying]);

  // get an array of each frame date for duration of animation
  function determineFrameDates() {
    const getNextDate = (date) => util.dateAdd(date, interval, delta);

    const frameDatesArray = [];
    let frameDate = startDate;
    // this puts an extra '.000Z' on the end of the date string
    frameDatesArray.push(frameDate.toISOString());
    while (frameDate < endDate) {
      frameDate = getNextDate(frameDate);
      frameDatesArray.push(frameDate.toISOString());
    }
    return frameDatesArray;
  }

  function getFrameDates() {
    const frameDatesArray = determineFrameDates();
    setFrameDates([...frameDatesArray]);
  }

  return (
    <DateRangeTileCheck frameDates={frameDates} activeLayers={activeLayers} />
  );
}

AnimationTileCheck.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  interval: PropTypes.string,
  delta: PropTypes.number,
  isPlaying: PropTypes.bool,
};

export default AnimationTileCheck;
