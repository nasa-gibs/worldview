import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from '../../components/util/button';

/**
 * The Smart-Handoff components replaces the existing data download capability
 * by directing users to select specific layer products within Worldview and 'hand' them 'off'
 * to NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
function SmartHandoffModal({ extentCoords, goToEarthDataSearch }) {
  // Hides Earthdata Search information by default
  const [showMoreInfo, toggleInfo] = useState(false);

  return (

    <div>

      <div id="smart-handoff-heading">
        <img src="../../../images/earth-data-search-logo.jpg" />
        <h1>search.earthdata.nasa.gov</h1>
      </div>

      <div id="smart-handoff-message">
        You are about to be transferred to the NASA Earthdata Search tool. This tool is used to download
        data granules using the selected layer, area of interest, and current date.
      </div>

      { showMoreInfo
      && (
      <div id="smart-handoff-about">
        <h1 id="about-heading">About Earthdata Search</h1>
        <div id="about-section">
          <p>
            Earthdata Search provides the only means for data discovery, filtering, visualization, and
            access across all of NASA Earth science data holdings. The current selected layer and the designated
            viewport region within Worldview will be transferred to Earthdata Search.
          </p>
          <p>
            More information to be documented later... Earthdata Search provides the only means for data discovery, filtering, visualization, and
            access across all of NASA Earth science data holdings. The current selected layer and the designated
            viewport region within Worldview will be transferred to Earthdata Search.
          </p>
          <p>
            More information to be documented later... Earthdata Search provides the only means for data discovery, filtering, visualization, and
            access across all of NASA Earth science data holdings. The current selected layer and the designated
            viewport region within Worldview will be transferred to Earthdata Search.
          </p>
        </div>
      </div>
      )}

      <div id="toggle-more-info" onClick={() => toggleInfo(!showMoreInfo)}>
        {showMoreInfo ? 'Hide Info' : 'Show More Info'}
      </div>

      <div id="layer-info">
        <h1> Selected layer to download: </h1>
        <p id="layer-name"> INSERT LAYER NAME </p>
        <p id="layer-mata-data"> INSERT LAYER META DATA </p>
      </div>


      <div id="button-group">
        <Button
          onClick={() => console.log('closing')}
          id="cancel-btn"
          text="Cancel"
        />

        <Button
          onClick={() => goToEarthDataSearch()} // Need to pass reference of current state of boundaries
          id="continue-btn"
          text="Continue"
          className="red"
        />
      </div>

    </div>

  );
}

/**
 * Handle type-checking of defined properties
 */
SmartHandoffModal.propTypes = {
  extentCoords: PropTypes.object,
  goToEarthDataSearch: PropTypes.func,
};

/**
 * ReactRedux; used for selecting the part of the data from the store
 * that the Smarthandoff component needs. This is called every time the
 * store state changes.
 * @param {*} state | Encapsulates the entire Redux store state.
 * @param {*} ownProps | Data from SmartHandoff that is used to retrieve data from the store.
 */
const mapStateToProps = (state, ownProps) => ({});

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({

});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoffModal);
