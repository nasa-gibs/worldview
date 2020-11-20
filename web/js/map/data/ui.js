import lodashSize from 'lodash/size';
import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import googleTagManager from 'googleTagManager';
import * as olExtent from 'ol/extent';
import { dataHandlerGetByName } from './handler';
import dataMap from './map';
import uiIndicator from '../../ui/indicator';
import util from '../../util/util';
import wvui from '../../ui/ui';
import {
  REL_DATA, REL_METADATA, REL_BROWSE, DATA_EXTS,
} from './cmr';
import * as DATA_CONSTANTS from '../../modules/data/constants';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../../modules/sidebar/constants';
import { toggleGranule } from '../../modules/data/actions';
import { SELECT_DATE } from '../../modules/date/constants';
import { LOCATION_POP_ACTION } from '../../redux-location-state-customs';
import { getActiveLayers, getAllActiveLayers } from '../../modules/layers/selectors';
import { getDataProductsFromActiveLayers, doesSelectedExist } from '../../modules/data/selectors';
import * as LAYER_CONSTANTS from '../../modules/layers/constants';
import { CHANGE_PROJECTION } from '../../modules/projection/constants';
import { faIconInfoCircleSVGDomEl } from '../fa-map-icons';

export default function dataUi(store, ui, config) {
  let queryActive = false;
  let mapController = null;
  let selectionListPanel = null;
  let downloadListPanel = null;
  let lastResults = null;
  const maps = ui.map;
  let queryExecuting = false;
  let nextQuery = null;

  const indicators = {
    query: null,
    noneInView: null,
    noResults: null,
  };

  const self = {};
  self.events = util.events();
  self.EVENT_QUERY = 'query';
  self.EVENT_QUERY_RESULTS = 'queryResults';
  self.EVENT_QUERY_CANCEL = 'queryCancel';
  self.EVENT_QUERY_ERROR = 'queryError';
  self.EVENT_QUERY_TIMEOUT = 'queryTimeout';
  self.selector = '#wv-data';
  self.id = 'wv-data';

  const subscribeToStore = function(action) {
    switch (action.type) {
      case CHANGE_PROJECTION:
        return changeProjection();
      case LOCATION_POP_ACTION:
      case CHANGE_SIDEBAR_TAB:
        return action.activeTab === 'download' ? onActivate() : mapController ? onDeactivate() : '';
      case DATA_CONSTANTS.DATA_GET_DATA_CLICK:
        return self.showDownloadList();
      case DATA_CONSTANTS.DATA_GRANULE_SELECT:
        self.events.trigger('granuleSelect', action.granule);
        return updateSelection();
      case DATA_CONSTANTS.DATA_GRANULE_UNSELECT:
        self.events.trigger('granuleUnselect', action.granule);
        return updateSelection();
      case LAYER_CONSTANTS.REMOVE_LAYER:
      case LAYER_CONSTANTS.REMOVE_GROUP:
      case LAYER_CONSTANTS.RESET_LAYERS:
      case LAYER_CONSTANTS.ADD_LAYER:
      case LAYER_CONSTANTS.REORDER_LAYERS:
      case LAYER_CONSTANTS.ADD_LAYERS_FOR_EVENT:
        return updateLayers();
      case SELECT_DATE:
      case DATA_CONSTANTS.SELECT_PRODUCT:
        return query();
      default:
        break;
    }
  };
  const changeProjection = function() {
    updateLayers();
    query();
    self.events.trigger('projectionUpdate');
  };
  const updateLayers = function() {
    const state = store.getState();
    const { proj, data } = state;
    const activeLayers = getAllActiveLayers(state);

    // If a layer was removed and the product no longer exists,
    // remove any selected items in that product
    // FIXME: This is a hack for now and should be cleaned up when
    // everything changes to models.
    const products = getDataProductsFromActiveLayers(activeLayers, config, proj.id);
    lodashEach(data.selectedGranules, (selected) => {
      const { product } = selected;
      if (!products[product] && !lodashFind(getActiveLayers(state), { product })) {
        store.dispatch(toggleGranule(selected));
      }
    });
  };
  const query = function() {
    const state = store.getState();
    const dataState = state.data;
    const { proj } = state;
    const activeLayers = getAllActiveLayers(state);
    if (state.sidebar.activeTab !== 'download') {
      return;
    }
    const products = getDataProductsFromActiveLayers(
      activeLayers,
      config,
      proj.id,
    );
    if (!dataState.selectedProduct || (dataState.selectedProduct && !doesSelectedExist(Object.entries(products), dataState.selectedProduct))) {
      self.events.trigger(self.EVENT_QUERY_RESULTS, {
        meta: {},
        granules: [],
      });
      return;
    }

    const productConfig = config.products[dataState.selectedProduct];
    if (!productConfig) {
      throw Error(`Product not defined: ${dataState.selectedProduct}`);
    }

    const handlerFactory = dataHandlerGetByName(productConfig.handler);
    const handler = handlerFactory(config, store);
    handler.events
      .on('query', () => {
        self.events.trigger(self.EVENT_QUERY);
      })
      .on('results', (results) => {
        queryExecuting = false;
        if (self.active && !nextQuery) {
          self.events.trigger(self.EVENT_QUERY_RESULTS, results);
        }
        if (nextQuery) {
          const q = nextQuery;
          nextQuery = null;
          executeQuery(q);
        }
      })
      .on('error', (textStatus, errorThrown) => {
        queryExecuting = false;
        if (self.active) {
          self.events.trigger(self.EVENT_QUERY_ERROR, textStatus, errorThrown);
        }
      })
      .on('timeout', () => {
        queryExecuting = false;
        if (self.active) {
          self.events.trigger(self.EVENT_QUERY_TIMEOUT);
        }
      });
    executeQuery(handler);
  };

  const executeQuery = function(handler) {
    if (!queryExecuting) {
      try {
        queryExecuting = true;
        handler.submit();
      } catch (error) {
        queryExecuting = false;
        throw error;
      }
    } else {
      nextQuery = handler;
    }
  };
  const init = function() {
    ui.events.on('last-action', subscribeToStore);
    ui.map.events.on('extent', self.onViewChange);
    self.events.on('query', onQuery)
      .on('queryResults', (results) => {
        onQueryResults(results);
        self.onViewChange(results);
      })
      .on('queryError', onQueryError)
      .on('queryTimeout', onQueryTimeout);
  };
  self.onViewChange = function(results) {
    results = results || lastResults;
    const state = store.getState();
    const map = ui.map.selected;
    if (!state.data.active || queryActive || !results) {
      return;
    }
    if (results.granules.length === 0) {
      return;
    }
    let hasCentroids = false;
    let inView = false;
    const extent = map.getView().calculateExtent(map.getSize());
    const { crs } = state.proj.selected;
    lodashEach(results.granules, (granule) => {
      if (granule.centroid && granule.centroid[crs]) {
        hasCentroids = true;
        if (olExtent.intersects(extent, granule.centroid[crs].getExtent())) {
          inView = true;
          return true;
        }
      }
    });
    uiIndicator.hide(indicators.noneInView);
    if (hasCentroids && !inView) {
      indicators.noneInView = uiIndicator.show('Zoom out or move map');
    }
  };
  const updateSelection = function() {
    if (downloadListPanel && downloadListPanel.visible()) {
      downloadListPanel.refresh();
    }
  };
  const onActivate = function() {
    self.active = true;
    self.events.trigger('activate');
    if (!mapController) {
      mapController = dataMap(store, maps, self, ui);
    }
    query();
  };
  self.onActivate = onActivate;

  const onDeactivate = function() {
    self.active = false;
    uiIndicator.hide(indicators);
    if (selectionListPanel) {
      selectionListPanel.hide();
    }
    if (downloadListPanel) {
      downloadListPanel.hide();
    }
    mapController.dispose();
  };

  const onQuery = function() {
    queryActive = true;
    indicators.query = uiIndicator.searching(indicators);
    if (selectionListPanel) {
      selectionListPanel.hide();
    }
    if (downloadListPanel) {
      downloadListPanel.hide();
    }
  };

  const onQueryResults = function(results) {
    const dataState = store.getState().data;
    if (selectionListPanel) {
      selectionListPanel.hide();
      selectionListPanel = null;
    }
    queryActive = false;
    lastResults = results;
    uiIndicator.hide(indicators);
    let hasResults = true;
    if (dataState.selectedProduct !== null && results.granules.length === 0) {
      indicators.noData = uiIndicator.noData(indicators);
      hasResults = false;
    }
    if (results.meta.showList && hasResults) {
      selectionListPanel = dataUiSelectionListPanel(self, results, store);
      selectionListPanel.show();
    }
  };

  const onQueryError = function(status, error) {
    queryActive = false;
    uiIndicator.hide(indicators);
    if (status !== 'abort') {
      console.error('Unable to search', status, error);
      wvui.notify(
        'Unable to search at this time.<br/><br/>Please try again later.',
      );
    }
  };

  const onQueryTimeout = function() {
    queryActive = false;
    uiIndicator.hide(indicators);
    wvui.notify(
      'No results received yet. This may be due to a '
      + 'connectivity issue. Please try again later.',
    );
  };

  self.showDownloadList = function() {
    if (selectionListPanel) {
      selectionListPanel.setVisible(false);
    }
    if (!downloadListPanel) {
      downloadListPanel = dataUiDownloadListPanel(config, store);
      downloadListPanel.events.on('close', () => {
        if (selectionListPanel) {
          selectionListPanel.setVisible(true);
        }
      });
    }
    downloadListPanel.show();
  };

  self.showUnavailableReason = function() {
    const headerMsg = "<h3 class='wv-data-unavailable-header'>Why are these layers not available for downloading?</h3>";
    const bodyMsg = 'Some layers in Worldview do not have corresponding source data products available for download.  These include National Boundaries, Orbit Tracks, Earth at Night, and MODIS Corrected Reflectance products.<br><br>For a downloadable product similar to MODIS Corrected Reflectance, please try the MODIS Land Surface Reflectance layers available in Worldview.  If you would like to generate MODIS Corrected Reflectance imagery yourself, please see the following document: <a href="https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf" target="_blank">https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf</a><br><br>If you would like to download only an image, please use the "camera" icon in the upper right.<br><br> Data download will not work for "Terra and Aqua" Fires, select Terra only Fires and/or Aqua only Fires to download the associated data files.';

    wvui.notify(headerMsg + bodyMsg, 'Notice', 600);
  };

  init();
  return self;
}

