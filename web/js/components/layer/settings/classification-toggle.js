import React from 'react';
import PropTypes from 'prop-types';
// import { CustomInput } from 'reactstrap';
import Switch from '../../util/switch';
import Scrollbar from '../../util/scrollbar';

class ClassificationToggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: props.active
    };
  }

  render() {
    const { legend, toggle, palette, height } = this.props;
    const tooltips = legend.tooltips;
    return (
      <div className="layer-classification-toggle settings-component">
        <h2 className="wv-header">Disable/Enable</h2>
        <Scrollbar style={{ maxHeight: height + 'px' }}>
          {legend.colors.map((color, index) => {
            const id = legend.id + index;
            const tooltip = tooltips[index];
            const inActive = palette.disabled && palette.disabled.includes(index);
            return (
              <Switch
                id={id}
                key={id}
                color={color}
                label={tooltip}
                active={!inActive}
                toggle={() => toggle(index)}
              />
            );
          })}
        </Scrollbar>
      </div>
    );
  }
}
ClassificationToggle.defaultProps = {
  start: 100
};
ClassificationToggle.propTypes = {
  layer: PropTypes.object,
  setOpacity: PropTypes.func,
  start: PropTypes.number
};

export default ClassificationToggle;
