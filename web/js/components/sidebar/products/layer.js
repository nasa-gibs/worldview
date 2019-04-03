import React from 'react';
import PropTypes from 'prop-types';
import Legend from './legend';
import { Draggable } from 'react-beautiful-dnd';
import util from '../../../util/util';
import { isEmpty as lodashIsEmpty } from 'lodash';
import googleTagManager from 'googleTagManager';
import { getPalette, getLegends } from '../../../modules/palettes/selectors';
import { openCustomContent } from '../../../modules/modal/actions';
import LayerInfo from '../../layer/info/info';
import LayerSettings from '../../layer/settings/settings';

import {
  toggleVisibility,
  removeLayer,
  layerHover
} from '../../../modules/layers/actions';
import { requestPalette } from '../../../modules/palettes/actions';
import { connect } from 'react-redux';

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
    const { zot, index, isInProjection } = props;
    this.state = {
      zot: zot,
      index: index,
      isInProjection: isInProjection
    };
  }
  // componentWillReceiveProps(props) {
  //   if (props.zot !== this.state.zot) {
  //     this.setState({ zot: props.zot });
  //   }
  //   if (props.isInProjection !== this.state.isInProjection) {
  //     this.setState({ isInProjection: props.isInProjection });
  //   }
  // }
  getLegend() {
    const {
      layer,
      runningObject,
      legends,
      checkerBoardPattern,
      getPalette,
      palette,
      renderedPalette,
      requestPalette,
      isLoading
    } = this.props;
    if (!lodashIsEmpty(renderedPalette)) {
      let isRunningData = !!runningObject;
      let colorHex = isRunningData ? runningObject.hex : null;
      return (
        <Legend
          layer={layer}
          paletteId={palette.id}
          getPalette={getPalette}
          legends={legends}
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
    const { zot, isInProjection } = this.state;
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
      hasPalette
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
                {hasPalette ? this.getLegend() : ''}
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
  renderedLegend: false,
  palette: {}
};
Layer.propTypes = {
  isVisible: PropTypes.bool,
  layerClasses: PropTypes.string,
  isDisabled: PropTypes.bool,
  getPalette: PropTypes.func,
  updateLayer: PropTypes.func,
  layer: PropTypes.object,
  layerGroupName: PropTypes.string,
  zoomLevel: PropTypes.number,
  zoomLimit: PropTypes.number,
  names: PropTypes.object,
  onAddClick: PropTypes.func,
  isMobile: PropTypes.bool,
  palette: PropTypes.object,
  runningObject: PropTypes.object,
  legends: PropTypes.object,
  index: PropTypes.number,
  checkerBoardPattern: PropTypes.object,
  isInProjection: PropTypes.bool,
  zot: PropTypes.number,
  onRemoveClick: PropTypes.func,
  toggleVisibility: PropTypes.func,
  onInfoClick: PropTypes.func,
  hover: PropTypes.func
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
  const { palettes, config } = state;
  const hasPalette = !lodashIsEmpty(layer.palette);
  const renderedPalettes = palettes.rendered;
  const legends =
    hasPalette && renderedPalettes[layer.id]
      ? getLegends(layer.id, renderedPalettes, config)
      : {};

  return {
    layer,
    isDisabled,
    isVisible,
    layerClasses,
    legends,
    names,
    index,
    isLoading: palettes.isLoading[layer.id],
    renderedPalette: renderedPalettes[layer.id],
    layerGroupName,
    isMobile: state.browser.is.small,
    hasPalette,
    getPalette: (layerId, index) => {
      return getPalette(layer.id, index, renderedPalettes, config);
    }
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
    const location = 'config/palettes/' + id + '.json';
    return dispatch(requestPalette(location, id));
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layer);
