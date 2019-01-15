import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Panel from '../components/image-download/panel';
import CropSelection from '../components/util/image-crop';

import {
  resolutionsGeo,
  resolutionsPolar,
  fileTypesGeo,
  fileTypesPolar
} from '../modules/image-download/constants';
// import BoundarySelection from '../components/image-download/select-boundary';

class ImageDownloadContainer extends Component {
  onSelectionChange() {}
  render() {
    const { projection, boundaries, el } = this.props;
    const fileTypes =
      projection === 'geographic' ? fileTypesGeo : fileTypesPolar;
    const resolutions =
      projection === 'geographic' ? resolutionsGeo : resolutionsPolar;
    return (
      <React.Fragment>
        <Panel
          projection={projection}
          fileTypes={fileTypes}
          resolutions={resolutions}
          boundaries={boundaries}
        />
        <CropSelection onChange={this.onSelectionChange.bind(this)} el={el} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { projection } = state.projection;
  // const { boundaries } = state.imageDownload;

  return {
    projection,
    boundaries: 0
  };
}

export default connect(mapStateToProps)(ImageDownloadContainer);

ImageDownloadContainer.propTypes = {
  projection: PropTypes.string
};
