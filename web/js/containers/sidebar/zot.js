import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

export default function Zot (props) {
  const { zot, layer, isMobile } = props;
  let className = 'zot';
  let tooltipString = '';
  const delay = isMobile ? { show: 300, hide: 300 } : { show: 0, hide: 300 };

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
      <UncontrolledTooltip
        className="zot-tooltip"
        target={`${layer}-zot`}
        placement="right"
        trigger="hover"
        delay={delay}
      >
        <div dangerouslySetInnerHTML={{ __html: tooltipString }} />
      </UncontrolledTooltip>
      <b>!</b>
    </div>
  );
}

Zot.propTypes = {
  isMobile: PropTypes.bool,
  layer: PropTypes.string,
  zot: PropTypes.object,
};
