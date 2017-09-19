/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.modal
 */
wv.layers.modal = wv.layers.modal || function(models, ui, config) {

  var model = models.layers;
  var self = {};

  self.selector = '#layer-modal';
  self.id = 'layer-modal';

  var $header = $(self.selector + ' header');
  var $categories = $(' #layer-categories ');
  var $selectedCategory = $(self.selector + " #selected-category");
  var $allLayers = $(self.selector + " #layers-all");
  var gridItemWidth = 320; //with of grid item + spacing
  var modalHeight;
  var sizeMultiplier;
  var searchBool;
  var hasMeasurement;

  // Visible Layers
  var visible = {};

  var init = function() {
    Object.values(config.layers).forEach(function(layer) {
      visible[layer.id] = true;
    });
    model.events
    // FIXME: on "add" needs to be present without trying to add a product
      // multiple times
      //.on("add", onLayerAdded)
      .on("remove", onLayerRemoved);
    models.proj.events.on("select", drawDefaultPage);

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
   * @param  {type} current The current config.measurements measurement.
   * @param  {type} source  The current measurement source.
   * @return {type}         Return true if the source contains settings.
   *
   */
  var hasMeasurementSetting = function(current, source) {
    var projection = models.proj.selected.id;
    var hasSetting;
    Object.values(source.settings).forEach(function(setting) {
      var layer = config.layers[setting];
      var proj = layer.projections;
      if(layer.id == setting && Object.keys(proj).indexOf(projection) > -1) {
        if (layer.layergroup && layer.layergroup.indexOf("reference_orbits") !== -1) {
          if(current.id === "orbital-track") {
            hasSetting = true;
          }
        // Don't output sources with only orbit tracks
        } else {
          hasSetting = true;
        }
      }
    });
    return hasSetting ? true : false;
  };

  /**
   * var hasMeasurementSource - Checks each (current) measurement's sources
   *  and run hasMeasurementSetting to see if these sources contain settings.
   *  If a source contains settings, also sets a hasMeasurement flag to be checked
   *  when drawing categories.
   *
   * @param  {type} current The current config.measurements measurement.
   * @return {type}         Return true if the measurement has sources with settings.
   */

  var hasMeasurementSource = function(current) {
    var hasSource;
    Object.values(current.sources).forEach(function(source) {
      if(hasMeasurementSetting(current, source)) { hasSource = true; hasMeasurement = true; };
    });
    return hasSource ? true : false;
  };


  /**
   * var checkModalView - If modalView is set, then output a console message describing
   *  which layer is being shown.
   *
   * @return {type}  description
   */
  var checkModalView = function() {
    var modalView = config.parameters.modalView;
    if (modalView) {
      switch(modalView) {
        case('categories'):
          console.warn("'Add Layers' view changed to Categories");
          break;
        case('measurements'):
          console.warn("'Add Layers' view changed to Measurements");
          break;
        case('layers'):
          console.warn("'Add Layers' view changed to Layers");
          break;
        default:
          console.warn("Invalid parameter; showing Categories view");
      }
    }
  };

  var setModalSize = function() {
    var availableWidth = $(window).width() - ($(window).width() * 0.15);
    sizeMultiplier = Math.floor(availableWidth / gridItemWidth);
    if (sizeMultiplier < 1)
      sizeMultiplier = 1;
    if (sizeMultiplier > 3)
      sizeMultiplier = 3;
    modalHeight = $(window).height() - 100;
  };

  $.fn.hasScrollBar = function() {
    return this.get(0).scrollHeight > this.height();
  };

  var redo = function() {
    setModalSize();

    $(self.selector).dialog("option", {
      height: modalHeight,
      width: gridItemWidth * sizeMultiplier + 10
    });

    $('#layer-modal-main').css('height', modalHeight - 40).perfectScrollbar('update');
  };

  var redoScrollbar = function() {
    $('#layer-modal-main').perfectScrollbar('update');
  };

  // This draws the default page, depending on projection
  // and hides the breadcrumb, and sets the search back to normal
  // and updates the scrollbar.
  var removeSearch = function() {
    $selectedCategory.hide();
    $breadcrumb.hide();
    searchBool = false;
    $('#layers-search-input').val('');
    $('#layer-search label.search-icon').removeClass('search-on').off('click');
  };

  var resize = function() {
    if ($(self.selector).dialog("isOpen")) {
      redo();
    }
  };

  var drawDefaultPage = function(e) {
    removeSearch();
    drawModal();
    redoScrollbar();
  };

  var drawModal = function() {
    var projection = models.proj.selected.id;
    var modalView = config.parameters.modalView;

    // If URL parameter is set, draw that type of modal view.
    if (modalView) {
      switch(modalView) {
        case('categories'):
          crumbText = 'Categories';
          drawCategories();
          break;
        case('measurements'):
          crumbText = 'Measurements';
          drawAllMeasurements();
          break;
        case('layers'):
          crumbText = 'Layers';
          drawAllLayers();
          break;
        default:
          crumbText = 'Categories';
          drawCategories();
          break;
      }
    // Else set the default views per projection.
    } else if (projection == 'geographic') {
      crumbText = 'Categories';
      drawCategories();
    } else {
      crumbText = 'Measurements';
      drawAllMeasurements();
    }
  };

  var drawCategories = function() {
    $categories.empty();
    if ($categories.data('isotope')) {
      $categories.isotope('destroy');
    }
    $allLayers.hide();
    $nav.empty();

    Object.keys(config.categories).forEach(function(metaCategoryName) {

      Object.values(config.categories[metaCategoryName]).forEach(function(category) {
        var sortNumber = 2;
        var $i = 0;

        // Check if categories have settings with the same projection.
        hasMeasurement = false;
        Object.values(category.measurements).forEach(function(measurement) {
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
          }).click(function(e) {
            drawMeasurements(category);
          });

          $categoryTitle.append($categoryLink);
          $categoryOpaque.append($categoryTitle);

          var $measurements = $('<ul />');

          Object.values(category.measurements).forEach(function(measurement, index) {
            var projection = models.proj.selected.id;
            var current = config.measurements[measurement];
            // Check if measurements have settings with the same projection.
            if(hasMeasurementSource(current)) {
              $i++;

              if ($i > 6) {
                setCategoryOverflow(category, $measurements);
              }

              if (config.measurements[measurement] === undefined) {
                throw new Error("Error: Measurement '" + measurement + "' stated in category '" + category.title + "' does not exist " + "in measurement list!");
              }

              var $measurement = $('<a />', {
                text: current.title,
                'class': 'layer-category-name',
                'data-category': category.id,
                'data-measurement': current.id,
                'title': category.title + ' - ' + current.title
              });

              $measurement.click(function(e) {
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
      }).click(function(e) {
        $categories.isotope({
          filter: '.layer-category-' + interestCssName(metaCategoryName)
        });
        $nav.find('.ui-button').removeClass('nav-selected');
        $("label[for=" + $(this).attr("id") + "]").addClass('nav-selected');
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
      //stamp: '.stamp',
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

  var drawMeasurements = function(category, selectedMeasurement, selectedIndex) {
    var projection = models.proj.selected.id;
    var tabIndex;
    var currentTab = -1;

    $selectedCategory.empty();
    $breadcrumb.empty();
    var $categoryList = $('<div />', {
      id: category.id + '-list'
    });
    // Begin Measurement Level
    Object.values(category.measurements).forEach(function(measurement) {
      var current = config.measurements[measurement];
      // Check if measurements have settings with the same projection.
      if(hasMeasurementSource(current)) {
        currentTab++;
        if (selectedMeasurement == current.id) {
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
        Object.values(current.sources).forEach(function(source) {
          // Check if sources have settings with the same projection.
          if(hasMeasurementSetting(current, source)) {
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

            $showMore.toggle(function(e) {
              $sourceMeta.removeClass('overflow');
              $moreElps.text('^').addClass('up');
              redoScrollbar();
            }, function(e) {
              $sourceMeta.addClass('overflow');
              $moreElps.text('...').removeClass('up');
              redoScrollbar();
            });

            // Simple test to see if theres a link to some metadata
            if (source.description) {
              $.get('config/metadata/' + source.description + '.html').success(function(data) {
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

            Object.values(source.settings).forEach(function(setting) {
              var layer = config.layers[setting];
              // If a setting matches the current projection, then output it.
              if (layer.id == setting && Object.keys(layer.projections).indexOf(projection) > -1) {

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

                if (_.find(model.active, {id: layer.id})) {
                  $setting.attr("checked", "checked");
                }

                var $label = $('<label />', {
                  text: layer.title,
                  'for': 'setting-' + encodeURIComponent(layer.id)
                });

                $wrapper.append($setting).append($label);

                // If this is an orbit track.... put it in the orbit track list
                if (layer.layergroup && layer.layergroup.indexOf("reference_orbits") !== -1) {
                  var orbitTitle;
                  if (layer.daynight && layer.track) {
                    orbitTitle = _.startCase(layer.track) + "/" + _.startCase(layer.daynight);
                  }

                  $label.empty()
                    .text(orbitTitle);
                  $sourceOrbits.append($wrapper);

                /**
                 * @deprecated since version 1.8.0 If the data set is old and doesn't have
                 * layergroup's set then we will need to track the layer title to determine
                 * if it is a Orbital Track
                 */
                } else if (layer.title.indexOf("Orbital Track") !== -1) {

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
                $wrapper.click(function(e) {
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

            //$sourceContent.append( $addButton, $removeButton );
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
      heightStyle: "content",
      animate: false,
      active: false,
      activate: function(event, ui) {
        redoScrollbar();
      }
    });

    if (selectedMeasurement) {
      $categoryList.accordion("option", "active", tabIndex);
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
    $selectedCategory.iCheck({checkboxClass: 'icheckbox_square-red'});

  };

  // Show all the measurments within the legacy-all category
  var drawAllMeasurements = function() {
    Object.keys(config.categories).forEach(function(metaCategoryName) {
      Object.values(config.categories[metaCategoryName]).forEach(function(category) {
        if (category.id == "legacy-all") {
          drawMeasurements(category);
        }
      });
    });
  };

  // TODO: Filter layers by settings with projections equal to current projection.
  var drawAllLayers = function() {
    var projection = models.proj.selected.id;

    $allLayers.empty();

    var $fullLayerList = $('<ul />', {
      id: 'flat-layer-list'
    });

    Object.values(config.layerOrder).forEach(function(layerId) {
      var current = config.layers[layerId];

      // Check if layer is equal to the current projection, then output
      if (Object.keys(current.projections).indexOf(projection) > -1) {
        if (!current) {
          console.warn("In layer order but not defined", layerId);
        } else {
          var $layerItem = $('<li />', {
            id: 'layer-flat-' + current.id,
            'class': 'layers-all-layer',
            'data-layer': encodeURIComponent(current.id)
          });

          var $layerHeader = $('<div />', {
            'class': 'layers-all-header'
          }).click(function(e) {
            $(this).find('input#' + encodeURIComponent(current.id))
              .iCheck('toggle');
          });

          var $layerTitleWrap = $('<div />', {
            'class': 'layers-all-title-wrap'
          });

          var $layerTitle = $('<h3 />', {
            text: current.title
          });

          var $layerSubtitle = $('<h5 />', {
            text: current.subtitle
          });

          var $checkbox = $('<input />', {
            id: encodeURIComponent(current.id),
            'value': current.id,
            'type': 'checkbox',
            'data-layer': current.id
          }).on('ifChecked', addLayer)
            .on('ifUnchecked', removeLayer);

          if ( _.find(model.active, {id: current.id}) ) {
            $checkbox.attr("checked", "checked");
          }

          // Metadata
          var $sourceMeta = $('<div />', {
            'class': 'source-metadata hidden'
          });

          var $showMore = $('<span />', {
            'class': 'fa fa-info-circle'
          });

          var $moreTab = $('<div />', {
            'class': 'metadata-more'
          });

          var $moreElps = $('<span />', {
            text: '^',
            'class': 'ellipsis up'
          });

          $moreTab.append( $moreElps );

          $showMore.add($moreTab).toggle( function(e){
            $sourceMeta.toggleClass('hidden');
            redoScrollbar();
          }, function(e){
            $sourceMeta.toggleClass('hidden');
            redoScrollbar();
          });

          $layerItem.append( $layerHeader );
          $layerHeader.append( $checkbox );
          $layerHeader.append( $layerTitleWrap );
          $layerTitleWrap.append( $layerTitle );
          if( current.description ) {
            $layerTitle.append( $showMore );
          }
          $layerTitleWrap.append( $layerSubtitle );

          if( current.description ) {
            $.get('config/metadata/' + current.description + '.html')
              .success(function(data) {
                $sourceMeta.html(data);
                $layerItem.append( $sourceMeta );
                $sourceMeta.append( $moreTab );
                $sourceMeta.find('a')
                  .attr('target','_blank');
              });
          }

          $fullLayerList.append( $layerItem );
        }
      }
    });

    $allLayers.append($fullLayerList);

    $selectedCategory.hide();
    $categories.hide();
    $nav.hide();
    $allLayers.show();

    $allLayers.iCheck({checkboxClass: 'icheckbox_square-red'});

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

  var interestCssName = function(name) {
    if (name === 'hazards and disasters') {
      return 'legacy';
    } else {
      return name;
    }
  };

  var interestLabelName = function(name) {
    if (name === 'scientific') {
      return 'science disciplines';
    } else {
      return name;
    }
  };

  // Apend ellipsis to category overview measurement list.
  var setCategoryOverflow = function(category, $measurements) {
    var $dotContinueItem = $('<li />', {
      'class': 'layer-category-item'
    });

    var $dotContinueLink = $('<a />', {
      text: '...',
      'data-category': category.id
    });

    $dotContinueLink.click(function(e) {
      drawMeasurements(category);
    });

    $dotContinueItem.append($dotContinueLink);
    $measurements.append($dotContinueItem);
  };

  var addLayer = function(event) {
    event.stopPropagation();
    model.add(decodeURIComponent($(this).val()));
  };

  var removeLayer = function(event) {
    event.stopPropagation();
    model.remove(decodeURIComponent($(this).val()));
  };

  var onLayerAdded = function(layer) {
    var $element = $(self.selector + " [data-layer='" + wv.util.jqueryEscape(layer.id) + "']");
    $element.iCheck("check");
  };

  var onLayerRemoved = function(layer) {
    var $element = $(self.selector + " [data-layer='" + wv.util.jqueryEscape(layer.id) + "']");
    $element.iCheck("uncheck");
  };

  var unfocusInput = function() {
    if (!wv.util.browser.small) {
      $('#layers-search-input').focus();
    } else {
      $('#layers-search-input').blur();
      $('#layer-modal-main').focus();
    }
  };

  var render = function() {
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
    }).click(function(e) {
      var that = this;
      //TODO: Click for search icon
    }).append("<i />");

    $(self.selector).dialog({
      autoOpen: false,
      resizable: false,
      height: modalHeight,
      width: gridItemWidth * sizeMultiplier + 10,
      modal: true,
      dialogClass: "layer-modal no-titlebar",
      draggable: false,
      title: "Layer Picker",
      show: {
        effect: "fade",
        duration: 400
      },
      hide: {
        effect: "fade",
        duration: 200
      },
      open: function(event, ui) {
        redo();

        if ($categories.data('isotope')) {
          $categories.isotope();
        }

        redoScrollbar();

        $(".ui-widget-overlay").click(function(e) {
          $(self.selector).dialog("close");
        });

        //fade in time for show is 400 above, so after that
        setTimeout(unfocusInput, 410);

      },
      close: function(event, ui) {
        $(".ui-widget-overlay").unbind("click");
      }
    });

    $search.append($searchBtn).append($searchInput);

    $header.append($search);

    var $closeButton = $('<div />', {
      id: 'layers-modal-close'
    }).click(function(e) {
      $(self.selector).dialog("close");
    }).append('<i />');

    $header.append($closeButton);

    //$(self.selector + "select").on('change', filter);
    $searchInput.keyup(filter);

    drawDefaultPage();
  };

  var searchTerms = function() {
    var search = $("#layers-search-input").val().toLowerCase();
    var terms = search.split(/ +/);
    return terms;
  };

  var filterAreaOfInterest = function(layerId) {
    if (!config.aoi) {
      return false;
    }
    var aoi = $(self.selector + "select").val();
    if (aoi === "All") {
      return false;
    }
    return $.inArray(layerId, config.aoi[aoi].baselayers) < 0 && $.inArray(layerId, config.aoi[aoi].overlays) < 0;
  };

  var filterProjections = function(layer) {
    return !layer.projections[models.proj.selected.id];
  };

  var filterSearch = function(layer, terms) {
    var search = $(self.selector + "search").val();
    if (search === "") {
      return false;
    }
    var filtered = false;
    var names = models.layers.getTitles(layer.id);
    $.each(terms, function(index, term) {
      filtered = !names.title.toLowerCase().contains(term) && !names.subtitle.toLowerCase().contains(term) && !names.tags.toLowerCase().contains(term) && !config.layers[layer.id].id.toLowerCase().contains(term);

      if (filtered) {
        return false;
      }
    });
    return filtered;
  };

  var runSearch = _.throttle(function() {
    var search = searchTerms();

    $.each(config.layers, function(layerId, layer) {

      var fproj = filterProjections(layer);
      var fterms = filterSearch(layer, search);

      var filtered = fproj || fterms;

      visible[layer.id] = !filtered;

      var display = filtered ? "none" : "block";
      var selector = "#flat-layer-list li[data-layer='" + wv.util.jqueryEscape(layerId) + "']";
      $(selector).css("display", display);
    });

    redoScrollbar();
  }, 250, {trailing: true});

  var filter = function(e) {

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
