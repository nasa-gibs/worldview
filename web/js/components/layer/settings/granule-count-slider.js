import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverTooltip from '../../util/hover-tooltip';
import useDebouncedSliderValue from '../../util/use-debounced-slider-value';
import util from '../../../util/util';
import { DEFAULT_NUM_GRANULES, MIN_GRANULES, MAX_GRANULES } from '../../../modules/layers/constants';

function GranuleCountSlider(props) {
  const {
    count,
    def,
    granuleDates,
    isMobile,
    updateGranuleLayerOptions,
  } = props;

  const [value, onSlide] = useDebouncedSliderValue(
    count,
    (val) => updateGranuleLayerOptions(granuleDates, def, val),
  );

  const infoId = `granule-count-info-${util.encodeId(def.id)}`;

  return (
    <div className="layer-granule-count-select settings-component">
      <div className="d-flex">
        <h2 className="wv-header">Granule Count</h2>
        <FontAwesomeIcon id={infoId} icon="info-circle" className="ms-2" widthAuto />
        <HoverTooltip
          target={infoId}
          placement="right"
          isMobile={isMobile}
          labelText="Number of most recent granules composited together, ending at the selected time."
        />
      </div>
      <input
        type="range"
        className="form-range"
        min={MIN_GRANULES}
        max={MAX_GRANULES}
        step={1}
        value={value}
        onChange={(e) => onSlide(parseInt(e.target.value, 10))}
        style={{
          '--value-percent': `${((value - MIN_GRANULES) / (MAX_GRANULES - MIN_GRANULES)) * 100}%`,
        }}
      />
      <div className="wv-label wv-label-granule-count mt-1">
        {value === 1 ? '1 granule' : `${value} granules`}
      </div>
    </div>
  );
}

GranuleCountSlider.defaultProps = {
  count: DEFAULT_NUM_GRANULES,
};
GranuleCountSlider.propTypes = {
  granuleDates: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  def: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  count: PropTypes.number,
  isMobile: PropTypes.bool,
  updateGranuleLayerOptions: PropTypes.func,
};

export default GranuleCountSlider;