const dataUiBulkDownloadPage = (function() {
  const ns = {};
  const pages = {
    wget: 'pages/wget.html',
    curl: 'pages/curl.html',
  };

  ns.show = function(selection, type) {
    const nonce = Date.now();
    const page = window.open(`${pages[type]}?v=${nonce}`, `Worldview_${nonce}`);

    let loaded = false;
    page.onload = function() {
      if (!loaded) {
        fillPage(page, selection, type);
        loaded = true;
      }
    };
    let checkCount = 0;
    const timer = setInterval(() => {
      checkCount += 1;
      if (loaded) {
        clearInterval(timer);
        return;
      }
      if (checkCount > 20) {
        clearInterval(timer);
        return;
      }
      if (fillPage(page, selection, type)) {
        loaded = true;
        clearInterval(timer);
      }
    }, 100);
  };

  const fillPage = function(page, selection, type) {
    const downloadLinks = [];
    const hosts = {};
    const indirectLinks = [];
    $.each(selection, (index, product) => {
      $.each(product.list, (index2, granule) => {
        let netrc = '';
        if (granule.urs) {
          netrc = '--netrc ';
        }
        $.each(granule.links, (index2, link) => {
          if (!link.data) {
            return;
          }
          if (product.noBulkDownload) {
            indirectLinks.push(
              `<li><a href='${link.href}'>${link.href}</a></li>`,
            );
            return;
          }
          if (type === 'curl') {
            downloadLinks.push(`curl --remote-name ${netrc}${link.href}`);
          } else {
            downloadLinks.push(link.href);
          }
          if (granule.urs) {
            // Get the hostname from the URL, the text between
            // the double slash and the first slash after that
            const host = /\/\/([^/]*)\//.exec(link.href);
            if (host) {
              hosts[host[1]] = true;
            }
          }
        });
      });
    });
    const links = page.document.getElementById('links');
    if (!links) return false;
    links.innerHTML = `<pre>${downloadLinks.join('\n')}</pre>`;

    const netrcEntries = [];
    const hostnames = [];
    $.each(hosts, (host) => {
      netrcEntries.push(
        `machine ${host} login URS_USER password URS_PASSWORD`,
      );
      hostnames.push(host);
    });
    if (netrcEntries.length > 0) {
      page.document.getElementById('netrc').innerHTML = `<pre>${netrcEntries.join('\n')}</pre>`;
      page.document.getElementById('bulk-password-notice').style.display = 'block';
      page.document.getElementById('netrc-instructions').style.display = 'block';
      const instructions = page.document.getElementById(
        'fdm-password-instructions',
      );
      if (instructions) {
        instructions.style.display = 'block';
      }
      const machineNames = page.document.getElementById('fdm-machine-names');
      if (machineNames) {
        machineNames.innerHTML = `<pre>${hostnames.join('\n')}</pre>`;
      }
    }
    if (indirectLinks.length > 0) {
      page.document.getElementById('indirect-instructions').style.display = 'block';
      page.document.getElementById('indirect').innerHTML = `<ul>${indirectLinks.join('\n')}</ul>`;
    }
    return true;
  };

  return ns;
}());

