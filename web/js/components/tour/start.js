import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class ModalExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // modal: false,
      modal: true,
      backdrop: true
    };

    this.buttonLabel = 'testing';

    this.toggle = this.toggle.bind(this);
    this.changeBackdrop = this.changeBackdrop.bind(this);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  changeBackdrop(e) {
    let value = e.target.value;
    if (value !== 'static') {
      value = JSON.parse(value);
    }
    this.setState({ backdrop: value });
  }

  render() {

    const quickButtonStyle = {
      'position': 'absolute',
      'top': '0',
      'right': '0',
      'z-index': '999',
      'height': '24px',
      'width': '96px',
    };

    return (
      <div>
        {/* <Button color="danger" style={quickButtonStyle} onClick={this.toggle}>Start Tour</Button> */}
        <Modal isOpen={this.state.modal} toggle={this.toggle} wrapClassName='tour tour-start' className={this.props.className} backdrop={this.state.backdrop}>
          <ModalHeader toggle={this.toggle}>Modal title</ModalHeader>
          <ModalBody>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggle}>Do Something</Button>{' '}
            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default ModalExample;