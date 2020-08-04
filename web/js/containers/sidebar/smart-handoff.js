import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import SmartHandoffModal from './smart-handoff-modal';
// import Products from '../../components/sidebar/product';
import Button from '../../components/util/button';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import { getLayers } from '../../modules/layers/selectors';
import { getDataProductsFromActiveLayers } from '../../modules/data/selectors';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { openCustomContent } from '../../modules/modal/actions';
import { changeCropBounds } from '../../modules/animation/actions';

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
      products,
      // selectedProduct,
      // selectProduct,
      isActive,
      showWarningModal,
    } = this.props;

    /** Determine if data-download 'smart-handoff' tab is activated by user */
    if (!isActive) return null;

    /** Bounardies referencing the coordinates displayed around image crop */
    const { boundaries } = this.state;
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


    /** Contains available imagery data that can be downloaded in Earthdata Search */
    // const dataArray = Object.entries(products); // TO-DO: Display the correct products based on availablility
    const dataArray = Object.entries(products);
    // if (dataArray.length > 0 && !selectedProduct && isActive) {
    // findProductToSelect(activeLayers, selectedProduct);
    // } else if (selectedProduct && !doesSelectedExist(dataArray, selectedProduct)) {
    // findProductToSelect(activeLayers, selectedProduct);
    // }

    return (
      <div id="smart-handoff-panel">
        <h1>Select a layer to download:</h1>

        { /** Listing of layers that are available to download via Earthdata Search */ }
        <div id="smart-handoff-product-list">
          {dataArray.map((product, i) => {
            if (!product[1].notSelectable) {
              return (
                <ul key={product[0]}>
                  <li>
                    Label:
                    {' '}
                    {product[1].items[0].label}
                  </li>
                  <li>
                    Sub Label:
                    {' '}
                    {product[1].items[0].sublabel}
                  </li>
                  <li>
                    Value:
                    {' '}
                    {product[1].items[0].value}
                  </li>
                  <li>
                    Title:
                    {' '}
                    {product[1].title}
                  </li>
                  <li>{product[0]}</li>
                </ul>
              );
            }
            return (
              <div>Nothing to see here...</div>
            );
          })}
        </div>

        { /** Download button that transfers user to NASA's Earthdata Search */ }
        <Button
          onClick={() => {
            if (showModal) showWarningModal(extentCoords);
            else openEarthDataSearch(extentCoords)();
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

const openEarthDataSearch = (extentCoords) => () => {
  // TO-DO: Need to capture boundaries, layer data, etc; whatever essentials for Earthdata Search
  window.open(`https://search.earthdata.nasa.gov/search?sb=${
    extentCoords.southWest},${extentCoords.northEast}&m=-30.59375!-210.9375!0!1!0!0,2`, '_blank');

  /*
    https://search.earthdata.nasa.gov/search/granules?
      p=C1000001167-NSIDC_ECS
      &pg[0][qt]=2017-11-15T00%3A00%3A00.000Z%2C2017-11-15T23%3A59%3A59.999Z
      &pg[0][dnf]=DAY
      &sb=-156.69223022460938%2C54.284636794532624%2C-133.9395446777344%2C70.07726383377425
      &m=59.6953125!-179.015625!3!1!0!0%2C2
      &ff=Customizable
      &tl=1571168792!4!!
  */
};

/**
 * Handle type-checking of defined properties
 */
SmartHandoff.propTypes = {
  isLayerSelected: PropTypes.bool,
  isActive: PropTypes.bool,
  products: PropTypes.object,
  selectedProduct: PropTypes.string,
  selectProduct: PropTypes.func,
  map: PropTypes.object.isRequired,
  onBoundaryChange: PropTypes.func,
  boundaries: PropTypes.object,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
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
    browser, layers, map, proj, data, config, compare, sidebar, boundaries,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const { selectedProduct } = data;
  const { activeString } = compare;
  const activeLayers = getLayers(layers[activeString], { proj: proj.id });
  const products = getDataProductsFromActiveLayers(
    activeLayers,
    config,
    proj.id,
  );
  return {
    screenWidth,
    screenHeight,
    boundaries,
    proj: proj.selected,
    map,
    selectedProduct,
    products,
    tabTypes,
    activeLayers,
    isActive: sidebar.activeTab === 'download',
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  showWarningModal: (extentCoords) => {
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal,
        bodyComponentProps: {
          extentCoords,
          goToEarthDataSearch: openEarthDataSearch(extentCoords),
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
