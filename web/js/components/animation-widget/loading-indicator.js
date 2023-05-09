import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, ModalBody, ModalHeader, Progress,
} from 'reactstrap';

export default function LoadingIndicator(props) {
  const {
    onClose, title, bodyMsg, loadedItems, totalItems,
  } = props;

  const msgStyle = {
    minHeight: 30, margin: '30px 0', fontSize: 14, textAlign: 'center',
  };
  const barStyle = { margin: 12 };
  const progressValue = ((loadedItems / totalItems) * 100).toFixed(0);

  const renderProgressBar = () => (
    <div style={barStyle}>
      <Progress
        animated
        striped
        value={progressValue}
      />
    </div>
  );

  const closeBtn = (
    <button className="modal-close-btn" onClick={onClose} type="button">
      &times;
    </button>
  );

  return (
    <Modal
      isOpen
      toggle={onClose}
      size="md"
      backdrop={false}
      wrapClassName="clickable-behind-modal"
    >
      <ModalHeader close={closeBtn}>{title}</ModalHeader>
      <ModalBody>
        {bodyMsg && (
          <div style={msgStyle}>{bodyMsg}</div>
        )}
        {totalItems && renderProgressBar()}
      </ModalBody>
    </Modal>
  );
}

LoadingIndicator.propTypes = {
  onClose: PropTypes.func,
  title: PropTypes.string,
  bodyMsg: PropTypes.string,
  loadedItems: PropTypes.number,
  totalItems: PropTypes.number,
};
