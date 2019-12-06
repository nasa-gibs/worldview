import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import { getLayers } from '../../modules/layers/selectors';
import Scrollbars from '../../components/util/scrollbar';

class Layers extends React.Component {
  render() {
    const {
      overlays,
      baselayers,
      isActive,
      layerGroupName,
      height,
      checkerBoardPattern,
      layerSplit
    } = this.props;
    const outterClass = 'layer-container sidebar-panel';
    return isActive && (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div
          className={isActive ? outterClass : 'hidden ' + outterClass}
          style={{ display: isActive ? 'block' : 'none' }}
        >
          <LayerList
            title="Overlays"
            groupId="overlays"
            layerGroupName={layerGroupName}
            layerSplit={layerSplit}
            layers={overlays}
            checkerBoardPattern={checkerBoardPattern}
          />
          <LayerList
            title="Base Layers"
            groupId="baselayers"
            layerGroupName={layerGroupName}
            layers={baselayers}
            layerSplit={layerSplit}
            checkerBoardPattern={checkerBoardPattern}
          />
        </div>
      </Scrollbars>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { layers, proj } = state;
  const { isActive, layerGroupName, height, checkerBoardPattern } = ownProps;
  const componentLayers = layers[layerGroupName];
  const layerObj = getLayers(componentLayers, { proj: proj.id, group: 'all' });

  return {
    baselayers: layerObj.baselayers,
    overlays: layerObj.overlays,
    layerSplit: layerObj.overlays.length,
    layerGroupName,
    height,
    isActive,
    checkerBoardPattern
  };
}
const mapDispatchToProps = dispatch => ({});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layers);

Layers.propTypes = {
  baselayers: PropTypes.array,
  checkerBoardPattern: PropTypes.object,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  layerGroupName: PropTypes.string,
  layerSplit: PropTypes.number,
  overlays: PropTypes.array
};
