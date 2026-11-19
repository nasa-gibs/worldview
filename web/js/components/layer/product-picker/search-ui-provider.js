import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  SearchProvider,
} from '@elastic/react-search-ui';
import {
  initState as initStateAction,
} from '../../../modules/product-picker/actions';
import ProductPicker from './product-picker';

function SearchUiProvider(props) {
  const {
    initState,
    searchConfig,
  } = props;

  useEffect(() => {
    initState();
  }, []);

  return !searchConfig
    ? null
    : (
      <SearchProvider config={searchConfig}>
        <ProductPicker />
      </SearchProvider>
    );
}

SearchUiProvider.propTypes = {
  initState: PropTypes.func,
  searchConfig: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
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
