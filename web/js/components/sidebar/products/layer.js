import React from 'react';
import PropTypes from 'prop-types';
import Legend from './legend';
import { Draggable } from 'react-beautiful-dnd';
import util from '../../../util/util';

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
    this.state = {
      zot: props.zot,
      index: props.index,
      isInProjection: props.isInProjection
    };
  }
  componentWillReceiveProps(props) {
    if (props.zot !== this.state.zot) {
      this.setState({ zot: props.zot });
    }
    if (props.isInProjection !== this.state.isInProjection) {
      this.setState({ isInProjection: props.isInProjection });
    }
  }
  hover(value) {
    const { updateLayer, layer } = this.props;
    updateLayer(layer.id, 'hover', value);
  }
  toggleVisibility(e) {
    const { updateLayer, layer } = this.props;
    updateLayer(layer.id, 'visibility');
  }
  onRemoveClick(e) {
    const { updateLayer, layer } = this.props;
    updateLayer(layer.id, 'remove');
  }
  onOptionsClick() {
    const { updateLayer, layer } = this.props;
    updateLayer(layer.id, 'options');
  }
  onInfoClick() {
    const { updateLayer, layer } = this.props;
    updateLayer(layer.id, 'info');
  }
  getLegend() {
    const {
      layer,
      palette,
      runningObject,
      getLegend,
      layerGroupName,
      checkerBoardPattern
    } = this.props;
    if (palette) {
      let isRunningData = !!runningObject;
      let colorHex = isRunningData ? runningObject.hex : null;
      return (
        <Legend
          layer={layer}
          palette={palette}
          legends={getLegend(layer.id, layerGroupName)}
          isRunningData={isRunningData}
          checkerBoardPattern={checkerBoardPattern}
          colorHex={colorHex}
        />
      );
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
  onLayerHover() {}
  getPalette() {}
  render() {
    const { zot, isInProjection } = this.state;
    const {
      layerGroupName,
      layer,
      isDisabled,
      isVisible,
      layerClasses,
      names,
      isMobile,
      index
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
              onMouseEnter={this.hover.bind(this, true)}
              onMouseLeave={this.hover.bind(this, false)}
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
                onClick={this.toggleVisibility.bind(this)}
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
                      ? 'fa fa-ban layer-eye-icon'
                      : !isVisible
                        ? 'fa fa-eye-slash layer-eye-icon'
                        : 'fa fa-eye layer-eye-icon'
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
                  className="button close bank-item-img"
                  onClick={this.onRemoveClick.bind(this)}
                >
                  <i />
                </a>
                <a
                  title={'Layer options for ' + names.title}
                  className={
                    isMobile ? 'hidden wv-layers-options' : 'wv-layers-options'
                  }
                  onClick={this.onOptionsClick.bind(this)}
                >
                  <i className="wv-layers-options-icon" />
                </a>
                <a
                  title={'Layer description for ' + names.title}
                  className={
                    isMobile ? 'hidden wv-layers-info' : 'wv-layers-info'
                  }
                  onClick={this.onInfoClick.bind(this)}
                >
                  <i className="fa fa-info wv-layers-info-icon" />
                </a>
                <h4 title={name.title}>{names.title}</h4>
                <p dangerouslySetInnerHTML={{ __html: names.subtitle }} />
                {this.getLegend()}
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
  getLegend: PropTypes.func,
  index: PropTypes.number,
  checkerBoardPattern: PropTypes.object,
  isInProjection: PropTypes.bool,
  zot: PropTypes.number
};
export default Layer;
