import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { openCustomContent } from '../modules/modal/actions';
const HEADER_TEXT = 'Error!';
const BODY_COMPONENT = () => (
  <React.Fragment>
    <div className="error-header">
      <i className="error-icon fas fa-exclamation-triangle fa-3x" />
      An unexpected error has occurred!
    </div>
    <div className="error-body">
      Please reload the page and try again. If you continue to have problems,
      contact us at
      <a href="mailto:@MAIL@"> @MAIL@ </a>
    </div>
  </React.Fragment>
);
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }
  componentDidCatch(error, info) {
    this.setState({ error: true });
    // Display fallback UI
    this.props.errorAlert();
    // log the error
    console.warn(error, info);
  }

  render() {
    if (this.state.error) {
      return '';
    }
    return this.props.children;
  }
}
const mapDispatchToProps = dispatch => ({
  errorAlert: () => {
    dispatch(
      openCustomContent('ERROR_MODAL', {
        headerText: HEADER_TEXT,
        bodyComponent: BODY_COMPONENT
      })
    );
  }
});

export default connect(
  null,
  mapDispatchToProps
)(ErrorBoundary);
ErrorBoundary.propTypes = {
  children: PropTypes.object,
  errorAlert: PropTypes.func
};
