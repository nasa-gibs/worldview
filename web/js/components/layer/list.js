import React from 'react';
import PropTypes from 'prop-types';
import LayerRow from './row.js';
import 'whatwg-fetch'; // fetch() polyfill for IE

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class LayerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filteredLayers: props.filteredLayers,
      expandedMetadataLayers: [],
      expandedDateRangesLayers: [],
      activeLayers: props.activeLayers
    };
  }

  /*
   * Toggles expansion of metadata for a layer given that layer's ID and makes
   * an AJAX request for the metadata if it's missing
   *
   * @method toggleMetadataExpansion
   * @param {string} layer - the layer to be toggled
   * @return {void}
   */
  toggleMetadataExpansion(layerId) {
    var { filteredLayers, expandedMetadataLayers } = this.state;
    var isMetadataExpanded = expandedMetadataLayers.find(id => id === layerId);
    if (isMetadataExpanded) {
      expandedMetadataLayers.splice(expandedMetadataLayers.indexOf(layerId), 1);
      expandedMetadataLayers = expandedMetadataLayers.filter(
        id => id !== layerId
      );
    } else {
      expandedMetadataLayers.push(layerId);
      this.setState({ expandedMetadataLayers: expandedMetadataLayers });
      var layer = filteredLayers.find(l => l.id === layerId);
      if (!layer.metadata) {
        var { origin, pathname } = window.location;
        var errorMessage = '<p>There was an error loading layer metadata.</p>';
        var uri = `${origin}${pathname}config/metadata/${
          layer.description
        }.html`;
        fetch(uri)
          .then(res => (res.ok ? res.text() : errorMessage))
          .then(body => {
            // Check that we have a metadata html snippet, rather than a fully
            // formed HTML file. Also avoid executing any script or style tags.
            var isMetadataSnippet = !body.match(
              /<(head|body|html|style|script)[^>]*>/i
            );
            layer.metadata = isMetadataSnippet ? body : errorMessage;
            this.setState({ layers: filteredLayers });
          });
      }
    }
  }

  /*
   * Toggles expansion of date ranges for a layer given that layer's ID
   *
   * @method toggleDateRangesExpansion
   * @param {string} layer - The layer being toggled
   * @return {void}
   */
  toggleDateRangesExpansion(layerId) {
    var { expandedDateRangesLayers } = this.state;
    var isDateRangesExpanded = expandedDateRangesLayers.find(
      id => id === layerId
    );
    if (isDateRangesExpanded) {
      expandedDateRangesLayers = expandedDateRangesLayers.filter(
        id => id !== layerId
      );
    } else {
      expandedDateRangesLayers.push(layerId);
      this.setState({ expandedDateRangesLayers: expandedDateRangesLayers });
    }
  }

  render() {
    var {
      filteredLayers,
      expandedMetadataLayers,
      expandedDateRangesLayers,
      activeLayers
    } = this.state;
    var { addLayer, removeLayer } = this.props;
    return (
      <div
        style={{
          height: '100%',
          overflowY: 'scroll',
          msOverflowStyle: 'scrollbar',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {filteredLayers.length < 1 ? <div>No results.</div> : null}
        {filteredLayers.map(layer => {
          var isEnabled = activeLayers.some(l => l.id === layer.id);
          var isMetadataExpanded = expandedMetadataLayers.includes(layer.id);
          var isDateRangesExpanded = expandedDateRangesLayers.includes(
            layer.id
          );
          return (
            <LayerRow
              key={layer.id}
              layer={layer}
              isEnabled={isEnabled}
              isMetadataExpanded={isMetadataExpanded}
              isDateRangesExpanded={isDateRangesExpanded}
              onState={addLayer}
              offState={removeLayer}
              toggleMetadataExpansion={id => this.toggleMetadataExpansion(id)}
              toggleDateRangesExpansion={id =>
                this.toggleDateRangesExpansion(id)
              }
            />
          );
        })}
      </div>
    );
  }
  _setListRef(ref) {
    this._layerList = ref;
  }
}

LayerList.propTypes = {
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  activeLayers: PropTypes.array,
  filteredLayers: PropTypes.array
};

export default LayerList;
