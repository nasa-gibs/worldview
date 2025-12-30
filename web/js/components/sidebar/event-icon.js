import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

const eventMappings = {
  dustHaze: 'dust-and-haze',
  icebergs: 'icebergs',
  floods: 'floods',
  manmade: 'manmade',
  seaLakeIce: 'icebergs',
  severeStorms: 'severe-storms',
  snow: 'snow',
  volcanoes: 'volcanoes',
  waterColor: 'water-color',
  wildfires: 'wildfires',
};

export default function EventIcon (props) {
  const {
    id,
    category,
    title,
    hideTooltip,
    withPin,
  } = props;

  return (
    <div>
      {withPin
        && (
          <img
            id={`${id + category}-pin`}
            className={`event-icon-pin event-icon-${category}-pin`}
            src="../images/natural-events/pin.svg"
          />
        )}
      <img
        id={id + category}
        className={`event-icon event-icon-${category}`}
        src={`../images/natural-events/icon-${eventMappings[category] || 'critical'}.svg`}
      />
      {!hideTooltip && (
        <UncontrolledTooltip
          id={`center-align-tooltip ${category}-${id}`}
          className="event-icon-tooltip"
          placement="top"
          target={id + category}
          fade={false}
          autohide={false}
        >
          {title || category}
        </UncontrolledTooltip>
      )}
    </div>
  );
}

EventIcon.propTypes = {
  id: PropTypes.string,
  category: PropTypes.string,
  hideTooltip: PropTypes.bool,
  title: PropTypes.string,
  withPin: PropTypes.bool,
};
