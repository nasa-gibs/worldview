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

  const { activeString, config, proj } = useSelector((state) => ({
    activeString: state.compare.activeString,
    config: state.config,
    proj: state.proj.selected,
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

    frameDatesArray.push(frameDate);
    while (frameDate < endDate) {
      frameDate = getNextDate(frameDate);
      frameDatesArray.push(frameDate);
    }
    return frameDatesArray;
  }

  function getFrameDates() {
    const frameDatesArray = determineFrameDates();
    setFrameDates([...frameDatesArray]);
  }

  return (
    <DateRangeTileCheck frameDates={frameDates} activeLayers={activeLayers} config={config} proj={proj} />
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
