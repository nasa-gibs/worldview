import React from 'react';
import PropTypes from 'prop-types';
import { Button, ModalFooter } from 'reactstrap';

export class Notify extends React.Component {
  render() {
    const { bodyText, cancel, accept } = this.props;
    return (
      <React.Fragment>
        <div className="notify">
          <p>{bodyText}</p>
        </div>
        <ModalFooter>
          <Button color="primary" onClick={cancel}>
            Cancel
          </Button>{' '}
          <Button color="#fff" onClick={accept}>
            OK
          </Button>
        </ModalFooter>
      </React.Fragment>
    );
  }
}

Notify.propTypes = {
  accept: PropTypes.func,
  bodyText: PropTypes.string,
  cancel: PropTypes.func
};
