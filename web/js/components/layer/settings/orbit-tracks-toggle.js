import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Checkbox } from '../../util/checkbox';
import { addLayer, removeLayer } from '../../../modules/layers/actions';
import { getOrbitTrackTitle } from '../../../modules/layers/util';

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
        const isEnabled = activeLayers.some((l) => l.id === id);
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
  const { config, compare, layers } = state;
  const trackLayers = ownProps.layer.tracks.map((trackName) => config.layers[trackName]);
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = layers[activeString];
  return {
    trackLayers,
    activeLayers,
  };
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    dispatch(addLayer(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayer(id));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OrbitTracksToggle);

OrbitTracksToggle.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  trackLayers: PropTypes.array,
};
