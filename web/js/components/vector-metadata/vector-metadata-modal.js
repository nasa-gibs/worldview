import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import MetaTable from './vector-metadata-table';

export default class VectorMetaModal extends React.Component {
  render() {
    return (
      <Modal isOpen={this.props.metaModal} toggle={this.props.toggleMetaModal} className={this.props.className} backdrop={false} fade={false} keyboard={true}>
        <ModalHeader toggle={this.props.toggleMetaModal} charCode="">{this.props.metaTitle}</ModalHeader>
        <ModalBody>
          <MetaTable metaTitle={this.props.metaTitle} metaFeatures={this.props.metaFeatures} metaLegend={this.props.metaLegend} />
        </ModalBody>
        <ModalFooter />
      </Modal>
    );
  }
}

VectorMetaModal.propTypes = {
  metaModal: PropTypes.bool.isRequired,
  toggleMetaModal: PropTypes.func.isRequired,
  className: PropTypes.string,
  metaTitle: PropTypes.string,
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