const dataUiDownloadListPanel = function(config, store) {
  const NOTICE = `<div id='wv-data-selection-notice'>${
    faIconInfoCircleSVGDomEl
  }<p class='text'>`
    + 'Some items you have selected require a profile with '
    + 'Earthdata Login to download. '
    + 'It is simple and free to sign up! '
    + '<a href=\'https://urs.earthdata.nasa.gov/users/new\' target=\'urs\'>'
    + 'Click to register for a profile.</a>'
    + '</p>'
    + '</div>';

  let selection;
  const self = {};
  let urs = false;
  let $dialog;

  self.events = util.events();

  self.show = function() {
    $dialog = wvui.getDialog().attr('id', 'wv-data-selection');

    $dialog.dialog({
      title: 'Download Links',
      width: 650,
      height: 500,
      autoOpen: false,
      closeText: '',
    });
    const $bottomPane = $('<div></div>')
      .attr('id', 'wv-data-bulk-download-links')
      .addClass('ui-dialog-buttonpane')
      .addClass('ui-widget-content')
      .addClass('ui-helper-clearfix')
      .html(bulkDownloadText());
    $('#wv-data-selection').after($bottomPane);
    $('.ui-dialog .ui-dialog-titlebar-close').attr('tabindex', -1);

    $dialog.dialog('open');

    $('a.wget').click(showWgetPage);
    $('a.curl').click(showCurlPage);

    $dialog.on('dialogclose', () => {
      self.events.trigger('close');
    });
    self.refresh();
  };

  self.refresh = function() {
    const dataState = store.getState().data;
    selection = reformatSelection(dataState);
    $('#wv-data-selection').html(bodyText(selection));
    const bulkVisible = isBulkDownloadable() && lodashSize(dataState.selectedGranules) !== 0;
    if (bulkVisible) {
      $('wv-data-bulk-download-links').show();
    } else {
      $('wv-data-bulk-download-links').hide();
    }
    $('#wv-data-selection .remove').click(removeGranule);
    $('#wv-data-selection tr').on('mouseenter', onHoverOver);
    $('#wv-data-selection tr').on('mouseleave', onHoverOut);
  };

  self.hide = function() {
    const $d = $('.ui-dialog');
    if ($d.length !== 0) {
      $d.hide();
    }
  };

  self.visible = function() {
    const $d = $('.ui-dialog');
    if ($d.length !== 0) {
      return $d.is(':visible');
    }
    return false;
  };

  const reformatSelection = function(dataState) {
    const selection = {};

    urs = false;
    $.each(dataState.selectedGranules, (key, granule) => {
      if (granule.urs) {
        urs = true;
      }
      if (!selection[granule.product]) {
        const productConfig = config.products[granule.product];
        selection[granule.product] = {
          name: productConfig.name,
          granules: [granule],
          counts: {},
          noBulkDownload: productConfig.noBulkDownload || false,
        };
      } else {
        selection[granule.product].granules.push(granule);
      }

      const product = selection[granule.product];

      // For each link that looks like metadata, see if that link is
      // repeated in all granules for that product. If so, we want to
      // bump that up to product level instead of at the granule level.
      $.each(granule.links, (index, link) => {
        // Formerly relied on metadata being correctly marked as data
        // via the cmr.REL_DATA constant;  unfortunately this wasn't
        // the case in practice so the following workaround was
        // implemented to check the link's file extension to see if
        // it looks like a data file
        let hrefExt = link.href
          .toLowerCase()
          .split('.')
          .slice(-1);
        if (hrefExt && hrefExt.length > 0) {
          // eslint-disable-next-line prefer-destructuring
          hrefExt = hrefExt[0];
        }
        if (
          (DATA_EXTS.indexOf(hrefExt) === -1 && link.rel !== REL_BROWSE)
          || link.rel === REL_METADATA
        ) {
          if (!product.counts[link.href]) {
            product.counts[link.href] = 1;
          } else {
            product.counts[link.href] += 1;
          }
        }
      });
    });

    $.each(selection, (key, product) => {
      product.links = [];
      product.list = [];

      // Some links found in a granule are not specific to that granule
      // and appear for every entry. If that is the case, hoist it up
      // to the product level instead. Every link in the results
      // are counted and this is true if the number of appearances is the
      // same as the number of granules. This check cannot be done
      // if there is only one granule returned.
      //
      // The code below checks for when the modulus is zero instead of
      // checking for equality. Not sure why this is the case but it
      // is probably important? Is there a case when a link appears
      // every other granule instead?
      if (product.granules.length > 1) {
        const granule = product.granules[0];
        $.each(granule.links, (index, link) => {
          const count = product.counts[link.href];
          if (count % product.granules.length === 0) {
            product.links.push(reformatLink(link));
          }
        });
      }

      $.each(product.granules, (index, granule) => {
        const item = {
          id: granule.id,
          label: granule.downloadLabel || granule.label,
          links: [],
          urs: granule.urs,
        };
        $.each(granule.links, (index, link) => {
          // Skip this link if now at the product level
          const count = product.counts[link.href];
          if (count % product.granules.length === 0 && count !== 1) {
            return;
          }
          // Skip browse images per Kevin's request
          if (link.rel === REL_BROWSE) {
            return;
          }
          item.links.push(reformatLink(link));
        });
        product.list.push(item);
      });
      product.list.sort((a, b) => {
        if (a.label > b.label) {
          return 1;
        }
        if (a.label < b.label) {
          return -1;
        }
        return 0;
      });
    });

    return selection;
  };

  const isBulkDownloadable = function() {
    let result = false;
    $.each(selection, (index, product) => {
      if (!product.noBulkDownload) {
        result = true;
      }
    });
    return result;
  };

  const reformatLink = function(link) {
    // For title, take it if found, otherwise, use the basename of the URI
    let titleVal = link.title;
    if (!link.title) {
      titleVal = link.href.split('/').slice(-1);

      // Handle special case where link is a directory which ends with /
      if (titleVal && titleVal.length && titleVal[0] === '') {
        titleVal = link.href;
      }
    }

    return {
      href: link.href,
      title: titleVal,
      data: link.rel === REL_DATA,
    };
  };

  const linksText = function(links) {
    const elements = [];
    elements.push('<ul>');
    $.each(links, (index, link) => {
      elements.push(
        `<li class='link'><a href='${
          link.href
        }' target='_blank'>${
          link.title
        }</a></li>`,
      );
    });
    elements.push('</ul>');
    return elements.join('\n');
  };

  const granuleText = function(product, granule) {
    let elements;
    if (product.name !== granule.label) {
      elements = [
        `<tr data-granule='${granule.id}'>`,
        `${"<td><input type='button' class='remove' "
        + "data-granule='"}${
          granule.id
        }' `
        + 'value=\'X\'></input></td>',
        `<td><nobr><ul><li>${granule.label}</li></ul></nobr></td>`,
        `<td class='wv-data-granule-link'>${
          linksText(granule.links)
        }</td>`,
        '</tr>',
      ];
    } else {
      elements = [
        `<tr data-granule='${granule.id}'>`,
        `${"<td><input type='button' class='remove' "
        + "data-granule='"}${
          granule.id
        }' `
        + 'value=\'X\'></input></td>',
        `<td colspan='2'>${linksText(granule.links)}</td>`,
        '</tr>',
      ];
    }
    return elements.join('\n');
  };

  const productText = function(product) {
    const elements = [`<h3>${product.name}</h3>`];

    elements.push('<h5>Selected Data</h5>');
    elements.push('<table>');

    $.each(product.list, (index, item) => {
      elements.push(granuleText(product, item));
    });
    elements.push('</table>');

    if (product.links && product.links.length > 0) {
      elements.push('<h5>Data Collection Information</h5>');
      elements.push("<div class='product'>");
      elements.push(linksText(product.links));
      elements.push('</div>');
    }

    return elements.join('\n');
  };

  const bodyText = function() {
    const dataState = store.getState().data;

    if (lodashSize(dataState.selectedGranules) === 0) {
      return '<br/><h3>Selection Empty</h3>';
    }
    const elements = [];
    if (urs) {
      elements.push(NOTICE);
    }
    const products = [];
    $.each(selection, (key, product) => {
      products.push(productText(product));
    });
    elements.push(products.join('<br/><br/><br/>'));
    const text = elements.join('');
    return text;
  };

  const bulkDownloadText = function() {
    const bulk = "<div class='bulk'>"
      + '<h5>Bulk Download</h5>'
      + "<ul class='BulkDownload'>"
      + "<li><a class='link wget'>List of Links</a>: "
      + 'for wget or download managers that accept a list of '
      + 'URLs</li>'
      + "<li><a class='link curl'>List of cURL Commands</a>: "
      + 'can be copied and pasted to '
      + 'a terminal window to download using cURL.</li>'
      + '</ul>'
      + '</div>';
    return bulk;
  };

  const showWgetPage = function() {
    googleTagManager.pushEvent({
      event: 'data_download_list_wget',
    });
    dataUiBulkDownloadPage.show(selection, 'wget');
  };

  const showCurlPage = function() {
    googleTagManager.pushEvent({
      event: 'data_download_list_curl',
    });
    dataUiBulkDownloadPage.show(selection, 'curl');
  };

  const removeGranule = function() {
    const id = $(this).attr('data-granule');
    const dataState = store.getState().data;
    store.dispatch(toggleGranule(dataState.selectedGranules[id]));
    onHoverOut.apply(this);
  };

  const onHoverOver = function() {
    const dataState = store.getState().data;
    self.events.trigger(
      'hoverOver',
      dataState.selectedGranules[$(this).attr('data-granule')],
    );
  };

  const onHoverOut = function() {
    const dataState = store.getState().data;
    self.events.trigger(
      'hoverOut',
      dataState.selectedGranules[$(this).attr('data-granule')],
    );
  };

  return self;
};

