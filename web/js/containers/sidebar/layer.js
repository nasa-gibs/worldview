import React from 'react';
import PropTypes from 'prop-types';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import { Draggable } from 'react-beautiful-dnd';
import util from '../../util/util';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import {
  getPalette,
  getPaletteLegends
} from '../../modules/palettes/selectors';
import { toggleCustomContent } from '../../modules/modal/actions';
import LayerInfo from '../../components/layer/info/info';
import LayerSettings from '../../components/layer/settings/settings';
import { requestPalette } from '../../modules/palettes/actions';
import { connect } from 'react-redux';
import {
  toggleVisibility,
  removeLayer,
  layerHover
} from '../../modules/layers/actions';
import OrbitTrack from './orbit-track';

const visibilityButtonClasses = 'hdanchor hide hideReg bank-item-img';
const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  ...draggableStyle,
  position: isDragging ? 'absolute' : 'relative',
  top: null,
  left: null
});

class Layer extends React.Component {
  constructor(props) {
    super(props);
    const { index } = props;
    this.state = {
      index: index
    };
  }

  getPaletteLegend = () => {
    const {
      compare,
      layer,
      layerGroupName,
      runningObject,
      paletteLegends,
      checkerBoardPattern,
      getPalette,
      palette,
      renderedPalette,
      requestPalette,
      isCustomPalette,
      isLoading,
      isMobile
    } = this.props;
    if (!lodashIsEmpty(renderedPalette)) {
      const isRunningData = compare.active
        ? compare.activeString === layerGroupName && !!runningObject
        : !!runningObject;
      const colorHex = isRunningData ? runningObject.paletteHex : null;
      return (
        <PaletteLegend
          layer={layer}
          layerGroupName={layerGroupName}
          paletteId={palette.id}
          getPalette={getPalette}
          paletteLegends={paletteLegends}
          isCustomPalette={isCustomPalette}
          isRunningData={isRunningData}
          checkerBoardPattern={checkerBoardPattern}
          colorHex={colorHex}
          isMobile={isMobile}
        />
      );
    } else if (!isLoading) {
      requestPalette(layer.id);
    }
  }

  getDisabledTitle = (layer) => {
    var startDate, endDate;
    if (layer.startDate && layer.endDate) {
      startDate = util.parseDate(layer.startDate);
      endDate = util.parseDate(layer.endDate);
      if (layer.period !== 'subdaily') {
        startDate =
          startDate.getDate() +
          ' ' +
          util.giveMonth(startDate) +
          ' ' +
          startDate.getFullYear();
        endDate =
          endDate.getDate() +
          ' ' +
          util.giveMonth(endDate) +
          ' ' +
          endDate.getFullYear();
      }
      return 'Data available between ' + startDate + ' - ' + endDate;
    } else if (layer.startDate) {
      startDate = util.parseDate(layer.startDate);
      if (layer.period !== 'subdaily') {
        startDate =
          startDate.getDate() +
          ' ' +
          util.giveMonth(startDate) +
          ' ' +
          startDate.getFullYear();
      }
      return 'Data available between ' + startDate + ' - Present';
    } else {
      return 'No data on selected date for this layer';
    }
  }

