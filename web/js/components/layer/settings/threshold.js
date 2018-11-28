import React from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import RangeInput from '../../util/range-input';
import util from '../../../util/util';
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
  setStartEnd(start, end, activeDragger) {
    this.setState({
      start: start,
      end: end,
      activeDragger: activeDragger
    });
  }
  updateThreshold(thresholdArray) {
    const { layerId, index } = this.props;
    const { start, end } = this.state;

    const newStart = Math.ceil(Number(thresholdArray[0]));
    const newEnd = Math.ceil(Number(thresholdArray[1]));
    if (newStart !== start && newEnd !== end) {
      this.setState({
        start: newStart,
        end: newEnd,
        activeDragger: 'start'
      });
    } else if (newStart !== start) {
      this.setState({
        start: newStart,
        activeDragger: 'start'
      });
    } else if (newEnd !== end) {
      this.setState({
        end: newEnd,
        activeDragger: 'end'
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
  positionText(str, position, len) {
    const labelDivWidth = 262;
    const padding = 10;
    const textWidth = util.getTextWidth(str, '13px Open Sans');
    const textOffset = (textWidth + padding) / 2;
    const offset = (position / len) * labelDivWidth - textOffset;
    return offset < 0
      ? 0
      : offset + textOffset > labelDivWidth
        ? labelDivWidth - (textWidth + padding)
        : offset;
  }
  render() {
    const { start, end, squashed, activeDragger } = this.state;
    const { index, min, max, legend } = this.props;
    const len = legend.tooltips.length;
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
            <div
              style={{
                left: this.positionText(startLabel, start, len) + 'px',
                zIndex: activeDragger === 'start' ? 10 : 5
              }}
              className="wv-label-range-min wv-label-range-case"
            >
              <span>{startLabel}</span>
            </div>
            <div
              style={{
                right: this.positionText(endLabel, max - end, len) + 'px',
                zIndex: activeDragger === 'end' ? 10 : 5
              }}
              className="wv-label-range-max wv-label-range-case"
            >
              <span>{endLabel}</span>
            </div>
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
