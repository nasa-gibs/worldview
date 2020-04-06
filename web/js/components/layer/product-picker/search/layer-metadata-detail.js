import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ListGroup, ListGroupItem, Button } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faGlobeAmericas } from '@fortawesome/free-solid-svg-icons';
import util from '../../../../util/util';
import { getOrbitTrackTitle, dateOverlap } from '../../../../modules/layers/util';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../../modules/layers/actions';
import {
  selectLayer as selectLayerAction,
} from '../../../../modules/product-picker/actions';
import { getActiveLayers } from '../../../../modules/layers/selectors';

class LayerMetadataDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDateRangesExpanded: false,
    };
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

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @param {e} event
   * @return {void}
   */
  toggleDateRanges(e) {
    this.setState((prevState) => ({ isDateRangesExpanded: !prevState.isDateRangesExpanded }));
  }

  getListItems = (layer) => layer.dateRanges
    .slice(0)
    .reverse()
    .map((l) => {
      let listItemStartDate;
      let listItemEndDate;
      if (l.startDate) {
        listItemStartDate = util.coverageDateFormatter('START-DATE', l.startDate, layer.period);
      }
      if (l.endDate) {
        listItemEndDate = util.coverageDateFormatter('END-DATE', l.endDate, layer.period);
      }

      return (
        <ListGroupItem key={`${l.startDate} - ${l.endDate}`}>
          {`${listItemStartDate} - ${listItemEndDate}`}
        </ListGroupItem>
      );
    })

  renderSplitTitle = (title) => {
    const splitIdx = title.indexOf('(');
    const attrs = title.slice(splitIdx);
    const titleName = title.slice(0, splitIdx - 1);
    return splitIdx < 0
      ? (<h3>{title}</h3>)
      : (
        <>
          <h3>{titleName}</h3>
          <h4>{attrs}</h4>
        </>
      );
  }

  /**
     * Return text with the temporal range based on layer start
     * and end dates
     * @param  {object} layer the layer object
     * @return {string}       Return a string with temporal range information
     */
  dateRangeText = (layer) => {
    let startDate;
    let startDateId;
    let endDate;
    let endDateId;

    if (layer.startDate) {
      startDateId = `${layer.id}-startDate`;
      startDate = util.coverageDateFormatter('START-DATE', layer.startDate, layer.period);
    }
    if (layer.endDate) {
      endDateId = `${layer.id}-endDate`;
      endDate = util.parseDate(layer.endDate);
      if (endDate <= util.today() && !layer.inactive) {
        endDate = 'Present';
      } else {
        endDate = util.coverageDateFormatter('END-DATE', layer.endDate, layer.period);
      }
    } else {
      endDate = 'Present';
    }
    return `Temporal coverage:
          <span class="layer-date-start" id='${startDateId}'> ${startDate} </span> -
          <span class="layer-end-date" id='${endDateId}'> ${endDate} </span>`;
  }

  renderLayerDates() {
    const { layer } = this.props;
    const { isDateRangesExpanded } = this.state;
    let listItems;
    let dateRanges;

    if (layer.dateRanges && layer.dateRanges.length > 1) {
      dateRanges = dateOverlap(layer.period, layer.dateRanges);
      if (dateRanges.overlap === false) {
        listItems = this.getListItems(layer);
      }
    }

    return (
      <>
        {layer.startDate && (
          <p className="layer-date-range">
            <span
              dangerouslySetInnerHTML={{ __html: this.dateRangeText(layer) }}
            />
            {layer.dateRanges
              && layer.dateRanges.length > 1
              && dateRanges.overlap === false && (
              <a
                id="layer-date-ranges-button"
                title="View all date ranges"
                className="layer-date-ranges-button"
                onClick={(e) => this.toggleDateRanges(e)}
              >
                {' '}
                <sup>*View Dates</sup>
              </a>
            )}
          </p>
        )}
        {isDateRangesExpanded && (
          <div className="layer-date-wrap">
            <p>Date Ranges:</p>
            <ListGroup className="layer-date-ranges">{listItems}</ListGroup>
          </div>
        )}
      </>
    );
  }

  render() {
    const {
      layer, selectedProjection, isActive, showPreviewImage,
    } = this.props;
    if (!layer) {
      return (
        <div className="no-results">
          <FontAwesomeIcon icon={faGlobeAmericas} />
          <h3> No layer selected. </h3>
          <h5> Select a layer to view details here!</h5>
        </div>
      );
    }
    const {
      title, subtitle, track, metadata,
    } = layer;
    const layerTitle = !track ? title : `${title} (${getOrbitTrackTitle(layer)})`;
    const previewUrl = `images/layers/previews/${selectedProjection}/${layer.id}.jpg`;
    const buttonText = isActive ? 'Remove Layer' : 'Add Layer';
    const btnClass = isActive ? 'add-to-map-btn text-center is-active' : 'add-to-map-btn text-center';
    const btnIconClass = isActive ? faMinus : faPlus;
    return (
      <div className="layers-all-layer">
        <div className="layers-all-header">
          {!track ? this.renderSplitTitle(layerTitle) : <h3>{layerTitle}</h3>}
          {subtitle && <h5>{subtitle}</h5>}
          {/* NOTE - NEED TO ADD faChevronDown TO FONT AWESOME IMPORT ABOVE FROM '@fortawesome/free-solid-svg-icons'
            <Button className="close-details" onClick={() => selectLayer(null)}>
              <FontAwesomeIcon icon={faChevronDown} />
            </Button>
          */}
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
          {this.renderLayerDates()}
          <div dangerouslySetInnerHTML={{ __html: metadata }} />
        </div>
      </div>
    );
  }
}

LayerMetadataDetail.propTypes = {
  addLayer: PropTypes.func,
  isActive: PropTypes.bool,
  layer: PropTypes.object,
  removeLayer: PropTypes.func,
  selectedProjection: PropTypes.string,
  showPreviewImage: PropTypes.bool,
};

/**
   * dateRangeText - Return text with the temporal range based on layer start
   * and end dates
   *
   * @method toggleMetadataButtons
   * @param  {object} layer the layer object
   * @return {string}       Return a string with temporal range information
   */
const dateRangeText = (layer) => {
  let startDate; let startDateId; let endDate; let
    endDateId;

  if (layer.startDate) {
    startDateId = `${layer.id}-startDate`;
    startDate = util.coverageDateFormatter('START-DATE', layer.startDate, layer.period);
  }

  if (layer.endDate) {
    endDateId = `${layer.id}-endDate`;
    endDate = util.parseDate(layer.endDate);

    if (endDate <= util.today() && !layer.inactive) {
      endDate = 'Present';
    } else {
      endDate = util.coverageDateFormatter('END-DATE', layer.endDate, layer.period);
    }
  } else {
    endDate = 'Present';
  }

  const dateRange = `
      Temporal coverage:
      <span class="layer-date-start" id='${startDateId}'> ${startDate} </span> -
      <span class="layer-end-date" id='${endDateId}'> ${endDate} </span>
    `;

  return dateRange;
};

const mapStateToProps = (state, ownProps) => {
  const {
    productPicker,
    proj,
    config,
  } = state;
  const { selectedLayer } = productPicker;
  const activeLayers = getActiveLayers(state);
  const isActive = !!activeLayers[selectedLayer.id];
  return {
    layer: selectedLayer,
    isActive,
    selectedProjection: proj.id,
    selectedLayer,
    showPreviewImage: config.features.previewSnapshots,
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
  mapStateToProps,
  mapDispatchToProps,
)(LayerMetadataDetail);
