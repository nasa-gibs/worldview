import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Checkbox from '../../util/checkbox';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../modules/layers/actions';
import { getOrbitTrackTitle } from '../../../modules/layers/util';
import { getActiveLayersMap } from '../../../modules/layers/selectors';

function AssociatedLayersToggle(props) {
  const {
    associatedLayers,
    addLayer,
    removeLayer,
    activeLayers,
  } = props;

  const getTitle = (layer) => {
    const [splitTitle] = layer.title.split('(');
    if (layer.type === 'granule') {
      return `Granule - ${splitTitle}`;
    } if (layer.track) {
      return `Orbit Track - ${getOrbitTrackTitle(layer)}`;
    }
    return `Daily Composite - ${splitTitle}`;
  };

  return (
    <div className="layer-orbit-tracks settings-component">
      <h2 className="wv-header"> Associated Layers </h2>
      { associatedLayers.map((layer) => {
        const { id } = layer;
        const isEnabled = !!activeLayers[id];
        const onCheck = () => (isEnabled ? removeLayer(id) : addLayer(id));
        return (
          <Checkbox
            id={id}
            key={id}
            title="Enable/disable this layer"
            checked={isEnabled}
            onCheck={onCheck}
            label={getTitle(layer)}
          />
        );
      }) }
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { config: { layers } } = state;
  const { orbitTracks = [], associatedLayers = [] } = ownProps.layer;
  const showLayers = associatedLayers
    .map((id) => layers[id])
    .concat(orbitTracks.map((id) => layers[id]));
  return {
    associatedLayers: showLayers,
    activeLayers: getActiveLayersMap(state),
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
)(AssociatedLayersToggle);

AssociatedLayersToggle.propTypes = {
  activeLayers: PropTypes.object,
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  associatedLayers: PropTypes.array,
};
