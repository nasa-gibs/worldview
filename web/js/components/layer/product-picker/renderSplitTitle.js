import React from 'react';
import PropTypes from 'prop-types';
import { getOrbitTrackTitle } from '../../../modules/layers/util';

/**
 * Split the layer name and details (which are found in parentheses)
 * onto separate lines
 *
 */
export default function RenderSplitLayerTitle(props) {
  const { layer } = props;
  const { title, subtitle } = layer;
  const layerIsOrbitTrack = (layer.layergroup || []).includes('reference_orbits');
  const layerTitle = !layerIsOrbitTrack ? title : `${title} (${getOrbitTrackTitle(layer)})`;
  const splitIdx = layerTitle.indexOf('(');
  const attrs = layerTitle.slice(splitIdx);
  const titleName = layerTitle.slice(0, splitIdx - 1);
  return splitIdx < 0
    ? (
      <>
        <h3>{layerTitle}</h3>
        {subtitle && (<h5>{subtitle}</h5>)}
      </>
    )
    : (
      <>
        <h3>{titleName}</h3>
        <h4>{attrs}</h4>
        {subtitle && (<h5>{subtitle}</h5>)}
      </>
    );
}

RenderSplitLayerTitle.propTypes = {
  layer: PropTypes.object,
};
