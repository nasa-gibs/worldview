import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Spinner } from 'reactstrap';

function LoadingIndicator({ msg, isLoading }) {
  const spinnerStyle = {
    position: 'absolute',
    top: 10,
    left: 300,
    zIndex: 999,
  };

  return isLoading && (
    <div style={spinnerStyle}>
      <Spinner color="light" size="sm" />
      {msg}
    </div>
  );
}

LoadingIndicator.propTypes = {
  msg: PropTypes.string,
  isLoading: PropTypes.bool,
};

const mapStateToProps = (state) => {
  const { msg, isLoading } = state.loading;
  return {
    msg,
    isLoading,
  };
};
export default connect(mapStateToProps)(LoadingIndicator);
