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

  render() {
    const {
      title,
      message,
      iconClassName,
      isOpen,
      onDismiss,
      onClick
    } = this.props;
    return (
      <Portal node={document && document.getElementById('wv-content')}>
        <Alert className="wv-alert" isOpen={isOpen}>
          <div
            className="alert-content"
            title={title}
            onClick={onClick}
          >
            {iconClassName && (
              <i className={'wv-alert-icon ' + iconClassName} />
            )}
            <div className="wv-alert-message">
              <div>
                {message}
              </div>
              {onClick && (
                <span className="wv-alert-read-more">Read More...</span>
              )}
            </div>
          </div>
          {onDismiss && (
            <div className="close-alert" onClick={onDismiss}>
              <i className="fa fa-times exit fa-1x" />
            </div>
          )}
        </Alert>
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
  isOpen: PropTypes.bool,
  message: PropTypes.string,
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
  timeout: PropTypes.number,
  title: PropTypes.string
};
