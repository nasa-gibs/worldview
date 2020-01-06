import React from 'react';
import PropTypes from 'prop-types';
import { getOrbitTrackTitle } from '../../../modules/layers/util';
/**
 * A single layer search result row
 * @class LayerRow
 * @extends React.Component
 */
class LayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.isEnabled,
      isDateRangesExpanded: props.isDateRangesExpanded
    };
  }

  /**
   * Toggle layer checked state
   * @method toggleCheck
   * @return {void}
   */
  toggleCheck() {
    var { checked } = this.state;
    var { onState, offState, layer } = this.props;
    if (checked) offState(layer.id);
    if (!checked) onState(layer.id);
    this.setState({ checked: !checked });
  }

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @param {e} event
   * @return {void}
   */
  toggleMetadataButtons(e) {
    e.stopPropagation(); // Prevent layer from being activated
    const { layer, showLayerMetadata } = this.props;
    showLayerMetadata(layer.id);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      checked: nextProps.isEnabled,
      isMetadataExpanded: nextProps.isMetadataExpanded,
      isDateRangesExpanded: nextProps.isDateRangesExpanded
    });
  }

  render() {
    const { checked } = this.state;
    const { layer, isMetadataShowing } = this.props;
    const { title, track, description, subtitle } = layer;
    let headerClass = 'layers-all-header has-checkbox';

    if (checked) headerClass += ' checked';
    const layerTitle = !track ? title : `${title} (${getOrbitTrackTitle(layer)})`;
    const rowClass = isMetadataShowing ? 'layers-all-layer selected' : 'layers-all-layer';

    return (
      <div className={rowClass}>
        <div className={headerClass} onClick={() => this.toggleCheck()}>
          <h3>
            {layerTitle}
          </h3>
          {subtitle && <h5>{subtitle}</h5>}
          {description && (
            <i
              className="fa fa-info-circle"
              onClick={e => this.toggleMetadataButtons(e)}
            />
          )}
        </div>
      </div>
    );
  }
}
LayerRow.propTypes = {
  isDateRangesExpanded: PropTypes.bool,
  isEnabled: PropTypes.bool,
  isMetadataExpanded: PropTypes.bool,
  isMetadataShowing: PropTypes.bool,
  layer: PropTypes.object,
  offState: PropTypes.func,
  onState: PropTypes.func,
  showLayerMetadata: PropTypes.func,
  toggleDateRangesExpansion: PropTypes.func
};

export default LayerRow;
