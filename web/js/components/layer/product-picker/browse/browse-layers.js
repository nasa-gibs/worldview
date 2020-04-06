import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import {
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';
import BrowseLayerList from './browse-layers-list';
import CategoryGrid from './category-grid';
import Scrollbars from '../../../util/scrollbar';
import MeasurementMetadataDetail from './measurement-metadata-detail';
import {
  selectCategory as selectCategoryAction,
  toggleFeatureTab as toggleFeatureTabAction,
  updateListScrollTop,
} from '../../../../modules/product-picker/actions';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class BrowseLayers extends React.Component {
  constructor(props) {
    super(props);

    this.selectCategoryType = this.selectCategoryType.bind(this);
  }

  /**
   * Update category type in which to show
   * e.g. Hazards and disasters or science disciplines
   * @param {String} key | categoryType identifier
   */
  selectCategoryType(key) {
    const { selectCategory, toggleFeatureTab } = this.props;
    if (key === 'featured') {
      toggleFeatureTab();
    } else {
      selectCategory(key);
    }
  }


  renderLayerList() {
    const {
      componentHeights,
      isMobile,
      // updateScrollPosition,
      listScrollTop,
    } = this.props;
    const {
      listHeight,
      listMinHeight,
      detailHeight,
    } = componentHeights;

    const debouncedOnScroll = lodashDebounce(({ scrollTop }) => {
      // updateScrollPosition(scrollTop);
    }, 500);
    const containerClass = isMobile
      ? 'search-container mobile'
      : 'search-container';
    const listContainerClass = isMobile
      ? 'layer-list-container browse mobile'
      : 'layer-list-container browse';

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
              <BrowseLayerList isMobile={isMobile} />
            </div>
          </Scrollbars>
        </div>
        { !isMobile && (
          <div className="layer-detail-container layers-all browse">
            <Scrollbars style={{ maxHeight: `${detailHeight}px` }}>
              <MeasurementMetadataDetail />
            </Scrollbars>
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      componentHeights,
      selectedProjection,
      width,
      categoryType,
      mode,
    } = this.props;
    const { listHeight } = componentHeights;
    const isCategoryDisplay = mode === 'category' && selectedProjection === 'geographic';
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
                  <CategoryGrid width={width} />
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
  categoryType: PropTypes.string,
  mode: PropTypes.string,
  isMobile: PropTypes.bool,
  componentHeights: PropTypes.object,
  listScrollTop: PropTypes.number,
  selectCategory: PropTypes.func,
  selectedProjection: PropTypes.string,
  toggleFeatureTab: PropTypes.func,
  // updateScrollPosition: PropTypes.func,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  selectCategory: (key) => {
    dispatch(selectCategoryAction(key));
  },
  toggleFeatureTab: () => {
    dispatch(toggleFeatureTabAction());
  },
  updateScrollPosition: (scrollTop) => {
    dispatch(updateListScrollTop(scrollTop));
  },
});

function mapStateToProps(state, ownProps) {
  const {
    config,
    browser,
    proj,
    productPicker,
  } = state;
  const isMobile = browser.lessThan.medium;
  const {
    mode,
    categoryType,
    listScrollTop,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  } = productPicker;
  return {
    mode,
    categoryType,
    categoryConfig: config.categories,
    measurementConfig: config.measurements,
    listScrollTop,
    isMobile,
    selectedProjection: proj.id,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BrowseLayers);
