import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';
import { Portal } from 'react-portal';
/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AlertComponent
 * @extends React.Component
 */
export default class AlertComponent extends React.Component {
  constructor(props) {
    super(props);
    if (props.timeout && props.onDismiss) {
      this.timeout = setTimeout(() => {
        props.onDismiss();
      }, props.timeout);
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  renderAlert() {
    const {
      title,
      message,
      iconClassName,
      isOpen,
      onDismiss,
      onClick
    } = this.props;
    return (
      <Alert
        id={this.props.id}
        className="wv-alert"
        isOpen={isOpen}
      >
        <div
          className="alert-content"
          title={title}
          onClick={onClick}
        >
          {iconClassName && (
            <i className={'wv-alert-icon ' + iconClassName} />
          )}
          <div className="wv-alert-message">
            {message}
          </div>
        </div>
        {onDismiss && (
          <div id={`${this.props.id}-close`} className="close-alert" onClick={onDismiss}>
            <i className="fa fa-times exit fa-1x" />
          </div>
        )}
      </Alert>
    );
  }

  render() {
    return this.props.noPortal
      ? (this.renderAlert())
      : (
        <Portal node={document && document.getElementById('wv-alert-container')}>
          {this.renderAlert()}
        </Portal>
      );
  }
}

AlertComponent.defaultProps = {
  iconClassName: 'fas fa-exclamation-triangle fa-1x',
  title: ''
};
AlertComponent.propTypes = {
  iconClassName: PropTypes.string,
  id: PropTypes.string,
  isOpen: PropTypes.bool,
  message: PropTypes.string,
  noPortal: PropTypes.bool,
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
  timeout: PropTypes.number,
  title: PropTypes.string
};
