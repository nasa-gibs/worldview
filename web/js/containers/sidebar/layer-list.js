/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import { get as lodashGet } from 'lodash';
import LayerRow from './layer-row';
import {
  replaceSubGroup,
  getZotsForActiveLayers,
  getTitles,
  getActiveLayers,
  memoizedAvailable as availableSelector,
} from '../../modules/layers/selectors';
import {
  reorderLayers as reorderLayersAction,
  removeGroup as removeGroupAction,
  toggleGroupVisibility as toggleGroupVisibilityAction,
} from '../../modules/layers/actions';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function LayerList(props) {
  const {
    activeLayers,
    activeChartingLayer,
    available,
    compareState,
    collapsed,
    getNames,
    groupId,
    isAnimating,
    isMobile,
    isChartingActive,
    layerSplit,
    layers,
    numVisible,
    projId,
    reorderLayers,
    title,
    removeGroup,
    toggleVisibility,
    toggleCollapse,
    zots,
  } = props;
  const { dragHandleProps = {} } = props;
  const groupLayerIds = layers.map(({ id }) => id);
  const layersInProj = layers.filter(({ projections }) => projections[projId]);
  const [showDropdownBtn, setDropdownBtnVisible] = useState(false);
  const [showDropdownMenu, setDropdownMenuVisible] = useState(false);

  const toggleDropdownMenuVisible = () => {
    if (showDropdownMenu) {
      setDropdownBtnVisible(false);
    }
    setDropdownMenuVisible(!showDropdownMenu);
  };

  const mouseEnter = () => { setDropdownBtnVisible(true); };
  const mouseLeave = () => {
    if (showDropdownMenu) return;
    setDropdownBtnVisible(false);
  };


  /**
   * Update Layer order after drag
   * @param {Object} result | Result of layer drag
   */
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || source.index === destination.index) {
      return;
    }
    const regex = new RegExp(`-${compareState}$`);
    const layerId = draggableId.replace(regex, '');
    const newLayerArray = reorder(layers, source.index, destination.index);

    // In the new ordering, find the layer right after the layer that just
    // moved. Leave null if moved to the end of the list.
    let nextLayerId = null;
    const nextIndex = destination.index + 1;
    if (nextIndex < newLayerArray.length) {
      nextLayerId = newLayerArray[nextIndex].id;
    }
    const newLayers = replaceSubGroup(
      layerId,
      nextLayerId,
      Array.from(activeLayers),
      layerSplit,
    );
    reorderLayers(newLayers);
  };

  const renderLayer = (layer, index) => {
    const { id, projections, visible } = layer;
    return (
      <LayerRow
        layer={layer}
        compareState={compareState}
        isChartingActive={isChartingActive}
        activeChartingLayer={activeChartingLayer}
        isInProjection={!!projections[projId]}
        key={id}
        index={index}
        zot={zots[id]}
        names={getNames(id)}
        isDisabled={!available(id)}
        isVisible={visible}
      />
    );
  };

  const renderDropdownMenu = () => (!isAnimating && !isChartingActive) && (
    <Dropdown className="layer-group-more-options" isOpen={showDropdownMenu} toggle={toggleDropdownMenuVisible}>
      <DropdownToggle>
        <FontAwesomeIcon
          className="layer-group-more"
          icon="ellipsis-v"
          widthAuto
        />
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem id="show-all" onClick={() => toggleVisibility(groupLayerIds, true)}>
          Show All Layers
        </DropdownItem>
        <DropdownItem id="hide-all" onClick={() => toggleVisibility(groupLayerIds, false)}>
          Hide All Layers
        </DropdownItem>
        <DropdownItem id="remove-group" onClick={() => removeGroup(groupLayerIds)}>
          Remove Group
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  const renderHeader = () => (
    <div
      className="layer-group-header"
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      {...dragHandleProps}
    >
      <h3 className="layer-group-title">
        {title}
        {collapsed ? ` (${numVisible}/${layersInProj.length})` : ''}
      </h3>
      <div className="layer-group-icons">
        {showDropdownBtn || isMobile ? renderDropdownMenu() : null}
        {!isChartingActive && (
          <FontAwesomeIcon
            className="layer-group-collapse"
            icon={!collapsed ? 'caret-down' : 'caret-left'}
            onClick={() => toggleCollapse(groupId, !collapsed)}
            widthAuto
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      id={`${compareState}-${groupId}`}
      className="layer-group-case"
    >

      {renderHeader()}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId={`${compareState}-${groupId}`}
          type={`layerGroup${groupId}`}
          direction="vertical"
        >
          {(provided, snapshot) => (
            <ul
              className={collapsed ? 'category hidden' : 'category'}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {layers.sort((layerA, layerB) => (isChartingActive ? layerB.shouldHide === layerA.shouldHide ? 0 : layerB.shouldHide ? -1 : 1 : 0)).map(renderLayer)}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

LayerList.propTypes = {
  activeLayers: PropTypes.array,
  available: PropTypes.func,
  collapsed: PropTypes.bool,
  compareState: PropTypes.string,
  dragHandleProps: PropTypes.object,
  getNames: PropTypes.func,
  groupId: PropTypes.string,
  isAnimating: PropTypes.bool,
  isMobile: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  layers: PropTypes.array,
  layerSplit: PropTypes.number,
  numVisible: PropTypes.number,
  projId: PropTypes.string,
  reorderLayers: PropTypes.func,
  toggleCollapse: PropTypes.func,
  toggleVisibility: PropTypes.func,
  title: PropTypes.string,
  zots: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => {
  const {
    embed, proj, config, map, animation, screenSize, charting,
  } = state;
  const isChartingActive = charting.active;
  const activeChartingLayer = charting.activeLayer;
  const { isEmbedModeActive } = embed;
  const zots = lodashGet(map, 'ui.selected')
    ? getZotsForActiveLayers(state)
    : {};
  let activeLayers = getActiveLayers(state);
  if (isEmbedModeActive) {
    activeLayers = activeLayers.filter((layer) => layer.layergroup !== 'Reference');
  }
  const numVisible = (ownProps.layers || []).filter(({ visible }) => visible).length;
  return {
    zots,
    isEmbedModeActive,
    isMobile: screenSize.isMobileDevice,
    activeLayers,
    projId: proj.id,
    getNames: (layerId) => getTitles(config, layerId, proj.id),
    available: (layerId) => availableSelector(state)(layerId),
    numVisible,
    isAnimating: animation.isPlaying,
    isChartingActive,
    activeChartingLayer,
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderLayers: (newLayerArray) => {
    dispatch(reorderLayersAction(newLayerArray));
  },
  removeGroup: (layerIds) => {
    dispatch(removeGroupAction(layerIds));
  },
  toggleVisibility: (layerIds, visible) => {
    dispatch(toggleGroupVisibilityAction(layerIds, visible));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerList);
