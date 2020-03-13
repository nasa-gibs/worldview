import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const TourIntro = (props) => (
  <div className="tour-intro">
    <p className="intro">
      Visually explore the past and the present of this dynamic planet from a satellite&apos;s perspective.
      Select from an array of stories below to learn more about Worldview, the satellite imagery we provide and events occurring around the world.
      {' '}
      <a href="#" title="Start using Worldview" onClick={props.toggleModalStart}>
        Start using Worldview
        <FontAwesomeIcon icon={faArrowRight} />
      </a>
    </p>
  </div>
);

TourIntro.propTypes = {
  toggleModalStart: PropTypes.func.isRequired,
};

export default TourIntro;
