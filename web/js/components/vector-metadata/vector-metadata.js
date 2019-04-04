import React from 'react';
import PropTypes from 'prop-types';
import Metadata from './modal-metadata';
// import googleTagManager from 'googleTagManager';

class VectorMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models,
      config: props.config,
      ui: props.ui,
      modalMeta: props.modalMeta
    };

    this.toggleModalMeta = this.toggleModalMeta.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  }

  resize() {
    if (window.innerWidth < 740) {
      this.setState({ modalMeta: false });
    }
    if (window.innerHeight < 450) {
      this.setState({ modalMeta: false });
    }
  }

  toggleModalMeta(e) {
    e.preventDefault();
    this.setState({
      modalMeta: !this.state.modalMeta
    });
    // googleTagManager.pushEvent({
    //   'event': 'meta_toggled',
    //   'meta': {
    //     'id': this.state.modalMeta
    //   }
    // });
  }

  render() {
    if (this.state.stories) {
      return (
        <div>
          <Metadata
            stories={this.state.stories}
            storyOrder={this.state.storyOrder}
            modalMeta={this.state.modalMeta}
            toggleModalMeta={this.toggleModalMeta}
          ></Metadata>
        </div>
      );
    } else {
      return null;
    }
  }
}

VectorMeta.propTypes = {
  models: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
  modalMeta: PropTypes.bool.isRequired
};

export default VectorMeta;
