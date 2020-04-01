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
  WithSearch,
} from '@elastic/react-search-ui';
import ProductPickerHeader from './header';
import FilterUnavailable from './filterUnavailable';
import {
  getLayersForProjection,
} from '../../../modules/layers/selectors';
import { onToggle } from '../../../modules/modal/actions';
import {
  updateProductPicker,
} from '../../../modules/product-picker/actions';
import BrowseLayers from './browse-layers';
import SearchLayers from './search-layers';
import { getSearchConfig } from '../../../modules/product-picker/searchConfig';


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
      headerElement: undefined,
    };

    this.runSearch = lodashDebounce(this.runSearch.bind(this), 300);
    this.enableSearchMode = this.enableSearchMode.bind(this);
    this.revertSearchState = this.revertSearchState.bind(this);
    this.toggleFilterByAvailable = this.toggleFilterByAvailable.bind(this);
  }

  componentDidMount() {
    const modalElement = document.getElementById('layer_picker_component');
    const headerElement = modalElement.querySelector('.modal-header');
    modalElement.classList.add('category-width');

    this.setState({
      modalElement,
      headerElement,
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { modalElement } = this.state;
    const { listType } = this.props;
    if (prevState.listType === listType) {
      return;
    }
    if (listType === 'category') {
      modalElement.classList.remove('browse-search-width');
      modalElement.classList.add('category-width');
    }
    if (listType === 'search' || listType === 'measurements') {
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
  runSearch(searchTerm) {
    const {
      selectedLayer,
      updateProductPickerState,
    } = this.props;

    let newState;
    let newSelectedLayer;

    // Search cleared
    if (searchTerm.length === 0) {
      newState = {
        filteredRows: [],
        listType: 'category',
        inputValue: '',
        selectedLayer: null,
      };
    // Search with terms
    } else {
      const selectedLayerInResults = selectedLayer
        && !!filteredRows.find((layer) => layer.id === selectedLayer.id);

      if (filteredRows.length === 1) {
        [newSelectedLayer] = filteredRows;
      } else if (selectedLayerInResults) {
        newSelectedLayer = selectedLayer;
      }

      // newState = {
      //   filteredRows,
      //   searchResultRows,
      //   numRowsFilteredOut: searchResultRows.length - filteredRows.length,
      //   listType: 'search',
      //   inputValue: value,
      //   selectedLayer: newSelectedLayer,
      //   listScrollTop: 0,
      // };
    }
    updateProductPickerState(newState);
  }

  /**
   * When using "back" button or clearing search field, unset selections
   */
  revertSearchState() {
    const { updateProductPickerState } = this.props;
    updateProductPickerState({
      listType: 'category',
      inputValue: '',
      selectedLayer: null,
      selectedMeasurement: null,
      selectedMeasurementSourceIndex: 0,
      listScrollTop: 0,
    });
  }

  toggleFilterByAvailable() {
    const { inputValue, filterByAvailable, updateProductPickerState } = this.props;
    updateProductPickerState({ filterByAvailable: !filterByAvailable });
    this.runSearch(inputValue);
  }

  getComponentHeights = () => {
    const {
      isMobile,
      screenHeight,
      selectedLayer,
      listType,
      category,
    } = this.props;
    const { headerElement } = this.state;
    const tabOffset = listType === 'category' || category === 'featured' ? 38 : 0;
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

  enableSearchMode = () => {
    const { updateProductPickerState, allLayers } = this.props;
    updateProductPickerState({
      listType: 'search',
      filteredRows: allLayers,
      selectedLayer: null,
    });
  }

  renderHeader(results, searchTerm, setSearchTerm) {
    const {
      selectedProjection,
      width,
      isMobile,
      onToggle,
      selectedDate,
      listType,
      category,
      filterByAvailable,
      numRowsFilteredOut,
    } = this.props;
    return (
      <ModalHeader toggle={onToggle}>
        <ProductPickerHeader
          selectedProjection={selectedProjection}
          selectedDate={selectedDate}
          listType={listType}
          inputValue={searchTerm}
          isMobile={isMobile}
          category={category}
          width={width}
          setSearchTerm={setSearchTerm}
          enableSearchMode={this.enableSearchMode}
          updateListState={this.revertSearchState}
          filterByAvailable={filterByAvailable}
          toggleFilterByAvailable={this.toggleFilterByAvailable}
        >
          {listType === 'search' && !isMobile
            && (
            <div className="header-filter-container">
              <div className="header-filters">
                <FilterUnavailable
                  selectedDate={selectedDate}
                  filterByAvailable={filterByAvailable}
                  toggleFilterByAvailable={this.toggleFilterByAvailable}
                />
              </div>
              <div className="results-text">
                { `Showing ${results.length} results`}
                {numRowsFilteredOut > 0 && (
                  <span>
                    {`(${numRowsFilteredOut} hidden by filters)`}
                  </span>
                )}
              </div>
            </div>
            )}
        </ProductPickerHeader>
      </ModalHeader>
    );
  }

  render() {
    const {
      activeLayers,
      listType,
      categoryType,
      category,
      searchConfig,
    } = this.props;
    const { listHeight, listMinHeight, detailHeight } = this.getComponentHeights();

    return !searchConfig ? null : (
      <SearchProvider config={searchConfig}>
        <WithSearch
          mapContextToProps={({
            wasSearched, setSearchTerm, searchTerm, results,
          }) => ({
            wasSearched, setSearchTerm, searchTerm, results,
          })}
        >
          {({
            wasSearched, setSearchTerm, searchTerm, results,
          }) => (
            <>
              {this.renderHeader(results, searchTerm, setSearchTerm)}

              <ModalBody>
                <div id="layer-modal-content" className="layer-modal-content">
                  {listType !== 'search'
                    ? (
                      <BrowseLayers
                        listHeight={listHeight}
                        listMinHeight={listMinHeight}
                        detailHeight={detailHeight}
                        activeLayers={activeLayers}
                        category={category}
                        categoryType={categoryType}
                      />
                    )
                    : (
                      <SearchLayers
                        listHeight={800}
                        listMinHeight={listMinHeight}
                        detailHeight={detailHeight}
                        filteredRows={results}
                      />
                    )}
                </div>
              </ModalBody>
            </>
          )}
        </WithSearch>
      </SearchProvider>
    );
  }
}

ProductPicker.propTypes = {
  activeLayers: PropTypes.array,
  allLayers: PropTypes.array,
  category: PropTypes.object,
  categoryType: PropTypes.string,
  config: PropTypes.object,
  filterByAvailable: PropTypes.bool,
  inputValue: PropTypes.string,
  isMobile: PropTypes.bool,
  listType: PropTypes.string,
  numRowsFilteredOut: PropTypes.number,
  onToggle: PropTypes.func,
  screenHeight: PropTypes.number,
  selectedDate: PropTypes.object,
  selectedLayer: PropTypes.object,
  selectedProjection: PropTypes.string,
  updateProductPickerState: PropTypes.func,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  onToggle: () => {
    dispatch(onToggle());
  },
  updateProductPickerState: (partialState) => {
    dispatch(updateProductPicker(partialState));
  },
});

function mapStateToProps(state, ownProps) {
  const {
    config,
    browser,
    proj,
    layers,
    compare,
    date,
    productPicker,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const isMobile = browser.lessThan.medium;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const width = getModalWidth(screenWidth);
  const activeLayers = layers[activeString];
  const searchConfig = getSearchConfig(state);

  return {
    ...productPicker,
    config,
    selectedDate: date.selected,
    isMobile,
    screenHeight,
    width,
    activeLayers,
    selectedProjection: proj.id,
    searchConfig,
  };
}
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
