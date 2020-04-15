import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Facet } from '@elastic/react-search-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCaretDown,
  faCaretRight,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'reactstrap';

function ProductFacet(props) {
  const [collapsed, toggleCollapse] = useState(false);
  const [tooltipVisible, toggleTooltip] = useState(false);

  const {
    field,
    label,
    show,
    tooltip,
    data,
  } = props;

  const renderHeaderIcons = () => (
    <>
      <Tooltip
        isOpen={tooltipVisible}
        target={`${field}-tooltip-target`}
        placement="right"
        toggle={() => toggleTooltip(!tooltipVisible)}
      >
        {tooltip}
      </Tooltip>
      <FontAwesomeIcon
        id={`${field}-tooltip-target`}
        className="facet-tooltip"
        icon={faInfoCircle}
      />
      <FontAwesomeIcon
        className={`facet-collapse-toggle ${!data.length && 'hidden'}`}
        icon={!collapsed ? faCaretDown : faCaretRight}
        onClick={() => toggleCollapse(!collapsed)}
      />
    </>
  );

  return collapsed || !data.length
    ? (
      <div className="facet-wrapper">
        {renderHeaderIcons()}
        <fieldset className="sui-facet">
          <legend className="sui-facet__title">{label}</legend>
        </fieldset>
        {!data.length && (
          <div className="no-matches">No matches.</div>
        )}
      </div>
    )
    : (
      <div className="facet-wrapper">
        {renderHeaderIcons()}
        {!collapsed && (
          <Facet
            field={field}
            label={label}
            filterType="any"
            show={show}
          />
        )}
      </div>
    );
}

ProductFacet.propTypes = {
  field: PropTypes.string,
  label: PropTypes.string,
  show: PropTypes.number,
  tooltip: PropTypes.string,
  data: PropTypes.array,
};


export default ProductFacet;
