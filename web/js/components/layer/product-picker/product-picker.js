import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import CategoryGrid from './category-grid';
import ProductPickerHeader from './header';
import LayerFilters from './layer-filters';
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

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ProductPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      listType: props.listType,
      categoryType: Object.keys(props.categoryConfig)[1],
      category: props.category,
      selectedLayer: null,
      selectedMeasurement: null,
      measurementSourceIndex: 0,
      filteredRows: props.filteredRows,
      inputValue: '',
      filterByAvailable: true,
      tooltipFilterAvailableOpen: false,
      modalElement: null
    };
    this.runSearch = lodashDebounce(this.runSearch, 300);
  }

  componentDidMount() {
    const modalElement = document.getElementById('layer_picker_component');
    modalElement.classList.add('category-width');
    this.setState({ modalElement });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { listType, modalElement } = this.state;
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
      allLayers
    } = this.props;
    const { categoryType, filterByAvailable } = this.state;
    const val = value.toLowerCase();
    let newState;

    // Search cleared
    if (val.length === 0) {
      newState = {
        filteredRows: [],
        listType: 'category',
        inputValue: ''
      };
      if (categoryType === 'featured') {
        this.toggleFeatureTab(newState);
        return;
      }
    // Search with terms
    } else {
      const terms = val.split(/ +/);
      const filteredRows = allLayers.filter(layer => {
        return !(
          filterProjections(layer) ||
          filterSearch(layer, val, terms) ||
          (filterByAvailable && !availableAtDate(layer, selectedDate))
        );
      });

      newState = {
        filteredRows: filteredRows,
        listType: 'search',
        inputValue: value
      };
    }
    this.setState(newState);
  }

  /**
   * Draw measurement list when category is clicked
   * @function drawMeasurements
   * @param {Object} category | category object
   * @param {String} selectedMeasurement | Measurement ID
   */
  drawMeasurements(category, selectedMeasurement) {
    this.setState({
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
    if (this.state.selectedMeasurement !== id) {
      this.setState({
        selectedMeasurement: id,
        measurementSourceIndex: 0
      });
    } else {
      this.setState({
        selectedMeasurement: null,
        measurementSourceIndex: 0
      });
    }
  }

  toggleFeatureTab = (partialState) => {
    const categoryType = 'featured';
    const { categoryConfig, measurementConfig } = this.props;
    const category = categoryConfig[categoryType].All;
    const selectedMeasurement = category.measurements[0];
    const selectedMeasurementId = measurementConfig[selectedMeasurement].id;

    this.setState({
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
      this.setState({
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
    const { inputValue, filterByAvailable } = this.state;
    this.setState({ filterByAvailable: !filterByAvailable });
    this.runSearch(inputValue);
  }

  /**
   * When using "back" button or clearing search field, unset selections
   */
  revertSearchState() {
    this.setState({
      listType: 'category',
      inputValue: '',
      selectedLayer: null,
      selectedMeasurement: null
    });
  }

  /**
   * When in "search" mode
   * @param {*} selectedLayer - the layer for which to show metadata
   */
  showMetadataForLayer(selectedLayer) {
    this.setState({ selectedLayer });
  }

  /**
   * When in "browse" measurement mode
   * @param {*} measurementSourceIndex -  the index of the source for which to show metadata
   */
  setSourceIndex(measurementSourceIndex) {
    this.setState({ measurementSourceIndex });
  }

  getCurrentMeasureSource() {
    const { measurementConfig } = this.props;
    const { selectedMeasurement, measurementSourceIndex } = this.state;

    let currentMeasurement;
    Object.keys(measurementConfig).forEach(measureName => {
      if (measurementConfig[measureName].id === selectedMeasurement) {
        currentMeasurement = measurementConfig[measureName];
      }
    });
    const sources = currentMeasurement && lodashValues(currentMeasurement.sources)
      .sort((a, b) => a.title.localeCompare(b.title));
    return sources && sources[measurementSourceIndex];
  }

  renderLayerList() {
    const {
      filteredRows,
      listType,
      categoryType,
      category,
      selectedMeasurement,
      selectedLayer,
      filterByAvailable
    } = this.state;
    const {
      categoryConfig,
      selectedProjection,
      selectedDate,
      activeLayers,
      measurementConfig,
      hasMeasurementSource,
      removeLayer,
      addLayer,
      hasMeasurementSetting,
      layerConfig,
      height
    } = this.props;

    const listContainerClass = listType === 'search'
      ? 'layer-list-container search'
      : 'layer-list-container browse';
    const detailContainerClass = listType === 'search'
      ? 'layer-detail-container layers-all search'
      : 'layer-detail-container layers-all browse';

    const currentMeasureSource = this.getCurrentMeasureSource();

    return (
      <>
        {listType === 'search' &&
          <LayerFilters
            selectedDate={selectedDate}
            numResults={filteredRows.length}
            filterByAvailable={filterByAvailable}
            toggleFilterByAvailable={this.toggleFilterByAvailable.bind(this)}
          />
        }

        <div className={listContainerClass}>
          <Scrollbars style={{ maxHeight: height + 'px' }}>
            <div className="product-outter-list-case">
              <LayerList
                addLayer={addLayer}
                removeLayer={removeLayer}
                activeLayers={activeLayers}
                layerConfig={layerConfig}
                listType={listType}
                category={category}
                categoryConfig={categoryConfig[categoryType]}
                selectedProjection={selectedProjection}
                selectedDate={selectedDate}
                filteredRows={filteredRows}
                hasMeasurementSetting={hasMeasurementSetting}
                hasMeasurementSource={hasMeasurementSource}
                measurementConfig={measurementConfig}
                selectedMeasurement={selectedMeasurement}
                updateSelectedMeasurement={this.updateSelectedMeasurement.bind(this)}
                showMetadataForLayer={layer => this.showMetadataForLayer(layer)}
                setSourceIndex={index => this.setSourceIndex(index)}
              />
            </div>
          </Scrollbars>
        </div>

        <div className={detailContainerClass}>
          {listType === 'search' ? (
            <LayerMetadataDetail
              layer={selectedLayer}
              height={height}>
            </LayerMetadataDetail>
          ) : (
            <MeasurementMetadataDetail
              categoryTitle={category.title}
              source={currentMeasureSource}
              height={height}>
            </MeasurementMetadataDetail>
          )}
        </div>
      </>
    );
  }

  render() {
    const {
      listType,
      categoryType,
      category,
      inputValue
    } = this.state;
    const {
      selectedProjection,
      modalView,
      height,
      width,
      isMobile,
      onToggle,
      categoryConfig,
      measurementConfig,
      hasMeasurementSource
    } = this.props;
    const isCategoryDisplay = listType === 'category' && selectedProjection === 'geographic';
    const showCategoryTabs = isCategoryDisplay || categoryType === 'featured';
    const categoryKeys = [
      'hazards and disasters',
      'scientific',
      'featured'
    ];

    return (
      <>
        <ModalHeader toggle={onToggle}>
          <ProductPickerHeader
            selectedProjection={selectedProjection}
            listType={listType}
            inputValue={inputValue}
            isMobile={isMobile}
            category={category}
            modalView={modalView}
            width={width}
            runSearch={this.runSearch.bind(this)}
            updateListState={this.revertSearchState.bind(this)}
          />
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
                  <Scrollbars style={{ maxHeight: height + 'px' }}>
                    <div>
                      {isCategoryDisplay ? (
                        <CategoryGrid
                          categories={lodashValues(categoryConfig[categoryType])}
                          measurementConfig={measurementConfig}
                          drawMeasurements={this.drawMeasurements.bind(this)}
                          hasMeasurementSource={hasMeasurementSource}
                          categoryType={categoryType}
                          width={width}
                        />
                      ) : this.renderLayerList()}
                    </div>
                  </Scrollbars>
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

ProductPicker.defaultProps = {
  category: null,
  listType: 'category'
};
ProductPicker.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  allLayers: PropTypes.array,
  categories: PropTypes.array,
  category: PropTypes.object,
  categoryConfig: PropTypes.object,
  currentMeasureSource: PropTypes.func,
  drawMeasurements: PropTypes.func,
  filterByDate: PropTypes.func,
  filteredRows: PropTypes.array,
  filterProjections: PropTypes.func,
  filterSearch: PropTypes.func,
  hasMeasurementSetting: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  layerConfig: PropTypes.object,
  listType: PropTypes.string,
  measurementConfig: PropTypes.object,
  measurements: PropTypes.object,
  modalView: PropTypes.string,
  onToggle: PropTypes.func,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  selectedProjection: PropTypes.string,
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
  }
});

function mapStateToProps(state, ownProps) {
  const { config, browser, proj, layers, compare, date } = state;
  const { screenWidth, screenHeight } = browser;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const height = screenHeight - 140;
  const width = getModalWidth(screenWidth);
  const allLayers = getLayersForProjection(config, proj.id);
  const activeLayers = layers[activeString];

  return {
    categoryConfig: config.categories,
    measurementConfig: config.measurements,
    layerConfig: config.layers,
    selectedDate: date.selected,
    height,
    width,
    allLayers,
    filteredRows: allLayers,
    activeLayers,
    selectedProjection: proj.id,
    isMobile: browser.lessThan.medium,
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
const filterSearch = function(layer, val, terms, config, projId) {
  if (!val) return false;
  var filtered = false;

  var names = getTitles(config, layer.id, projId);
  lodashEach(terms, function(term, index) {
    filtered =
      !lodashIncludes(lodashToLower(names.title), term) &&
      !lodashIncludes(lodashToLower(names.subtitle), term) &&
      !lodashIncludes(lodashToLower(names.tags), term) &&
      !lodashIncludes(lodashToLower(layer.id, term));
    if (filtered) return false;
  });
  return filtered;
};
