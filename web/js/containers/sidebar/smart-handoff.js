import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import moment from 'moment';
import SmartHandoffModal from './smart-handoff-modal';
import Button from '../../components/util/button';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import { getLayers } from '../../modules/layers/selectors';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { openCustomContent } from '../../modules/modal/actions';
import { changeCropBounds } from '../../modules/animation/actions';
import getSelectedDate from '../../modules/date/selectors';


/**
 * The Smart-Handoff components replaces the existing data download capability
 * by directing users to select specific layer products within Worldview and 'hand' them 'off'
 * to NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
class SmartHandoff extends Component {
  /**
   * SmartHandoff's default constructor
   * @param {*} props | A read-only object used to transfer data from a parent component
   */
  constructor(props) {
    super(props);

    const {
      screenWidth,
      screenHeight,
      onBoundaryChange,
    } = props;

    this.state = {
      boundaries: props.boundaries || {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
      selectedLayer: null,
    };

    this.debounceBoundaryUpdate = lodashDebounce(onBoundaryChange, 200);
    this.onBoundaryChange = this.onBoundaryChange.bind(this);
  }

  /**
   * Fires when the image cropper is moved around on the map; updates the SW and NE lat/lon coordinates.
   * @param {*} boundaries - the focal point to which layer data should be contained within
   */
  onBoundaryChange(boundaries) {
    const {
      x, y, width, height,
    } = boundaries;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };

    this.setState({ boundaries: newBoundaries });
    this.debounceBoundaryUpdate(newBoundaries);
  }

  onLayerSelected(layer) {
    this.setState({ selectedLayer: layer });
  }

  /**
   * Default render which displays the data-download panel
   */
  render() {
    const {
      isLayerSelected,
      map,
      screenWidth,
      screenHeight,
      proj,
      activeLayers,
      isActive,
      showWarningModal,
      selectedDate,
    } = this.props;

    /** Determine if data-download 'smart-handoff' tab is activated by user */
    if (!isActive) return null;

    /** Bounardies referencing the coordinates displayed around image crop */
    const { boundaries, selectedLayer } = this.state;
    const {
      x, y, x2, y2,
    } = boundaries;

    /** Keeps image crop to always be displayed on the map */
    const keepSelection = true;

    /** Retrieve the lat/lon coordinates based on the defining boundary and map projection */
    const lonlats = imageUtilGetCoordsFromPixelValues(
      boundaries,
      map.ui.selected,
    );
    const { crs } = proj;
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

    const extentCoords = {
      southWest: `${geolonlat1[0]},${geolonlat1[1]}`,
      northEast: `${geolonlat2[0]},${geolonlat2[1]}`,
    };

    const showModal = true;

    return (
      <div id="smart-handoff-side-panel">
        <h1>Select a layer to download:</h1>

        {/** Listing of layers that are available to download via Earthdata Search */}
        <div id="smart-handoff-layer-list">
          {activeLayers.map((layer, i) => {
            if (layer.conceptId) {
              return (
                <div key={layer.conceptId} className="layer-item">
                  <input
                    id={layer.id}
                    type="radio"
                    value={layer.conceptId}
                    name="smart-handoff-layer-radio"
                    onClick={() => this.onLayerSelected(layer)}
                  />
                  <label htmlFor={layer.id}>{layer.title}</label>
                  <span>{layer.subtitle}</span>
                  <hr />

                </div>
              );
            }
            return null;
          })}
        </div>

        { /** Download button that transfers user to NASA's Earthdata Search */ }
        <Button
          onClick={() => {
            if (showModal) showWarningModal(selectedDate, selectedLayer, extentCoords);
            else openEarthDataSearch(selectedDate, selectedLayer, extentCoords)();
          }}
          id="download-btn"
          text="Download"
          className="red"
          disabled={isLayerSelected}
        />

        { /** Image crop overlay used to determine user's area of interest */ }
        <Crop
          className="download-extent"
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={this.onBoundaryChange}
          keepSelection={keepSelection}
          bottomLeftStyle={{
            left: x,
            top: y2 + 5,
            width: x2 - x,
          }}
          topRightStyle={{
            left: x,
            top: y - 20,
            width: x2 - x,
          }}
          coordinates={{
            bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
            topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]]),
          }}
          showCoordinates
        />
      </div>
    );
  }
}

const openEarthDataSearch = (selectedDate, selectedLayer, extentCoords) => () => {
  const { conceptId } = selectedLayer;
  const { southWest, northEast } = extentCoords;

  const startDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T00:00:00.000Z`;
  const endDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T23:59:59.999Z`;

  const dateRange = `${startDate},${endDate}`;

  const earthDataSearchURL = `https://search.earthdata.nasa.gov/search/granules?p=${conceptId}&pg[0][qt]=${dateRange}&pg[0][dnf]=DAY&sb=${southWest},${northEast}&m=-30.59375!-210.9375!0!1!0!0,2`;

  window.open(earthDataSearchURL, '_blank');
  /* Example URL string
    https://search.earthdata.nasa.gov/search/granules?
      p=C1000001167-NSIDC_ECS
      &pg[0][qt]=2017-11-15T00%3A00%3A00.000Z%2C2017-11-15T23%3A59%3A59.999Z
      &pg[0][dnf]=DAY
      &sb=-156.69223022460938%2C54.284636794532624%2C-133.9395446777344%2C70.07726383377425
      &m=59.6953125!-179.015625!3!1!0!0%2C2
      &ff=Customizable
      &tl=1571168792!4!!
  */

  // API Call to CMR

  // Standard vs NRT

  // Check DNF for ESD - dont put in query 


};

/**
 * Handle type-checking of defined properties
 */
SmartHandoff.propTypes = {
  isLayerSelected: PropTypes.bool,
  isActive: PropTypes.bool,
  activeLayers: PropTypes.array,
  map: PropTypes.object.isRequired,
  onBoundaryChange: PropTypes.func,
  boundaries: PropTypes.object,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectedDate: PropTypes.instanceOf(Date),
  showWarningModal: PropTypes.func,
};

/**
 * ReactRedux; used for selecting the part of the data from the store
 * that the Smarthandoff component needs. This is called every time the
 * store state changes.
 * @param {*} state | Encapsulates the entire Redux store state.
 * @param {*} ownProps | Data from SmartHandoff that is used to retrieve data from the store.
 */
const mapStateToProps = (state, ownProps) => {
  const { tabTypes } = ownProps;
  const {
    browser, layers, map, proj, compare, sidebar, boundaries,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const { activeString } = compare;
  const activeLayers = getLayers(layers[activeString], { proj: proj.id });
  return {
    activeLayers,
    boundaries,
    isActive: sidebar.activeTab === 'download',
    map,
    proj: proj.selected,
    screenWidth,
    screenHeight,
    selectedDate: getSelectedDate(state),
    tabTypes,
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  showWarningModal: (selectedDate, selectedLayer, extentCoords) => {
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal,
        bodyComponentProps: {
          selectedDate,
          selectedLayer,
          extentCoords,
          goToEarthDataSearch: openEarthDataSearch(selectedDate, selectedLayer, extentCoords),
        },
        size: 'lg',
      }),
    );
  },
  onBoundaryChange: (bounds) => {
    dispatch(changeCropBounds(bounds));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoff);
