import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  toLower as lodashToLower,
  each as lodashEach,
  includes as lodashIncludes,
} from 'lodash';
import lodashDebounce from 'lodash/debounce';
import {
  ModalBody,
  ModalHeader,
} from 'reactstrap';
import ProductPickerHeader from './header';
import FilterUnavailable from './filterUnavailable';
import {
  getLayersForProjection,
  getTitles,
} from '../../../modules/layers/selectors';
import { onToggle } from '../../../modules/modal/actions';
import { availableAtDate } from '../../../modules/layers/util';
import {
  updateProductPicker,
} from '../../../modules/product-picker/actions';
import BrowseLayers from './browse-layers';
import SearchLayers from './search-layers';

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
  runSearch(value) {
    const {
      filterProjections,
      filterSearch,
      selectedDate,
      allLayers,
      categoryType,
      filterByAvailable,
      selectedLayer,
      updateProductPickerState,
    } = this.props;
    const val = value.toLowerCase();
    let newState;
    let newSelectedLayer;

    // Search cleared
    if (val.length === 0) {
      newState = {
        filteredRows: [],
        listType: 'category',
        inputValue: '',
        selectedLayer: null,
      };
      if (categoryType === 'featured') {
        this.toggleFeatureTab(newState);
        return;
      }
    // Search with terms
    } else {
      const terms = val.split(/ +/);
      const searchResultRows = allLayers.filter((layer) => !(filterProjections(layer) || filterSearch(layer, val, terms)));
      const filteredRows = searchResultRows.filter((layer) => !(filterByAvailable && !availableAtDate(layer, selectedDate)));

      const selectedLayerInResults = selectedLayer
        && !!filteredRows.find((layer) => layer.id === selectedLayer.id);

      if (filteredRows.length === 1) {
        [newSelectedLayer] = filteredRows;
      } else if (selectedLayerInResults) {
        newSelectedLayer = selectedLayer;
      }

      newState = {
        filteredRows,
        searchResultRows,
        numRowsFilteredOut: searchResultRows.length - filteredRows.length,
        listType: 'search',
        inputValue: value,
        selectedLayer: newSelectedLayer,
        listScrollTop: 0,
      };
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

  render() {
    const {
      activeLayers,
      selectedProjection,
      modalView,
      width,
      isMobile,
      onToggle,
      selectedDate,
      listType,
      categoryType,
      category,
      inputValue,
      filterByAvailable,
      filteredRows,
      numRowsFilteredOut,
    } = this.props;
    const { listHeight, listMinHeight, detailHeight } = this.getComponentHeights();

    return (
      <>
        <ModalHeader toggle={onToggle}>
          <ProductPickerHeader
            selectedProjection={selectedProjection}
            selectedDate={selectedDate}
            listType={listType}
            inputValue={inputValue}
            isMobile={isMobile}
            category={category}
            modalView={modalView}
            width={width}
            runSearch={this.runSearch}
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
                  { `Showing ${filteredRows.length} results`}
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
                  listHeight={listHeight}
                  listMinHeight={listMinHeight}
                  detailHeight={detailHeight}
                  filteredRows={filteredRows}
                />
              )}
          </div>
        </ModalBody>
      </>
    );
  }
}

ProductPicker.propTypes = {
  activeLayers: PropTypes.array,
  allLayers: PropTypes.array,
  category: PropTypes.object,
  categoryType: PropTypes.string,
  filterByAvailable: PropTypes.bool,
  filteredRows: PropTypes.array,
  filterProjections: PropTypes.func,
  filterSearch: PropTypes.func,
  inputValue: PropTypes.string,
  isMobile: PropTypes.bool,
  listType: PropTypes.string,
  modalView: PropTypes.string,
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
  const allLayers = getLayersForProjection(state);
  const activeLayers = layers[activeString];

  return {
    ...productPicker,
    categoryConfig: config.categories,
    measurementConfig: config.measurements,
    layerConfig: config.layers,
    selectedDate: date.selected,
    isMobile,
    screenHeight,
    width,
    allLayers,
    activeLayers,
    selectedProjection: proj.id,
    showPreviewImage: config.features.previewSnapshots,
    filterProjections: (layer) => !layer.projections[proj.id],
    filterSearch: (layer, val, terms) => filterSearch(layer, val, terms, config, proj.id),
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

// Takes the terms and returns true if the layer isnt part of search
const filterSearch = (layer, val, terms, config, projId) => {
  if (!val) return false;

  let filtered = false;
  const names = getTitles(config, layer.id, projId);
  const title = lodashToLower(names.title);
  const subtitle = lodashToLower(names.subtitle);
  const tags = lodashToLower(names.tags);
  const layerId = lodashToLower(layer.id);

  lodashEach(terms, (term) => {
    filtered = !lodashIncludes(title, term)
      && !lodashIncludes(subtitle, term)
      && !lodashIncludes(tags, term)
      && !lodashIncludes(layerId, term);
    if (filtered) return false;
  });
  return filtered;
};
