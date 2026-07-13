import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function AlertUtil({
  id,
  isOpen: isOpenProp,
  title,
  message,
  messageTitle,
  icon,
  onDismiss,
  onClick,
  timeout,
  noPortal,
}) {
  const [isOpen, setIsOpen] = useState(isOpenProp);

  // Replaces constructor timeout + componentWillUnmount cleanup
  useEffect(() => {
    if (timeout && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeAlert = () => {
    setIsOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const alertContent = (
    <Alert
      id={id}
      className="wv-alert"
      isOpen={isOpen}
    >
      <div
        role="alertdialog"
        className="alert-content"
        title={title}
        onClick={onClick}
        style={{ paddingRight: !onDismiss ? 8 : 5 }}
      >
        <FontAwesomeIcon
          icon={icon || 'exclamation-triangle'}
          className="wv-alert-icon"
          size="1x"
          widthAuto
        />
        <div className="alert-text">
          <p className="wv-alert-title">
            {messageTitle}
          </p>
          <em className="wv-alert-message">
            <b>{message}</b>
          </em>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          id={`${id}-close`}
          className="close-alert"
          onClick={() => closeAlert()}
        >
          <FontAwesomeIcon icon="times" className="exit" size="1x" widthAuto />
        </button>
      )}
    </Alert>
  );

  const alertContainer = document.getElementById('wv-alert-container');
  if (!noPortal && alertContainer) {
    return createPortal(alertContent, alertContainer);
  }
  return alertContent;
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
  messageTitle: PropTypes.string,
  noPortal: PropTypes.bool,
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
  timeout: PropTypes.number,
  title: PropTypes.string,
};

export default AlertUtil;
