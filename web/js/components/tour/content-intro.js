/* eslint-disable react/destructuring-assignment */
import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function TourIntro(props) {
  return (
    <div className="tour-intro">
      <p className="intro">
        Visually explore the past and the present of this dynamic planet from a satellite&apos;s perspective.
        Select from an array of stories below to learn more about @NAME@, the satellite imagery we provide and events occurring around the world.
        {' '}
        <a href="#" title="Start using @NAME@" onClick={props.toggleModalStart}>
          Start using @NAME@
          <FontAwesomeIcon icon="arrow-right" />
        </a>
      </p>
    </div>
  );
}

TourIntro.propTypes = {
  toggleModalStart: PropTypes.func.isRequired,
};

export default TourIntro;
