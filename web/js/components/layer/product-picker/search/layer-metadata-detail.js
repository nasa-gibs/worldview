import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../../modules/layers/actions';
import { getActiveLayersMap, makeGetDescription } from '../../../../modules/layers/selectors';
import {
  selectLayer as selectLayerAction,
} from '../../../../modules/product-picker/actions';
import RenderSplitLayerTitle from '../renderSplitTitle';
import RecentLayersInfo from '../browse/recent-layers-info';
import LayerInfo from '../../info/info';

class LayerMetadataDetail extends React.Component {
  constructor(props) {
    super(props);
    this.toggleLayer = this.toggleLayer.bind(this);
  }

  toggleLayer() {
    const {
      addLayer, removeLayer, isActive, layer,
    } = this.props;
    if (isActive) {
      removeLayer(layer.id);
    } else {
      addLayer(layer.id);
    }
  }

  renderNoSelection() {
    const { categoryType } = this.props;
    return categoryType === 'recent'
      ? (<RecentLayersInfo />)
      : (
        <div className="no-results">
          <FontAwesomeIcon icon="globe-americas" />
          <h3> No layer selected. </h3>
          <h5> Select a layer to view details here!</h5>
        </div>
      );
  }

  render() {
    const {
      layer, selectedProjection, isActive, showPreviewImage, measurementDescriptionPath,
    } = this.props;
    if (!layer) {
      return this.renderNoSelection();
    }
    const previewUrl = `images/layers/previews/${selectedProjection}/${layer.id}.jpg`;
    const buttonText = isActive ? 'Remove Layer' : 'Add Layer';
    const btnClass = isActive ? 'add-to-map-btn text-center is-active' : 'add-to-map-btn text-center';
    const btnIconClass = isActive ? 'minus' : 'plus';
    return (
      <div className="layers-all-layer">
        <div className="layers-all-header">
          <RenderSplitLayerTitle layer={layer} />
        </div>
        {showPreviewImage
          && (
          <div className="text-center">
            <a href={previewUrl} rel="noopener noreferrer" target="_blank">
              <img className="img-fluid layer-preview" src={previewUrl} />
            </a>
          </div>
          )}
        <div className="text-center">
          <Button className={btnClass} onClick={this.toggleLayer}>
            <FontAwesomeIcon icon={btnIconClass} />
            {buttonText}
          </Button>
        </div>
        <div className="source-metadata visible">
          <LayerInfo
            layer={layer}
            measurementDescriptionPath={measurementDescriptionPath}
          />
        </div>
      </div>
    );
  }
}

LayerMetadataDetail.propTypes = {
  addLayer: PropTypes.func,
  categoryType: PropTypes.string,
  isActive: PropTypes.bool,
  layer: PropTypes.object,
  measurementDescriptionPath: PropTypes.string,
  removeLayer: PropTypes.func,
  selectedProjection: PropTypes.string,
  showPreviewImage: PropTypes.bool,
};

const makeMapStateToProps = () => {
  const getDescriptionPath = makeGetDescription();
  return (state, ownProps) => {
    const {
      productPicker,
      proj,
      config,
    } = state;
    const { selectedLayer, categoryType } = productPicker;
    const activeLayers = getActiveLayersMap(state);
    const isActive = selectedLayer && !!activeLayers[selectedLayer.id];
    const measurementDescriptionPath = getDescriptionPath(state, ownProps);

    return {
      isActive,
      categoryType,
      measurementDescriptionPath,
      selectedProjection: proj.id,
      showPreviewImage: config.features.previewSnapshots,
    };
  };
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    dispatch(addLayerAction(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayerAction(id));
  },
  selectLayer: (layer) => {
    dispatch(selectLayerAction(layer));
  },
});

export default connect(
  makeMapStateToProps,
  mapDispatchToProps,
)(LayerMetadataDetail);
