import React from 'react';
import PropTypes from 'prop-types';
import LayerList from './list';
import CategoryList from './category-list';
import ProductPickerHeader from './header';
import lodashValues from 'lodash/values';
import Scrollbars from '../../util/scrollbar';
import googleTagManager from 'googleTagManager';
import lodashDebounce from 'lodash/debounce';

import {
  Modal,
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
      isOpen: props.isOpen,
      categoryType: Object.keys(props.categoryConfig)[0],
      height: props.height,
      width: props.width,
      category: props.category,
      activeLayers: props.activeLayers,
      allLayers: props.allLayers,
      selectedMeasurement: null,
      filteredRows: props.filteredRows,
      selectedProjection: props.selectedProjection,
      inputValue: ''
    };
    this.runSearch = lodashDebounce(this.runSearch, 300);
  }
  /**
   * Update modal visibility
   * @function toggle
   */
  toggle() {
    const val = !this.state.isOpen;
    this.setState({
      isOpen: val
    });
    this.props.onToggleModal(val);
  }
  /**
   * Either filter layers with search object or
   * revert to initial state
   * @function runSearch
   * @param e | onChange event object
   */
  runSearch(value) {
    const { filterProjections, filterSearch } = this.props;
    const { allLayers } = this.state;
    let val = value.toLowerCase();

    if (val.length === 0) {
      this.setState({
        filteredRows: [],
        listType: 'category',
        inputValue: ''
      });
    } else {
      let terms = val.split(/ +/);
      let filteredRows = allLayers.filter(function(layer) {
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
      isOpen,
      activeLayers,
      selectedProjection,
      filteredRows,
      listType,
      categoryType,
      height,
      category,
      inputValue,
      width,
      selectedMeasurement
    } = this.state;
    const {
      categoryConfig,
      measurementConfig,
      hasMeasurementSource,
      removeLayer,
      addLayer,
      hasMeasurementSetting,
      layerConfig,
      modalView
    } = this.props;
    const isCategoryDisplay =
      listType === 'category' && selectedProjection === 'geographic';

    return (
      <Modal
        isOpen={isOpen}
        toggle={this.toggle.bind(this)}
        backdrop={true}
        className="custom-layer-dialog"
        autoFocus={false}
      >
        <ModalHeader toggle={this.toggle.bind(this)}>
          <ProductPickerHeader
            selectedProjection={selectedProjection}
            listType={listType}
            inputValue={inputValue}
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
      </Modal>
    );
  }
}

ProductPicker.defaultProps = {
  listType: 'category',
  isOpen: false,
  category: null
};
ProductPicker.propTypes = {
  listType: PropTypes.string,
  categories: PropTypes.array,
  measurements: PropTypes.object,
  drawMeasurements: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  isOpen: PropTypes.bool,
  toggleModal: PropTypes.func,
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  activeLayers: PropTypes.array,
  filteredRows: PropTypes.array,
  height: PropTypes.number,
  expandedMeasurements: PropTypes.object,
  activeMeasurementIndex: PropTypes.number,
  selectedProjection: PropTypes.string,
  modalView: PropTypes.string,
  categoryConfig: PropTypes.object,
  measurementConfig: PropTypes.object,
  layerConfig: PropTypes.object,
  allLayers: PropTypes.array,
  width: PropTypes.number,
  hasMeasurementSetting: PropTypes.func,
  filterProjections: PropTypes.func,
  filterSearch: PropTypes.func,
  onToggleModal: PropTypes.func,
  category: PropTypes.object
};

export default ProductPicker;
