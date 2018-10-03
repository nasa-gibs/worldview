import React from 'react';
// import Share from './share/index.js';
// import Projection from './projection/index.js';
// import Snapshot from './snapshot/index.js';
// import Info from './info/index.js'

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalShare: false,
      modalProjection: false,
      modalSnapshot: false,
      modalInfo: false
    };

    this.toggleModalShare = this.toggleModalShare.bind(this);
    this.toggleModalProjection = this.toggleModalProjection.bind(this);
    this.toggleModalSnapshot = this.toggleModalSnapshot.bind(this);
    this.toggleModalInfo = this.toggleModalInfo.bind(this);
  }

  toggleModalShare(e) {
    e.preventDefault();
    this.setState({
      modalShare: !this.state.modalShare
    });
  }

  toggleModalProjection(e) {
    e.preventDefault();
    this.setState({
      modalProjection: !this.state.modalProjection
    });
  }

  toggleModalSnapshot(e) {
    e.preventDefault();
    this.setState({
      modalSnapshot: !this.state.modalSnapshot
    });
  }

  toggleModalInfo(e) {
    e.preventDefault();
    this.setState({
      modalInfo: !this.state.modalInfo
    });
  }

  render() {
    return (
      <ul id="wv-toolbar" className="wv-toolbar">
        <li id="wv-link-button" className="wv-toolbar-button"></li>
        <li id="wv-proj-button" className="wv-toolbar-button"></li>
        <li id="wv-image-button" className="wv-toolbar-button"></li>
        <li id="wv-info-button" className="wv-toolbar-button wv-status-hide"></li>
      </ul>
    );
  }
}

export default Toolbar;
