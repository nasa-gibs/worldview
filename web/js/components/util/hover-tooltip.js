import React from 'react';
import PropTypes from 'prop-types';
import {
  UncontrolledTooltip,
} from 'reactstrap';

/*
 *
 * @class HoverTooltip
 * @extends React.Component
 */
function HoverTooltip(props) {
  const {
    delay, fade, innerClassName, isMobile, labelText, placement, target,
  } = props;

  return !isMobile && (
    <UncontrolledTooltip
      id="center-align-tooltip"
      trigger="hover"
      target={target}
      boundariesElement="window"
      placement={placement}
      delay={delay}
      fade={fade}
      innerClassName={innerClassName}
    >
      {labelText}
    </UncontrolledTooltip>
  );
}

HoverTooltip.defaultProps = {
  placement: 'bottom',
  delay: { show: 50, hide: 0 },
  fade: true,
  innerClassName: '',
};

HoverTooltip.propTypes = {
  delay: PropTypes.object,
  fade: PropTypes.bool,
  innerClassName: PropTypes.string,
  isMobile: PropTypes.bool,
  labelText: PropTypes.string,
  placement: PropTypes.string,
  target: PropTypes.string,
};

export default HoverTooltip;
