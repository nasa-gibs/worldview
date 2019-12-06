import React from 'react';
import PropTypes from 'prop-types';
import Products from '../../components/sidebar/product';
import Scrollbars from '../../components/util/scrollbar';
import { connect } from 'react-redux';
import {
  getSelectionCounts,
  getDataProductsFromActiveLayers,
  findAvailableProduct,
  doesSelectedExist
} from '../../modules/data/selectors';
import { selectProduct } from '../../modules/data/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { getLayers } from '../../modules/layers/selectors';

const CustomBodyModalContent = () => {
  return (
    <React.Fragment>
      <h3 className="wv-data-unavailable-header">
        Why are these layers not available for downloading?
      </h3>
      <p>
        Some layers in Worldview do not have corresponding source data products
        available for download. These include National Boundaries, Orbit Tracks,
        Earth at Night, and MODIS Corrected Reflectance products.
        <br />
        <br />
        For a downloadable product similar to MODIS Corrected Reflectance,
        please try the MODIS Land Surface Reflectance layers available in
        Worldview. If you would like to generate MODIS Corrected Reflectance
        imagery yourself, please see the following document:{' '}
        <a
          style={{ overflowWrap: 'break-word' }}
          href="https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf
        </a>
        <br />
        <br />
        If you would like to download only an image, please use the &ldquo;camera&rdquo;
        icon in the upper right.
        <br />
        <br /> Data download will not work for &ldquo;Terra and Aqua&rdquo; Fires, select
        Terra only Fires and/or Aqua only Fires to download the associated data
        files.
      </p>
    </React.Fragment>
  );
};

class Data extends React.Component {
  render() {
    const {
      isActive,
      height,
      findProductToSelect,
      counts,
      selectedProduct,
      selectProduct,
      activeLayers,
      products,
      showUnavailableReason,
      tabTypes
    } = this.props;
    if (!tabTypes.download) return null;
    const dataArray = Object.entries(products);
    if (dataArray.length > 0 && !selectedProduct && isActive) {
      findProductToSelect(activeLayers, selectedProduct);
    } else if (selectedProduct && !doesSelectedExist(dataArray, selectedProduct)) {
      findProductToSelect(activeLayers, selectedProduct);
    }
    return (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div id="wv-data">
          <div className="wv-datalist sidebar-panel content">
            <div id="wv-datacontent">
              {dataArray.map((product, i) => {
                return (
                  <Products
                    key={product[0]}
                    id={product[0]}
                    productObject={product[1]}
                    countsObject={counts}
                    isSelected={selectedProduct === product[0]}
                    selectProduct={selectProduct}
                    showUnavailableReason={showUnavailableReason}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Scrollbars>
    );
  }
}
Data.propTypes = {
  activeLayers: PropTypes.array,
  counts: PropTypes.object,
  data: PropTypes.object,
  findProductToSelect: PropTypes.func,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  products: PropTypes.object,
  selected: PropTypes.string,
  selectedProduct: PropTypes.string,
  selectProduct: PropTypes.func,
  showUnavailableReason: PropTypes.func,
  tabTypes: PropTypes.object
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  showUnavailableReason: () => {
    dispatch(
      openCustomContent('data_download_no_data_notify', {
        headerText: 'Notify',
        bodyComponent: CustomBodyModalContent,
        size: 'lg'
      })
    );
  },
  findProductToSelect: (products, selectedProduct) => {
    const newSelection = findAvailableProduct(products);
    if (newSelection) {
      dispatch(selectProduct(newSelection));
    }
  },
  selectProduct: id => {
    dispatch(selectProduct(id));
  }
});
function mapStateToProps(state, ownProps) {
  const { tabTypes } = ownProps;
  const { layers, proj, data, config, compare, sidebar } = state;
  const { selectedProduct, selectedGranules } = data;
  const activeString = compare.activeString;
  const activeLayers = getLayers(layers[activeString], { proj: proj.id });
  const counts = getSelectionCounts(activeLayers, selectedGranules);
  const products = getDataProductsFromActiveLayers(
    activeLayers,
    config,
    proj.id
  );
  return {
    counts,
    selectedProduct,
    products,
    tabTypes,
    activeLayers,
    isActive: sidebar.activeTab === 'download'
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Data);
