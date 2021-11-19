import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getSourcesForProjection } from '../../../../modules/product-picker/selectors';
import LayerInfo from '../../info/info';

function MeasurementMetadataDetail (props) {
  const {
    isMobile, source, layers, categoryTitle, showPreviewImage, selectedProjection,
  } = props;
  const [isMetadataExpanded, setMetadataExpansion] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  const metadataPath = source && source.description;
  const metadataForSource = metadata[metadataPath] && metadata[metadataPath].data;

  useEffect(() => {
    setLoading(true);
    let controller = new AbortController();
    if (metadataPath && !metadataForSource) {
      try {
        (async () => {
          const options = { signal: controller.signal };
          const data = await fetch(`config/metadata/layers/${metadataPath}.html`, options);
          metadata[metadataPath] = { data: await data.text() };
          controller = null;
          setMetadata(metadata);
          setLoading(false);
        })();
      } catch (e) {
        if (!controller.signal.aborted) {
          setLoading(false);
          // eslint-disable-next-line no-console
          console.error(e);
        }
      }
    } else {
      setLoading(false);
    }
    return () => (controller ? controller.abort() : null);
  }, [source]);

  const renderMetadataForLayers = () => layers
    .filter(({ projections }) => !!projections[selectedProjection])
    .map((l) => (
      <div className="layer-description" key={l.id}>
        <h3>{l.title}</h3>
        {showPreviewImage && (
        <div className="text-center">
          <a
            href={`images/layers/previews/${selectedProjection}/${l.id}.jpg`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              className="img-fluid layer-preview"
              src={`images/layers/previews/${selectedProjection}/${l.id}.jpg`}
            />
          </a>
        </div>
        )}
        <LayerInfo key={l.id} layer={l} />
      </div>
    ));

  const renderMobile = () => {
    const sourceTextLong = metadataForSource && metadataForSource.length >= 1000;
    const manylayers = layers && layers.length > 0;
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
  if (!metadataPath && !layers.length) {
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
  const {
    productPicker, layers, config, proj,
  } = state;

  const { category, selectedMeasurementSourceIndex } = productPicker;
  const sources = getSourcesForProjection(state);
  const source = sources && sources[selectedMeasurementSourceIndex];
  const { layerConfig } = layers;
  const settings = source ? source.settings : [];
  const layersForSource = settings.map((id) => layerConfig[id]);

  return {
    categoryTitle: category && category.title,
    source,
    layers: layersForSource,
    selectedProjection: proj.id,
    showPreviewImage: config.features.previewSnapshots,
  };
};

export default connect(
  mapStateToProps,
)(MeasurementMetadataDetail);
