import React from 'react';
import PropTypes from 'prop-types';
import CustomTooltip from '../util/custom-tooltip';

export default function EventIcon (props) {
  const {
    id,
    category,
    title,
    hideTooltip,
    isSelected,
  } = props;

  const slug = category.toLowerCase().split(' ').join('-');

  return (
    <CustomTooltip
      id={`${slug}-${id}`}
      text={title || category}
      hideTooltip={hideTooltip}
      isSelected={isSelected}
    >
      <i
        id={id + slug}
        className={`event-icon event-icon-${slug}`}
      />
    </CustomTooltip>
  );
}

EventIcon.propTypes = {
  id: PropTypes.string,
  category: PropTypes.string,
  hideTooltip: PropTypes.bool,
  title: PropTypes.string,
  isSelected: PropTypes.bool,
};
