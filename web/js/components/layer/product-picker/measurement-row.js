import React from 'react';
import PropTypes from 'prop-types';
import lodashValues from 'lodash/values';
import lodashFind from 'lodash/find';
import { getOrbitTrackTitle } from '../../../modules/layers/util';
import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Row,
  ListGroup
} from 'reactstrap';
import MeasurementLayerRow from './measurement-layer-row';

/**
 * A single layer search result row
 * @class LayerRow
 * @extends React.Component
 */
class LayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSelected: props.isSelected,
      projection: props.projection,
      activeSourceIndex: 0,
      isMetadataExpanded: false
    };
  }

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @return {void}
   */
  toggleMetadataExpansion() {
    this.setState({ isMetadataExpanded: !this.state.isMetadataExpanded });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { isEnabled, isMetadataExpanded, isDateRangesExpanded } = this.state;
    if (
      nextProps.checked !== isEnabled ||
      nextProps.isMetadataExpanded !== isMetadataExpanded ||
      nextProps.isDateRangesExpanded !== isDateRangesExpanded
    ) {
      this.setState({
        checked: nextProps.isEnabled,
        isMetadataExpanded: nextProps.isMetadataExpanded,
        isDateRangesExpanded: nextProps.isDateRangesExpanded
      });
    }
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
      addLayer
    } = this.props;
    const { projection } = this.state;
    const OrbitSourceList = [];
    const LayerSouceList = [];

    source.settings.forEach(setting => {
      const layer = layerConfig[setting];
      if (
        layer &&
        layer.id === setting &&
        Object.keys(layer.projections).indexOf(projection) > -1
      ) {
        if (
          layer.layergroup &&
          layer.layergroup.indexOf('reference_orbits') !== -1
        ) {
          OrbitSourceList.push(
            <MeasurementLayerRow
              measurementId={measurement.id}
              key={measurement.id + layer.id}
              checked={!!lodashFind(activeLayers, { id: layer.id })}
              layerId={layer.id}
              title={getOrbitTrackTitle(layer)}
              removeLayer={removeLayer}
              addLayer={addLayer}
            />
          );
        } else {
          LayerSouceList.push(
            <MeasurementLayerRow
              measurementId={measurement.id}
              key={measurement.id + layer.id}
              checked={!!lodashFind(activeLayers, { id: layer.id })}
              layerId={layer.id}
              title={layer.title}
              removeLayer={removeLayer}
              addLayer={addLayer}
            />
          );
        }
      } else if (layer && layer.title && layer.title.indexOf('Orbital Track') !== -1) {
        // The following complex if statement is a placeholder
        // for truncating the layer names, until the rest of
        // the interface is implemented
        if (layer.title.indexOf('(') !== -1) {
          var regExp = /\(([^)]+)\)/;
          var matches = regExp.exec(layer.title);
          orbitTitle = matches[1];
        }
      }
    });
    return (
      <div>
        {LayerSouceList.length > 0 ? (
          <ListGroup className="source-settings source-sub-group">
            {LayerSouceList}
          </ListGroup>
        ) : (
          ''
        )}
        {OrbitSourceList.length > 0 ? (
          <React.Fragment>
            <h3 className="source-orbits-title">Orbital Tracks:</h3>
            <ListGroup
              id={source.id + '-orbit-tracks'}
              className="source-orbit-tracks source-sub-group"
            >
              {OrbitSourceList}
            </ListGroup>
          </React.Fragment>
        ) : (
          ''
        )}
      </div>
    );
  }

  /**
   * Toggle layer
   * @param {String} id | Layer ID
   */
  onClickLayer(id) {
    const { removeLayer, addLayer, activeLayers } = this.props;
    if (lodashFind(activeLayers, { id: id })) {
      removeLayer(id);
    } else {
      addLayer(id);
    }
  }

  /**
   * Request metadata if row is active and
   * hide metadata when too many chars
   * @param {Object} source | Source Object
   */
  renderSourceMetaData(source) {
    const { sourceMetadata, getSourceMetadata } = this.props;
    const { isMetadataExpanded } = this.state;
    // Simple test to see if theres a link to some metadata
    if (source.description) {
      if (sourceMetadata[source.description]) {
        const data = sourceMetadata[source.description].data;
        const doesMetaDataNeedExpander = data.length >= 1000;
        const isMetaVisible = isMetadataExpanded || !doesMetaDataNeedExpander;
        return (
          <div>
            <div
              className={
                isMetaVisible ? 'source-metadata ' : 'source-metadata overflow'
              }
              dangerouslySetInnerHTML={{ __html: data }}
            />
            {doesMetaDataNeedExpander ? (
              <div
                className="metadata-more"
                onClick={() => this.toggleMetadataExpansion()}
              >
                <span
                  className={isMetadataExpanded ? 'ellipsis up' : 'ellipsis'}
                >
                  {isMetadataExpanded ? '^' : '...'}
                </span>
              </div>
            ) : (
              ''
            )}
          </div>
        );
      } else {
        getSourceMetadata(source);
        return <div className="text-white">loading Metadata </div>;
      }
    }
  }

  /**
   * Render measurement content for selected source in
   * `TabPane`
   * @param {Object} measurement | Measurement Object
   * @param {Object} source | Source Object
   */
  renderSourceContent(measurement, source) {
    return (
      <TabContent
        className="col-md-9 col-sm-12"
        id={measurement.id + '-' + source.id}
      >
        <TabPane>
          {this.renderSourceSettings(source)}
          {this.renderSourceMetaData(source)}
        </TabPane>
      </TabContent>
    );
  }

  /**
   * Render Possible sources for measurement
   * @param {Object} measurement | Measurement Object
   * @param {Object} source | Source Object
   * @param {Number} index | Index of measurement
   * @param {Number} activeSourceIndex | Index of active measurement
   */
  renderSourceTabs(measurement, source, index, activeSourceIndex) {
    return (
      <NavItem
        key={source.id + index}
        id={source.id + '-' + index + '-source-Nav'}
        className={
          index === activeSourceIndex
            ? 'active source-nav-item'
            : 'source-nav-item'
        }
      >
        <NavLink onClick={() => this.setState({ activeSourceIndex: index })}>
          {source.title}
        </NavLink>
      </NavItem>
    );
  }

  toggleRowExpansion() {
    const { isSelected } = this.state;
    this.setState({ isSelected: !isSelected });
  }

  /**
   * Render content when Active
   */
  renderContent() {
    const { hasMeasurementSetting, measurement } = this.props;
    const { activeSourceIndex } = this.state;
    const sources = lodashValues(measurement.sources);

    // set first valid index to handle invalid activeSourceIndex indexes after projection change
    let minValidIndex = -1;
    let validActiveIndex = activeSourceIndex;

    const Tabs = (
      <Nav vertical className="source-tabs col-md-3 col-sm-12">
        {sources
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((source, index) => {
            if (hasMeasurementSetting(measurement, source)) {
              // only set minValidIndex once to find init active tab/content
              if (minValidIndex < 0) {
                minValidIndex = index;
              }
              // if activeSourceIndex is less than first valid index, make minValidIndex active tab
              validActiveIndex =
                minValidIndex > activeSourceIndex
                  ? minValidIndex
                  : activeSourceIndex;
              return this.renderSourceTabs(
                measurement,
                source,
                index,
                validActiveIndex
              );
            } else {
              return '';
            }
          })}
      </Nav>
    );

    // content set as minValidIndex if activeSourceIndex is not valid
    const Content = this.renderSourceContent(
      measurement,
      sources[validActiveIndex]
    );
    return (
      <div className="container">
        <Row>
          {Tabs}
          {Content}
        </Row>
      </div>
    );
  }

  render() {
    const {
      measurement,
      category,
      updateSelectedMeasurement,
      id,
      isSelected
    } = this.props;
    return (
      <div
        className="measurement-row layers-all-layer"
        id={'accordion-' + category.id + '-' + measurement.id}
        key={category.id + '-' + measurement.id}
      >
        <div
          onClick={() => {
            updateSelectedMeasurement(id);
          }}
          className="measurement-row-header"
        >
          <h3>{measurement.title}</h3>
          {measurement.subtitle && <h5>{measurement.subtitle}</h5>}
          <i
            className={
              isSelected
                ? 'fa fa-chevron-circle-down arrow-icon'
                : 'fa fa-chevron-circle-right arrow-icon'
            }
          />
        </div>
        {isSelected ? this.renderContent() : ''}
      </div>
    );
  }
}
LayerRow.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  category: PropTypes.object,
  getSourceMetadata: PropTypes.func,
  hasMeasurementSetting: PropTypes.func,
  id: PropTypes.string,
  isSelected: PropTypes.bool,
  layerConfig: PropTypes.object,
  measurement: PropTypes.object,
  projection: PropTypes.string,
  removeLayer: PropTypes.func,
  sourceMetadata: PropTypes.object,
  updateSelectedMeasurement: PropTypes.func
};

export default LayerRow;
