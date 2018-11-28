import React from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import RangeInput from '../../util/range-input';
import { Checkbox } from '../../util/checkbox';

class ThresholdSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      start: props.start,
      end: props.end,
      squashed: props.squashed,
      activeDragger: 'start'
    };
    this.debounceSetRange = lodashDebounce(props.setRange, 300);
  }
  updateSquash(boo) {
    const { setRange, layerId, index } = this.props;
    const { start, end, squashed } = this.state;
    const isSquashed = !squashed;
    setRange(layerId, parseFloat(start), parseFloat(end), isSquashed, index);
    this.setState({ squashed: isSquashed });
  }
  updateThreshold(thresholdArray) {
    const { layerId, index } = this.props;
    const { start, end } = this.state;

    const newStart = Math.ceil(Number(thresholdArray[0]));
    const newEnd = Math.ceil(Number(thresholdArray[1]));
    if (newStart !== start && newEnd !== end) {
      this.setState({
        start: newStart,
        end: newEnd
      });
    } else if (newStart !== start) {
      this.setState({
        start: newStart
      });
    } else if (newEnd !== end) {
      this.setState({
        end: newEnd
      });
    } else {
      return;
    }
    this.debounceSetRange(
      layerId,
      parseFloat(newStart),
      parseFloat(newEnd),
      this.state.squashed,
      index
    );
  }
  render() {
    const { start, end, squashed } = this.state;
    const { index, min, max, legend } = this.props;
    const units = legend.units || '';
    const startLabel = legend.tooltips[start] + ' ' + units;
    const endLabel = legend.tooltips[end] + ' ' + units;
    return (
      <div className="layer-threshold-select settings-component">
        <h2 className="wv-header">Thresholds</h2>
        <div id={'wv-palette-squash' + index} className="wv-palette-squash">
          <Checkbox
            name="Squash Palette"
            color="gray"
            checked={squashed}
            label={'Squash Palette'}
            classNames="wv-squash-button-check"
            id={'wv-squash-button-check' + index}
            onCheck={this.updateSquash.bind(this)}
          />
        </div>
        <div
          id={'wv-layer-options-threshold' + index}
          className="wv-layer-options-threshold"
        >
          <RangeInput
            start={[start, end]}
            range={{ min: min, max: max }}
            step={1}
            onSlide={this.updateThreshold.bind(this)}
          />
          <div className="wv-label">
            <span className="wv-label-range-min wv-label-range">
              {startLabel}
            </span>
            <span className="wv-label-range-max wv-label-range">
              {endLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
ThresholdSelect.propTypes = {
  start: PropTypes.number,
  end: PropTypes.number,
  onSlide: PropTypes.func,
  index: PropTypes.number
};

export default ThresholdSelect;
