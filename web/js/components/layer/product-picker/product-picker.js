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
import util from '../../../util/util';
import { JOYRIDE_INCREMENT } from '../../../util/constants';

const { events } = util;

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
    this.setState({ modalElement }, () => {
      setTimeout(() => {
        events.trigger(JOYRIDE_INCREMENT);
      }, 200);
      this.setModalClass();
    });
  }

  componentDidUpdate(prevProps) {
    const { mode, categoryType } = this.props;
    if (prevProps.mode !== mode || prevProps.categoryType !== categoryType) {
      this.setModalClass();
    }
  }

  componentWillUnmount() {
    const { filters, searchTerm, saveSearchState } = this.props;
    saveSearchState(filters, searchTerm);
  }

  setModalClass() {
    const { modalElement } = this.state;
    const { mode, categoryType } = this.props;
    if (mode === 'category' && categoryType !== 'recent') {
      modalElement.classList.remove('browse-search-width');
      modalElement.classList.add('category-width');
    } else if (
      mode === 'search'
        || mode === 'measurements'
        || categoryType === 'recent'
        || categoryType === 'featured'
    ) {
      modalElement.classList.remove('category-width');
      modalElement.classList.add('browse-search-width');
    }
  }

  render() {
    const {
      closeModal,
      mode,
      width,
    } = this.props;
    const closeBtn = (
      <button className="layer-btn-close" onClick={closeModal} style={mode === 'search' ? { top: '-10px' } : {}} type="button">
        &times;
      </button>
    );
    return (
      <>
        <ModalHeader toggle={closeModal} close={closeBtn}>
          <ProductPickerHeader
            width={width}
            toggleFilterByAvailable={this.toggleFilterByAvailable}
          />
        </ModalHeader>
        <ModalBody>
          <div id="layer-modal-content" className="layer-modal-content">
            {mode !== 'search'
              ? (<BrowseLayers width={width} />)
              : (<SearchLayers />)}
          </div>
        </ModalBody>
      </>
    );
  }
}

ProductPicker.propTypes = {
  categoryType: PropTypes.string,
  closeModal: PropTypes.func,
  filters: PropTypes.array,
  mode: PropTypes.string,
  saveSearchState: PropTypes.func,
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
    screenSize,
    productPicker,
  } = state;
  const { screenWidth } = screenSize;
  const width = getModalWidth(screenWidth);
  const { mode, category, categoryType } = productPicker;

  return {
    screenSize,
    category,
    categoryType,
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
