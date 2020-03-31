import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  values as lodashValues,
} from 'lodash';
import lodashDebounce from 'lodash/debounce';
// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';
import {
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';
import LayerList from './layer-list';
import CategoryGrid from './category-grid';
import Scrollbars from '../../util/scrollbar';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../modules/layers/actions';
import {
  hasMeasurementSetting as hasSettingSelector,
  hasMeasurementSource as hasSourceeSelecetor,
} from '../../../modules/layers/selectors';
import MeasurementMetadataDetail from './measurement-metadata-detail';
import {
  updateProductPicker,
  updateListScrollTop,
} from '../../../modules/product-picker/actions';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class BrowseLayers extends React.Component {
  constructor(props) {
    super(props);

    this.selectMeasurement = this.selectMeasurement.bind(this);
    this.showMeasurements = this.showMeasurements.bind(this);
    this.selectCategoryType = this.selectCategoryType.bind(this);
  }

  /**
   * Update category type in which to show
   * e.g. Hazards and disasters or science disciplines
   * @param {String} key | categoryType identifier
   */
  selectCategoryType(key) {
    const { updateProductPickerState } = this.props;
    if (key === 'featured') {
      this.toggleFeatureTab();
    } else {
      updateProductPickerState({
        categoryType: key,
        listType: 'category',
        selectedMeasurement: null,
      });
    }

    googleTagManager.pushEvent({
      event: 'layers_meta_category',
      layers: {
        meta_category: key,
      },
    });
  }

  toggleFeatureTab = (partialState) => {
    const { updateProductPickerState } = this.props;
    const categoryType = 'featured';
    const { categoryConfig, measurementConfig } = this.props;
    const category = categoryConfig[categoryType].All;
    const selectedMeasurement = category.measurements[0];
    const selectedMeasurementId = measurementConfig[selectedMeasurement].id;

    updateProductPickerState({
      ...partialState,
      categoryType,
      category,
      listType: 'measurements',
      selectedMeasurement: selectedMeasurementId,
    });
  }

  /**
   * Draw measurement list when category is clicked
   * @function showMeasurements
   * @param {Object} category | category object
   * @param {String} selectedMeasurement | Measurement ID
   */
  showMeasurements(category, selectedMeasurement) {
    const { updateProductPickerState } = this.props;
    updateProductPickerState({
      listType: 'measurements',
      selectedMeasurement,
      category,
    });
    googleTagManager.pushEvent({
      event: 'layers_category',
      layers: {
        category: category.title,
      },
    });
  }

  /**
   * @function selectMeasurement
   * @param {String} id | Measurement ID
   */
  selectMeasurement(id) {
    const { updateProductPickerState, productPicker } = this.props;
    if (productPicker.selectedMeasurement !== id) {
      updateProductPickerState({
        selectedMeasurement: id,
        selectedMeasurementSourceIndex: 0,
      });
    } else {
      updateProductPickerState({
        selectedMeasurement: null,
        selectedMeasurementSourceIndex: 0,
      });
    }
  }

  /**
   * When in "browse" measurement mode
   * @param {*} selectedMeasurementSourceIndex - the index of the source for which to show metadata
   */
  setSourceIndex(selectedMeasurementSourceIndex) {
    const { updateProductPickerState } = this.props;
    updateProductPickerState({ selectedMeasurementSourceIndex });
  }

  getSelectedMeasurementSource() {
    const { productPicker, measurementConfig } = this.props;
    const { selectedMeasurement, selectedMeasurementSourceIndex } = productPicker;
    const measurements = Object.values(measurementConfig);
    const currentMeasurement = measurements.find(({ id }) => id === selectedMeasurement);
    if (currentMeasurement) {
      const sources = Object.values(currentMeasurement.sources)
        .sort((a, b) => a.title.localeCompare(b.title));
      return sources && sources[selectedMeasurementSourceIndex];
    }
  }

  renderLayerList() {
    const {
      listHeight,
      listMinHeight,
      detailHeight,
      isMobile,
      categoryConfig,
      selectedProjection,
      selectedDate,
      activeLayers,
      measurementConfig,
      addLayer,
      removeLayer,
      hasMeasurementSource,
      hasMeasurementSetting,
      layerConfig,
      selectedLayer,
      updateScrollPosition,
      productPicker,
    } = this.props;
    const {
      category,
      categoryType,
      listScrollTop,
      selectedMeasurement,
      selectedMeasurementSourceIndex,
    } = productPicker;

    const debouncedOnScroll = lodashDebounce(({ scrollTop }) => {
      updateScrollPosition(scrollTop);
    }, 500);
    const containerClass = isMobile ? 'search-container mobile' : 'search-container';
    const listContainerClass = isMobile ? 'layer-list-container browse mobile' : 'layer-list-container browse';

    return (
      <div className={containerClass}>
        <div className={listContainerClass}>
          <Scrollbars
            style={{
              maxHeight: `${listHeight}px`,
              minHeight: `${listMinHeight}px`,
            }}
            scrollBarVerticalTop={listScrollTop}
            onScroll={debouncedOnScroll}
          >
            <div className="product-outter-list-case">
              <LayerList
                listType="measurements"
                isMobile={isMobile}
                addLayer={addLayer}
                removeLayer={removeLayer}
                activeLayers={activeLayers}
                layerConfig={layerConfig}
                category={category}
                categoryConfig={categoryConfig[categoryType]}
                selectedProjection={selectedProjection}
                selectedDate={selectedDate}
                selectedLayer={selectedLayer}
                hasMeasurementSetting={hasMeasurementSetting}
                hasMeasurementSource={hasMeasurementSource}
                measurementConfig={measurementConfig}
                selectedMeasurement={selectedMeasurement}
                updateSelectedMeasurement={this.selectMeasurement}
                setSourceIndex={(index) => this.setSourceIndex(index)}
                selectedMeasurementSourceIndex={selectedMeasurementSourceIndex}
              />
            </div>
          </Scrollbars>
        </div>
        { !isMobile && (
          <div className="layer-detail-container layers-all browse">
            <Scrollbars style={{ maxHeight: `${detailHeight}px` }}>
              <MeasurementMetadataDetail
                categoryTitle={category && category.title}
                source={this.getSelectedMeasurementSource()}
              />
            </Scrollbars>
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      listHeight,
      selectedProjection,
      width,
      categoryConfig,
      measurementConfig,
      hasMeasurementSource,
      productPicker,
    } = this.props;
    const { categoryType, listType } = productPicker;
    const isCategoryDisplay = listType === 'category' && selectedProjection === 'geographic';
    const showCategoryTabs = isCategoryDisplay || categoryType === 'featured';
    const categoryKeys = [
      'hazards and disasters',
      'scientific',
      'featured',
    ];

    return (
      showCategoryTabs
        ? (
          <>
            <Nav id="categories-nav" className="categories-nav">
              {categoryKeys.map((sortKey) => (
                <NavItem
                  key={sortKey}
                  className="layer-category-navigation"
                  active={sortKey === categoryType}
                >
                  <NavLink onClick={() => this.selectCategoryType(sortKey)}>
                    {sortKey === 'scientific' ? 'Science Disciplines' : sortKey}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
            {isCategoryDisplay ? (
              <Scrollbars style={{ maxHeight: `${listHeight}px` }}>
                <div className="product-outter-list-case">
                  <CategoryGrid
                    categories={lodashValues(categoryConfig[categoryType])}
                    measurementConfig={measurementConfig}
                    drawMeasurements={this.showMeasurements}
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
    );
  }
}

BrowseLayers.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  categoryConfig: PropTypes.object,
  hasMeasurementSetting: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  isMobile: PropTypes.bool,
  layerConfig: PropTypes.object,
  listHeight: PropTypes.number,
  listMinHeight: PropTypes.number,
  detailHeight: PropTypes.number,
  measurementConfig: PropTypes.object,
  measurements: PropTypes.object,
  productPicker: PropTypes.object,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  selectedLayer: PropTypes.object,
  selectedProjection: PropTypes.string,
  updateProductPickerState: PropTypes.func,
  updateScrollPosition: PropTypes.func,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    googleTagManager.pushEvent({
      event: 'layer_added',
      layers: {
        id,
      },
    });
    dispatch(addLayerAction(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayerAction(id));
  },
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
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
  const { screenHeight } = browser;
  const isMobile = browser.lessThan.medium;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = layers[activeString];

  return {
    productPicker,
    categoryConfig: config.categories,
    measurementConfig: config.measurements,
    layerConfig: config.layers,
    selectedDate: date.selected,
    isMobile,
    screenHeight,
    activeLayers,
    selectedProjection: proj.id,
    showPreviewImage: config.features.previewSnapshots,
    filterProjections: (layer) => !layer.projections[proj.id],
    hasMeasurementSource: (current) => hasSourceeSelecetor(current, config, proj.id),
    hasMeasurementSetting: (current, source) => hasSettingSelector(current, source, config, proj.id),
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BrowseLayers);
