import React from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-loader';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

/*
 * @class SpinnerModal
 * @extends React.Component
 */
export default class SpinnerModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      metDelay: false,
    };
    if (props.delay) {
      setTimeout(() => {
        this.setState({ metDelay: true });
      }, props.delay);
    }
  }

  render() {
    const { headerText, onClose, delay } = this.props;
    if (delay && !this.state.metDelay) return '';
    return (
      <Modal isOpen toggle={onClose}>
        <ModalHeader toggle={onClose}>{headerText}</ModalHeader>
        <ModalBody>
          <div style={{ minHeight: 50 }}>
            <Spinner color="#fff" loaded={false}>
              loading
            </Spinner>
          </div>
        </ModalBody>
      </Modal>
    );
  }
}

SpinnerModal.defaultProps = {
  headerText: 'Loading',
};
SpinnerModal.propTypes = {
  delay: PropTypes.number,
  headerText: PropTypes.string,
  onClose: PropTypes.func,
};
