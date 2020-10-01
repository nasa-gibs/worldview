import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  InputGroup, InputGroupText,
} from 'reactstrap';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import safeLocalStorage from '../../util/local-storage';

/**
 * The Smart-Handoff components replaces the existing data download capability
 * by directing users to select specific layer products within Worldview and 'hand' them 'off'
 * to NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
function SmartHandoffModal({
  selectedDate, selectedLayer, extentCoords, goToEarthDataSearch,
}) {
  // Hides Earthdata Search information by default
  const [showMoreInfo, toggleInfo] = useState(false);

  const { title, subtitle } = selectedLayer;
  const date = moment.utc(selectedDate).format('YYYY MMM DD');

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
        <hr />
        <h1 className="about-heading">About Earthdata Search</h1>
        <div id="about-section">
          <p>
            Earthdata Search provides the only means for data discovery, filtering, visualization, and
            access across all of NASA Earth science data holdings. The current selected layer and the designated
            viewport region in Worldview will be used to derive data granules within Earthdata Search.
          </p>

          <img id="earth-data-gif" src="../../../images/earth-data-search-preview.gif" />
          <p id="earth-data-caption">
            Granules that are available to download will be listed in the white pull out menu. Each granule listed can be
            downloaded individually or the entire set contained within the bounding box can be downloaded as a zip file.
          </p>

          <p>
            To leverage the use of Earthdata Search, users must register at
            {' '}
            <a href="https://urs.earthdata.nasa.gov/home" target="_blank" rel="noopener noreferrer">urs.earthdata.nasa.gov</a>
            . The registration is provided free of charge. The user needs to set up a user ID, password, and provide
            additional information, such as, user name, affiliation, country and a valid e-mail address, in order to complete
            the registration process.
          </p>

          <h1 className="about-heading">Why must I register?</h1>
          <p>
            As noted on the Earthdata homepage, the Earthdata Login provides a single mechanism for user registration and profile
            management for all EOSDIS system components (DAACs, Tools, Services). Your Earthdata login also helps the EOSDIS program
            better understand the usage of EOSDIS services to improve user experience through customization of tools and improvement
            of services. EOSDIS data are openly available to all and free of charge except where governed by international agreements.
          </p>
        </div>
      </div>
      )}

      <div id="toggle-more-info" onClick={() => toggleInfo(!showMoreInfo)}>
        <h2><span>{showMoreInfo ? 'Hide Info' : 'Show More Info'}</span></h2>
      </div>

      <div id="layer-info">
        <h1> Selected layer to download: </h1>
        <p id="layer-name">{`${title}`}</p>
        <p id="layer-mata-data">{`${subtitle} (${date})`}</p>
      </div>


      <div className="button-group">
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

      <div className="checkbox-footer">
        <input name="show-earthdata-modal" id="hide-earthdata-modal-checkbox" type="checkbox" />
        <label htmlFor="show-earthdata-modal">Do not show this message again.</label>
      </div>

    </div>

  );
}

function hideEarthdataModal() {
  console.log('ticked');
}

/**
 * Handle type-checking of defined properties
 */
SmartHandoffModal.propTypes = {
  extentCoords: PropTypes.object,
  goToEarthDataSearch: PropTypes.func,
  selectedDate: PropTypes.instanceOf(Date),
  selectedLayer: PropTypes.object,
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
