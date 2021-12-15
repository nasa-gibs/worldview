import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import Spinner from 'react-loader';

export default function PreloadSpinner({ onClose, title, bodyMsg }) {
  return (
    <Modal
      isOpen
      toggle={onClose}
      size="sm"
      backdrop={false}
      wrapClassName="clickable-behind-modal"
    >
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>
        {bodyMsg && (
          <div style={{
            minHeight: 30, marginBottom: 30, fontSize: 14,
          }}
          >
            {bodyMsg}
          </div>
        )}
        <div style={{ minHeight: 50 }}>
          <Spinner color="#fff" loaded={false} />
        </div>
      </ModalBody>
    </Modal>
  );
}

PreloadSpinner.propTypes = {
  onClose: PropTypes.func,
  title: PropTypes.string,
  bodyMsg: PropTypes.string,
};
