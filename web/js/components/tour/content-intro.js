import React from 'react';
import PropTypes from 'prop-types';

class TourIntro extends React.Component {
  render() {
    return (
      <div className="tour-intro">
        <p className="intro">
          The NASA Worldview app provides a satellite's perspective of the planet as it
          looks today and as it has in the past. Click an event below to analyze the event in
          great detail within the application. These guides will walk you through new and
          create ways to use Worldview. <a href="#" title="Start using Worldview" onClick={this.props.toggleModalStart}>Start using Worldview <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
        </p>
      </div>
    );
  }
}

TourIntro.propTypes = {
  toggleModalStart: PropTypes.func.isRequired
};

export default TourIntro;
