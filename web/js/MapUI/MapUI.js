import React, { useEffect } from 'react';
import { connect } from 'react-redux';



const MapUI = (props) => {



  return (
  <>
  </>
  )

  };

const mapStateToProps = (state) => {
  const { settings } = state;
  const { globalTemperatureUnit } = settings;
  return {
    globalTemperatureUnit
  }
}

export default connect(
  mapStateToProps
)(MapUI);
