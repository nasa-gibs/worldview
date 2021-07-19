import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { layer } from '@fortawesome/fontawesome-svg-core';
import util from '../../../../util/util';
import { getMeasurementSource } from '../../../../modules/product-picker/selectors';
import LayerInfo from '../../info/info';

function MeasurementMetadataDetail (props) {
  const {
    isMobile, source, layers, categoryTitle,
  } = props;
  const [isMetadataExpanded, setMetadataExpansion] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  const metadataPath = source && source.description;
  const metadataForSource = metadata[metadataPath] && metadata[metadataPath].data;

  useEffect(() => {
    if (metadataPath && !metadataForSource) {
      util
        .get(`config/metadata/layers/${metadataPath}.html`)
        .then((data) => {
          metadata[metadataPath] = { data };
          setMetadata(metadata);
          setLoading(false);
        }).catch(() => { setLoading(false); });
    }
  }, [source]);

  const renderMetadataForLayers = () => layers.map((l) => (
    <div className="layer-description" key={l.id}>
      <h3>{l.title}</h3>
      <LayerInfo key={l.id} layer={l} />
    </div>
  ));

  const renderMobile = () => {
    const sourceTextLong = metadataForSource && metadataForSource.length >= 1000;
    const manylayers = layers && layer.length > 0;
    const doesMetaDataNeedExpander = sourceTextLong || manylayers;
    const isMetaVisible = isMetadataExpanded || !doesMetaDataNeedExpander;
    return (
      <div>
        <div
          className={isMetaVisible ? 'source-metadata ' : 'source-metadata overflow'}
        >
          <div dangerouslySetInnerHTML={{ __html: metadataForSource }} />
          {renderMetadataForLayers()}
        </div>
        {doesMetaDataNeedExpander && (
          <div
            className="metadata-more"
            onClick={() => setMetadataExpansion(!isMetadataExpanded)}
          >
            <span className={isMetadataExpanded ? 'ellipsis up' : 'ellipsis'}>
              {isMetadataExpanded ? '^' : '...'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderDesktop = () => {
    const { title } = source;
    return (
      <div className="layers-all-layer">
        <div className="layers-all-header">
          <h3>{title}</h3>
        </div>
        <div className="source-metadata">
          <div dangerouslySetInnerHTML={{ __html: metadataForSource }} />
          {renderMetadataForLayers()}
        </div>
      </div>
    );
  };

  /* No source selected yet */
  if (!isMobile && !source) {
    return (
      <div className="no-results">
        <FontAwesomeIcon icon="map" />
        <h3>{categoryTitle}</h3>
        <h5> Select a measurement to view details here!</h5>
      </div>
    );
  }

  /* No metadata configured for this source */
  if (!metadataPath && !layer.length) {
    return (
      <div className="no-results">
        <FontAwesomeIcon icon="meteor" />
        <h3> No metadata found. </h3>
      </div>
    );
  }


  if (!metadataForSource && loading) {
    return (
      <div className="no-results">
        <h3> Loading metadata ... </h3>
      </div>
    );
  }

  return isMobile ? renderMobile() : renderDesktop();
}

MeasurementMetadataDetail.propTypes = {
  categoryTitle: PropTypes.string,
  isMobile: PropTypes.bool,
  layers: PropTypes.array,
  source: PropTypes.object,
};

const mapStateToProps = (state) => {
  const { productPicker, layers } = state;
  const source = getMeasurementSource(state);
  const { category } = productPicker;
  const { layerConfig } = layers;
  const settings = source ? source.settings : [];
  const layersForSource = settings.map((id) => layerConfig[id]);

  return {
    categoryTitle: category && category.title,
    source,
    layers: layersForSource,
  };
};

export default connect(
  mapStateToProps,
)(MeasurementMetadataDetail);
