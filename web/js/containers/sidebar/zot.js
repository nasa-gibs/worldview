import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import util from '../../util/util';

export default function Zot (props) {
  const { zot, layer, isMobile } = props;
  let className = 'zot';
  let tooltipString = '';
  const delay = isMobile ? { show: 300, hide: 300 } : { show: 50, hide: 500 };
  if (zot) {
    const {
      overZoomValue,
      layerNotices,
      underZoomValue,
      hasGranules,
    } = zot;
    if (overZoomValue) {
      className = 'zot overzoom';
      tooltipString += `Layer is overzoomed by ${zot.overZoomValue.toString()}x its maximum zoom level. <br/>`;
    } else if (underZoomValue > 0) {
      className = 'zot underzoom';
      tooltipString += `Layer is underzoomed by ${zot.underZoomValue.toString()}x its minimum zoom level; zoom in to see imagery <br/>`;
    } else if (Object.hasOwn(zot, 'hasGranules') && !hasGranules) {
      className = 'zot no-granules';
      tooltipString += 'No visible imagery on this date and/or location. <br/> Try moving the map or select a different date in the layer\'s settings. <br/>';
    }
    if (layerNotices) {
      tooltipString += zot.layerNotices;
      className = 'zot layer-notice';
    }
    if (overZoomValue && layerNotices) {
      className = 'zot overzoom layer-notice';
    }
  }

  return (
    <div
      id={`${util.encodeId(layer)}-zot`}
      className={className}
    >
      <UncontrolledTooltip
        id="center-align-tooltip"
        className="zot-tooltip"
        boundariesElement="window"
        target={`${util.encodeId(layer)}-zot`}
        placement="right"
        trigger="hover"
        autohide={isMobile}
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
