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

  var $addBtn = $('#layers-add');
  var $header = $(self.selector + ' header');
  var $categories = $(' #layer-categories ');
  var $selectedCategory = $(self.selector + " #selected-category");
  var $allLayers = $(self.selector + " #layers-all");
  var gridItemWidth = 320; //with of grid item + spacing
  var projection = models.proj.selected.id;
  var modalHeight;
  var sizeMultiplier;
  var searchBool;

  //Visible Layers
  var visible = {};

  var init = function() {
    _.each(config.layers, function(layer) {
      visible[layer.id] = true;
    });
    model.events
    //FIXME: on "add" needs to be present without trying to add a product
    // multiple times
    //.on("add", onLayerAdded)
      .on("remove", onLayerRemoved);
    models.proj.events.on("select", drawDefaultPage);

    //Create tiles
    render();

    $addBtn.click(function(e) {
      $(self.selector).dialog("open");
    });

    $(window).resize(resize);
  };

  //Create container for 'by interest' filters buttons
  var $nav = $('<nav></nav>').attr('id', 'categories-nav');

  //Create container for breadcrumb
  var $breadcrumb = $('<nav></nav>').attr('id', 'category-breadcrumb');

  var checkModalView = function() {
    if (config.parameters.modalView == 'categories') {
      console.warn("'Add Layers' view changed to Categories");
    } else if (config.parameters.modalView == 'measurements') {
      console.warn("'Add Layers' view changed to Measurements");
    } else if (config.parameters.modalView == 'layers') {
      console.warn("'Add Layers' view changed to Layers");
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

    //$( '.stamp' ).css("width", sizeMultiplier * gridItemWidth - 10 + "px");
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
    var crumbtext;
    projection = models.proj.selected.id;

    // If URL parameter is set, draw that type of modal view.
    if (config.parameters.modalView == 'categories') {
      crumbText = 'Categories';
      drawCategories();
    } else if (config.parameters.modalView == 'measurements') {
      crumbText = 'Measurements';
      drawAllMeasurements();
    } else if (config.parameters.modalView == 'layers') {
      crumbText = 'Layers';
      drawAllLayers();

      // Else set the default views per projection.
    } else if (projection == 'geographic') {
      crumbText = 'Categories';
      drawCategories();
    } else {
      crumbText = 'All Measurements';
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

    _.each(config.categories, function(metaCategory, metaCategoryName) {

      _.each(config.categories[metaCategoryName], function(category, name) {
        var sortNumber;

        // Check if categories have settings with the same projection.
        var categoryHasSetting;
        _.each( category.measurements, function( measurement, index ) {
            var projection = models.proj.selected.id;
            var current = config.measurements[measurement];
            _.each( current.sources, function( source, souceName ) {
                _.each( source.settings, function( setting ) {
                    var layer = config.layers[setting];
                    var proj = layer.projections;
                    if(layer.id == setting && Object.keys(proj).indexOf(projection) > -1) {
                        categoryHasSetting = true;
                    }
                });
            });
        });

        if (categoryHasSetting === true) {
          if (category.placement) {
            if (category.placement === 'first') {
              sortNumber = 1;
            } else if (category.placement === 'last') {
              sortNumber = 3;
            }
          } else
            sortNumber = 2;
          var $category = $('<div></div>').attr('data-sort', sortNumber).addClass('layer-category layer-category-' + interestCssName(metaCategoryName)).attr('id', category.id);
          if (category.image) {
            $category.css('background-image', 'url("images/wv.layers/categories/' + category.image + '")');
          }

          var $categoryOpaque = $('<div></div>').addClass('category-background-cover');

          $category.append($categoryOpaque);

          var $categoryTitle = $('<h3></h3>');

          var $categoryLink = $('<a></a>').text(category.title).attr('alt', category.title).addClass('layer-category-name').click(function(e) {
            drawMeasurements(category);
          });

          $categoryTitle.append($categoryLink);
          $categoryOpaque.append($categoryTitle);

          var $measurements = $('<ul></ul>');
          $i = 0;
          _.each(category.measurements, function(measurement, index) {
            var projection = models.proj.selected.id;
            var current = config.measurements[measurement];
            // Check if measurements have settings with the same projection.
            var measurementHasSetting;
            _.each( current.sources, function( source, souceName ) {
                _.each( source.settings, function( setting ) {
                    var layer = config.layers[setting];
                    var proj = layer.projections;
                    if(layer.id == setting && Object.keys(proj).indexOf(projection) > -1) {
                        measurementHasSetting = true;
                    }
                });
            });
            if(measurementHasSetting === true) {
              $i++;

              if ($i > 6) {
                setCategoryOverflow(category, $measurements);
              }

              if (config.measurements[measurement] === undefined) {
                throw new Error("Error: Measurement '" + measurement + "' stated in category '" + category.title + "' does not exist " + "in measurement list!");
              }

              var $measurement = $('<a></a>').attr('data-category', category.id).attr('data-measurement', current.id).attr('title', category.title + ' - ' + current.title).text(current.title);

              $measurement.click(function(e) {
                drawMeasurements(category, current.id, index);
              });

              var $measurementItem = $('<li></li>').addClass('layer-category-item');

              $measurementItem.append($measurement);

              $measurements.append($measurementItem);
            }
          });

          $categoryOpaque.append($measurements);

          $categories.append($category);

          $breadcrumb.show();

        }

      });

      $categories.show();

      var $filterButton = $('<input />').attr('type', 'radio').text(interestLabelName(metaCategoryName));

      var $label = $('<label></label>').text(interestLabelName(metaCategoryName));

      $filterButton.attr('id', 'button-filter-' + interestCssName(metaCategoryName)).attr('data-filter', interestCssName(metaCategoryName)).click(function(e) {
        $categories.isotope({
          filter: '.layer-category-' + interestCssName(metaCategoryName)
        });
        $nav.find('.ui-button').removeClass('nav-selected');
        $("label[for=" + $(this).attr("id") + "]").addClass('nav-selected');
      });

      $label.attr('for', 'button-filter-' + interestCssName(metaCategoryName));

      $nav.append($filterButton);
      $nav.append($label);
      //Create radiobuttons with filter buttons
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
    $selectedCategory.empty();
    $breadcrumb.empty();
    var $categoryList = $('<div></div>').attr('id', category.id + '-list');

    //Begin Measurement Level
    _.each( category.measurements, function( measurement, measurementName ) {
        var current = config.measurements[measurement];

        // Check if measurements have settings with the same projection.
        var measurementHasSetting;
        _.each( current.sources, function( source, souceName ) {
            _.each( source.settings, function( setting ) {
                var layer = config.layers[setting];
                var proj = layer.projections;
                if(layer.id == setting && Object.keys(proj).indexOf(projection) > -1) {
                    measurementHasSetting = true;
                }
            });
        });

      if (measurementHasSetting === true) {
        var $measurementHeader = $('<div></div>').attr('id', 'accordion-' + category.id + '-' + current.id);

        var $measurementTitle = $('<h3></h3>').text(current.title);

        var $measurementSubtitle = $('<h5></h5>').text(current.subtitle);

        var $sourceTabs = $('<ul></ul>');

        var $measurementContent = $('<div></div>');

        $measurementContent.append($sourceTabs);

        //Begin source level
        _.each( current.sources, function( source, souceName ) {

            // Check if sources have settings with the same projection.
            var sourceHasSetting;
            _.each( source.settings, function( setting ) {
                var layer = config.layers[setting];
                var proj = layer.projections;
                if(layer.id == setting && Object.keys(proj).indexOf(projection) > -1) {
                    sourceHasSetting = true;
                }
            });

            if(sourceHasSetting === true) {
            var $sourceTab = $('<li></li>');

            var $sourceLink = $('<a></a>').text(source.title).attr('href', '#' + current.id + '-' + source.id);

            $sourceTab.append($sourceLink);
            $sourceTabs.append($sourceTab);

            var $sourceContent = $('<div></div>').attr('id', current.id + '-' + source.id);

            //Metadata

            var $sourceMeta = $('<div></div>').addClass('source-metadata');

            var $showMore = $('<div></div>').addClass('metadata-more');

            var $moreElps = $('<span></span>').addClass('ellipsis').text('...');

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

            //Simple test to see if theres a link to some metadata
            if (source.description) {
              $.get('config/metadata/' + source.description + '.html').success(function(data) {
                $sourceMeta.html(data);
                $sourceContent.append($sourceMeta);

                $sourceMeta.find('a').attr('target', '_blank');
                //More than a thousand chars add show more widget
                if ($sourceMeta.text().length > 1000) {
                  $sourceMeta.addClass('overflow').after($showMore);
                }
              });
            }

            var $sourceSettings = $('<ul></ul>').addClass('source-settings');

            var $sourceOrbits = $('<ul></ul>').addClass('source-orbit-tracks').attr('id', source.id + '-orbit-tracks');

            _.each(source.settings, function(setting) {
              var layer = config.layers[setting];

              // If a setting matches the current projection, then output it.
              if (layer.id == setting && Object.keys(layer.projections).indexOf(projection) > -1) {

                var $wrapper = $('<li></li>').attr('data-layer', encodeURIComponent(layer.id)).attr('value', encodeURIComponent(layer.id)).addClass('measurement-settings-item');

                var $setting = $('<input></input>').attr('type', 'checkbox').addClass('settings-check').attr('id', 'setting-' + layer.id).attr('value', encodeURIComponent(layer.id))
                //maybe dont need value and data-layer both
                  .attr('data-layer', encodeURIComponent(layer.id)).on('ifChecked', addLayer).on('ifUnchecked', removeLayer);

                if (_.find(model.active, {id: layer.id})) {
                  $setting.attr("checked", "checked");
                }

                var $label = $('<label></label>').attr('for', 'setting-' + encodeURIComponent(layer.id)).text(layer.title);

                $wrapper.append($setting).append($label);

                //If this is an orbit track.... put it in the orbit track list
                if (layer.title.indexOf("Orbital Track") !== -1) {
                  var orbitTitle;
                  // The following complex if statement is a placeholder
                  // for truncating the layer names, until the rest of
                  // the interface is implemented

                  if (layer.title.indexOf('(') !== -1) {
                    var regExp = /\(([^)]+)\)/;
                    var matches = regExp.exec(layer.title);
                    orbitTitle = matches[1];
                  }
                  $label.empty().text(orbitTitle);
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
            //End setting level
            $sourceContent.append($sourceSettings);

            if ($sourceOrbits.children().length > 0) {
              var $orbitsTitle = $('<h3></h3>').addClass('source-orbits-title').text('Orbital Tracks:');

              $sourceContent.append($orbitsTitle);
              $sourceContent.append($sourceOrbits);
            }

            //$sourceContent.append( $addButton, $removeButton );
            $measurementContent.append($sourceContent);
          }
        });
        //End source level
        $measurementContent.tabs();

        $measurementHeader.append($measurementTitle);
        $measurementHeader.append($measurementSubtitle);

        $categoryList.append($measurementHeader);
        $categoryList.append($measurementContent);
      }
    });
    //End measurement level

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
      $categoryList.accordion("option", "active", selectedIndex);
    }

    $selectedCategory.append($categoryList);

    // Create breadcrumb crumbs but do not show by default, only show within
    // drawCategories and searching
    var $homeCrumb = $('<a></a>').text(crumbText).attr('alt', 'categories').attr('title', 'Back to Layer Categories').click(drawDefaultPage);

    $breadcrumb.append($homeCrumb).append('<b> / ' + category.title + '</b>');
    $selectedCategory.prepend($breadcrumb);
    $('#layers-search-input').show();

    //Switch navs
    $categories.hide();
    $nav.hide();
    $allLayers.hide();

    $selectedCategory.show();
    redoScrollbar();
    $selectedCategory.iCheck({checkboxClass: 'icheckbox_square-red'});

  };

  // Show all the measurments within the legacy-all category
  var drawAllMeasurements = function() {
    _.each(config.categories, function(metaCategory, metaCategoryName) {
      _.each(config.categories[metaCategoryName], function(category, name) {
        if (category.id == "legacy-all") {
          drawMeasurements(category);
        }
      });
    });
  };

  // TODO: Filter layers by settings with projections equal to current projection.
  var drawAllLayers = function() {

    $allLayers.empty();

    var $fullLayerList = $('<ul></ul>').attr('id', 'flat-layer-list');

    _.each(config.layerOrder, function(layerId) {

      var current = config.layers[layerId];

      //Check if layer is equal to the current projection, then output
      if (Object.keys(current.projections).indexOf(projection) > -1) {
        if (!current) {
          console.warn("In layer order but not defined", layerId);
        } else {
          var $layerItem = $( '<li></li>' )
              .attr('id', 'layer-flat-' + current.id )
              .attr("data-layer", encodeURIComponent(current.id))
              .addClass('layers-all-layer');


          var $layerHeader = $('<div></div>')
            .addClass('layers-all-header')
            .click(function(e) {
              $(this).find('input#' + encodeURIComponent(current.id))
              .iCheck('toggle');
            });

          var $layerTitleWrap = $( '<div></div>' )
              .addClass('layers-all-title-wrap');

          var $layerTitle = $( '<h3></h3>' )
              .text( current.title );

          var $layerSubtitle = $('<h5></h5>')
              .append( current.subtitle );

          var $checkbox = $("<input></input>")
              .attr("id", encodeURIComponent(current.id))
              .attr("value", current.id)
              .attr("type", "checkbox")
              .attr("data-layer", current.id)
              .on('ifChecked', addLayer)
              .on('ifUnchecked', removeLayer);

          if ( _.find(model.active, {id: current.id}) ) {
              $checkbox.attr("checked", "checked");
          }

          //Metadata
          var $sourceMeta = $( '<div></div>' )
              .addClass('source-metadata hidden');

          var $showMore = $('<span></span>')
              .addClass('fa fa-info-circle');

          var $moreTab = $('<div></div>')
              .addClass('metadata-more');

          var $moreElps = $('<span></span>')
              .addClass('ellipsis up')
              .text('^');

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
                  }
              );
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
      var $homeCrumb = $('<a></a>').text(crumbText).attr('alt', crumbText).attr('title', 'Back to ' + crumbText).click(drawDefaultPage);

      $breadcrumb.append($homeCrumb).append('<b> / Search Results</b>');

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
    } else
      return name;
    }
  ;

  var interestLabelName = function(name) {
    if (name === 'scientific') {
      return 'science disciplines';
    } else
      return name;
    }
  ;

  // Apend ellipsis to category overview measurement list.
  var setCategoryOverflow = function(category, $measurements) {
    var $dotContinueItem = $('<li></li>').addClass('layer-category-item');

    var $dotContinueLink = $('<a></a>').attr('data-category', category.id).text('...');

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

    var $search = $("<div></div>").attr("id", "layer-search");

    var $searchInput = $("<input></input>").attr("id", "layers-search-input").attr('placeholder', 'Search');

    var $searchBtn = $("<label></label>").addClass("search-icon").click(function(e) {
      var that = this;
      //TODO: Click for search icon
    }).append("<i></i>");

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

    var $closeButton = $('<div></div>').attr('id', 'layers-modal-close').click(function(e) {
      $(self.selector).dialog("close");
    }).append('<i></i>');

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
