import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  SearchProvider,
} from '@elastic/react-search-ui';
import {
  initSearchState as initStateAction,
} from '../../../modules/product-picker/actions';
import ProductPicker from './product-picker';


class SearchUiProvider extends React.Component {
  componentDidMount() {
    const { initState } = this.props;
    initState();
  }

  render() {
    const { searchConfig } = this.props;
    return !searchConfig ? null : (
      <SearchProvider config={searchConfig}>
        <ProductPicker />
      </SearchProvider>
    );
  }
}

SearchUiProvider.propTypes = {
  initState: PropTypes.func,
  searchConfig: PropTypes.object,
};

const mapDispatchToProps = (dispatch) => ({
  initState: () => {
    dispatch(initStateAction());
  },
});

const mapStateToProps = (state) => {
  const { productPicker } = state;
  const { searchConfig } = productPicker;
  return {
    searchConfig,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchUiProvider);
