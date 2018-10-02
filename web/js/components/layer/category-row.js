import React from 'react';
import PropTypes from 'prop-types';
import lodashValues from 'lodash/values';
import lodashFind from 'lodash/find';
import lodashStartCase from 'lodash/startCase';
import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Row,
  ListGroup,
  ListGroupItem
} from 'reactstrap';

import { Checkbox } from '../util/checkbox';

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
  toggleMetadataExpansion() {
    this.setState({ isMetadataExpanded: !this.state.isMetadataExpanded });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      checked: nextProps.isEnabled,
      isMetadataExpanded: nextProps.isMetadataExpanded,
      isDateRangesExpanded: nextProps.isDateRangesExpanded
    });
  }
  renderOrbitListItem(orbitTitle, measurement, layer) {
    const { activeLayers } = this.props;
    return (
      <ListGroupItem key={measurement.id + '-' + layer.id}>
        <Checkbox
          name={layer.title}
          checked={!!activeLayers[layer.id]}
          onCheck={this.onClickLayer.bind(this, layer.id)}
          label={orbitTitle}
          id={'setting-' + layer.id}
          classNames="settings-check"
        />
      </ListGroupItem>
    );
  }
  renderSourceSettings(source) {
    const { layerConfig, measurement, activeLayers } = this.props;
    const { projection } = this.state;
    let OrbitSourceList = [];
    let LayerSouceList = [];
    let orbitTitle = '';
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
          if (layer.daynight && layer.track) {
            orbitTitle =
              lodashStartCase(layer.track) +
              '/' +
              lodashStartCase(layer.daynight);
          } else if (layer.track) {
            orbitTitle = lodashStartCase(layer.track);
          } else if (layer.day) {
            orbitTitle = lodashStartCase(layer.daynight);
          }

          OrbitSourceList.push(
            this.renderOrbitListItem(orbitTitle, measurement, layer)
          );
        } else {
          LayerSouceList.push(
            <ListGroupItem key={measurement.id + '-' + layer.id}>
              <Checkbox
                name={layer.title}
                checked={!!activeLayers[layer.id]}
                onCheck={this.onClickLayer.bind(this, layer.id)}
                label={layer.title}
                id={'setting-' + layer.id}
                classNames="settings-check"
              />
            </ListGroupItem>
          );
        }
      } else if (layer.title.indexOf('Orbital Track') !== -1) {
        // The following complex if statement is a placeholder
        // for truncating the layer names, until the rest of
        // the interface is implemented
        if (layer.title.indexOf('(') !== -1) {
          var regExp = /\(([^)]+)\)/;
          var matches = regExp.exec(layer.title);
          orbitTitle = matches[1];
        }
        OrbitSourceList.push(
          this.renderOrbitListItem(orbitTitle, measurement, layer)
        );
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
  onClickLayer(id) {
    const { removeLayer, addLayer, activeLayers } = this.props;
    if (lodashFind(activeLayers, { id: id })) {
      removeLayer(id);
    } else {
      addLayer(id);
    }
  }
  requestMetaData(layer, palettePromise) {
    if (this.state.palettes[layer.id]) {
      return this.state.palettes[layer.id];
    } else if (layer.palette) {
      palettePromise(layer.id).then(palette => {
        var palettes = this.state.palettes;
        palettes[layer.id] = palette;
        this.setState({
          palettes: palettes
        });
      });
    }
    return null;
  }
  renderSourceMetaData(source) {
    const { sourceMetadata, getSourceMetadata } = this.props;
    const { isMetadataExpanded } = this.state;
    // Simple test to see if theres a link to some metadata
    if (source.description) {
      if (sourceMetadata[source.id]) {
        let data = sourceMetadata[source.id].data;
        let doesMetaDataNeedExpander = data.length >= 1000;
        let isMetaVisible = isMetadataExpanded || !doesMetaDataNeedExpander;
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
        return <div>loading Metadata </div>;
      }
    } else {
      return <div> No Metadata </div>;
    }
  }
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
  renderContent() {
    const { hasMeasurementSetting, measurement } = this.props;
    const { activeSourceIndex } = this.state;
    const sources = lodashValues(measurement.sources);

    const Tabs = (
      <Nav vertical className="source-tabs col-md-3 col-sm-12">
        {sources.map(
          (source, index) =>
            hasMeasurementSetting(measurement, source)
              ? this.renderSourceTabs(
                measurement,
                source,
                index,
                activeSourceIndex
              )
              : ''
        )}
      </Nav>
    );

    const Content = this.renderSourceContent(
      measurement,
      sources[activeSourceIndex]
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
  layer: PropTypes.object,
  isEnabled: PropTypes.bool,
  isMetadataExpanded: PropTypes.bool,
  isDateRangesExpanded: PropTypes.bool,
  onState: PropTypes.func,
  offState: PropTypes.func,
  toggleMetadataExpansion: PropTypes.func,
  toggleDateRangesExpansion: PropTypes.func
};

export default LayerRow;
