import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, ModalBody, ModalHeader, Progress,
} from 'reactstrap';
import Spinner from 'react-loader';

export default function PreloadSpinner(props) {
  const {
    onClose, title, bodyMsg, loadedItems, totalItems, preload,
  } = props;

  const msgStyle = {
    minHeight: 30, marginBottom: 50, fontSize: 14, textAlign: 'center',
  };
  const progressValue = ((loadedItems / totalItems) * 100).toFixed(0);
  const renderProgressBar = () => (
    <div style={{ margin: 12 }}>
      <Progress
        animated
        striped
        value={progressValue}
        color={!preload && 'success'}
      >
        {!preload && `${loadedItems} / ${totalItems} `}
      </Progress>
    </div>
  );
  const renderSpinner = () => (
    <div style={{ minHeight: 50 }}>
      <Spinner color="#fff" loaded={false} />
    </div>
  );

  return (
    <Modal
      isOpen
      toggle={onClose}
      size="md"
      backdrop={false}
      wrapClassName="clickable-behind-modal"
    >
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>
        {bodyMsg && (
          <div style={msgStyle}>{bodyMsg}</div>
        )}
        {totalItems ? renderProgressBar() : renderSpinner()}
      </ModalBody>
    </Modal>
  );
}

PreloadSpinner.propTypes = {
  onClose: PropTypes.func,
  title: PropTypes.string,
  bodyMsg: PropTypes.string,
  loadedItems: PropTypes.number,
  totalItems: PropTypes.number,
  preload: PropTypes.bool,
};
