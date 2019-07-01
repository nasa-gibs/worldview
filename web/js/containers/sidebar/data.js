import React from 'react';
import PropTypes from 'prop-types';
import Products from '../../components/sidebar/product';
import Scrollbars from '../../components/util/scrollbar';
import { connect } from 'react-redux';
import {
  getSelectionCounts,
  getDataProductsFromActiveLayers,
  findAvailableProduct
} from '../../modules/data/selectors';
import { selectProduct } from '../../modules/data/actions';

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
      findProductToSelect(activeLayers);
    }
    return (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div id="wv-data">
          <div className="wv-datalist sidebar-panel content">
            <div id="wv-datacontent">
              {dataArray.map(product => {
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

const mapDispatchToProps = dispatch => ({
  findProductToSelect: products => {
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
  const activeLayers = layers[activeString];
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
