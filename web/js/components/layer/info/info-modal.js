import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import LayerInfo from './info';
import util from '../../../util/util';

export default function LayerInfoModal(props) {
  const { layer, measurementDescriptionPath } = props;
  const [metadata, setMetadata] = useState();

  const initMetadata = async () => {
    if (!metadata && measurementDescriptionPath) {
      const url = `config/metadata/layers/${measurementDescriptionPath}.html`;
      const data = await util.get(url);
      setMetadata(data || 'No metadata found.');
    }
  };

  useEffect(() => {
    initMetadata();
  }, [layer]);

  return (
    <div id="layer-description" className="layer-description">
      <LayerInfo layer={layer} />
      {metadata && (
        <div
          className="layer-metadata"
          dangerouslySetInnerHTML={{ __html: metadata }}
        />
      )}
    </div>
  );
}

LayerInfoModal.propTypes = {
  layer: PropTypes.object,
  measurementDescriptionPath: PropTypes.string,
};
