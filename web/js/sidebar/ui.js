import 'jquery-ui-bundle/jquery-ui';
import lodashFind from 'lodash/find';
import lodashDebounce from 'lodash/debounce';
import util from '../util/util';
import Sidebar from '../components/sidebar/sidebar';
import React from 'react';
import ReactDOM from 'react-dom';
import { getCompareObjects } from '../compare/util';
import { getCheckerboard } from '../palettes/util';
import { layersOptions } from '../layers/options';
import { layersInfo } from '../layers/info';
import { getZotsForActiveLayers } from '../layers/util';
import { timelineDataHightlight } from '../date/util';
import wvui from '../ui/ui';
import googleTagManager from 'googleTagManager';

export function sidebarUi(models, config, ui) {
  var isCollapsed = false;
  var activeTab = 'layers';
  var self = {};
  var model = models.layers;
  var compareObj = {};
  var compareModeType = 'swipe';

  self.events = util.events();

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(Sidebar, getInitialProps()),
      document.getElementById('wv-sidebar')
    );

    var debounceUpdateData = lodashDebounce(updateData, 300, { leading: true });
    var debounceUpdateEventsList = lodashDebounce(updateEventsList, 300, {
      leading: true,
      trailing: true
    });
    var layerAdd = function(layer) {
      if (!ui.tour.resetting && !ui.naturalEvents.selecting) {
        updateLayers();
      }
    };

    // Set Event Listeners
    if (models.data) {
      models.data.events
        .on('activate', () => {
          self.selectTab('download');
          debounceUpdateData();
        })
        .on('productSelect', onProductSelect)
        .on('layerUpdate', debounceUpdateData)
        .on('granuleSelect', debounceUpdateData)
        .on('granuleUnselect', debounceUpdateData);
    }
    models.layers.events
      .on('add', layerAdd)
      .on('remove', updateLayers)
      .on('modal', val => {
        self.reactComponent.setState({
          modalOpen: val
        });
      })
      .on('update', updateLayers);

    ui.tour.events.on('reset', () => {
      updateLayers();
      updateData();
      updateState('isCompareMode');
    });

    models.palettes.events
      .on('set-custom', updateLayers)
      .on('clear-custom', updateLayers)
      .on('range', updateLayers)
      .on('update', updateLayers);
    if (models.naturalEvents) {
      models.naturalEvents.events
        .on('activate', () => self.selectTab('events'))
        .on('list-change', debounceUpdateEventsList)
        .on('selected-event', selected => {
          self.reactComponent.setState({ selectedEvent: selected });
          updateLayers();
        });
    }
    if (models.compare) {
      models.compare.events
        .on('toggle', () => {
          if (!ui.tour.resetting) {
            updateState('isCompareMode');
            updateState('layerObjects');
            updateState('layers');
          }
        })
        .on('toggle-state', () => {
          updateState('isCompareA');
          updateData();
        });
    }
    models.date.events.on('select', updateLayers);
    if (models.proj) {
      models.proj.events.on('select', updateLayers).on('select', () => {
        self.reactComponent.setState({ projection: models.proj.selected.id });
      });
    }
    models.map.events.on('data-running', runningLayers => {
      self.reactComponent.setState({ runningLayers: runningLayers });
    });
    $(window).resize(resize);
    ui.map.events.on(
      'zooming',
      lodashDebounce(() => {
        updateState('zotsObject', getZotsForActiveLayers(config, models, ui));
      }, 300)
    );
  };
  self.renderEvents = function() {
    self.reactComponent.setState({
      eventsData: models.naturalEvents.data,
      selectEvent: ui.naturalEvents.selectEvent,
      deselectEvent: ui.naturalEvents.deselectEvent,
      filterEventList: ui.naturalEvents.filterEventList
    });
  };
  var getInitialProps = function() {
    var compareModel;
    activeTab =
      models.naturalEvents && models.naturalEvents.active
        ? 'events'
        : models.data && models.data.active
          ? 'download'
          : 'layers';
    if (config.features.compare) {
      compareModel = models.compare;
      if (models.compare.active) {
        compareObj = getCompareObjects(models);
        compareModeType = compareModel.mode;
      }
    }
    return {
      activeTab: activeTab,
      isCompareMode:
        compareModel && compareModel.active ? compareModel.active : false,
      isCollapsed: isCollapsed,
      layers: model.get({ group: 'all' }),
      onTabClick: self.selectTab,
      toggleSidebar: toggleSidebar,
      toggleLayerVisibility: toggleLayerVisibility,
      compareFeature: config.features.compare,
      tabTypes: getActiveTabs(),
      getNames: model.getTitles,
      firstDateObject: compareObj.a,
      secondDateObject: compareObj.b,
      getAvailability: getAvailability,
      toggleComparisonObject: toggleComparisonObject,
      toggleMode: toggleComparisonMode,
      isCompareA: compareModel && compareModel.isCompareA,
      updateLayer: updateLayer,
      addLayers: onAddLayerCLick,
      comparisonType: compareModeType,
      changeCompareMode: compareModel ? compareModel.setMode : null,
      checkerBoardPattern: getCheckerboard(),
      palettePromise: models.palettes.palettePromise,
      getLegend: models.palettes.getLegends,
      replaceSubGroup: model.replaceSubGroup,
      runningLayers: null,
      selectedDataProduct: models.data ? models.data.selectedProduct : null,
      isMobile: util.browser.small,
      localStorage: util.browser.localStorage,
      zotsObject: getZotsForActiveLayers(config, models, ui),
      eventsData: { sources: [], events: [] },
      visibleEvents: { all: true },
      filterEventList: null,
      selectEvent: null,
      deselectEvent: null,
      projection:
        models.proj && models.proj.selected.id
          ? models.proj.selected.id
          : 'geographic',
      selectedEvent:
        models.naturalEvents && models.naturalEvents.selected
          ? models.naturalEvents.selected
          : {},
      getDataSelectionCounts: models.data
        ? models.data.getSelectionCounts
        : null,
      selectDataProduct: models.data ? models.data.selectProduct : null,
      showListAllButton: true,
      getDataSelectionSize: models.data ? models.data.getSelectionSize : null,
      onGetData: null,
      showDataUnavailableReason: null
    };
  };
  var updateEventsList = function(visibleEvents, showListAll) {
    self.reactComponent.setState({
      visibleEvents: visibleEvents,
      showListAllButton: showListAll
    });
  };
  var updateData = function() {
    if (!ui.tour.resetting) {
      self.reactComponent.setState({
        dataDownloadObject: models.data.groupByProducts(),
        onGetData: ui.data.showDownloadList,
        showDataUnavailableReason: ui.data.showUnavailableReason
      });
    }
  };
  /**
   * Update layer when something happens (Event listeners)
   */
  var updateLayers = function() {
    if (!ui.tour.resetting) {
      if (models.compare && models.compare.active) {
        let compareObj = getCompareObjects(models);
        return self.reactComponent.setState({
          firstDateObject: compareObj.a,
          secondDateObject: compareObj.b,
          zotsObject: getZotsForActiveLayers(config, models, ui)
        });
      } else {
        self.reactComponent.setState({
          layers: models.layers.get(
            { group: 'all', proj: models.proj.selected.id },
            models.layers[models.layers.activeLayers]
          ),
          zotsObject: getZotsForActiveLayers(config, models, ui)
        });
      }
    }
  };
  var onProductSelect = function(product) {
    self.reactComponent.setState({ selectedDataProduct: product });
  };
  var getAvailability = function(id, date, groupStr) {
    return model.available(id, date, model[groupStr]);
  };
  /**
   * Update collapse state based on window width on resize
   */
  var resize = function() {
    var state = self.reactComponent.state;
    var isMobile = state.isMobile;
    if (!isMobile && util.browser.small) {
      if (models.compare.active) toggleComparisonMode();
      self.reactComponent.setState({
        isMobile: true,
        isCollapsed: true
      });
    } else if (isMobile && !util.browser.small) {
      self.reactComponent.setState({
        isMobile: false,
        isCollapsed: state.isCollapsedRequested
      });
    }
    self.reactComponent.setState({ windowHeight: window.innerHeight });
  };
  var toggleComparisonObject = function() {
    models.compare.toggleState();
  };
  var onAddLayerCLick = function() {
    ui.addModal.open();
  };

  /**
   * Toggle A|B and init layer and date values if not already created
   */
  var toggleComparisonMode = function() {
    if (!models.layers.activeB || !models.date.selectedB) {
      if (!models.date.selectedB) {
        models.date.initCompare();
      }
      if (!models.layers.activeB) {
        models.layers.initCompare();
      }
    }
    models.compare.toggle();
  };
  var getActiveTabs = function() {
    const features = config.features;
    return {
      download: features.dataDownload,
      layers: true,
      events: features.naturalEvents
    };
  };
  /**
   * Update react component state
   * @param {String} type | State key to update
   * @param {Object} value
   */
  var updateState = function(type, value) {
    switch (type) {
      case 'isCollapsed':
        return self.reactComponent.setState({ isCollapsed: isCollapsed });
      case 'activeTab':
        return self.reactComponent.setState({ activeTab: activeTab });
      case 'layers':
        return self.reactComponent.setState({
          layers: models.layers.get(
            { group: 'all', proj: 'all' },
            models.layers[models.layers.activeLayers]
          )
        });
      case 'isCompareMode':
        return self.reactComponent.setState({
          isCompareMode: models.compare ? models.compare.active : false
        });
      case 'isCompareA': {
        return self.reactComponent.setState({
          isCompareA: models.compare ? models.compare.isCompareA : true
        });
      }
      case 'zotsObject':
        return self.reactComponent.setState({ zotsObject: value });
      case 'layerObjects':
        compareObj = getCompareObjects(models);
        return self.reactComponent.setState({
          firstDateObject: compareObj.a,
          secondDateObject: compareObj.b
        });
    }
  };
  /**
   * Force Timeline expand
   */
  self.expandNow = function() {
    isCollapsed = false;
    updateState('isCollapsed');
  };
  /**
   * Toggle sidebar collapsed state
   */
  var toggleSidebar = function() {
    isCollapsed = !isCollapsed;
    updateState('isCollapsed');
  };
  /**
   * Select a tab
   * @param {String} tab | Tab to activate
   */
  self.selectTab = function(tab) {
    if (activeTab === tab) return;
    activeTab = tab;
    wvui.close();
    self.events.trigger('selectTab', tab);
    updateState('activeTab');
  };
  /**
   * Trigger correct callback based on layer event
   * @param {String} layerId
   * @param {String} typeOfUpdate | Type of Layer event
   * @param {Boolean} value | Value related to type of event
   */
  var updateLayer = function(layerId, typeOfUpdate, value) {
    var layer;
    var layerGroupString = models.layers.activeLayers;
    var isCompareMode = models.compare && models.compare.active;

    switch (typeOfUpdate) {
      case 'remove':
        models.layers.remove(layerId, layerGroupString);
        break;
      case 'add':
        models.layers.add(layerId, {}, layerGroupString);
        break;
      case 'visibility':
        models.layers.toggleVisibility(layerId, layerGroupString);
        updateState(getStateType(isCompareMode));
        break;
      case 'info':
        googleTagManager.pushEvent({
          event: 'sidebar_layer_info'
        });
        let $infoDialog = $('#wv-layers-info-dialog');
        if (
          $infoDialog.attr('data-layer') !== layerId ||
          $infoDialog.length === 0
        ) {
          layer = lodashFind(models.layers[layerGroupString], { id: layerId });
          layersInfo(config, models, layer);
        } else {
          wvui.close();
        }

        break;
      case 'options':
        googleTagManager.pushEvent({
          event: 'sidebar_layer_options'
        });
        let $optionDialog = $('#wv-layers-options-dialog');
        if (
          $optionDialog.attr('data-layer') !== layerId ||
          $optionDialog.length === 0
        ) {
          layer = lodashFind(models.layers[layerGroupString], { id: layerId });
          layersOptions(config, models, layer, layerGroupString);
        } else {
          wvui.close();
        }

        break;
      case 'hover':
        timelineDataHightlight(layerId, value);
        break;
      default:
        updateState(getStateType(isCompareMode));
    }
  };
  var getStateType = function(isCompareActive) {
    return isCompareActive ? 'layers' : 'layerObjects';
  };
  /**
   * Update visibility of layer (on eye click)
   * @param {String} layerId
   * @param {Boolean} isVisible
   */
  var toggleLayerVisibility = function(layerId, isVisible) {
    var layerGroupString = models.layers.activeLayers;
    models.layers.setVisibility(layerId, isVisible, layerGroupString);
    // Update correct layer object
    if (layerGroupString === 'active') {
      updateState('layers');
    } else {
      updateState('layerObjects');
    }
  };

  init();
  return self;
}
