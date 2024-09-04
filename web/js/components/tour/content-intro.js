/* eslint-disable react/destructuring-assignment */
import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLineRightCircleFill } from '@edsc/earthdata-react-icons/horizon-design-system/earthdata/ui';

function TourIntro(props) {
  return (
    <div className="tour-intro">
      <p className="intro">
        Visually explore the past and the present of this dynamic planet from a satellite&apos;s perspective.
        Select from an array of stories below to learn more about @NAME@ (a part of
        {' '}
        <a href="https://www.earthdata.nasa.gov/" target="_blank" rel="noreferrer">NASA Earthdata</a>
        ), the satellite imagery we provide and events occurring around the world.
        {' '}
        <a href="#" title="Start using @NAME@" onClick={props.toggleModalStart} className="start-link">
          Start using @NAME@
          <ArrowLineRightCircleFill class="intro-arrow" size="16px" />
        </a>
      </p>
    </div>
  );
}

TourIntro.propTypes = {
  toggleModalStart: PropTypes.func.isRequired,
};

export default TourIntro;
