import React from 'react';
import PropTypes from 'prop-types';
import VectorMetaModal from './vector-metadata-modal';
// import googleTagManager from 'googleTagManager';

export default class VectorMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models,
      config: props.config,
      ui: props.ui,
      metaModal: props.metaModal
    };

    this.toggleMetaModal = this.toggleMetaModal.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  }

  resize() {
    if (window.innerWidth < 740) {
      this.setState({ metaModal: false });
    }
    if (window.innerHeight < 450) {
      this.setState({ metaModal: false });
    }
  }

  toggleMetaModal(e) {
    e.preventDefault();
    this.setState({
      metaModal: !this.state.metaModal
    });
    // googleTagManager.pushEvent({
    //   'event': 'meta_toggled',
    //   'meta': {
    //     'id': this.state.metaModal
    //   }
    // });
  }

  render() {
    if (this.state.stories) {
      return (
        <div>
          <VectorMetaModal
            metaModal={this.state.metaModal}
            toggleMetaModal={this.toggleMetaModal}
            vectorMeta={this.props.vectorMeta}
          />
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
  metaModal: PropTypes.bool.isRequired,
  vectorMeta: PropTypes.object.isRequired
};
