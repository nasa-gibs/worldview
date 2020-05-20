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
  const [tooltipVisible, toggleTooltip] = useState(false);

  const {
    config,
    data,
    collapsed,
    toggleCollapse,
  } = props;

  const {
    field,
    booleanOptionLabel,
    label,
    filterType,
    tooltip,
    show,
    view,
  } = config;

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
        onClick={() => toggleCollapse(field)}
      />
    </>
  );

  const noBooleanResults = field === 'availableAtDate'
     && data.length === 1
     && data.find(({ value }) => value === 'false');
  const noResults = !data.length || noBooleanResults;

  return collapsed || noResults
    ? (
      <div className="facet-wrapper">
        {renderHeaderIcons()}
        <fieldset className="sui-facet">
          <legend className="sui-facet__title">{label}</legend>
        </fieldset>
        {noResults && !collapsed && (
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
            label={booleanOptionLabel || label}
            filterType={filterType}
            show={show}
            view={view}
          />
        )}
      </div>
    );
}

ProductFacet.propTypes = {
  config: PropTypes.object,
  collapsed: PropTypes.bool,
  data: PropTypes.array,
  toggleCollapse: PropTypes.func,
};


export default ProductFacet;
