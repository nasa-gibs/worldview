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
const HoverTooltip = (props) => {
  const {
    isMobile, labelText, placement, target,
  } = props;

  return !isMobile && (
    <UncontrolledTooltip
      trigger="hover"
      target={target}
      boundariesElement="window"
      placement={placement}
    >
      {labelText}
    </UncontrolledTooltip>
  );
};

HoverTooltip.defaultProps = {
  placement: 'bottom',
};

HoverTooltip.propTypes = {
  isMobile: PropTypes.bool,
  labelText: PropTypes.string,
  placement: PropTypes.string,
  target: PropTypes.string,
};

export default HoverTooltip;
