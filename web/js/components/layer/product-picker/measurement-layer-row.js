import React from 'react';
import PropTypes from 'prop-types';
import { ListGroupItem } from 'reactstrap';
import { Checkbox } from '../../util/checkbox';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class MeasurementLayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked
    };
  }
  onClick() {
    const { removeLayer, addLayer, layerId } = this.props;
    const checked = !this.state.checked;
    this.setState({ checked: checked });
    if (!checked) {
      removeLayer(layerId);
    } else {
      addLayer(layerId);
    }
  }
  render() {
    const { layerId, measurementId, title } = this.props;
    const { checked } = this.state;
    return (
      <ListGroupItem
        key={measurementId + '-' + layerId}
        onClick={this.onClick.bind(this)}
        id={'checkbox-case-' + layerId}
      >
        <Checkbox
          name={title}
          onClick={this.onClick.bind(this)}
          checked={checked}
          label={title}
          classNames="settings-check"
        />
      </ListGroupItem>
    );
  }
}
MeasurementLayerRow.defaultProps = {
  checked: false
};
MeasurementLayerRow.propTypes = {
  onClick: PropTypes.func,
  measurementId: PropTypes.string,
  layerId: PropTypes.string,
  title: PropTypes.string,
  removeLayer: PropTypes.func,
  addLayer: PropTypes.func,
  checked: PropTypes.bool
};

export default MeasurementLayerRow;
