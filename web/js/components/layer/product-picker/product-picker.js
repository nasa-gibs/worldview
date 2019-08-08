import React from 'react';
import PropTypes from 'prop-types';
import LayerList from './list';
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

import { ModalBody, ModalHeader, Nav, NavItem, NavLink } from 'reactstrap';

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
      categoryType: Object.keys(props.categoryConfig)[0],
      category: props.category,
      selectedMeasurement: null,
      filteredRows: props.filteredRows,
      inputValue: ''
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
    const { filterProjections, filterSearch, allLayers } = this.props;
    const val = value.toLowerCase();
    if (val.length === 0) {
      this.setState({
        filteredRows: [],
        listType: 'category',
        inputValue: ''
      });
    } else {
      const terms = val.split(/ +/);
      const filteredRows = allLayers.filter(function(layer) {
        return !(filterProjections(layer) || filterSearch(layer, val, terms));
      });
      this.setState({
        filteredRows: filteredRows,
        listType: 'search',
        inputValue: value
      });
    }
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
      selectedMeasurement: selectedMeasurement,
      category: category
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

  /**
   * Update category type in which to sort
   * e.g. Hazards and disasters or science
   * disciplines
   * @param {String} key | categoryType identifier
   */
  sort(key) {
    this.setState({
      categoryType: key
    });
    googleTagManager.pushEvent({
      event: 'layers_meta_category',
      layers: {
        meta_category: key
      }
    });
  }

  render() {
    const {
      filteredRows,
      listType,
      categoryType,
      category,
      inputValue,
      selectedMeasurement
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
      modalView,
      height,
      width,
      isMobile,
      onToggle
    } = this.props;
    const isCategoryDisplay =
      listType === 'category' && selectedProjection === 'geographic';

    return (
      <React.Fragment>
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
            {isCategoryDisplay ? (
              <Nav tabs id="categories-nav" className="categories-nav">
                {Object.keys(categoryConfig).map(sortKey => (
                  <NavItem
                    key={sortKey}
                    className="layer-category-navigation"
                    active={sortKey === categoryType}
                  >
                    <NavLink onClick={this.sort.bind(this, sortKey)}>
                      {sortKey === 'scientific'
                        ? 'Science Disciplines'
                        : sortKey}
                    </NavLink>
                  </NavItem>
                ))}
              </Nav>
            ) : (
              ''
            )}

            <Scrollbars style={{ maxHeight: height - 40 + 'px' }}>
              <div className="product-outter-list-case">
                {isCategoryDisplay ? (
                  <CategoryList
                    categories={lodashValues(categoryConfig[categoryType])}
                    measurementConfig={measurementConfig}
                    drawMeasurements={this.drawMeasurements.bind(this)}
                    hasMeasurementSource={hasMeasurementSource}
                    categoryType={categoryType}
                    width={width}
                  />
                ) : (
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
                    updateSelectedMeasurement={this.updateSelectedMeasurement.bind(
                      this
                    )}
                  />
                )}
              </div>
            </Scrollbars>
          </div>
        </ModalBody>
      </React.Fragment>
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
  const { config, browser, proj, layers, compare } = state;
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
    hasMeasurementSetting: (current, source) => {
      return hasMeasurementSetting(current, source, config, proj.id);
    },
    filterSearch: (layer, val, terms) => {
      return filterSearch(layer, val, terms, config, proj.id);
    },
    hasMeasurementSource: current => {
      return hasMeasurementSource(current, config, proj.id);
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
