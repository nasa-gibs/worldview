import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { recentLayerInfo } from '../../../../modules/product-picker/util';

export default function RecentLayersInfo (props) {
  return (
    <div className="no-results">
      <FontAwesomeIcon icon="clock" />
      <h3> Recently Used Layers </h3>
      <p>
        {recentLayerInfo}
      </p>
    </div>
  );
}
