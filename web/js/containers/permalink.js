import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Share from '../components/share/share';

class Permalink extends Component {
  render() {
    return <Share />;
  }
}

function mapStateToProps(state) {
  const { projection } = state.projection;

  return {
    projection
  };
}

export default connect(mapStateToProps)(Permalink);

Permalink.propTypes = {
  projection: PropTypes.string
};
