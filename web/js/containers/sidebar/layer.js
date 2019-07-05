import React from 'react';
import PropTypes from 'prop-types';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import { Draggable } from 'react-beautiful-dnd';
import util from '../../util/util';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import googleTagManager from 'googleTagManager';
import { getPalette, getPaletteLegends } from '../../modules/palettes/selectors';
import { openCustomContent } from '../../modules/modal/actions';
import LayerInfo from '../../components/layer/info/info';
import LayerSettings from '../../components/layer/settings/settings';
import { requestPalette } from '../../modules/palettes/actions';
import { connect } from 'react-redux';
import {
  toggleVisibility,
  removeLayer,
  layerHover
} from '../../modules/layers/actions';

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
  getPaletteLegend() {
    const {
      layer,
      runningObject,
      paletteLegends,
      checkerBoardPattern,
      getPalette,
      palette,
      renderedPalette,
      requestPalette,
      isCustomPalette,
      isLoading
    } = this.props;
    if (!lodashIsEmpty(renderedPalette)) {
      let isRunningData = !!runningObject;
      let colorHex = isRunningData ? runningObject.paletteHex : null;
      return (
        <PaletteLegend
          layer={layer}
          paletteId={palette.id}
          getPalette={getPalette}
          paletteLegends={paletteLegends}
          isCustomPalette={isCustomPalette}
          isRunningData={isRunningData}
          checkerBoardPattern={checkerBoardPattern}
          colorHex={colorHex}
        />
      );
    } else if (!isLoading) {
      requestPalette(layer.id);
    }
  }
  getDisabledTitle(layer) {
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
  render() {
    const {
      layerGroupName,
      onRemoveClick,
      toggleVisibility,
      onInfoClick,
      hover,
      layer,
      isDisabled,
      isVisible,
      layerClasses,
      names,
      isMobile,
      index,
      onOptionsClick,
      hasPalette,
      zot,
      isInProjection
    } = this.props;

    return (
      <Draggable
        draggableId={util.encodeId(layer.id) + '-' + layerGroupName}
        index={index}
        direction="vertical"
      >
        {(provided, snapshot) => {
          return isInProjection ? (
            <li
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              id={layerGroupName + '-' + util.encodeId(layer.id)}
              style={getItemStyle(
                snapshot.isDragging,
                provided.draggableProps.style
              )}
              className={
                isDisabled
                  ? layerClasses + ' disabled layer-hidden'
                  : !isVisible
                    ? layerClasses + ' layer-hidden'
                    : zot
                      ? layerClasses + ' layer-enabled layer-visible zotted'
                      : layerClasses + ' layer-enabled layer-visible'
              }
              onMouseEnter={() => hover(layer.id, true)}
              onMouseLeave={() => hover(layer.id, false)}
            >
              <a
                className={
                  isDisabled
                    ? visibilityButtonClasses + ' layer-hidden'
                    : !isVisible
                      ? visibilityButtonClasses + ' layer-hidden'
                      : visibilityButtonClasses + ' layer-enabled layer-visible'
                }
                id={'hide' + util.encodeId(layer.id)}
                onClick={() => toggleVisibility(layer.id, !isVisible)}
                title={
                  !isVisible && !isDisabled
                    ? 'Show Layer'
                    : isDisabled
                      ? this.getDisabledTitle(layer)
                      : 'Hide Layer'
                }
              >
                <i
                  className={
                    isDisabled
                      ? 'fas fa-ban layer-eye-icon'
                      : !isVisible
                        ? 'far fa-eye-slash layer-eye-icon'
                        : 'far fa-eye layer-eye-icon'
                  }
                />
              </a>

              <div
                className={'zot'}
                title={
                  zot
                    ? 'Layer is overzoomed by ' +
                      zot.toString() +
                      'x its maximum zoom level'
                    : ''
                }
              >
                <b>!</b>
              </div>
              <div className="layer-main">
                <a
                  id={'close' + layerGroupName + util.encodeId(layer.id)}
                  title={'Remove Layer'}
                  className="button wv-layers-close"
                  onClick={() => onRemoveClick(layer.id)}
                >
                  <i className="fa fa-times" />
                </a>
                <a
                  title={'Layer options for ' + names.title}
                  className={
                    isMobile ? 'hidden wv-layers-options' : 'wv-layers-options'
                  }
                  onClick={() => onOptionsClick(layer, names.title)}
                >
                  <i className="fas fa-sliders-h wv-layers-options-icon" />
                </a>
                <a
                  title={'Layer description for ' + names.title}
                  className={
                    isMobile ? 'hidden wv-layers-info' : 'wv-layers-info'
                  }
                  onClick={() => onInfoClick(layer, names.title)}
                >
                  <i className="fa fa-info wv-layers-info-icon" />
                </a>
                <h4 title={name.title}>{names.title}</h4>
                <p dangerouslySetInnerHTML={{ __html: names.subtitle }} />
                {hasPalette ? this.getPaletteLegend() : ''}
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
  const { palettes, config, map } = state;
  const hasPalette = !lodashIsEmpty(layer.palette);
  const renderedPalettes = palettes.rendered;
  const paletteName = lodashGet(config, `layers.${layer.id}.palette.id`);
  const paletteLegends =
    hasPalette && renderedPalettes[paletteName]
      ? getPaletteLegends(layer.id, layerGroupName, state)
      : [];
  const isCustomPalette = hasPalette && palettes.custom[layer.id];

  return {
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
    isMobile: state.browser.is.small,
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
    dispatch(
      openCustomContent('LAYER_OPTIONS_MODAL' + '-' + layer.id, {
        headerText: title || 'Layer Options',
        backdrop: false,
        bodyComponent: LayerSettings,
        modalClassName: 'layer-settings-modal',
        timeout: 150,
        bodyComponentProps: {
          layer: layer
        }
      })
    );
  },
  onInfoClick: (layer, title) => {
    googleTagManager.pushEvent({
      event: 'sidebar_layer_info'
    });
    dispatch(
      openCustomContent('LAYER_INFO_MODAL' + '-' + layer.id, {
        headerText: title || 'Layer Description',
        backdrop: false,
        bodyComponent: LayerInfo,
        modalClassName: 'layer-info-modal',
        timeout: 150,
        bodyComponentProps: {
          layer: layer
        }
      })
    );
  },
  requestPalette(id) {
    return dispatch(requestPalette(id));
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layer);
