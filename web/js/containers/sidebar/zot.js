import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

export default function Zot (props) {
  const { zot, layer } = props;
  const [tooltipVisible, toggleTooltip] = useState(false);
  let className = 'zot';
  let tooltipString = '';
  if (zot && zot.overZoomValue) {
    tooltipString += `Layer is overzoomed by ${zot.overZoomValue.toString()}x its maximum zoom level <br/>`;
  }
  if (zot && zot.layerNotices) {
    tooltipString += zot.layerNotices;
    className = 'zot layer-notice';
  }

  return (
    <div
      id={`${layer}-zot`}
      className={className}
    >
      <Tooltip
        className="zot-tooltip"
        isOpen={tooltipVisible}
        target={`${layer}-zot`}
        placement="right"
        toggle={() => toggleTooltip(!tooltipVisible)}
        delay={{ show: 0, hide: 300 }}
      >
        <div dangerouslySetInnerHTML={{ __html: tooltipString }} />
      </Tooltip>
      <b>!</b>
    </div>
  );
}

Zot.propTypes = {
  layer: PropTypes.string,
  zot: PropTypes.object,
};
