import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import LayerList from './layer-list';
import CategoryGrid from './category-grid';
import ProductPickerHeader from './header';
import Switch from '../../util/switch';
import {
  toLower as lodashToLower,
  values as lodashValues,
  each as lodashEach,
  includes as lodashIncludes
} from 'lodash';
import lodashDebounce from 'lodash/debounce';
import Scrollbars from '../../util/scrollbar';
import googleTagManager from 'googleTagManager';
import { addLayer, removeLayer } from '../../../modules/layers/actions';
import {
  getLayersForProjection,
  getTitles,
  hasMeasurementSetting,
  hasMeasurementSource
} from '../../../modules/layers/selectors';
import { onToggle } from '../../../modules/modal/actions';
import { availableAtDate } from '../../../modules/layers/util.js';
import LayerMetadataDetail from './layer-metadata-detail';
import MeasurementMetadataDetail from './measurement-metadata-detail';
import {
  ModalBody,
  ModalHeader,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap';
import {
  updateProductPicker,
  updateListScrollTop
} from '../../../modules/product-picker/actions';

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
      listScrollTop: props.listScrollTop || 0
    };
    this.runSearch = lodashDebounce(this.runSearch, 300);
  }

  componentDidMount() {
    const modalElement = document.getElementById('layer_picker_component');
    const headerElement = modalElement.querySelector('.modal-header');
    modalElement.classList.add('category-width');
    this.setState({
      modalElement,
      headerElement
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
      update
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
        selectedLayer: null
      };
      if (categoryType === 'featured') {
        this.toggleFeatureTab(newState);
        return;
      }
    // Search with terms
    } else {
      const terms = val.split(/ +/);
      const searchResultRows = allLayers.filter(layer => {
        return !(filterProjections(layer) || filterSearch(layer, val, terms));
      });
      const filteredRows = searchResultRows.filter(layer => {
        return !(filterByAvailable && !availableAtDate(layer, selectedDate));
      });

      const selectedLayerInResults = selectedLayer &&
        !!filteredRows.find(layer => layer.id === selectedLayer.id);

      if (filteredRows.length === 1) {
        newSelectedLayer = filteredRows[0];
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
        listScrollTop: 0
      };
    }
    update(newState);
  }

  /**
   * Draw measurement list when category is clicked
   * @function drawMeasurements
   * @param {Object} category | category object
   * @param {String} selectedMeasurement | Measurement ID
   */
  drawMeasurements(category, selectedMeasurement) {
    const { update } = this.props;
    update({
      listType: 'measurements',
      selectedMeasurement,
      category
    });
    googleTagManager.pushEvent({
      event: 'layers_category',
      layers: {
        category: category.title
      }
    });
  }

  /**
   * @function updateSelectedMeasurement
   * @param {String} id | Measurement ID
   */
  updateSelectedMeasurement(id) {
    const { update } = this.props;
    if (this.props.selectedMeasurement !== id) {
      update({
        selectedMeasurement: id,
        selectedMeasurementSourceIndex: 0
      });
    } else {
      update({
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0
      });
    }
  }

  /**
   * When in "browse" measurement mode
   * @param {*} selectedMeasurementSourceIndex -  the index of the source for which to show metadata
   */
  setSourceIndex(index) {
    const { update } = this.props;
    update({
      selectedMeasurementSourceIndex: index
    });
  }

  getSelectedMeasurementSource() {
    const { selectedMeasurement, selectedMeasurementSourceIndex } = this.props;
    const measurements = Object.values(this.props.measurementConfig);
    const currentMeasurement = measurements.find(measure => measure.id === selectedMeasurement);
    if (currentMeasurement) {
      const sources = Object.values(currentMeasurement.sources)
        .sort((a, b) => a.title.localeCompare(b.title));
      return sources && sources[selectedMeasurementSourceIndex];
    }
  }

  toggleFeatureTab = (partialState) => {
    const { update } = this.props;
    const categoryType = 'featured';
    const { categoryConfig, measurementConfig } = this.props;
    const category = categoryConfig[categoryType].All;
    const selectedMeasurement = category.measurements[0];
    const selectedMeasurementId = measurementConfig[selectedMeasurement].id;

    update({
      ...partialState,
      categoryType,
      category,
      listType: 'measurements',
      selectedMeasurement: selectedMeasurementId
    });
  }

  /**
   * Update category type in which to sort
   * e.g. Hazards and disasters or science
   * disciplines
   * @param {String} key | categoryType identifier
   */
  sort(key) {
    if (key === 'featured') {
      this.toggleFeatureTab();
    } else {
      this.props.update({
        categoryType: key,
        listType: 'category',
        selectedMeasurement: null
      });
    }

    googleTagManager.pushEvent({
      event: 'layers_meta_category',
      layers: {
        meta_category: key
      }
    });
  }

  toggleFilterByAvailable() {
    const { inputValue, filterByAvailable, update } = this.props;
    update({ filterByAvailable: !filterByAvailable });
    this.runSearch(inputValue);
  }

  /**
   * When using "back" button or clearing search field, unset selections
   */
  revertSearchState() {
    this.props.update({
      listType: 'category',
      inputValue: '',
      selectedLayer: null,
      selectedMeasurement: null,
      selectedMeasurementSourceIndex: 0,
      listScrollTop: 0
    });
  }

  /**
   * When in "search" mode
   * @param {*} selectedLayer - the layer for which to show metadata
   */
  showMetadataForLayer(selectedLayer) {
    this.props.update({ selectedLayer });
  }

  renderLayerList() {
    const { headerElement } = this.state;
    const {
      isMobile,
      categoryConfig,
      selectedProjection,
      selectedDate,
      activeLayers,
      measurementConfig,
      hasMeasurementSource,
      selectedMeasurementSourceIndex,
      removeLayer,
      addLayer,
      hasMeasurementSetting,
      screenHeight,
      layerConfig,
      filteredRows,
      numRowsFilteredOut,
      listType,
      categoryType,
      category,
      selectedMeasurement,
      selectedLayer,
      updateScrollPosition,
      listScrollTop
    } = this.props;

    const isSearching = listType === 'search';
    const debouncedOnScroll = lodashDebounce((contentWrapperEl) => {
      updateScrollPosition(contentWrapperEl.scrollTop);
    }, 500);
    const bodyHeight = headerElement ? screenHeight - headerElement.offsetHeight : 0;
    let listHeight, listMinHeight, detailHeight;
    if (isMobile) {
      detailHeight = selectedLayer ? bodyHeight / 2 : bodyHeight;
      listHeight = selectedLayer
        ? (bodyHeight / 2) - 10
        : bodyHeight - 8;
      listMinHeight = listHeight;
    } else {
      detailHeight = listHeight = bodyHeight - 80;
      listMinHeight = 300;
    }

    const containerClass = isMobile ? 'search-container mobile' : 'search-container';
    const listContainerClass = isSearching
      ? isMobile
        ? 'layer-list-container search mobile'
        : 'layer-list-container search'
      : isMobile
        ? 'layer-list-container browse mobile'
        : 'layer-list-container browse';

    return filteredRows.length || !isSearching ? (
      <>
        <div className={containerClass}>
          <div className={listContainerClass}>
            <Scrollbars
              style={{
                maxHeight: listHeight + 'px',
                minHeight: listMinHeight + 'px'
              }}
              scrollBarVerticalTop={listScrollTop}
              onScroll={debouncedOnScroll}>
              <div className="product-outter-list-case">
                <LayerList
                  isMobile={isMobile}
                  addLayer={addLayer}
                  removeLayer={removeLayer}
                  activeLayers={activeLayers}
                  layerConfig={layerConfig}
                  listType={listType}
                  category={category}
                  categoryConfig={categoryConfig[categoryType]}
                  selectedProjection={selectedProjection}
                  selectedDate={selectedDate}
                  selectedLayer={selectedLayer}
                  filteredRows={filteredRows}
                  hasMeasurementSetting={hasMeasurementSetting}
                  hasMeasurementSource={hasMeasurementSource}
                  measurementConfig={measurementConfig}
                  selectedMeasurement={selectedMeasurement}
                  updateSelectedMeasurement={this.updateSelectedMeasurement.bind(this)}
                  showMetadataForLayer={layer => this.showMetadataForLayer(layer)}
                  setSourceIndex={index => this.setSourceIndex(index)}
                  selectedMeasurementSourceIndex={selectedMeasurementSourceIndex}
                />
              </div>
            </Scrollbars>
          </div>
          { this.renderDetails(detailHeight) }
        </div>
      </>)
      : (
        <div className="no-results" style={{ height: listMinHeight - 45 + 'px' }}>
          <i className="fas fa-5x fa-meteor"></i>
          <h3> No layers found! </h3>
          {numRowsFilteredOut > 0 &&
          <p>
            {numRowsFilteredOut} result(s) are being filtered out.
            <a className="remove-filters" onClick={this.toggleFilterByAvailable.bind(this)}>
              Remove filters?
            </a>
          </p>
          }
        </div>
      );
  }

  renderDetails(height) {
    const {
      isMobile,
      activeLayers,
      addLayer,
      removeLayer,
      selectedProjection,
      category,
      listType,
      selectedLayer
    } = this.props;
    const isSearching = listType === 'search';
    const selectedLayerActive = selectedLayer &&
      activeLayers.some(layer => layer.id === selectedLayer.id);
    const detailContainerClass = isSearching
      ? isMobile
        ? 'layer-detail-container layers-all search mobile'
        : 'layer-detail-container layers-all search'
      : 'layer-detail-container layers-all browse';

    if (isSearching) {
      return isMobile && !selectedLayer ? null : (
        <div className={detailContainerClass}>
          <Scrollbars style={{ maxHeight: height + 'px' }}>
            <LayerMetadataDetail
              layer={selectedLayer}
              isActive={selectedLayerActive}
              addLayer={addLayer}
              removeLayer={removeLayer}
              selectedProjection={selectedProjection}>
            </LayerMetadataDetail>
          </Scrollbars>
        </div>
      );
    } else {
      return !isMobile && (
        <div className={detailContainerClass}>
          <Scrollbars style={{ maxHeight: height + 'px' }}>
            <MeasurementMetadataDetail
              categoryTitle={category && category.title}
              source={this.getSelectedMeasurementSource()}>
            </MeasurementMetadataDetail>
          </Scrollbars>
        </div>
      );
    }
  }

  render() {
    const { headerElement } = this.state;
    const {
      selectedProjection,
      modalView,
      screenHeight,
      width,
      isMobile,
      onToggle,
      categoryConfig,
      measurementConfig,
      hasMeasurementSource,
      selectedDate,
      listType,
      categoryType,
      category,
      inputValue,
      filterByAvailable,
      filteredRows,
      numRowsFilteredOut
    } = this.props;
    const isCategoryDisplay = listType === 'category' && selectedProjection === 'geographic';
    const showCategoryTabs = (isCategoryDisplay || categoryType === 'featured') && !inputValue;
    const categoryKeys = [
      'hazards and disasters',
      'scientific',
      'featured'
    ];
    const bodyHeight = headerElement ? screenHeight - headerElement.offsetHeight - 38 : 0;
    const listHeight = isMobile ? bodyHeight : bodyHeight - 50;

    const diplayDate = moment.utc(selectedDate).format('YYYY MMM DD');
    const filterTooltipContent =
      <div className="filter-tooltip">
        If enabled, only show results which would be visible
        at the currently selected date: <br />
        <div className="display-date"> {diplayDate} </div>
      </div>;

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
            runSearch={this.runSearch.bind(this)}
            updateListState={this.revertSearchState.bind(this)}
            filterByAvailable={filterByAvailable}
            toggleFilterByAvailable={this.toggleFilterByAvailable.bind(this)}>
            {listType === 'search' && !isMobile &&
              <div className='header-filter-container'>
                <div className='header-filters'>
                  <Switch
                    id="unavailable-toggle"
                    label="Hide unavailable"
                    active={filterByAvailable}
                    toggle={this.toggleFilterByAvailable.bind(this)}
                    tooltip={filterTooltipContent}>
                  </Switch>
                </div>
                <div className="results-text">
                  Showing {filteredRows.length} results
                  {numRowsFilteredOut > 0 &&
                    <span>({numRowsFilteredOut} hidden by filters)</span>
                  }
                </div>
              </div>
            }
          </ProductPickerHeader>
        </ModalHeader>

        <ModalBody>
          <div id="layer-modal-content" className="layer-modal-content">
            {showCategoryTabs
              ? (
                <>
                  <Nav id="categories-nav" className="categories-nav">
                    {categoryKeys.map(sortKey => (
                      <NavItem
                        key={sortKey}
                        className="layer-category-navigation"
                        active={sortKey === categoryType}
                      >
                        <NavLink onClick={this.sort.bind(this, sortKey)}>
                          {sortKey === 'scientific' ? 'Science Disciplines' : sortKey}
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                  {isCategoryDisplay ? (
                    <Scrollbars style={{ maxHeight: listHeight + 'px' }}>
                      <div className="product-outter-list-case">
                        <CategoryGrid
                          categories={lodashValues(categoryConfig[categoryType])}
                          measurementConfig={measurementConfig}
                          drawMeasurements={this.drawMeasurements.bind(this)}
                          hasMeasurementSource={hasMeasurementSource}
                          categoryType={categoryType}
                          width={width}
                        />
                      </div>
                    </Scrollbars>
                  ) : this.renderLayerList()}
                </>
              )
              : this.renderLayerList()
            }
          </div>
        </ModalBody>
      </>
    );
  }
}

ProductPicker.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  allLayers: PropTypes.array,
  categories: PropTypes.array,
  category: PropTypes.object,
  categoryConfig: PropTypes.object,
  categoryType: PropTypes.string,
  drawMeasurements: PropTypes.func,
  filterByAvailable: PropTypes.bool,
  filteredRows: PropTypes.array,
  filterProjections: PropTypes.func,
  filterSearch: PropTypes.func,
  hasMeasurementSetting: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  inputValue: PropTypes.string,
  isMobile: PropTypes.bool,
  layerConfig: PropTypes.object,
  listScrollTop: PropTypes.number,
  listType: PropTypes.string,
  measurementConfig: PropTypes.object,
  measurements: PropTypes.object,
  modalView: PropTypes.string,
  numRowsFilteredOut: PropTypes.number,
  onToggle: PropTypes.func,
  removeLayer: PropTypes.func,
  screenHeight: PropTypes.number,
  searchResultRows: PropTypes.array,
  selectedDate: PropTypes.object,
  selectedLayer: PropTypes.object,
  selectedMeasurement: PropTypes.string,
  selectedMeasurementSource: PropTypes.object,
  selectedMeasurementSourceIndex: PropTypes.number,
  selectedProjection: PropTypes.string,
  update: PropTypes.func,
  updateScrollPosition: PropTypes.func,
  width: PropTypes.number
};

