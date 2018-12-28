import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ModalComponent extends React.Component {
  /**
   * Update modal visibility
   * @function toggle
   */

  render() {
    const {
      ModalClassName,
      headerChildren,
      headerText,
      bodyHeader,
      bodyChildren,
      bodyText,
      onToggle,
      isOpen
    } = this.props;
    return (
      <Modal
        isOpen={isOpen}
        toggle={onToggle}
        backdrop={true}
        className={ModalClassName || 'default-modal'}
        autoFocus={false}
      >
        <ModalHeader toggle={onToggle}>
          {headerChildren || (headerText || '')}
        </ModalHeader>
        <ModalBody>
          {bodyHeader ? <h3>{bodyHeader}</h3> : ''}
          {bodyChildren || (bodyText || '')}
        </ModalBody>
      </Modal>
    );
  }
}
export default ModalComponent;
