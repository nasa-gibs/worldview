import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverTooltip from '../../util/hover-tooltip';
import useDebouncedSliderValue from '../../util/use-debounced-slider-value';
import util from '../../../util/util';
import { MIN_DAY_COUNT } from '../../../modules/layers/constants';

function DayRangeSlider(props) {
  const {
    layer,
    dayCount,
    maxDayRange,
    isMobile,
    updateDayCount,
  } = props;

  const [value, onSlide] = useDebouncedSliderValue(
    dayCount,
    (val) => updateDayCount(layer.id, val),
  );

  const infoId = `day-range-info-${util.encodeId(layer.id)}`;

  return (
    <div className="layer-day-range-select settings-component">
      <div className="d-flex">
        <h2 className="wv-header">Days to Aggregate</h2>
        <FontAwesomeIcon id={infoId} icon="info-circle" className="ms-2" widthAuto />
        <HoverTooltip
          target={infoId}
          placement="right"
          isMobile={isMobile}
          labelText="Number of consecutive days of imagery composited together, ending on the selected date."
        />
      </div>
      <input
        type="range"
        className="form-range"
        min={MIN_DAY_COUNT}
        max={maxDayRange}
        step={1}
        value={value}
        onChange={(e) => onSlide(parseInt(e.target.value, 10))}
        style={{
          '--value-percent': `${((value - MIN_DAY_COUNT) / (maxDayRange - MIN_DAY_COUNT)) * 100}%`,
        }}
      />
      <div className="wv-label wv-label-day-range mt-1">
        {value === 1 ? '1 day' : `${value} days`}
      </div>
    </div>
  );
}

DayRangeSlider.propTypes = {
  layer: PropTypes.object,
  dayCount: PropTypes.number,
  maxDayRange: PropTypes.number,
  isMobile: PropTypes.bool,
  updateDayCount: PropTypes.func,
};

export default DayRangeSlider;
