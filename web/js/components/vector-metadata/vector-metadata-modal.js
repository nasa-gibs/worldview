import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import MetaTable from './vector-metadata-table';

export default class VectorMetaModal extends React.Component {
  render() {
    return (
      <Modal isOpen={this.props.metaModal} toggle={this.props.toggleMetaModal} className={this.props.className} backdrop={false} fade={false} keyboard={true}>
        <ModalHeader toggle={this.props.toggleMetaModal} charCode="">"this.props.vectorMeta.title"</ModalHeader>
        <ModalBody>
          <MetaTable vectorMeta={this.props.vectorMeta} />
        </ModalBody>
        <ModalFooter />
      </Modal>
    );
  }
}

VectorMetaModal.propTypes = {
  metaModal: PropTypes.bool.isRequired,
  toggleMetaModal: PropTypes.func.isRequired,
  vectorMeta: PropTypes.object.isRequired,
  className: PropTypes.string
};
