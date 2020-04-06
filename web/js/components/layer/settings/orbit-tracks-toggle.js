import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Checkbox from '../../util/checkbox';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../modules/layers/actions';
import { getOrbitTrackTitle } from '../../../modules/layers/util';
import { getActiveLayers } from '../../../modules/layers/selectors';

const OrbitTracksToggle = (props) => {
  const {
    trackLayers,
    addLayer,
    removeLayer,
    activeLayers,
  } = props;

  return (
    <div className="layer-orbit-tracks settings-component">
      <h2 className="wv-header"> Orbit Tracks </h2>
      { trackLayers.map((layer) => {
        const { id } = layer;
        const isEnabled = !!activeLayers[id];
        const onCheck = () => (isEnabled ? removeLayer(id) : addLayer(id));
        return (
          <Checkbox
            key={id}
            title="Enable/disable orbit tracks for this layer"
            checked={isEnabled}
            onCheck={onCheck}
            label={getOrbitTrackTitle(layer)}
          />
        );
      }) }
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  const { config } = state;
  const { tracks } = ownProps.layer;
  return {
    trackLayers: tracks.map((trackName) => config.layers[trackName]),
    activeLayers: getActiveLayers(state),
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
)(OrbitTracksToggle);

OrbitTracksToggle.propTypes = {
  activeLayers: PropTypes.object,
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  trackLayers: PropTypes.array,
};
