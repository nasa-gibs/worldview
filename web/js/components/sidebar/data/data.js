import React from 'react';
import PropTypes from 'prop-types';
import Product from './product';
import Scrollbars from '../../util/scrollbar';
import { connect } from 'react-redux';
import {
  getSelectionCounts,
  getDataProductsFromActiveLayers,
  findAvailableProduct
} from '../../../modules/data/selectors';
import { selectProduct } from '../../../modules/data/actions';

class Data extends React.Component {
  render() {
    const {
      height,
      findProductToSelect,
      counts,
      selectedProduct,
      selectProduct,
      products,
      showUnavailableReason,
      tabTypes
    } = this.props;
    if (!tabTypes.download) return null;
    const dataArray = Object.entries(products);
    if (dataArray.length > 0 && !selectedProduct) findProductToSelect(products);
    return (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div id="wv-data">
          <div className="wv-datalist sidebar-panel content">
            <div id="wv-datacontent">
              {dataArray.map(product => {
                return (
                  <Product
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
  height: PropTypes.number,
  data: PropTypes.object,
  getCounts: PropTypes.func,
  showUnavailableReason: PropTypes.func,
  selected: PropTypes.string,
  selectProduct: PropTypes.func,
  tabTypes: PropTypes.object
};
const mapDispatchToProps = dispatch => ({
  findProductToSelect: products => {
    const newSelection = findAvailableProduct(products);
    if (newSelection) dispatch(selectProduct(newSelection));
  },
  selectProduct: id => {
    dispatch(selectProduct(id));
  }
});
function mapStateToProps(state, ownProps) {
  const { tabTypes } = ownProps;
  const { layers, proj, data, config, compare } = state;
  const { selectedProduct, selectedGranules } = data;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = layers[activeString];
  const counts = getSelectionCounts(activeLayers, selectedGranules);
  const products = getDataProductsFromActiveLayers(
    activeLayers,
    config,
    proj.id
  );
  return { counts, selectedProduct, products, tabTypes };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Data);
