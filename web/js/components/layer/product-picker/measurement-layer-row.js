import React from 'react';
import PropTypes from 'prop-types';
import { ListGroupItem, Tooltip } from 'reactstrap';
import { Checkbox } from '../../util/checkbox';
import { availableAtDate } from '../../../modules/layers/util';
import moment from 'moment';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class MeasurementLayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked,
      tooltipOpen: false
    };
  }

  onClick() {
    const { removeLayer, addLayer, layer } = this.props;
    const checked = !this.state.checked;
    this.setState({ checked });
    if (!checked) {
      removeLayer(layer.id);
    } else {
      addLayer(layer.id);
    }
  }

  toggleTooltip() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
  }

  render() {
    const { layer, measurementId, title, selectedDate } = this.props;
    const { checked, tooltipOpen } = this.state;
    const layerIsAvailable = availableAtDate(layer, selectedDate);
    const diplayDate = moment(selectedDate).format('YYYY MMM DD');
    const listItemClass = !layerIsAvailable ? 'unavailable' : '';
    // Replace periods in id since period causes issue with tooltip targeting
    const itemElementId = 'checkbox-case-' + layer.id.split('.').join('-');

    return (
      <ListGroupItem
        key={measurementId + '-' + layer.id}
        onClick={this.onClick.bind(this)}
        id={itemElementId}
        className={listItemClass}
      >
        <Checkbox
          name={title}
          onClick={this.onClick.bind(this)}
          checked={checked}
          label={title}
          classNames="settings-check"
        >
          {!layerIsAvailable &&
            <>
              <i id="availability-info" className="fa fa-ban" />
              <Tooltip
                placement="top"
                isOpen={tooltipOpen}
                target={itemElementId}
                toggle={this.toggleTooltip.bind(this)}>
                    This layer has no visible content on the selected date: <br/>
                <span style={{ fontFamily: 'monospace' }}> {diplayDate} </span>
              </Tooltip>
            </>
          }
        </Checkbox>

      </ListGroupItem>
    );
  }
}
MeasurementLayerRow.defaultProps = {
  checked: false
};
MeasurementLayerRow.propTypes = {
  addLayer: PropTypes.func,
  checked: PropTypes.bool,
  layer: PropTypes.object,
  measurementId: PropTypes.string,
  onClick: PropTypes.func,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  title: PropTypes.string
};

export default MeasurementLayerRow;
