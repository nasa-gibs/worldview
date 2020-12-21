import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import { get as lodashGet } from 'lodash';
import LayerRow from './layer-row';
import GroupSettings from '../../components/layer/settings/group-settings';
import {
  replaceSubGroup,
  getZotsForActiveLayers,
  getTitles,
  getActiveLayers,
  memoizedAvailable as availableSelector,
} from '../../modules/layers/selectors';
import {
  reorderLayers as reorderLayersAction,
  removeLayer as removeLayerAction,
  toggleVisibility as toggleVisibilityAction,
} from '../../modules/layers/actions';
import { toggleCustomContent } from '../../modules/modal/actions';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function LayerList(props) {
  const {
    compareState,
    reorderLayers,
    layerSplit,
    activeLayers,
    layers,
    zots,
    projId,
    getNames,
    available,
    groupId,
    title,
    removeLayers,
    toggleVisibility,
    launchOpacityModal,
  } = props;

  const [collapsed, toggleCollapse] = useState(false);
  const groupLayerIds = layers.map(({ id }) => id);

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
        isInProjection={!!projections[projId]}
        key={id}
        index={index}
        layerClasses="item productsitem"
        zot={zots[id]}
        names={getNames(id)}
        isDisabled={!available(id)}
        isVisible={visible}
      />
    );
  };

  const renderDropdownMenu = () => (
    <UncontrolledDropdown className="layer-group-more-options">
      <DropdownToggle>
        <FontAwesomeIcon
          className="layer-group-more"
          icon="ellipsis-v"
        />
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem onClick={() => toggleVisibility(groupLayerIds, true)}>
          Show All Layers
        </DropdownItem>
        <DropdownItem onClick={() => toggleVisibility(groupLayerIds, false)}>
          Hide All Layers
        </DropdownItem>
        <DropdownItem onClick={() => launchOpacityModal(groupLayerIds, title)}>
          Set Opacity
        </DropdownItem>
        <DropdownItem onClick={() => removeLayers(groupLayerIds)}>
          Remove Group
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );

  return (
    <div className="layer-group-case">
      <h3 className="layer-group-title">{`${title} (${layers.length})`}</h3>

      <div className="layer-group-icons">
        {renderDropdownMenu()}

        <FontAwesomeIcon
          className="layer-group-collapse"
          icon={!collapsed ? 'caret-down' : 'caret-left'}
          onClick={() => toggleCollapse(!collapsed)}
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {!collapsed && (
          <Droppable
            droppableId={`${compareState}-${groupId}`}
            type={`layerGroup${groupId}`}
            direction="vertical"
          >
            {(provided, snapshot) => (
              <ul
                className="category"
                ref={provided.innerRef}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...provided.droppableProps}
              >
                {layers.map(renderLayer)}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        )}
      </DragDropContext>
    </div>
  );
}

LayerList.propTypes = {
  activeLayers: PropTypes.array,
  available: PropTypes.func,
  getNames: PropTypes.func,
  groupId: PropTypes.string,
  compareState: PropTypes.string,
  layers: PropTypes.array,
  layerSplit: PropTypes.number,
  projId: PropTypes.string,
  reorderLayers: PropTypes.func,
  runningLayers: PropTypes.object,
  removeLayers: PropTypes.func,
  toggleVisibility: PropTypes.func,
  launchOpacityModal: PropTypes.func,
  title: PropTypes.string,
  zots: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => {
  const { proj, config, map } = state;
  const zots = lodashGet(map, 'ui.selected')
    ? getZotsForActiveLayers(state)
    : {};
  return {
    zots,
    activeLayers: getActiveLayers(state),
    projId: proj.id,
    getNames: (layerId) => getTitles(config, layerId, proj.id),
    available: (layerId) => availableSelector(state)(layerId),
  };
};

const mapDispatchToProps = (dispatch) => ({
  reorderLayers: (newLayerArray) => {
    dispatch(reorderLayersAction(newLayerArray));
  },
  removeLayers: (layerIds) => {
    layerIds.forEach((id) => {
      dispatch(removeLayerAction(id));
    });
  },
  toggleVisibility: (layerIds, visible) => {
    layerIds.forEach((id) => {
      dispatch(toggleVisibilityAction(id, visible));
    });
  },
  launchOpacityModal: (layers, title) => {
    const key = `LAYER_INFO_MODAL-${title}`;
    dispatch(
      toggleCustomContent(key, {
        headerText: title || 'Layer Options',
        backdrop: false,
        bodyComponent: GroupSettings,
        bodyComponentProps: {
          layers,
        },
        // Using clickableBehindModal: true here causes an issue where switching sidebar
        // tabs does not close this modal
        wrapClassName: 'clickable-behind-modal',
        modalClassName: ' layer-info-settings-modal layer-settings-modal',
        timeout: 150,
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerList);
