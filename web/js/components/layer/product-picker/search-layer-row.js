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
      checked: props.isEnabled
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
   * Show metadata for this layer
   * @method showMetadata
   * @param {e} event
   * @return {void}
   */
  showMetadata(e) {
    e.stopPropagation(); // Prevent layer from being activated
    const { layer, showLayerMetadata } = this.props;
    showLayerMetadata(layer.id);
  }

  /**
   * Spit the layer name and details (which are foundi in parentheses)
   * onto separate lines
   *
   * @param {*} title - the full layer title
   */
  renderSplitTitle(title) {
    const splitIdx = title.indexOf('(');
    const attrs = title.slice(splitIdx);
    const titleName = title.slice(0, splitIdx - 1);
    return splitIdx < 0 || title.length < 40
      ? <h3> {title} </h3>
      : (
        <>
          <h3> {titleName} </h3>
          <h4> {attrs} </h4>
        </>
      );
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      checked: nextProps.isEnabled
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
          {!track ? this.renderSplitTitle(layerTitle) : <h3>{layerTitle}</h3>}
          {subtitle && <h5>{subtitle}</h5>}
          {description && (
            <i className="fa fa-info-circle" onClick={e => this.showMetadata(e)} />
          )}
        </div>
      </div>
    );
  }
}
LayerRow.propTypes = {
  isEnabled: PropTypes.bool,
  isMetadataShowing: PropTypes.bool,
  layer: PropTypes.object,
  offState: PropTypes.func,
  onState: PropTypes.func,
  showLayerMetadata: PropTypes.func,
  toggleDateRangesExpansion: PropTypes.func
};

export default LayerRow;
