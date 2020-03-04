import React from 'react';
import PropTypes from 'prop-types';
import { ModalFooter } from 'reactstrap';
import Button from '../util/button';

export class Notify extends React.Component {
  render() {
    const { bodyText, cancel, accept } = this.props;
    return (
      <>
        <div className="notify">
          <p>{bodyText}</p>
        </div>
        <ModalFooter>
          <Button className="cancel-notify" text="Cancel" onClick={cancel} />
          <Button className="accept-notify" text="OK" onClick={accept} />
        </ModalFooter>
      </>
    );
  }
}

Notify.propTypes = {
  accept: PropTypes.func,
  bodyText: PropTypes.string,
  cancel: PropTypes.func,
};