const mapDispatchToProps = dispatch => ({
  addLayer: id => {
    googleTagManager.pushEvent({
      event: 'layer_added',
      layers: {
        id: id
      }
    });
    dispatch(addLayer(id));
  },
  removeLayer: id => {
    dispatch(removeLayer(id));
  },
  onToggle: () => {
    dispatch(onToggle());
  },
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
  },
  update: (partialState) => {
    dispatch(updateProductPicker(partialState));
  }
});

function mapStateToProps(state, ownProps) {
  const {
    config,
    browser,
    proj,
    layers,
    compare,
    date,
    productPicker
  } = state;
  const { screenWidth, screenHeight } = browser;
  const isMobile = browser.lessThan.medium;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const width = getModalWidth(screenWidth);
  const allLayers = getLayersForProjection(config, proj.id);
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
    filterProjections: layer => {
      return !layer.projections[proj.id];
    },
    filterSearch: (layer, val, terms) => {
      return filterSearch(layer, val, terms, config, proj.id);
    },
    hasMeasurementSource: current => {
      return hasMeasurementSource(current, config, proj.id);
    },
    hasMeasurementSetting: (current, source) => {
      return hasMeasurementSetting(current, source, config, proj.id);
    }
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductPicker);

const getModalWidth = function(width) {
  var availableWidth = width - width * 0.15;
  var gridItemWidth = 310;
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
    filtered =
      !lodashIncludes(title, term) &&
      !lodashIncludes(subtitle, term) &&
      !lodashIncludes(tags, term) &&
      !lodashIncludes(layerId, term);
    if (filtered) return false;
  });
  return filtered;
};
