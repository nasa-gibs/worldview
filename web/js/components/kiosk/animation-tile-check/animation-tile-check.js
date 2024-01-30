import React, { useEffect, useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
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

  const config = useSelector((state) => state.config, shallowEqual);
  const proj = useSelector((state) => state.proj.selected, shallowEqual);
  const zoom = useSelector((state) => Math.floor(state.map.ui.selected.getView().getZoom()));
  const activeLayers = useSelector((state) => getActiveLayers(state, state.compare.activeString), shallowEqual);

  const [frameDates, setFrameDates] = useState([]);

  // Get an array of each frame date for duration of animation
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

  // This component is only renered when kioskMode is active & eic is subdaily or daily animation
  // This means we can listen to the animation play trigger once the tileError check has completed
  useEffect(() => {
    if (isPlaying) getFrameDates();
  }, [isPlaying]);

  return (
    <DateRangeTileCheck frameDates={frameDates} activeLayers={activeLayers} config={config} proj={proj} zoom={zoom} />
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
