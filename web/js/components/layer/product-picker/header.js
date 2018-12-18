import React from 'react';
import PropTypes from 'prop-types';
import {
  Breadcrumb,
  BreadcrumbItem,
  InputGroup,
  Input,
  Button
} from 'reactstrap';

import util from '../../../util/util';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ProductPickerHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: props.inputValue
    };
  }
  /**
   * Go back to original screen
   * @method revertToInitialScreen
   */
  revertToInitialScreen() {
    this.props.updateListState('category');
    this.setState({ inputValue: '' });
  }
  handleChange(e) {
    this.props.runSearch(e.target.value);
    this.setState({ inputValue: e.target.value });
  }
  render() {
    const isAutoFocus = !util.browser.touchDevice;
    const {
      modalView,
      selectedProjection,
      listType,
      category,
      width
    } = this.props;
    const isBreadCrumb =
      !modalView &&
      selectedProjection === 'geographic' &&
      listType !== 'category' &&
      width > 650;
    const isSearching = listType === 'search';
    const BackButton = (
      <Button
        className="back-button"
        color="secondary"
        onClick={this.revertToInitialScreen.bind(this)}
      >
        <i className="fa fa-arrow-left" />{' '}
      </Button>
    );
    return (
      <InputGroup id="layer-search" className="layer-search">
        {isBreadCrumb ? (
          <React.Fragment>
            {BackButton}
            <Breadcrumb tag="nav" className="layer-bread-crumb">
              <BreadcrumbItem
                tag="a"
                title="Back to Layer Categories"
                href="#"
                onClick={this.revertToInitialScreen.bind(this)}
              >
                Categories
              </BreadcrumbItem>
              <BreadcrumbItem active tag="span">
                {listType === 'search'
                  ? 'Search Results'
                  : category
                    ? category.title
                    : ''}
              </BreadcrumbItem>
            </Breadcrumb>
          </React.Fragment>
        ) : isSearching ? (
          <React.Fragment>{BackButton}</React.Fragment>
        ) : (
          ''
        )}

        <Input
          onChange={this.handleChange.bind(this)}
          id="layers-search-input"
          value={this.state.inputValue}
          placeholder="Search"
          type="search"
          autoFocus={isAutoFocus}
        />
      </InputGroup>
    );
  }
}

ProductPickerHeader.propTypes = {
  inputValue: PropTypes.string,
  modalView: PropTypes.string,
  runSearch: PropTypes.func,
  selectedProjection: PropTypes.string,
  listType: PropTypes.string,
  category: PropTypes.object,
  updateListState: PropTypes.func,
  width: PropTypes.number
};

export default ProductPickerHeader;
