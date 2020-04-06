import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import {
  ModalBody,
  ModalHeader,
} from 'reactstrap';
import {
  SearchProvider,
  // WithSearch,
} from '@elastic/react-search-ui';
import ProductPickerHeader from './header';
import FilterUnavailable from './filterUnavailable';
import { onToggle as onToggleAction } from '../../../modules/modal/actions';
import BrowseLayers from './browse/browse-layers';
import SearchLayers from './search/search-layers';
import { getSearchConfig } from '../../../modules/product-picker/selectors';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ProductPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalElement: undefined,
    };

    // this.toggleFilterByAvailable = this.toggleFilterByAvailable.bind(this);
  }

  componentDidMount() {
    const modalElement = document.getElementById('layer_picker_component');
    modalElement.classList.add('category-width');
    this.setState({ modalElement });
  }

  componentDidUpdate(prevProps) {
    const { modalElement } = this.state;
    const { mode } = this.props;
    if (prevProps.mode === mode) {
      return;
    }
    if (mode === 'category') {
      modalElement.classList.remove('browse-search-width');
      modalElement.classList.add('category-width');
    }
    if (mode === 'search' || mode === 'measurements') {
      modalElement.classList.remove('category-width');
      modalElement.classList.add('browse-search-width');
    }
  }

  /**
   * Either filter layers with search object or
   * revert to initial state
   * @function runSearch
   * @param e | onChange event object
   */
  // runSearch(searchTerm) {
  //   const {
  //     selectedLayer,
  //     updateProductPickerState,
  //   } = this.props;

  //   let newState;
  //   let newSelectedLayer;

  //   // Search cleared
  //   if (searchTerm.length === 0) {
  //     newState = {
  //       filteredRows: [],
  //       listType: 'category',
  //       inputValue: '',
  //       selectedLayer: null,
  //     };
  //   // Search with terms
  //   } else {
  //     const selectedLayerInResults = selectedLayer
  //       && !!filteredRows.find((layer) => layer.id === selectedLayer.id);

  //     if (filteredRows.length === 1) {
  //       [newSelectedLayer] = filteredRows;
  //     } else if (selectedLayerInResults) {
  //       newSelectedLayer = selectedLayer;
  //     }

  //     // newState = {
  //     //   filteredRows,
  //     //   searchResultRows,
  //     //   numRowsFilteredOut: searchResultRows.length - filteredRows.length,
  //     //   listType: 'search',
  //     //   inputValue: value,
  //     //   selectedLayer: newSelectedLayer,
  //     //   listScrollTop: 0,
  //     // };
  //   }
  //   updateProductPickerState(newState);
  // }

  // toggleFilterByAvailable() {
  // const { inputValue, filterByAvailable, updateProductPickerState } = this.props;
  // updateProductPickerState({ filterByAvailable: !filterByAvailable });
  // this.runSearch(inputValue);
  // }

  getComponentHeights = () => {
    const {
      isMobile,
      screenHeight,
      selectedLayer,
      mode,
      category,
    } = this.props;
    const { modalElement } = this.state;
    const headerElement = modalElement && modalElement.querySelector('.modal-header');
    const tabOffset = mode === 'category' || category === 'featured' ? 38 : 0;
    const detailTopBorderSize = 5;
    const headerHeight = headerElement && headerElement.offsetHeight;
    const bodyHeight = headerElement ? screenHeight - headerHeight - tabOffset : 0;

    return isMobile
      ? {
        detailHeight: !selectedLayer ? 0 : (bodyHeight * 0.6) - detailTopBorderSize,
        listHeight: selectedLayer ? bodyHeight * 0.4 : bodyHeight,
        listMinHeight: selectedLayer ? bodyHeight * 0.4 : bodyHeight,
      }
      : {
        listHeight: bodyHeight - 80,
        detailHeight: bodyHeight - 80,
        listMinHeight: 300,
      };
  }

  render() {
    const {
      mode,
      searchConfig,
      width,
      onToggle,
    } = this.props;

    return !searchConfig ? null : (
      <SearchProvider config={searchConfig}>
        <ModalHeader toggle={onToggle}>
          <ProductPickerHeader
            width={width}
            toggleFilterByAvailable={this.toggleFilterByAvailable}
          />
        </ModalHeader>
        <ModalBody>
          <div id="layer-modal-content" className="layer-modal-content">
            {mode !== 'search'
              ? (
                <BrowseLayers componentHeights={this.getComponentHeights()} width={width} />
              )
              : (
                <SearchLayers componentHeights={this.getComponentHeights()} width={width} />
              )}
          </div>
        </ModalBody>
      </SearchProvider>
    );
  }
}

ProductPicker.propTypes = {
  category: PropTypes.object,
  isMobile: PropTypes.bool,
  mode: PropTypes.string,
  onToggle: PropTypes.func,
  screenHeight: PropTypes.number,
  searchConfig: PropTypes.object,
  selectedLayer: PropTypes.object,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  onToggle: () => {
    dispatch(onToggleAction());
  },
});

const mapStateToProps = (state, ownProps) => {
  const {
    browser,
    productPicker,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const isMobile = browser.lessThan.medium;
  const width = getModalWidth(screenWidth);
  const searchConfig = getSearchConfig(state);
  const { mode, category } = productPicker;

  return {
    category,
    mode,
    isMobile,
    screenHeight,
    searchConfig,
    width,
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProductPicker);

const getModalWidth = function(width) {
  const availableWidth = width - width * 0.15;
  const gridItemWidth = 310;
  let sizeMultiplier = Math.floor(availableWidth / gridItemWidth);
  if (sizeMultiplier < 1) {
    sizeMultiplier = 1;
  }
  if (sizeMultiplier > 3) {
    sizeMultiplier = 3;
  }
  const gutterSpace = (sizeMultiplier - 1) * 10;
  const modalPadding = 26;
  return gridItemWidth * sizeMultiplier + gutterSpace + modalPadding;
};
