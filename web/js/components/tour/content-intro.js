import React from 'react';
import PropTypes from 'prop-types';

class TourIntro extends React.Component {
  render() {
    return (
      <div className="tour-intro">
        <p className="intro">
          Visually explore the past and the present of this dynamic planet from a satellite's perspective.
          Select from an array of stories below to learn more about Worldview, the satellite imagery we provide and events occurring around the world. <a href="#" title="Start using Worldview" onClick={this.props.toggleModalStart}>Start using Worldview <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
        </p>
      </div>
    );
  }
}

TourIntro.propTypes = {
  toggleModalStart: PropTypes.func.isRequired
};

export default TourIntro;
