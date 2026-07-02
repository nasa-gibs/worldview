import { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import util from '../../util/util';

export default function VectorMetaTooltip(props) {
  const {
    id,
    index,
    description,
  } = props;

  const [tooltipOpen, setTooltipOpen] = useState(false);

  function mouseEnter() {
    setTooltipOpen(true);
  }

  function mouseLeave() {
    setTooltipOpen(false);
  }

  const elId = util.cleanId(String(`tooltip${id}${index}`));

  return (
    <div
      className="vector-info-tooltip-case"
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      key={elId}
    >
      <div id={elId} className="sub-case">
        <FontAwesomeIcon icon="info" className="vector-info-icon cursor-pointer" widthAuto />
      </div>
      <Tooltip
        id="center-align-tooltip"
        dangerouslySetInnerHTML={{ __html: description }}
        boundariesElement="window"
        placement="right"
        isOpen={tooltipOpen}
        target={elId}
        fade={false}
      />
    </div>
  );
}

VectorMetaTooltip.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  description: PropTypes.string,
};
