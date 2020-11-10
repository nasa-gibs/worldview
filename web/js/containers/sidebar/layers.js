import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers } from '../../modules/layers/selectors';
import Scrollbars from '../../components/util/scrollbar';

function Layers (props) {
  const {
    overlays,
    baselayers,
    isActive,
    layerGroupName,
    height,
    layerSplit,
  } = props;
  const outterClass = 'layer-container sidebar-panel';
  return isActive && (
  <Scrollbars style={{ maxHeight: `${height}px` }}>
    <div
      className={isActive ? outterClass : `hidden ${outterClass}`}
      style={{ display: isActive ? 'block' : 'none' }}
    >
      <LayerList
        title="Overlays"
        groupId="overlays"
        layerGroupName={layerGroupName}
        layerSplit={layerSplit}
        layers={overlays}
      />
      <LayerList
        title="Base Layers"
        groupId="baselayers"
        layerGroupName={layerGroupName}
        layers={baselayers}
        layerSplit={layerSplit}
      />
    </div>
  </Scrollbars>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { layers, proj } = state;
  const { layerGroupName } = ownProps;
  const componentLayers = layers[layerGroupName];
  const layerObj = getLayers(componentLayers, { proj: proj.id, group: 'all' });

  return {
    baselayers: layerObj.baselayers,
    overlays: layerObj.overlays,
    layerSplit: layerObj.overlays.length,
    layerGroupName,
  };
};

export default connect(
  mapStateToProps,
  null,
)(Layers);

Layers.propTypes = {
  baselayers: PropTypes.array,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  layerGroupName: PropTypes.string,
  layerSplit: PropTypes.number,
  overlays: PropTypes.array,
};
