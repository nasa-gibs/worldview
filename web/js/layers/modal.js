import $ from 'jquery';
import 'jquery-ui/dialog';
import 'jquery-ui/accordion';
import 'jquery-ui/button';
import 'jquery-ui/tabs';
import 'icheck';
import 'isotope-layout';
import 'perfect-scrollbar/jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import { LayerList } from 'worldview-components';
import lodashFind from 'lodash/find';
import lodashIndexOf from 'lodash/indexOf';
import lodashSortBy from 'lodash/sortBy';
import lodashStartCase from 'lodash/startCase';
import lodashValues from 'lodash/values';
import util from '../util/util';

export function layersModal(models, ui, config) {
  var crumbText;
  var model = models.layers;
  var self = {};
  self.selector = '#layer-modal';
  self.id = 'layer-modal';
  self.metadata = {};

  var $header = $(self.selector + ' header');
  var $categories = $(' #layer-categories ');
  var $selectedCategory = $(self.selector + ' #selected-category');
  var $allLayers = $(self.selector + ' #layers-all');
  var gridItemWidth = 320; // with of grid item + spacing
  var modalHeight;
  var modalWidth;
  var sizeMultiplier;
  var searchBool;
  var hasMeasurement;

  var getLayersForProjection = function (projection) {
    var filteredLayers = lodashValues(config.layers).filter(function (layer) {
      // Only use the layers for the active projection
      return layer.projections[projection];
    }).map(function (layer) {
      // If there is metadata for the current projection, use that
      var projectionMeta = layer.projections[projection];
      if (projectionMeta.title) layer.title = projectionMeta.title;
      if (projectionMeta.subtitle) layer.subtitle = projectionMeta.subtitle;
      // Decode HTML entities in the subtitle
      if (layer.subtitle) layer.subtitle = decodeHtml(layer.subtitle);
      return layer;
    });
    return lodashSortBy(filteredLayers, function (layer) {
      return lodashIndexOf(config.layerOrder, layer.id);
    });
  };

  var decodeHtml = function (html) {
    var txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  var allLayers = getLayersForProjection(models.proj.selected.id);

  var init = function () {
    model.events
    // FIXME: on "add" needs to be present without trying to add a product
      // multiple times
      // .on("add", onLayerAdded)
      .on('remove', onLayerRemoved);
    models.proj.events.on('select', drawDefaultPage);

    // Create tiles
    render();

    $(window)
      .resize(resize);
  };

  // Create container for 'by interest' filters buttons
  var $nav = $('<nav />', {
    id: 'categories-nav'
  });

  // Create container for breadcrumb
  var $breadcrumb = $('<nav />', {
    id: 'category-breadcrumb'
  });

  /**
   * var hasMeasurementSetting - Checks the (current) measurement's source
   *  for a setting and returns true if present.
   *
   * @param  {string} current The current config.measurements measurement.
   * @param  {string} source  The current measurement source.
   * @return {boolean}         Return true if the source contains settings.
   *
   */
  var hasMeasurementSetting = function (current, source) {
    var projection = models.proj.selected.id;
    var hasSetting;
    lodashValues(source.settings).forEach(function (setting) {
      var layer = config.layers[setting];
      if (layer) {
        var proj = layer.projections;
        if (layer.id === setting && Object.keys(proj).indexOf(projection) > -1) {
          if (layer.layergroup && layer.layergroup.indexOf('reference_orbits') !== -1) {
            if (current.id === 'orbital-track') {
              hasSetting = true;
            }
          // Don't output sources with only orbit tracks
          } else {
            hasSetting = true;
          }
        }
      }
    });
    return hasSetting;
  };

  /**
   * var hasMeasurementSource - Checks each (current) measurement's sources
   *  and run hasMeasurementSetting to see if these sources contain settings.
   *  If a source contains settings, also sets a hasMeasurement flag to be checked
   *  when drawing categories.
   *
   * @param  {string} current The current config.measurements measurement.
   * @return {boolean}         Return true if the measurement has sources with settings.
   */

  var hasMeasurementSource = function (current) {
    var hasSource;
    lodashValues(current.sources).forEach(function (source) {
      if (hasMeasurementSetting(current, source)) {
        hasSource = true;
        hasMeasurement = true;
      }
    });
    return hasSource;
  };

  /**
   * var checkModalView - If modalView is set, then output a console message describing
   *  which layer is being shown.
   *
   * @return {string}  Returns a console warn message.
   */
  var checkModalView = function () {
    var modalView = config.parameters.modalView;
    switch (modalView) {
      case ('categories'):
        console.warn('\'Add Layers\' view changed to Categories');
        break;
      case ('measurements'):
        console.warn('\'Add Layers\' view changed to Measurements');
        break;
      case ('layers'):
        console.warn('\'Add Layers\' view changed to Layers');
        break;
      case undefined:
        break;
      default:
        console.warn('Invalid parameter; showing Categories view');
    }
  };
  var setModalSize = function () {
    var availableWidth = $(window).width() - ($(window).width() * 0.15);
    sizeMultiplier = Math.floor(availableWidth / gridItemWidth);
    if (sizeMultiplier < 1) { sizeMultiplier = 1; }
    if (sizeMultiplier > 3) { sizeMultiplier = 3; }
    modalHeight = $(window).height() - 100;
    modalWidth = gridItemWidth * sizeMultiplier + 10;
  };

  $.fn.hasScrollBar = function () {
    return this.get(0).scrollHeight > this.height();
  };
  // Update modal size
  var redo = function () {
    setModalSize();
    $(self.selector).dialog('option', {
      height: modalHeight,
      width: modalWidth
    });
    $('#layers-all').css('height', modalHeight - 70); // 40 search box height + 30 breadcrub height
    $('#layer-modal-main').css('height', modalHeight - 40).perfectScrollbar('update');
  };

  var redoScrollbar = function () {
    $('#layer-modal-main').perfectScrollbar('update');
  };

  // This draws the default page, depending on projection
  // and hides the breadcrumb, and sets the search back to normal
  // and updates the scrollbar.
  var removeSearch = function () {
    $selectedCategory.hide();
    $breadcrumb.hide();
    searchBool = false;
    if (self.reactList) {
      $('#layer-modal-main').perfectScrollbar();
    }
    $('#layers-search-input').val('');
    $('#layer-search label.search-icon').removeClass('search-on').off('click');
  };

  var resize = function () {
    if ($(self.selector).dialog('isOpen')) {
      redo();
    }
  };

  var drawDefaultPage = function () {
    removeSearch();
    drawModal();
    redoScrollbar();
    allLayers = getLayersForProjection(models.proj.selected.id);
  };

  /**
   * var drawModal - Draws the contents of the layers modal based on the
   *  modalView parameter or the current projection.
   *
   * @return {void}  Calls the categories, measurements, or layers view functions
   *  to which renders the html. Also sets the breadcrumb text based on the view.
   */
  var drawModal = function () {
    var projection = models.proj.selected.id;
    var modalView = config.parameters.modalView;

    // If URL parameter is set, draw that type of modal view.
    switch (modalView) {
      case ('categories'):
        crumbText = 'Categories';
        drawCategories();
        break;
      case ('measurements'):
        crumbText = 'Measurements';
        drawAllMeasurements();
        break;
      case ('layers'):
        crumbText = 'Layers';
        drawAllLayers();
        break;
      case undefined:
        // Set the default views per projection if modalView is not defined.
        if (projection === 'geographic') {
          crumbText = 'Categories';
          drawCategories();
        } else {
          crumbText = 'Measurements';
          drawAllMeasurements();
        }
        break;
      default:
        crumbText = 'Categories';
        drawCategories();
        break;
    }
  };

  /**
   * var drawCategories - Draws all categories if it has non-empty measurements.
   *  If it has a placement flag, that category will display first or last. If
   *  there are more than 6 measurements ina category, an ellipsis is output.
   *  Categories are grouped in one of two interests tabs. Each category has a unique image.
   *
   * @return {HTMLElement}  Returns html to output measurements grouped by categories with
   *  categories grouped by interest.
   */
  var drawCategories = function () {
    $categories.empty();
    if ($categories.data('isotope')) {
      $categories.isotope('destroy');
    }
    $allLayers.hide();
    $nav.empty();

    Object.keys(config.categories).forEach(function (metaCategoryName) {
      lodashValues(config.categories[metaCategoryName]).forEach(function (category) {
        var sortNumber = 2;
        var $i = 0;

        // Check if categories have settings with the same projection.
        hasMeasurement = false;
        lodashValues(category.measurements).forEach(function (measurement) {
          hasMeasurementSource(config.measurements[measurement]);
        });

        if (hasMeasurement) {
          if (category.placement === 'first') {
            sortNumber = 1;
          } else if (category.placement === 'last') {
            sortNumber = 3;
          }

          var $category = $('<div />', {
            id: category.id,
            'class': 'layer-category layer-category-' + interestCssName(metaCategoryName),
            'data-sort': sortNumber
          });

          if (category.image) {
            $category.css('background-image', 'url("images/wv.layers/categories/' + category.image + '")');
          }

          var $categoryOpaque = $('<div />', {
            'class': 'category-background-cover'
          });

          $category.append($categoryOpaque);

          var $categoryTitle = $('<h3 />');

          var $categoryLink = $('<a />', {
            text: category.title,
            'class': 'layer-category-name',
            'alt': category.title
          }).click(function (e) {
            drawMeasurements(category);
          });

          $categoryTitle.append($categoryLink);
          $categoryOpaque.append($categoryTitle);

          var $measurements = $('<ul />');

          lodashValues(category.measurements).forEach(function (measurement, index) {
            var current = config.measurements[measurement];
            // Check if measurements have settings with the same projection.
            if (hasMeasurementSource(current)) {
              $i++;

              if ($i > 6) {
                setCategoryOverflow(category, $measurements);
              }

              if (config.measurements[measurement] === undefined) {
                throw new Error('Error: Measurement \'' + measurement + '\' stated in category \'' + category.title + '\' does not exist ' + 'in measurement list!');
              }

              var $measurement = $('<a />', {
                text: current.title,
                'class': 'layer-category-name',
                'data-category': category.id,
                'data-measurement': current.id,
                'title': category.title + ' - ' + current.title
              });

              $measurement.click(function (e) {
                drawMeasurements(category, current.id, index);
              });

              var $measurementItem = $('<li />', {
                'class': 'layer-category-item'
              });

              $measurementItem.append($measurement);

              $measurements.append($measurementItem);

              $categoryOpaque.append($measurements);

              $categories.append($category);
            }
          });

          $breadcrumb.show();
        }
      });

      $categories.show();

      var $filterButton = $('<input />', {
        text: interestLabelName(metaCategoryName),
        id: 'button-filter-' + interestCssName(metaCategoryName),
        'data-filter': interestCssName(metaCategoryName),
        'type': 'radio'
      }).click(function (e) {
        $categories.isotope({
          filter: '.layer-category-' + interestCssName(metaCategoryName)
        });
        $nav.find('.ui-button').removeClass('nav-selected');
        $('label[for=' + $(this).attr('id') + ']').addClass('nav-selected');
      });

      var $label = $('<label />', {
        text: interestLabelName(metaCategoryName),
        'for': 'button-filter-' + interestCssName(metaCategoryName)
      });

      $nav.append($filterButton);
      $nav.append($label);
      // Create radiobuttons with filter buttons
      $nav.buttonset();
      $nav.show();
    });

    $categories.isotope({
      itemSelector: '.layer-category',
      // stamp: '.stamp',
      getSortData: {
        name: '.layer-category-name', // text from querySelector
        order: '[data-sort]'
      },
      sortBy: [
        'order', 'name'
      ],
      filter: '.layer-category-legacy',
      masonry: {
        gutter: 10
      }

    });

    $('#layer-modal-main').prepend($nav);

    $('label[for=button-filter-legacy]').addClass('nav-selected');
  };

  /**
   * var drawMeasurements - Draws a measurement if it contains sources with settings.
   *
   * @param  {string} category            Return a measurement from a particular category.
   * @param  {string} selectedMeasurement Select a specificy measurement to interact with.
   * @param  {number} selectedIndex       An index of the output measurement; pass
   *  in the index to select that measurement.
   * @return {HTMLElement}  Returns a list of measurements with a dropdown containing
   *  sources which contain settings. Each source has a description. Layers
   *  can be added to the map using a checkbox.
   */
  var drawMeasurements = function (category, selectedMeasurement, selectedIndex) {
    var projection = models.proj.selected.id;
    var tabIndex;
    var currentTab = -1;

    $selectedCategory.empty();
    $breadcrumb.empty();
    var $categoryList = $('<div />', {
      id: category.id + '-list'
    });
    // Begin Measurement Level
    lodashValues(category.measurements).forEach(function (measurement) {
      var current = config.measurements[measurement];
      // Check if measurements have settings with the same projection.
      if (hasMeasurementSource(current)) {
        currentTab++;
        if (selectedMeasurement === current.id) {
          tabIndex = currentTab;
        }

        var $measurementHeader = $('<div />', {
          id: 'accordion-' + category.id + '-' + current.id
        });

        var $measurementTitle = $('<h3 />', {
          text: current.title
        });

        var $measurementSubtitle = $('<h5 />', {
          text: current.subtitle
        });

        var $sourceTabs = $('<ul />');

        var $measurementContent = $('<div />');

        $measurementContent.append($sourceTabs);

        // Begin source level
        lodashValues(current.sources).forEach(function (source) {
          var isExpanded;
          // Check if sources have settings with the same projection.
          if (hasMeasurementSetting(current, source)) {
            var $sourceTab = $('<li />');

            var $sourceLink = $('<a />', {
              text: source.title,
              'href': '#' + current.id + '-' + source.id
            });

            $sourceTab.append($sourceLink);
            $sourceTabs.append($sourceTab);

            var $sourceContent = $('<div />', {
              id: current.id + '-' + source.id
            });

            // Metadata
            var $sourceMeta = $('<div />', {
              'class': 'source-metadata'
            });

            var $showMore = $('<div />', {
              'class': 'metadata-more'
            });

            var $moreElps = $('<span />', {
              text: '...',
              'class': 'ellipsis'
            });

            $showMore.append($moreElps);

            $showMore.on('click', function() {
              isExpanded = !isExpanded;
              if (isExpanded) {
                $sourceMeta.removeClass('overflow');
                $moreElps.text('^').addClass('up');
                redoScrollbar();
              } else {
                $sourceMeta.addClass('overflow');
                $moreElps.text('...').removeClass('up');
                redoScrollbar();
              }
            });

            // Simple test to see if theres a link to some metadata
            if (source.description) {
              $.get('config/metadata/' + source.description + '.html').success(function (data) {
                $sourceMeta.html(data);
                $sourceContent.append($sourceMeta);

                $sourceMeta.find('a').attr('target', '_blank');
                // More than a thousand chars add show more widget
                if ($sourceMeta.text().length > 1000) {
                  $sourceMeta.addClass('overflow').after($showMore);
                }
              });
            }

            var $sourceSettings = $('<ul />', {
              'class': 'source-settings'
            });

            var $sourceOrbits = $('<ul />', {
              id: source.id + '-orbit-tracks',
              'class': 'source-orbit-tracks'
            });

            lodashValues(source.settings).forEach(function (setting) {
              var layer = config.layers[setting];
              // If a setting matches the current projection, then output it.
              if (layer && layer.id === setting && Object.keys(layer.projections).indexOf(projection) > -1) {
                var $wrapper = $('<li />', {
                  'class': 'measurement-settings-item',
                  'data-layer': encodeURIComponent(layer.id),
                  'value': encodeURIComponent(layer.id)
                });

                var $setting = $('<input />', {
                  id: 'setting-' + layer.id,
                  'class': 'settings-check',
                  'type': 'checkbox',
                  'data-layer': encodeURIComponent(layer.id),
                  'value': encodeURIComponent(layer.id)
                }).on('ifChecked', addLayer)
                  .on('ifUnchecked', removeLayer);

                if (lodashFind(model.active, { id: layer.id })) {
                  $setting.attr('checked', 'checked');
                }

                var $label = $('<label />', {
                  text: layer.title,
                  'for': 'setting-' + encodeURIComponent(layer.id)
                });

                $wrapper.append($setting).append($label);

                // If this is an orbit track.... put it in the orbit track list
                if (layer.layergroup && layer.layergroup.indexOf('reference_orbits') !== -1) {
                  var orbitTitle = '';
                  if (layer.daynight && layer.track) {
                    orbitTitle = lodashStartCase(layer.track) + '/' + lodashStartCase(layer.daynight);
                  } else if (layer.track) {
                    orbitTitle = lodashStartCase(layer.track);
                  } else if (layer.day) {
                    orbitTitle = lodashStartCase(layer.daynight);
                  }

                  $label.empty()
                    .text(orbitTitle);
                  $sourceOrbits.append($wrapper);

                /**
                 * @deprecated conditional since version 1.8.0 If the data
                 * set doesn't have the layergroup parameter set then use the
                 * layer title to determine if it is a Orbital Track.
                 */
                } else if (layer.title.indexOf('Orbital Track') !== -1) {
                  // The following complex if statement is a placeholder
                  // for truncating the layer names, until the rest of
                  // the interface is implemented
                  if (layer.title.indexOf('(') !== -1) {
                    var regExp = /\(([^)]+)\)/;
                    var matches = regExp.exec(layer.title);
                    orbitTitle = matches[1];
                  }
                  $label.empty()
                    .text(orbitTitle);
                  $sourceOrbits.append($wrapper);
                } else {
                  $sourceSettings.append($wrapper);
                }
                $wrapper.click(function (e) {
                  e.stopPropagation();
                  var $checkbox = $(this).find('input#setting-' + layer.id);

                  $checkbox.iCheck('toggle');
                });
              }
            });
            // End setting level
            $sourceContent.append($sourceSettings);

            if ($sourceOrbits.children().length > 0) {
              var $orbitsTitle = $('<h3 />', {
                text: 'Orbital Tracks:',
                'class': 'source-orbits-title'
              });

              $sourceContent.append($orbitsTitle);
              $sourceContent.append($sourceOrbits);
            }

            // $sourceContent.append( $addButton, $removeButton );
            $measurementContent.append($sourceContent);
          }
        });
        // End source level
        $measurementContent.tabs();

        $measurementHeader.append($measurementTitle);
        $measurementHeader.append($measurementSubtitle);

        $categoryList.append($measurementHeader);
        $categoryList.append($measurementContent);
      }
    });
    // End measurement level

    $categoryList.accordion({
      collapsible: true,
      heightStyle: 'content',
      animate: false,
      active: false,
      activate: function (event, ui) {
        redoScrollbar();
      }
    });

    if (selectedMeasurement) {
      $categoryList.accordion('option', 'active', tabIndex);
    }

    $selectedCategory.append($categoryList);

    // Create breadcrumb crumbs but do not show by default, only show within
    // drawCategories and searching
    var $homeCrumb = $('<a />', {
      text: crumbText,
      'alt': 'categories',
      'title': 'Back to Layer Categories'
    }).click(drawDefaultPage);

    $breadcrumb.append($homeCrumb).append('<span> / ' + category.title + '</span>');
    $selectedCategory.prepend($breadcrumb);
    $('#layers-search-input').show();

    // Switch navs
    $categories.hide();
    $nav.hide();
    $allLayers.hide();

    $selectedCategory.show();
    redoScrollbar();
    $selectedCategory.iCheck({
      checkboxClass: 'iCheck iCheck-checkbox icheckbox_square-red'
    });
  };

  /**
   * var drawAllMeasurements - Shows all the measurments within the legacy-all
   *  category. This is used for outputting the measurement view.
   *
   * @return {void}  Returns a list of measurements with a dropdown containing
   *  sources which contain settings. Each source has a description.
   */
  var drawAllMeasurements = function () {
    Object.keys(config.categories).forEach(function (metaCategoryName) {
      lodashValues(config.categories[metaCategoryName]).forEach(function (category) {
        if (category.id === 'legacy-all') {
          drawMeasurements(category);
        }
      });
    });
  };

  /**
   * var drawAllLayers - Draws all layers contained within a specific projection
   *  and contained within the layerOrder file.
   *
   * @return {HTMLElement}  Returns html with title, substitle, description and option to
   *  add layer to the map.
   */
  var drawAllLayers = function () {
    var projection = models.proj.selected.id;
    // Remove perfectScrollbar for the search list window
    $('#layer-modal-main').perfectScrollbar('destroy');

    var props = {
      addLayer: model.add,
      removeLayer: model.remove,
      activeLayers: model.active,
      selectedProjection: projection,
      filteredLayers: getLayersForProjection(projection)
    };
    self.reactList = ReactDOM.render(
      React.createElement(LayerList, props),
      $allLayers[0]
    );

    $selectedCategory.hide();
    $categories.hide();
    $nav.hide();
    $allLayers.show();

    // Create breadcrumb crumbs
    $breadcrumb.empty();

    if (searchBool) {
      var $homeCrumb = $('<a />', {
        text: crumbText,
        'alt': crumbText,
        'title': 'Back to ' + crumbText
      }).click(drawDefaultPage);

      $breadcrumb.append($homeCrumb).append('<span> / Search Results</span>');

      $allLayers.prepend($breadcrumb);
      $('#layers-search-input').show();

      $('label.search-icon').addClass('search-on');
      $('label.search-on').click(drawDefaultPage);

      $breadcrumb.show();
    }
  };

  var interestCssName = function (name) {
    if (name === 'hazards and disasters') {
      return 'legacy';
    } else {
      return name;
    }
  };

  var interestLabelName = function (name) {
    if (name === 'scientific') {
      return 'science disciplines';
    } else {
      return name;
    }
  };

  /**
   * var setCategoryOverflow - Apends an ellipsis to category overview measurement list.
   *
   * @param  {string} category      The category to append the ellipsis to.
   * @param  {string} $measurements The measurements contained within the category.
   * @return {HTMLElement}               Returns html to add the ellipsis to the category list.
   */
  var setCategoryOverflow = function (category, $measurements) {
    var $dotContinueItem = $('<li />', {
      'class': 'layer-category-item'
    });

    var $dotContinueLink = $('<a />', {
      text: '...',
      'data-category': category.id
    });

    $dotContinueLink.click(function (e) {
      drawMeasurements(category);
    });

    $dotContinueItem.append($dotContinueLink);
    $measurements.append($dotContinueItem);
  };

  var addLayer = function (event) {
    event.stopPropagation();
    model.add(decodeURIComponent($(this).val()));
  };

  var removeLayer = function (event) {
    event.stopPropagation();
    model.remove(decodeURIComponent($(this).val()));
  };

  var onLayerRemoved = function(layer) {
    var $element = $(self.selector + ' [data-layer="' + util.jqueryEscape(layer.id) + '"]');
    $element.iCheck('uncheck');
    if (self.reactList) {
      self.reactList.setState({
        activeLayers: model.active
      });
    }
  };

  var unfocusInput = function () {
    if (!util.browser.small) {
      $('#layers-search-input').focus();
    } else {
      $('#layers-search-input').blur();
      $('#layer-modal-main').focus();
    }
  };

  var render = function () {
    checkModalView();
    setModalSize();

    $('#layer-modal-main').css('height', modalHeight - 40).perfectScrollbar();

    var $search = $('<div />', {
      id: 'layer-search'
    });

    var $searchInput = $('<input />', {
      id: 'layers-search-input',
      'placeholder': 'Search'
    });

    var $searchBtn = $('<label />', {
      'class': 'search-icon'
    }).click(function (e) {
      // TODO: Click for search icon
    }).append('<i />');

    $search.append($searchBtn)
      .append($searchInput);

    $header.append($search);

    var $closeButton = $('<div />', {
      'id': 'layers-modal-close'
    }).click(function () {
      $(self.selector).dialog('close');
    }).append('<i></i>');

    $header.append($closeButton);

    $(self.selector).dialog({
      autoOpen: false,
      resizable: false,
      height: modalHeight,
      width: modalWidth,
      modal: true,
      dialogClass: 'layer-modal no-titlebar',
      draggable: false,
      title: 'Layer Picker',
      show: {
        effect: 'fade',
        duration: 400
      },
      hide: {
        effect: 'fade',
        duration: 200
      },
      open: function (event, ui) {
        redo();
        if ($categories.data('isotope')) {
          $categories.isotope();
        }

        redoScrollbar();

        $('.ui-widget-overlay').click(function (e) {
          $(self.selector).dialog('close');
        });

        // fade in time for show is 400 above, so after that
        setTimeout(unfocusInput, 410);
      },
      close: function (event, ui) {
        $('.ui-widget-overlay').unbind('click');
      }
    });

    // $(self.selector + "select").on('change', filter);
    $searchInput.keyup(filter);
    drawDefaultPage();
  };

  // returns each term from search field
  var searchTerms = function () {
    var search = $('#layers-search-input').val().toLowerCase();
    var terms = search.split(/ +/);
    return terms;
  };

  var filterProjections = function (layer) {
    return !layer.projections[models.proj.selected.id];
  };
  // Takes the terms and returns true if the layer isnt part of search
  var filterSearch = function (layer, terms) {
    var search = $(self.selector + 'search').val();
    if (search === '') return false;
    var filtered = false;
    var names = models.layers.getTitles(layer.id);

    $.each(terms, function (index, term) {
      filtered = !names.title.toLowerCase().contains(term) &&
        !names.subtitle.toLowerCase().contains(term) &&
        !names.tags.toLowerCase().contains(term) &&
        !config.layers[layer.id].id.toLowerCase().contains(term);

      if (filtered) return false;
    });
    return filtered;
  };

  var runSearch = function () {
    var search = searchTerms();
    var filteredLayers = allLayers.filter(function (layer) {
      return !(filterProjections(layer) || filterSearch(layer, search));
    });
    self.reactList.setState({
      filteredLayers: filteredLayers
    });
  };

  var filter = function (e) {
    if ($('#layers-search-input').val().length !== 0) {
      searchBool = true;
    } else {
      searchBool = false;
      drawModal();
      removeSearch();
    }
    // Ran on every keystroke in search
    if (searchBool) {
      if (($allLayers.css('display') === 'none') || ($breadcrumb.css('display') === 'none')) {
        drawAllLayers();
      }
      runSearch();
    } else {
      drawModal();
    }
  };

  init();
  return self;
};
