import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

export default function Zot (props) {
  const { zot, layer } = props;
  const [tooltipVisible, toggleTooltip] = useState(false);

  let zotString = '';
  if (zot && zot.overZoomValue) {
    zotString += `Layer is overzoomed by ${zot.overZoomValue.toString()}x its maximum zoom level <br/>`;
  }
  if (zot && zot.layerNotices) {
    zotString += zot.layerNotices;
  }

  return (
    <div
      id={`${layer}-zot`}
      className="zot"
    >
      <Tooltip
        className="zot-tooltip"
        isOpen={tooltipVisible}
        target={`${layer}-zot`}
        placement="right"
        toggle={() => toggleTooltip(!tooltipVisible)}
        delay={{ show: 0, hide: 300 }}
      >
        <div dangerouslySetInnerHTML={{ __html: zotString }} />
      </Tooltip>
      <b>!</b>
    </div>
  );
}

Zot.propTypes = {
  layer: PropTypes.string,
  zot: PropTypes.object,
};
