import React from 'react';
import PropTypes from 'prop-types';
import LayerList from './layer-list';
import CategoryList from './category-list';
import ProductPickerHeader from './header';
import {
  toLower as lodashToLower,
  values as lodashValues,
  each as lodashEach,
  includes as lodashIncludes
} from 'lodash';
import Scrollbars from '../../util/scrollbar';
import googleTagManager from 'googleTagManager';
import lodashDebounce from 'lodash/debounce';
import { connect } from 'react-redux';
import { addLayer, removeLayer } from '../../../modules/layers/actions';
import {
  getLayersForProjection,
  getTitles,
  hasMeasurementSetting,
  hasMeasurementSource
} from '../../../modules/layers/selectors';
import { onToggle } from '../../../modules/modal/actions';
import { datesinDateRanges } from '../../../modules/layers/util.js';
import MetadataDetail from './metadata-detail';
import { ModalBody, ModalHeader, Nav, NavItem, NavLink, Form } from 'reactstrap';

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
      selectedMeasurement: null,
      filteredRows: props.filteredRows,
      inputValue: '',
      filterByAvailable: true,
      selectedLayer: null
    };
    this.runSearch = lodashDebounce(this.runSearch, 300);
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
      filterByDate,
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
          (filterByAvailable && !filterByDate(layer))
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
      this.setState({ selectedMeasurement: id });
    } else {
      this.setState({ selectedMeasurement: null });
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

  showMetadataForLayer(layer) {
    this.setState({
      selectedLayer: layer
    });
  }

  renderLayerCategoriesMenu() {
    const { categoryType, category } = this.state;
    const { categoryConfig } = this.props;
    const categories = categoryConfig[categoryType];

    return (
      <div className="layer-categories-list">
        <h4> {categoryType} </h4>
        <ul >

          {Object.keys(categories).map((categoryName, idx) => {
          // const firstMeasurementInCategory = category.measurements[0];
          // const selectedMeasurement = measurementConfig[firstMeasurementInCategory].id;
            const selectCategory = categories[categoryName];

            return (
              <li
                key={idx}
                onClick={() => this.drawMeasurements(selectCategory)}
                className={category.title === categoryName ? 'selected' : ''}>
                {categoryName}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  renderLayerList() {
    const {
      filteredRows,
      filterByAvailable,
      listType,
      categoryType,
      category,
      selectedMeasurement,
      selectedLayer
    } = this.state;
    const {
      categoryConfig,
      selectedProjection,
      activeLayers,
      measurementConfig,
      hasMeasurementSource,
      removeLayer,
      addLayer,
      hasMeasurementSetting,
      layerConfig,
      height
    } = this.props;

    return (
      <>
        <div className="layer-filters-container">
          {listType === 'search' ? (
            <>
              <div className="filter-controls">
                <h3>Filters</h3>
                <Form>

                  <div className="custom-control custom-switch">
                    <input
                      id="unit-toggle"
                      className="custom-control-input"
                      type="checkbox"
                      onChange={this.toggleFilterByAvailable.bind(this)}
                      defaultChecked={filterByAvailable}/>
                    <label className="custom-control-label" htmlFor="unit-toggle">
                      Filter by availability
                    </label>
                  </div>
                </Form>
              </div>
              <div className="results-text">
                Showing {filteredRows.length} results
              </div>
            </>
          ) : (
            this.renderLayerCategoriesMenu()
          )}
        </div>

        <div className="layer-list-container">
          <Scrollbars style={{ maxHeight: height - 40 + 'px' }}>
            <div className="product-outter-list-case">
              <LayerList
                addLayer={addLayer}
                removeLayer={removeLayer}
                activeLayers={activeLayers}
                hasMeasurementSource={hasMeasurementSource}
                selectedProjection={selectedProjection}
                filteredRows={filteredRows}
                hasMeasurementSetting={hasMeasurementSetting}
                measurementConfig={measurementConfig}
                layerConfig={layerConfig}
                listType={listType}
                category={category}
                categoryConfig={categoryConfig[categoryType]}
                selectedMeasurement={selectedMeasurement}
                updateSelectedMeasurement={this.updateSelectedMeasurement.bind(this)}
                showMetadataForLayer={layer => this.showMetadataForLayer(layer)}
              />
            </div>
          </Scrollbars>
        </div>
        <div className="layer-detail-container layers-all">
          <MetadataDetail
            layer={selectedLayer}>
          </MetadataDetail>
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
            updateListState={str => {
              this.setState({ listType: str, inputValue: '' });
            }}
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
                  <Scrollbars style={{ maxHeight: height - 40 + 'px' }}>
                    <div className="product-outter-list-case">
                      {isCategoryDisplay && (
                        <CategoryList
                          categories={lodashValues(categoryConfig[categoryType])}
                          measurementConfig={measurementConfig}
                          drawMeasurements={this.drawMeasurements.bind(this)}
                          hasMeasurementSource={hasMeasurementSource}
                          categoryType={categoryType}
                          width={width}
                        />
                      )}
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
  const height = screenHeight - 100;
  const width = getModalWidth(screenWidth);
  const allLayers = getLayersForProjection(config, proj.id);
  const activeLayers = layers[activeString];

  return {
    categoryConfig: config.categories,
    measurementConfig: config.measurements,
    layerConfig: config.layers,
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
    filterByDate: (layer) => {
      return filterByDate(layer, date.selected);
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
      !lodashIncludes(lodashToLower(config.layers[layer.id].id), term);
    if (filtered) return false;
  });
  return filtered;
};

/**
  *
  * @param {*} layer - layer definition
  * @param {*} date - current selected app date
  */
const filterByDate = (layer, date) => {
  const availableDates = datesinDateRanges(layer, date);
  if (layer.endDate && layer.inactive) {
    return date < new Date(layer.endDate) && date > new Date(layer.startDate);
  }
  if (!availableDates.length && !layer.endDate && !layer.inactive) {
    return date > new Date(layer.startDate);
  }
  return availableDates.length > 0;
};
