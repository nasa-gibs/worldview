import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { openCustomContent } from '../modules/modal/actions';

const HEADER_TEXT = 'Error!';
function BODY_COMPONENT() {
  return (
    <>
      <div className="error-header">
        <FontAwesomeIcon icon="exclamation-triangle" className="error-icon" size="3x" />
        An unexpected error has occurred!
      </div>
      <div className="error-body">
        Please reload the page and try again. If you continue to have problems,
        contact us at
        <a href="mailto:@MAIL@"> @MAIL@ </a>
      </div>
    </>
  );
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }

  componentDidCatch(error, info) {
    const { errorAlert } = this.props;
    this.setState({ error: true });
    // Display fallback UI
    errorAlert();
    // log the error
    console.warn(error, info);
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;
    if (error) {
      return '';
    }
    return children;
  }
}
const mapDispatchToProps = (dispatch) => ({
  errorAlert: () => {
    dispatch(
      openCustomContent('ERROR_MODAL', {
        headerText: HEADER_TEXT,
        bodyComponent: BODY_COMPONENT,
      }),
    );
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(ErrorBoundary);
ErrorBoundary.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  errorAlert: PropTypes.func,
};
