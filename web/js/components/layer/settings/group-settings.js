import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Slider from 'rc-slider';
import { setOpacity as setOpacityAction } from '../../../modules/layers/actions';
import { getActiveLayersMap } from '../../../modules/layers/selectors';

function GroupSettings(props) {
  const {
    setOpacity,
    layers,
    activeLayersMap,
  } = props;

  const opacities = layers.map((id) => activeLayersMap[id].opacity);
  const averageLayerOpacities = opacities.reduce((acc, curr) => acc + curr) / layers.length;
  const valuesAligned = opacities.every((o) => o === opacities[0]);
  const adjustedPercentage = Math.ceil(averageLayerOpacities * 100);

  return (
    <div className="layer-opacity-select settings-component">
      <h2 className="wv-header"> Opacity </h2>
      <Slider
        defaultValue={adjustedPercentage}
        onChange={(val) => {
          setOpacity(layers, (val / 100).toFixed(2));
        }}
      />
      <div className="wv-label wv-label-opacity">
        {`${adjustedPercentage}%`}
      </div>
      {!valuesAligned && (
        <div>
          Notice: Opacity settings for individual layers in this
          group are varied. Changing the opacity here will equalize them
        </div>
      )}
    </div>
  );
}
const mapDispatchToProps = (dispatch) => ({
  setOpacity: (ids, opacity) => {
    ids.forEach((id) => {
      dispatch(setOpacityAction(id, opacity));
    });
  },
});
const mapStateToProps = (state) => ({
  activeLayersMap: getActiveLayersMap(state),
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GroupSettings);

GroupSettings.propTypes = {
  activeLayersMap: PropTypes.object,
  layers: PropTypes.array,
  setOpacity: PropTypes.func,
};
