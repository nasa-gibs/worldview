import React from 'react';
import PropTypes from 'prop-types';
import LayerInfo from './info';
import Scrollbars from '../../util/scrollbar';

export default function LayerInfoModal(props) {
  const { screenHeight, layer } = props;

  return (
    <Scrollbars style={{ maxHeight: `${screenHeight - 200}px` }}>
      <LayerInfo layer={layer} />
      {/*
        Put the source specific metadata here as well
      */}
    </Scrollbars>
  );
}

LayerInfoModal.propTypes = {
  screenHeight: PropTypes.number,
  layer: PropTypes.object,
};
