/* eslint-disable react/jsx-props-no-spreading */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import { get as lodashGet } from 'lodash';
import LayerRow from './layer-row';
import util from '../../util/util';
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

  const orderedLayers = [...layers]
    .sort((layerA, layerB) => {
      const shouldHideLayerB = layerB.shouldHide ? -1 : 1;
      const shouldHideLayers = layerB.shouldHide === layerA.shouldHide
        ? 0
        : shouldHideLayerB;
      return isChartingActive
        ? shouldHideLayers
        : 0;
    });

  const sortableLayerIds = orderedLayers
    .map((layer) => `${util.encodeId(layer.id)}-${compareState}`);

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

  // Prevent pointer/mouse events on controls from bubbling up and activating group drag.
  const stopDndActivation = (e) => {
    if (e?.nativeEvent?.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
  };

  /**
   * Update Layer order after drag
   * @param {Object} result | Result of layer drag
   */
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceIndex = sortableLayerIds.indexOf(active.id);
    const destinationIndex = sortableLayerIds.indexOf(over.id);
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) return;

    const regex = new RegExp(`-${compareState}$`);
    const layerId = `${active.id}`.replace(regex, '');
    const newLayerArray = arrayMove(orderedLayers, sourceIndex, destinationIndex);

    // In the new ordering, find the layer right after the layer that just
    // moved. Leave null if moved to the end of the list.
    let nextLayerId = null;
    const nextIndex = destinationIndex + 1;
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
      <DropdownToggle
        onPointerDown={stopDndActivation}
        onMouseDown={stopDndActivation}
      >
        <FontAwesomeIcon
          className="layer-group-more"
          icon="ellipsis-v"
          widthAuto
        />
      </DropdownToggle>
      <DropdownMenu onPointerDown={stopDndActivation} onMouseDown={stopDndActivation}>
        <DropdownItem
          id="show-all"
          onPointerDown={stopDndActivation}
          onMouseDown={stopDndActivation}
          onClick={() => toggleVisibility(groupLayerIds, true)}
        >
          Show All Layers
        </DropdownItem>
        <DropdownItem
          id="hide-all"
          onPointerDown={stopDndActivation}
          onMouseDown={stopDndActivation}
          onClick={() => toggleVisibility(groupLayerIds, false)}
        >
          Hide All Layers
        </DropdownItem>
        <DropdownItem
          id="remove-group"
          onPointerDown={stopDndActivation}
          onMouseDown={stopDndActivation}
          onClick={() => removeGroup(groupLayerIds)}
        >
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
            onPointerDown={stopDndActivation}
            onMouseDown={stopDndActivation}
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

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={sortableLayerIds}
          strategy={verticalListSortingStrategy}
        >
          <ul className={collapsed ? 'category hidden' : 'category'}>
            {orderedLayers.map(renderLayer)}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

LayerList.propTypes = {
  activeChartingLayer: PropTypes.string,
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  available: PropTypes.func,
  collapsed: PropTypes.bool,
  compareState: PropTypes.string,
  dragHandleProps: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  getNames: PropTypes.func,
  groupId: PropTypes.string,
  isAnimating: PropTypes.bool,
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  layers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  layerSplit: PropTypes.number,
  numVisible: PropTypes.number,
  projId: PropTypes.string,
  removeGroup: PropTypes.func,
  reorderLayers: PropTypes.func,
  toggleCollapse: PropTypes.func,
  toggleVisibility: PropTypes.func,
  title: PropTypes.string,
  zots: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
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
