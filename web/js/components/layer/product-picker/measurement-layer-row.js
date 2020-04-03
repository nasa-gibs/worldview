import React from 'react';
import PropTypes from 'prop-types';
import { ListGroupItem, Tooltip } from 'reactstrap';
import moment from 'moment';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { availableAtDate } from '../../../modules/layers/util';
import Checkbox from '../../util/checkbox';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../modules/layers/actions';

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
      tooltipOpen: false,
    };
    this.onClick = this.onClick.bind(this);
    this.toggleTooltip = this.toggleTooltip.bind(this);
  }

  onClick() {
    const { removeLayer, addLayer, layer } = this.props;
    const { checked } = this.state;
    const newChecked = !checked;
    this.setState((prevState) => ({
      checked: !prevState.checked,
    }));
    if (!newChecked) {
      removeLayer(layer.id);
    } else {
      addLayer(layer.id);
    }
  }

  toggleTooltip() {
    this.setState((prevState) => ({
      tooltipOpen: !prevState.tooltipOpen,
    }));
  }

  render() {
    const {
      layer, measurementId, title, selectedDate,
    } = this.props;
    const { checked, tooltipOpen } = this.state;
    const layerIsAvailable = availableAtDate(layer, selectedDate);
    const diplayDate = moment.utc(selectedDate).format('YYYY MMM DD');
    const listItemClass = !layerIsAvailable ? 'unavailable' : '';
    // Replace periods in id since period causes issue with tooltip targeting
    const itemElementId = `checkbox-case-${layer.id.split('.').join('-')}`;

    return (
      <ListGroupItem
        key={`${measurementId}-${layer.id}`}
        onClick={this.onClick}
        id={itemElementId}
        className={listItemClass}
      >
        <Checkbox
          name={title}
          onClick={this.onClick}
          checked={checked}
          label={title}
          classNames="settings-check"
        >
          {!layerIsAvailable
            && (
              <>
                <FontAwesomeIcon icon={faBan} id="availability-info" />
                <Tooltip
                  placement="top"
                  isOpen={tooltipOpen}
                  target={itemElementId}
                  toggle={this.toggleTooltip}
                >
                  This layer has no visible content on the selected date:
                  {' '}
                  <br />
                  <span style={{ fontFamily: 'monospace' }}>
                    {' '}
                    {diplayDate}
                    {' '}
                  </span>
                </Tooltip>
              </>
            )}
        </Checkbox>

      </ListGroupItem>
    );
  }
}
MeasurementLayerRow.defaultProps = {
  checked: false,
};
MeasurementLayerRow.propTypes = {
  addLayer: PropTypes.func,
  checked: PropTypes.bool,
  layer: PropTypes.object,
  measurementId: PropTypes.string,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  title: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => {
  const { date } = state;
  return {
    selectedDate: date.selected,
  };
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    dispatch(addLayerAction(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayerAction(id));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeasurementLayerRow);
