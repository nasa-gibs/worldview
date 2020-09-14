import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ListGroupItem, Tooltip } from 'reactstrap';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { available, getActiveLayers } from '../../../../modules/layers/selectors';
import Checkbox from '../../../util/checkbox';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../../modules/layers/actions';
import SelectedDate from '../../../selected-date';
import getSelectedDate from '../../../../modules/date/selectors';
import { getLayerNoticesForLayer } from '../../../../modules/notifications/util';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
function MeasurementLayerRow (props) {
  const {
    isEnabled, removeLayer, addLayer, layer, measurementId, title, selectedDate, layerNotices,
  } = props;
  const [tooltipVisible, toggleTooltip] = useState(false);
  const layerIsAvailable = available(layer.id, selectedDate, [layer]);
  const listItemClass = !layerIsAvailable || layerNotices ? 'unavailable' : '';
  // Replace periods in id since period causes issue with tooltip targeting
  const itemElementId = `checkbox-case-${layer.id.split('.').join('-')}`;
  const checkboxId = `${layer.id.split('.').join('-')}-checkbox`;

  function onClick() {
    if (isEnabled) {
      removeLayer(layer.id);
    } else {
      addLayer(layer.id);
    }
  }

  return (
    <ListGroupItem
      key={`${measurementId}-${layer.id}`}
      id={itemElementId}
      className={listItemClass}
    >
      <Checkbox
        id={checkboxId}
        name={title}
        onClick={onClick}
        checked={isEnabled}
        label={title}
        classNames="settings-check"
      >
        {!layerIsAvailable && (<FontAwesomeIcon icon={faBan} id="availability-info" />)}
        {layerNotices && (<FontAwesomeIcon icon={faExclamationTriangle} id="notice-info" />)}
        {(layerNotices || !layerIsAvailable) && (
          <Tooltip
            className="zot-tooltip"
            placement="top"
            isOpen={tooltipVisible}
            target={itemElementId}
            toggle={() => toggleTooltip(!tooltipVisible)}
          >
            {!layerIsAvailable && (
              <div>
                This layer has no visible content on the selected date:
                <br />
                <span style={{ fontFamily: 'monospace' }}>
                  <SelectedDate />
                </span>
              </div>
            )}
            {layerNotices
              ? (<div dangerouslySetInnerHTML={{ __html: layerNotices }} />)
              : ''}
          </Tooltip>
        )}
      </Checkbox>
    </ListGroupItem>
  );
}

MeasurementLayerRow.propTypes = {
  addLayer: PropTypes.func,
  isEnabled: PropTypes.bool,
  layer: PropTypes.object,
  layerNotices: PropTypes.string,
  measurementId: PropTypes.string,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  title: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => {
  const { notifications } = state;
  const activeLayerMap = getActiveLayers(state);
  const { id } = ownProps.layer;
  return {
    isEnabled: !!activeLayerMap[id],
    selectedDate: getSelectedDate(state),
    layerNotices: getLayerNoticesForLayer(id, notifications),
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
