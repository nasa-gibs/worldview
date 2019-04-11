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
      metaModal: props.metaModal,
      metaTitle: props.metaTitle,
      metaFeatures: props.metaFeatures,
      metaLegend: props.metaLegend
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
    return (
      <VectorMetaModal
        metaModal={this.state.metaModal}
        toggleMetaModal={this.toggleMetaModal}
        vectorMeta={this.props.vectorMeta}
        metaTitle={this.state.metaTitle}
      />
    );
  }
}

VectorMeta.propTypes = {
  models: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  ui: PropTypes.object.isRequired,
  metaModal: PropTypes.bool.isRequired,
  metaTitle: PropTypes.string,
  metaFeatures: PropTypes.object.isRequired,
  metaLegend: PropTypes.object.isRequired
};
