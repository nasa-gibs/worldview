import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import util from '../util/util';
import { throttle } from 'lodash';

const replaceHistoryState = throttle(
  function(queryString) {
    if (util.browser.history) {
      window.history.replaceState('', '@OFFICIAL_NAME@', '?' + queryString);
    }
  },
  2000,
  {
    leading: true,
    trailing: true
  }
);

class Permalink extends Component {
  render() {
    const { queryString } = this.props;
    if (queryString) replaceHistoryState(queryString);
    return '';
  }
}

function mapStateToProps(state) {
  const { queryString } = state.link;
  return {
    queryString: queryString
  };
}

export default connect(mapStateToProps)(Permalink);

Permalink.propTypes = {
  queryString: PropTypes.string
};