const dataUiSelectionListPanel = function(dataUi, results, store) {
  const self = {};
  const granules = {};
  let $dialog;
  const init = function() {
    dataUi.events.on('granuleUnselect', onGranuleUnselect);
  };

  self.show = function() {
    $dialog = wvui.getDialog('wv-data-list');
    $dialog
      .attr('id', 'wv-data-list')
      .html(bodyText())
      .dialog({
        title: 'Select data',
        width: 400,
        height: 400,
        closeText: '',
      });
    $('button.ui-dialog-titlebar-close').hide();

    $.each(results.granules, (index, granule) => {
      granules[granule.id] = granule;
    });
    $('#wv-data-list input').on('click', toggleSelection);
  };

  self.hide = function() {
    const $d = $('.ui-dialog');
    if ($d.length !== 0) {
      $d.hide();
    }
  };

  self.visible = function() {
    const $d = $('.ui-dialog');
    if ($d.length !== 0) {
      return $d.is(':visible');
    }
    return false;
  };

  self.setVisible = function(value) {
    if (!value) {
      self.hide();
    } else {
      self.show();
    }
  };

  const resultsText = function() {
    const elements = [];
    const dataState = store.getState().data;
    $.each(results.granules, (index, granule) => {
      const selected = dataState.selectedGranules[granule.id] ? "checked='true'" : '';
      elements.push(
        `${'<tr>'
        + '<td>'
        + "<input type='checkbox' value='"}${
          granule.id
        }' ${
          selected
        }>`
        + '</td>'
        + `<td class='label'>${
          granule.label
        }</td>`
        + '</tr>',
      );
    });
    const text = elements.join('\n');
    return text;
  };

  const bodyText = function() {
    const elements = ["<div'>", '<table>', resultsText(), '</table>', '</div>'];
    const text = `${elements.join('\n')}<br/>`;
    return text;
  };

  const toggleSelection = function() {
    const granule = granules[$(this).attr('value')];
    store.dispatch(toggleGranule(granule));
  };

  const onGranuleUnselect = function(granule) {
    $(`#wv-data-list input[value='${granule.id}']`).removeAttr('checked');
  };

  init();
  return self;
};
