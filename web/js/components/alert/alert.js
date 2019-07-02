import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';

class TourAlert extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: props.visible,
      message: props.message
    };

    this.onDismiss = this.onDismiss.bind(this);
  }

  onDismiss() {
    this.setState({ visible: false });
  }

  render() {
    return (
      <div>
        <Alert className="wv-alert" isOpen={this.state.visible} toggle={this.onDismiss}>
          <p>{this.state.message}</p>
        </Alert>
      </div>
    );
  };
}

TourAlert.propTypes = {
  visible: PropTypes.bool.isRequired,
  message: PropTypes.string
};

export default TourAlert;