  stopPropagation = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  }

  renderControls() {
    const {
      layer,
      layerGroupName,
      names,
      isMobile,
      onRemoveClick,
      onInfoClick,
      onOptionsClick
    } = this.props;
    const { title } = names;
    return (
      <>
        <a
          id={'close' + layerGroupName + util.encodeId(layer.id)}
          title={'Remove Layer'}
          className="button wv-layers-close"
          onClick={() => onRemoveClick(layer.id)}
        >
          <i className="fa fa-times" />
        </a>
        <a
          title={'Layer options for ' + title}
          className={isMobile ? 'hidden wv-layers-options' : 'wv-layers-options'}
          onMouseDown={this.stopPropagation}
          onClick={() => onOptionsClick(layer, title)}
        >
          <i className="fas fa-sliders-h wv-layers-options-icon" />
        </a>
        <a
          title={'Layer description for ' + title}
          className={isMobile ? 'hidden wv-layers-info' : 'wv-layers-info'}
          onMouseDown={this.stopPropagation}
          onClick={() => onInfoClick(layer, title)}
        >
          <i className="fa fa-info wv-layers-info-icon" />
        </a>
      </>
    );
  };

  render() {
    const {
      layerGroupName,
      toggleVisibility,
      hover,
      layer,
      isDisabled,
      isVisible,
      layerClasses,
      names,
      index,
      hasPalette,
      zot,
      isInProjection,
      tracksForLayer
    } = this.props;

    const containerClass = isDisabled
      ? layerClasses + ' disabled layer-hidden'
      : !isVisible
        ? layerClasses + ' layer-hidden'
        : zot
          ? layerClasses + ' layer-enabled layer-visible zotted'
          : layerClasses + ' layer-enabled layer-visible';
    const visibilityToggleClass = isDisabled
      ? visibilityButtonClasses + ' layer-hidden'
      : !isVisible
        ? visibilityButtonClasses + ' layer-hidden'
        : visibilityButtonClasses + ' layer-enabled layer-visible';
    const visibilityTitle = !isVisible && !isDisabled
      ? 'Show Layer'
      : isDisabled
        ? this.getDisabledTitle(layer)
        : 'Hide Layer';
    const visibilityIconClass = isDisabled
      ? 'fas fa-ban layer-eye-icon'
      : !isVisible
        ? 'far fa-eye-slash layer-eye-icon'
        : 'far fa-eye layer-eye-icon';

    const zotTitle = zot
      ? 'Layer is overzoomed by ' + zot.toString() + 'x its maximum zoom level'
      : '';

    return (
      <Draggable
        draggableId={util.encodeId(layer.id) + '-' + layerGroupName}
        index={index}
        direction="vertical"
      >
        {(provided, snapshot) => {
          return isInProjection ? (
            <li
              id={layerGroupName + '-' + util.encodeId(layer.id)}
              className={containerClass}
              style={getItemStyle(
                snapshot.isDragging,
                provided.draggableProps.style
              )}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              onMouseEnter={() => hover(layer.id, true)}
              onMouseLeave={() => hover(layer.id, false)}
            >
              <a
                className={visibilityToggleClass}
                id={'hide' + util.encodeId(layer.id)}
                onClick={() => toggleVisibility(layer.id, !isVisible)}
                title={visibilityTitle}
              >
                <i className={visibilityIconClass} />
              </a>

              <div
                className={'zot'}
                title={zotTitle}
              >
                <b>!</b>
              </div>

              <div className="layer-main">
                <div className="layer-info">
                  {this.renderControls()}
                  <h4 title={name.title}>{names.title}</h4>
                  <p dangerouslySetInnerHTML={{ __html: names.subtitle }} />
                  {hasPalette ? this.getPaletteLegend() : ''}
                </div>
                {tracksForLayer.length > 0 && (
                  <div className="layer-tracks">
                    {tracksForLayer.map(track => {
                      return (
                        <OrbitTrack
                          key={track.id}
                          trackLayer={track}
                          parentLayer={layer}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          ) : (
            <li
              className="layer-list-placeholder"
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            />
          );
        }}
      </Draggable>
    );
  }
}

Layer.defaultProps = {
  palette: {},
  renderedLegend: false
};
Layer.propTypes = {
  checkerBoardPattern: PropTypes.object,
  compare: PropTypes.object,
  getPalette: PropTypes.func,
  hasPalette: PropTypes.bool,
  hover: PropTypes.func,
  index: PropTypes.number,
  isCustomPalette: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isInProjection: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  isVisible: PropTypes.bool,
  layer: PropTypes.object,
  layerClasses: PropTypes.string,
  layerGroupName: PropTypes.string,
  names: PropTypes.object,
  onInfoClick: PropTypes.func,
  onOptionsClick: PropTypes.func,
  onRemoveClick: PropTypes.func,
  palette: PropTypes.object,
  paletteLegends: PropTypes.array,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  runningObject: PropTypes.object,
  toggleVisibility: PropTypes.func,
  tracksForLayer: PropTypes.array,
  zot: PropTypes.number
};
function mapStateToProps(state, ownProps) {
  const {
    layer,
    isDisabled,
    isVisible,
    layerClasses,
    names,
    index,
    layerGroupName
  } = ownProps;
  const { palettes, config, map, layers, compare } = state;
  const hasPalette = !lodashIsEmpty(layer.palette);
  const renderedPalettes = palettes.rendered;
  const paletteName = lodashGet(config, `layers['${layer.id}'].palette.id`);
  const paletteLegends = hasPalette && renderedPalettes[paletteName]
    ? getPaletteLegends(layer.id, layerGroupName, state)
    : [];
  const isCustomPalette = hasPalette && palettes.custom[layer.id];
  const tracksForLayer = layers[layerGroupName].filter(activeLayer => {
    return (layer.tracks || []).some(track => activeLayer.id === track);
  });

  return {
    compare,
    tracksForLayer,
    layer,
    isDisabled,
    isVisible,
    layerClasses,
    paletteLegends,
    names,
    index,
    isCustomPalette,
    isLoading: palettes.isLoading[paletteName],
    renderedPalette: renderedPalettes[paletteName],
    layerGroupName,
    isMobile: state.browser.lessThan.medium,
    hasPalette,
    getPalette: (layerId, index) => {
      return getPalette(layer.id, index, layerGroupName, state);
    },
    runningObject: map.runningDataObj[layer.id]
  };
}

const mapDispatchToProps = dispatch => ({
  hover: (id, value) => {
    dispatch(layerHover(id, value));
  },
  toggleVisibility: (id, isVisible) => {
    dispatch(toggleVisibility(id, isVisible));
  },
  onRemoveClick: id => {
    dispatch(removeLayer(id));
  },
  onOptionsClick: (layer, title) => {
    const key = 'LAYER_OPTIONS_MODAL' + '-' + layer.id;
    googleTagManager.pushEvent({
      event: 'sidebar_layer_options'
    });
    dispatch(
      toggleCustomContent(key, {
        headerText: title || 'Layer Options',
        backdrop: false,
        bodyComponent: LayerSettings,
        // Using clickableBehindModal: true here causes an issue where switching sidebar
        // tabs does not close this modal
        wrapClassName: 'clickable-behind-modal',
        modalClassName: ' layer-info-settings-modal layer-settings-modal',
        timeout: 150,
        bodyComponentProps: {
          layer: layer
        }
      })
    );
  },
  onInfoClick: (layer, title) => {
    const key = 'LAYER_INFO_MODAL' + '-' + layer.id;
    googleTagManager.pushEvent({
      event: 'sidebar_layer_info'
    });
    dispatch(
      toggleCustomContent(key, {
        headerText: title || 'Layer Description',
        backdrop: false,
        bodyComponent: LayerInfo,
        // Using clickableBehindModal: true here causes an issue where switching sidebar
        // tabs does not close this modal
        wrapClassName: 'clickable-behind-modal',
        modalClassName: ' layer-info-settings-modal layer-info-modal',
        timeout: 150,
        size: 'lg',
        bodyComponentProps: {
          layer: layer
        }
      })
    );
  },
  requestPalette: (id) => {
    dispatch(requestPalette(id));
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layer);
