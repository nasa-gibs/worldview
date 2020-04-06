import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';
import { Portal } from 'react-portal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup, faTimes, faRuler, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

// icons used with alert by passing string as prop iconClassName
const alertIcons = {
  faRuler,
  faLayerGroup,
};

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
      id,
      title,
      message,
      iconClassName,
      isOpen,
      onDismiss,
      onClick,
    } = this.props;
    const icon = iconClassName
      ? alertIcons[iconClassName] || faExclamationTriangle
      : faExclamationTriangle;
    return (
      <Alert
        id={id}
        className="wv-alert"
        isOpen={isOpen}
      >
        <div
          className="alert-content"
          title={title}
          onClick={onClick}
        >
          <FontAwesomeIcon icon={icon} className="wv-alert-icon" size="1x" />
          <div className="wv-alert-message">
            {message}
          </div>
        </div>
        {onDismiss && (
          <div id={`${id}-close`} className="close-alert" onClick={onDismiss}>
            <FontAwesomeIcon icon={faTimes} className="exit" size="1x" />
          </div>
        )}
      </Alert>
    );
  }

  render() {
    const { noPortal } = this.props;
    return noPortal
      ? this.renderAlert()
      : (
        <Portal node={document && document.getElementById('wv-alert-container')}>
          {this.renderAlert()}
        </Portal>
      );
  }
}

AlertComponent.defaultProps = {
  iconClassName: '',
  title: '',
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
  title: PropTypes.string,
};
