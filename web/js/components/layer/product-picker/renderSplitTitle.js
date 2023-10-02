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
  const layerIsOrbitTrack = layer.layergroup === 'Orbital Track';
  const layerTitle = !layerIsOrbitTrack ? title : `${title} (${getOrbitTrackTitle(layer, false)})`;
  let splitIdx;
  let attrs;
  let titleName;

  try {
    splitIdx = layerTitle.indexOf('(');
    attrs = layerTitle.slice(splitIdx);
    titleName = layerTitle.slice(0, splitIdx - 1);
  } catch (e) {
    console.error('Could not split title for ', layer.id);
    console.error(e);
  }

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
