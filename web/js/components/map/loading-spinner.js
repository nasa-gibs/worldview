import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Spinner } from 'reactstrap';

function LoadingIndicator({ msg, isLoading, isMobile }) {
  const spinnerStyle = {
    position: 'absolute',
    top: 10,
    left: 300,
    zIndex: 999,
  };

  const mobileSpinnerStyle = {
    position: 'absolute',
    top: 10,
    left: 80,
    zIndex: 999,
  };

  return isLoading && (
    <div style={isMobile ? mobileSpinnerStyle : spinnerStyle}>
      <Spinner color="light" size="sm" />
      {msg}
    </div>
  );
}
LoadingIndicator.propTypes = {
  msg: PropTypes.string,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
};

const mapStateToProps = (state) => {
  const { screenSize, loading } = state;
  const { msg, isLoading } = loading;
  return {
    isLoading,
    isMobile: screenSize.isMobileDevice,
    msg,
  };
};
export default connect(mapStateToProps)(LoadingIndicator);
