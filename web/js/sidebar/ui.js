import $ from "jquery";
import "jquery-ui/dialog";
import lodashFind from "lodash/find";
import lodashDebounce from "lodash/debounce";
import util from "../util/util";
import Sidebar from "../components/sidebar/sidebar";
import React from "react";
import ReactDOM from "react-dom";
import { getCompareObjects } from "../compare/util";
import { getCheckerboard } from "../palettes/util";
import { layersOptions } from "../layers/options";
import { layersInfo } from "../layers/info";
import palettes from "../palettes/palettes";
import { getZotsForActiveLayers } from "../layers/util";
import { timelineDataHightlight } from "../date/util";
import wvui from "../ui/ui";

export function sidebarUi(models, config, ui) {
  var isCollapsed = false;
  var activeTab = "layers";
  var self = {};
  var model = models.layers;
  var compareObj = {};
  var compareModeType = "swipe";

  self.events = util.events();

  var init = function() {
    self.reactComponent = ReactDOM.render(
      React.createElement(Sidebar, getInitialProps()),
      document.getElementById("wv-sidebar")
    );

    var debounceUpdateData = lodashDebounce(updateData, 300, { leading: true });
    var debounceUpdateEventsList = lodashDebounce(updateEventsList, 300, {
      leading: true,
      trailing: true
    });
    var layerAdd = function(layer) {
      updateLayers();
      updateState("zotsObject", getZotsForActiveLayers(config, models, ui));
    };

    // Set Event Listeners
    models.data.events
      .on("activate", () => {
        self.selectTab("download");
        debounceUpdateData();
      })
      .on("productSelect", onProductSelect)
      .on("layerUpdate", debounceUpdateData)
      .on("granuleSelect", debounceUpdateData)
      .on("granuleUnselect", debounceUpdateData);
    models.layers.events
      .on("add", layerAdd)
      .on("remove", updateLayers)
      .on("update", updateLayers);

    models.palettes.events
      .on("set-custom", updateLayers)
      .on("clear-custom", updateLayers)
      .on("range", updateLayers)
      .on("update", updateLayers);
    models.naturalEvents.events
      .on("activate", () => self.selectTab("events"))
      .on("list-change", debounceUpdateEventsList)
      .on("selected-event", selected => {
        self.reactComponent.setState({ selectedEvent: selected });
      })
      .on("hasData", () => {
        self.reactComponent.setState({
          eventsData: models.naturalEvents.data,
          selectEvent: ui.naturalEvents.selectEvent,
          deselectEvent: ui.naturalEvents.deselectEvent,
          filterEventList: ui.naturalEvents.filterEventList
        });
      });
    models.compare.events
      .on("toggle", () => {
        updateState("isCompareMode");
        updateState("layerObjects");
        updateState("layers");
      })
      .on("toggle-state", () => {
        updateState("isCompareA");
      });
    models.date.events.on("select", updateLayers);
    models.proj.events.on("select", updateLayers);
    models.map.events.on("data-running", runningLayers => {
      self.reactComponent.setState({ runningLayers: runningLayers });
    });
    $(window).resize(resize);
    ui.map.events.on(
      "zooming",
      lodashDebounce(() => {
        updateState("zotsObject", getZotsForActiveLayers(config, models, ui));
      }, 300)
    );
  };

  var getInitialProps = function() {
    var compareModel;
    activeTab = models.naturalEvents.active
      ? "events"
      : models.data.active
        ? "download"
        : "layers";
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
      layers: model.get({ group: "all" }),
      onTabClick: self.selectTab,
      toggleSidebar: toggleSidebar,
      toggleLayerVisibility: toggleLayerVisibility,
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
      changeCompareMode: compareModel.setMode,
      checkerBoardPattern: getCheckerboard(),
      palettePromise: palettePromise,
      getLegend: models.palettes.getLegends,
      replaceSubGroup: model.replaceSubGroup,
      runningLayers: null,
      selectedDataProduct: models.data.selectedProduct,
      isMobile: util.browser.small,
      localStorage: util.browser.localStorage,
      zotsObject: getZotsForActiveLayers(config, models, ui),
      eventsData: { sources: [], events: [] },
      visibleEvents: { all: true },
      filterEventList: null,
      selectEvent: null,
      deselectEvent: null,
      selectedEvent: models.naturalEvents.selected || {},
      getDataSelectionCounts: models.data.getSelectionCounts,
      selectDataProduct: models.data.selectProduct,
      showListAllButton: true,
      getDataSelectionSize: models.data.getSelectionSize,
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
    self.reactComponent.setState({
      dataDownloadObject: models.data.groupByProducts(),
      onGetData: ui.data.showDownloadList,
      showDataUnavailableReason: ui.data.showUnavailableReason
    });
  };
  var updateLayers = function() {
    if (models.compare.active) {
      updateState("layerObjects");
      updateState("zotsObject", getZotsForActiveLayers(config, models, ui));
    } else {
      updateState("layers");
      updateState("zotsObject", getZotsForActiveLayers(config, models, ui));
    }
  };
  var onProductSelect = function(product) {
    self.reactComponent.setState({ selectedDataProduct: product });
  };
  var getAvailability = function(id, date, groupStr) {
    return model.available(id, date, model[groupStr]);
  };
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
    wvui.closeDialog();
    $("#layer-modal").dialog("open");
  };

  // Need to rethink what is going on here
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
  var palettePromise = function(layerId, paletteId) {
    return new Promise((resolve, reject) => {
      if (config.palettes.rendered[paletteId]) {
        resolve();
      } else {
        palettes.loadRenderedPalette(config, layerId).done(function(result) {
          resolve(result);
        });
      }
    });
  };
  var getActiveTabs = function() {
    const features = config.features;
    return {
      download: features.dataDownload,
      layers: true,
      events: features.naturalEvents != null
    };
  };
  var updateState = function(type, value) {
    switch (type) {
      case "isCollapsed":
        return self.reactComponent.setState({ isCollapsed: isCollapsed });
      case "activeTab":
        return self.reactComponent.setState({ activeTab: activeTab });
      case "layers":
        return self.reactComponent.setState({
          layers: models.layers.get(
            { group: "all" },
            models.layers[models.layers.activeLayers]
          )
        });
      case "isCompareMode":
        return self.reactComponent.setState({
          isCompareMode: models.compare ? models.compare.active : false
        });
      case "isCompareA": {
        return self.reactComponent.setState({
          isCompareA: models.compare ? models.compare.isCompareA : true
        });
      }
      case "zotsObject":
        return self.reactComponent.setState({ zotsObject: value });
      case "layerObjects":
        compareObj = getCompareObjects(models);
        return self.reactComponent.setState({
          firstDateObject: compareObj.a,
          secondDateObject: compareObj.b
        });
    }
  };
  self.expandNow = function() {
    isCollapsed = false;
    updateState("isCollapsed");
  };
  var toggleSidebar = function() {
    isCollapsed = !isCollapsed;
    updateState("isCollapsed");
  };

  self.selectTab = function(tab) {
    if (activeTab === tab) return;
    activeTab = tab;
    self.events.trigger("selectTab", tab);
    updateState("activeTab");
  };
  var updateLayer = function(layerId, typeOfUpdate, value) {
    var layer;
    var layerGroupString = models.layers.activeLayers;
    var isCompareMode = models.compare && models.compare.active;
    switch (typeOfUpdate) {
      case "remove":
        models.layers.remove(layerId, layerGroupString);
        break;
      case "add":
        models.layers.add(layerId, {}, layerGroupString);
        break;
      case "visibility":
        models.layers.toggleVisibility(layerId, layerGroupString);
        updateState(removeLayerState(isCompareMode));
        break;
      case "info":
        layer = lodashFind(models.layers[layerGroupString], { id: layerId });
        layersInfo(config, models, layer);
        break;
      case "options":
        layer = lodashFind(models.layers[layerGroupString], { id: layerId });
        console.log(models, layer, layerGroupString);
        layersOptions(config, models, layer, layerGroupString);
        break;
      case "hover":
        timelineDataHightlight(layerId, value);
        break;
      default:
        updateState(removeLayerState(isCompareMode));
    }
  };
  var removeLayerState = function(isCompareActive) {
    return isCompareActive ? "layers" : "layerObjects";
  };
  var toggleLayerVisibility = function(layerId, isVisible) {
    var layerGroupString = models.layers.activeLayers;
    models.layers.setVisibility(layerId, isVisible, layerGroupString);
    if (layerGroupString === "active") {
      updateState("layers");
    } else {
      updateState("layerObjects");
    }
  };

  init();
  return self;
}
