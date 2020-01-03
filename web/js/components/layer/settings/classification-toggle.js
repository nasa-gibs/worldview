import React from 'react';
import PropTypes from 'prop-types';
import { CustomInput } from 'reactstrap';
import { Checkbox } from '../../util/checkbox';

class ClassificationToggle extends React.Component {

  render() {
    const { layer, legend } = this.props;
    const tooltips = legend.tooltips;
    return (
      <div className="layer-classification-toggle settings-component">
        <h2 className="wv-header">Category Enable/Disable</h2>
        {legend.colors.map((color, index) => {
          const id = legend.id + index;
          const tooltip = tooltips[index];
          return (
            // <CustomInput key={id} type="switch" id={id} name={tooltip + ' switch'} label={tooltip} />
            <Checkbox
              key={id}
              title={tooltip}
              checked={false}
              label={tooltip}
            />
          );
        })}
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
