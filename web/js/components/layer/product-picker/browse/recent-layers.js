import React from 'react';
import PropTypes from 'prop-types';
import safeLocalStorage from '../../../../util/local-storage';
import SearchLayerList from '../search/search-layers-list';

const RecentLayersList = ({ proj, layerConfig }) => {
  const { RECENT_LAYERS } = safeLocalStorage.keys;
  const recentLayers = JSON.parse(
    safeLocalStorage.getItem(RECENT_LAYERS),
  );
  const sortFn = (a, b) => {
    if (a.count > b.count) return -1;
    if (a.count < b.count) return 1;
    if (a.dateAdded > b.dateAdded) return 1;
    if (a.dateAdded < b.dateAdded) return -1;
  };

  const results = recentLayers[proj]
    .sort(sortFn)
    .map(({ id }) => layerConfig[id]);

  console.table(recentLayers[proj].sort(sortFn));

  return (
    <div>
      <SearchLayerList results={results} />
    </div>
  );
};

RecentLayersList.propTypes = {
  proj: PropTypes.string,
  layerConfig: PropTypes.object,
};

export default RecentLayersList;
