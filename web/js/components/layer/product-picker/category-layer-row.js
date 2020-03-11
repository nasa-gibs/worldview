import React from 'react';
import PropTypes from 'prop-types';
import lodashValues from 'lodash/values';
import lodashFind from 'lodash/find';
import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  ListGroup,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronCircleDown, faChevronCircleRight } from '@fortawesome/free-solid-svg-icons';
import { getOrbitTrackTitle } from '../../../modules/layers/util';
import MeasurementLayerRow from './measurement-layer-row';
import MeasurementMetadataDetail from './measurement-metadata-detail';


/**
 * A single category result row
 * @class CategoryLayerRow
 * @extends React.Component
 */
class CategoryLayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSelected: props.isSelected,
      projection: props.projection,
    };
  }

  /**
   * Render orbits and layer selections for
   * selected source
   * @param {Object} source | Object containing source info
   */
  renderSourceSettings(source) {
    const {
      layerConfig,
      measurement,
      activeLayers,
      removeLayer,
      addLayer,
      selectedDate,
    } = this.props;
    const { projection } = this.state;
    const OrbitSourceList = [];
    const LayerSouceList = [];
    let orbitTitle = '';

    source.settings.forEach((setting) => {
      const layer = layerConfig[setting];
      if (
        layer
        && layer.id === setting
        && Object.keys(layer.projections).indexOf(projection) > -1
      ) {
        if (
          layer.layergroup
          && layer.layergroup.indexOf('reference_orbits') !== -1
        ) {
          orbitTitle = getOrbitTrackTitle(layer);
          OrbitSourceList.push(
            <MeasurementLayerRow
              measurementId={measurement.id}
              key={measurement.id + layer.id}
              checked={!!lodashFind(activeLayers, { id: layer.id })}
              layer={layer}
              title={orbitTitle}
              removeLayer={removeLayer}
              addLayer={addLayer}
              selectedDate={selectedDate}
            />,
          );
        } else {
          LayerSouceList.push(
            <MeasurementLayerRow
              measurementId={measurement.id}
              key={measurement.id + layer.id}
              checked={!!lodashFind(activeLayers, { id: layer.id })}
              layer={layer}
              title={layer.title}
              removeLayer={removeLayer}
              addLayer={addLayer}
              selectedDate={selectedDate}
            />,
          );
        }
      } else if (layer && layer.title && layer.title.indexOf('Orbital Track') !== -1) {
        // The following complex if statement is a placeholder
        // for truncating the layer names, until the rest of
        // the interface is implemented
        if (layer.title.indexOf('(') !== -1) {
          const regExp = /\(([^)]+)\)/;
          const matches = regExp.exec(layer.title);

          [, orbitTitle] = matches;
        }
      }
    });
    return (
      <div>
        {LayerSouceList.length > 0 ? (
          <ListGroup className="source-settings source-sub-group">
            {LayerSouceList}
          </ListGroup>
        )
          : ''}
        {OrbitSourceList.length > 0 ? (
          <>
            <h3 className="source-orbits-title">Orbital Tracks:</h3>
            <ListGroup
              id={`${source.id}-orbit-tracks`}
              className="source-orbit-tracks source-sub-group"
            >
              {OrbitSourceList}
            </ListGroup>
          </>
        )
          : ''}
      </div>
    );
  }

  /**
   * Toggle layer
   * @param {String} id | Layer ID
   */
  onClickLayer(id) {
    const { removeLayer, addLayer, activeLayers } = this.props;
    if (lodashFind(activeLayers, { id })) {
      removeLayer(id);
    } else {
      addLayer(id);
    }
  }

  /**
   * Render Possible sources for measurement
   * @param {Object} source | Source Object
   * @param {Number} index | Index of measurement
   * @param {Number} activeSourceIndex | Index of active measurement
   */
  renderSourceTabs(source, index, activeSourceIndex) {
    const { setSourceIndex } = this.props;
    return (
      <NavItem
        key={source.id + index}
        id={`${source.id}-${index}-source-Nav`}
        onClick={() => setSourceIndex(index)}
        className={
          index === activeSourceIndex
            ? 'active source-nav-item'
            : 'source-nav-item'
        }
      >
        {source.title}
      </NavItem>
    );
  }

  /**
   * Render content when Active
   */
  renderContent() {
    const {
      hasMeasurementSetting,
      measurement,
      isMobile,
      selectedMeasurementSourceIndex,
    } = this.props;
    const sources = lodashValues(measurement.sources);

    // set first valid index to handle invalid activeSourceIndex indexes after projection change
    let minValidIndex = -1;
    let validActiveIndex = selectedMeasurementSourceIndex;

    return (
      <div className="measure-row-contents">
        <Nav vertical className="source-tabs">
          {sources
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((source, index) => {
              if (hasMeasurementSetting(measurement, source)) {
                // only set minValidIndex once to find init active tab/content
                if (minValidIndex < 0) {
                  minValidIndex = index;
                }
                // if activeSourceIndex is less than first valid index, make minValidIndex active tab
                validActiveIndex = minValidIndex > selectedMeasurementSourceIndex
                  ? minValidIndex
                  : selectedMeasurementSourceIndex;
                return this.renderSourceTabs(source, index, selectedMeasurementSourceIndex);
              }
              return '';
            })}
        </Nav>
        <TabContent id={`${measurement.id}-${sources[validActiveIndex].id}`}>
          <TabPane>
            {this.renderSourceSettings(sources[validActiveIndex])}
            {isMobile
              && (
              <MeasurementMetadataDetail
                source={sources[validActiveIndex]}
                isMobile={isMobile}
              />
              )}
          </TabPane>
        </TabContent>
      </div>
    );
  }

  render() {
    const {
      measurement,
      category,
      updateSelectedMeasurement,
      id,
      isSelected,
    } = this.props;
    const className = isSelected
      ? 'measurement-row layers-all-layer selected'
      : 'measurement-row layers-all-layer';
    return (
      <div
        className={className}
        id={`accordion-${category.id}-${measurement.id}`}
        key={`${category.id}-${measurement.id}`}
      >
        <div
          onClick={() => updateSelectedMeasurement(id)}
          className="measurement-row-header"
        >
          <h3>{measurement.title}</h3>
          {measurement.subtitle && !isSelected && <h5>{measurement.subtitle}</h5>}
          {isSelected
            ? <FontAwesomeIcon icon={faChevronCircleDown} className="arrow-icon" />
            : <FontAwesomeIcon icon={faChevronCircleRight} className="arrow-icon" />}
        </div>
        {isSelected ? this.renderContent() : ''}
      </div>
    );
  }
}
CategoryLayerRow.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  category: PropTypes.object,
  checked: PropTypes.bool,
  getSourceMetadata: PropTypes.func,
  hasMeasurementSetting: PropTypes.func,
  id: PropTypes.string,
  isMobile: PropTypes.bool,
  isSelected: PropTypes.bool,
  layerConfig: PropTypes.object,
  measurement: PropTypes.object,
  projection: PropTypes.string,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  selectedMeasurementSourceIndex: PropTypes.number,
  setSourceIndex: PropTypes.func,
  sourceMetadata: PropTypes.object,
  updateSelectedMeasurement: PropTypes.func,
};

export default CategoryLayerRow;
