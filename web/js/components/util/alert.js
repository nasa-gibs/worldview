import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AlertComponent
 * @extends React.Component
 */
export default class AlertUtil extends React.Component {
  constructor(props) {
    super(props);
    if (props.timeout && props.onDismiss) {
      this.timeout = setTimeout(() => {
        props.onDismiss();
      }, props.timeout);
    }
    this.state = {
      isOpen: props.isOpen,
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  closeAlert() {
    const { onDismiss } = this.props;
    this.setState({ isOpen: false });
    if (onDismiss) {
      onDismiss();
    }
  }

  renderAlert() {
    const {
      id,
      title,
      message,
      icon,
      onDismiss,
      onClick,
    } = this.props;
    const { isOpen } = this.state;

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
          style={{ paddingRight: !onDismiss ? 8 : 5 }}
        >
          <FontAwesomeIcon
            icon={icon || 'exclamation-triangle'}
            className="wv-alert-icon"
            size="1x"
          />
          <div className="wv-alert-message">
            {message}
          </div>
        </div>
        {onDismiss && (
          <div
            id={`${id}-close`}
            className="close-alert"
            onClick={() => this.closeAlert()}
          >
            <FontAwesomeIcon icon="times" className="exit" size="1x" />
          </div>
        )}
      </Alert>
    );
  }

  render() {
    const { noPortal } = this.props;
    return noPortal
      ? this.renderAlert()
      : createPortal(this.renderAlert(), document.getElementById('wv-alert-container'));
  }
}

AlertUtil.defaultProps = {
  icon: '',
  title: '',
};
AlertUtil.propTypes = {
  icon: PropTypes.string,
  id: PropTypes.string,
  isOpen: PropTypes.bool,
  message: PropTypes.string,
  noPortal: PropTypes.bool,
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
  timeout: PropTypes.number,
  title: PropTypes.string,
};
