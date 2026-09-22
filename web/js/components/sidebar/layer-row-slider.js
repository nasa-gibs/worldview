import { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import useDebouncedSliderValue from '../util/use-debounced-slider-value';

function LayerRowSlider(props) {
  const {
    sliderId,
    min,
    max,
    value: propValue,
    unitLabel,
    tooltipText,
    onChange,
    isMobile,
    stopDndActivation,
  } = props;

  const [value, onSlide, isSliding] = useDebouncedSliderValue(propValue, onChange);
  const [isHovered, setIsHovered] = useState(false);

  const pillId = `${sliderId}-pill`;
  const pillText = `${value} ${unitLabel}${value === 1 ? '' : 'S'}`;

  return (
    <>
      <div
        className="layer-row-slider"
        onPointerDown={stopDndActivation}
        onMouseDown={stopDndActivation}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={stopDndActivation}
      >
        <input
          type="range"
          className="form-range form-range-compact"
          id={sliderId}
          min={min}
          max={max}
          step={1}
          value={value}
          aria-label={`${unitLabel} count`}
          onChange={(e) => onSlide(parseInt(e.target.value, 10))}
          style={{
            '--value-percent': `${((value - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <span
        id={pillId}
        className="day-range-pill badge rounded-pill text-light bg-dark"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {pillText}
      </span>
      {!isMobile && (
        <Tooltip
          id="center-align-tooltip"
          placement="top"
          target={pillId}
          boundariesElement="wv-content"
          isOpen={isHovered || isSliding.current}
          delay={{ show: 250, hide: 0 }}
        >
          {tooltipText}
        </Tooltip>
      )}
    </>
  );
}

LayerRowSlider.propTypes = {
  sliderId: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  value: PropTypes.number,
  unitLabel: PropTypes.string,
  tooltipText: PropTypes.string,
  onChange: PropTypes.func,
  isMobile: PropTypes.bool,
  stopDndActivation: PropTypes.func,
};

export default LayerRowSlider;
