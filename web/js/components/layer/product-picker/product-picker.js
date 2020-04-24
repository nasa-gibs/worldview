import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  withSearch,
} from '@elastic/react-search-ui';
import {
  ModalBody,
  ModalHeader,
} from 'reactstrap';

import ProductPickerHeader from './header';
import {
  onToggle as onToggleAction,
} from '../../../modules/modal/actions';
import BrowseLayers from './browse/browse-layers';
import SearchLayers from './search/search-layers';
import {
  saveSearchState as saveSearchStateAction,
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
    };
  }

  componentDidMount() {
    const modalElement = document.getElementById('layer_picker_component');
    this.setState({ modalElement }, this.setModalClass);
  }

  componentDidUpdate(prevProps) {
    const { mode } = this.props;
    if (prevProps.mode !== mode) {
      this.setModalClass();
    }
  }

  componentWillUnmount() {
    const { filters, searchTerm, saveSearchState } = this.props;
    saveSearchState(filters, searchTerm);
  }

  setModalClass() {
    const { modalElement } = this.state;
    const { mode } = this.props;
    if (mode === 'category') {
      modalElement.classList.remove('browse-search-width');
      modalElement.classList.add('category-width');
    }
    if (mode === 'search' || mode === 'measurements') {
      modalElement.classList.remove('category-width');
      modalElement.classList.add('browse-search-width');
    }
  }

  render() {
    const {
      closeModal,
      mode,
      width,
      browser,
      category,
    } = this.props;

    const { screenHeight } = browser;
    const dialogMargin = 12;
    const tabOffset = mode === 'category' || category === 'featured' ? 38 : 0;
    const headerHeight = mode === 'search' ? 70 : 48;
    let bodyHeight = screenHeight - headerHeight - tabOffset - 100 - dialogMargin;

    if (browser.lessThan.medium) {
      bodyHeight = screenHeight - headerHeight - tabOffset;
    }

    return (
      <>
        <ModalHeader toggle={() => closeModal()}>
          <ProductPickerHeader
            width={width}
            toggleFilterByAvailable={this.toggleFilterByAvailable}
          />
        </ModalHeader>
        <ModalBody>
          <div id="layer-modal-content" className="layer-modal-content">
            {mode !== 'search'
              ? (<BrowseLayers bodyHeight={bodyHeight} width={width} />)
              : (<SearchLayers bodyHeight={bodyHeight} width={width} />)}
          </div>
        </ModalBody>
      </>
    );
  }
}

ProductPicker.propTypes = {
  browser: PropTypes.object,
  category: PropTypes.object,
  closeModal: PropTypes.func,
  filters: PropTypes.array,
  mode: PropTypes.string,
  saveSearchState: PropTypes.func,
  screenHeight: PropTypes.number,
  searchTerm: PropTypes.string,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  saveSearchState: (filters, searchTerm) => {
    dispatch(saveSearchStateAction(filters, searchTerm));
  },
  closeModal: () => {
    dispatch(onToggleAction());
  },
});

const mapStateToProps = (state) => {
  const {
    browser,
    productPicker,
  } = state;
  const { screenWidth } = browser;
  const width = getModalWidth(screenWidth);
  const { mode, category } = productPicker;

  return {
    browser,
    category,
    mode,
    width,
  };
};

export default withSearch(
  ({
    filters, searchTerm,
  }) => ({
    filters, searchTerm,
  }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProductPicker));

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
