import React from 'react';
import PropTypes from 'prop-types';
import RangeInput from '../../util/range-input';

class OpacitySelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      start: props.start || 100
    };
  }
  render() {
    const { layer, setOpacity } = this.props;
    return (
      <div className="layer-opacity-select settings-component">
        <h2 className="wv-header">Opacity</h2>
        <RangeInput
          start={[this.state.start]}
          range={{ min: 0, max: 100 }}
          step={1}
          onSlide={val => {
            const opacity = Number(val[0]);
            setOpacity(layer.id, (opacity / 100).toFixed(2));
            this.setState({ start: opacity });
          }}
        />
        <div className="wv-label wv-label-opacity">
          {this.state.start + '%'}
        </div>
      </div>
    );
  }
}
OpacitySelect.defaultProps = {
  start: 100
};
OpacitySelect.propTypes = {
  start: PropTypes.number,
  setOpacity: PropTypes.func,
  layer: PropTypes.object
};

export default OpacitySelect;
