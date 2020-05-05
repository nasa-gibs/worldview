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
    filterType,
    show,
    tooltip,
    data,
    view,
  } = props;

  const renderHeaderIcons = () => (
    <>
      <Tooltip
        className="facet-tooltip-content"
        isOpen={tooltipVisible}
        target={`${field}-tooltip-target`}
        placement="right"
        toggle={() => toggleTooltip(!tooltipVisible)}
        delay={{ show: 0, hide: 1000 }}
      >
        <div dangerouslySetInnerHTML={{ __html: tooltip }} />
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
            filterType={filterType}
            show={show}
            view={view}
          />
        )}
      </div>
    );
}

ProductFacet.propTypes = {
  field: PropTypes.string,
  label: PropTypes.string,
  filterType: PropTypes.string,
  show: PropTypes.number,
  tooltip: PropTypes.string,
  data: PropTypes.array,
  view: PropTypes.func,
};


export default ProductFacet;
