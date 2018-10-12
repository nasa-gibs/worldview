import React from 'react';
import PropTypes from 'prop-types';
import LayerList from './list';
import CategoryList from './category-list';
import ProductPickerHeader from './header';
import lodashValues from 'lodash/values';
import Scrollbars from '../util/scrollbar';
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
      category: null,
      activeLayers: props.activeLayers,
      allLayers: props.allLayers,
      selectedMeasurement: null,
      selectedProjection: props.selectedProjection
    };
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  runSearch(e) {
    const { filterProjections, filterSearch } = this.props;
    const { allLayers } = this.props;
    let val = e.target.value.toLowerCase();

    if (val.length === 0) {
      this.setState({
        filteredRows: [],
        listType: 'category'
      });
    } else {
      let terms = val.split(/ +/);
      let filteredRows = allLayers.filter(function(layer) {
        return !(filterProjections(layer) || filterSearch(layer, val, terms));
      });
      this.setState({
        filteredRows: filteredRows,
        listType: 'search'
      });
    }
  }
  drawMeasurements(category, selectedMeasurement) {
    this.setState({
      listType: 'measurements',
      selectedMeasurement: selectedMeasurement,
      category: category
    });
  }
  updateSelectedMeasurement(id) {
    if (this.state.selectedMeasurement !== id) {
      this.setState({ selectedMeasurement: id });
    } else {
      this.setState({ selectedMeasurement: null });
    }
  }
  sort(key) {
    this.setState({
      categoryType: key
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
    return (
      <Modal
        isOpen={isOpen}
        toggle={this.toggle.bind(this)}
        backdrop={true}
        className="custom-layer-dialog"
      >
        <ModalHeader toggle={this.toggle.bind(this)}>
          <ProductPickerHeader
            selectedProjection={selectedProjection}
            listType={listType}
            category={category}
            modalView={modalView}
            runSearch={this.runSearch.bind(this)}
            updateListState={str => {
              this.setState({ listType: str });
            }}
          />
        </ModalHeader>
        <Scrollbars style={{ maxHeight: height - 40 + 'px' }}>
          <ModalBody>
            <div id="layer-modal-content" className="layer-modal-content">
              {listType === 'category' ? (
                <React.Fragment>
                  <Nav tabs id="categories-nav" className="categories-nav">
                    {Object.keys(categoryConfig).map(sortKey => (
                      <NavItem
                        key={sortKey}
                        className="layer-category-navigation"
                        active={sortKey === categoryType}
                      >
                        <NavLink onClick={this.sort.bind(this, sortKey)}>
                          {sortKey}
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                  <CategoryList
                    categories={lodashValues(categoryConfig[categoryType])}
                    measurementConfig={measurementConfig}
                    drawMeasurements={this.drawMeasurements.bind(this)}
                    hasMeasurementSource={hasMeasurementSource}
                    categoryType={categoryType}
                    width={width}
                  />
                </React.Fragment>
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
                  selectedMeasurement={selectedMeasurement}
                  updateSelectedMeasurement={this.updateSelectedMeasurement.bind(
                    this
                  )}
                />
              )}
            </div>
          </ModalBody>
        </Scrollbars>
      </Modal>
    );
  }
}

ProductPicker.defaultProps = {
  listType: 'category',
  isOpen: false
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
  filterSearch: PropTypes.func
};

export default ProductPicker;
