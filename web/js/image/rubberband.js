import $ from 'jquery';
import 'jquery-ui/button';
import 'jquery-jcrop';
import lodashFind from 'lodash/find';
import util from '../util/util';
import wvui from '../ui/ui';
import { imagePanel } from './panel';

const dialogConfig = {
  dialogClass: 'wv-panel wv-image',
  title: 'Take a snapshot',
  show: {
    effect: 'slide',
    direction: 'up'
  },
  hide: {
    effect: 'slide',
    direction: 'up'
  },
  width: 230,
  height: 'auto',
  minHeight: 10,
  draggable: false,
  resizable: false,
  autoOpen: false
};

const PALETTE_WARNING =
  'One or more layers on the map have been modified (changed palette, ' +
  'thresholds, etc.). These modifications cannot be used to take a ' +
  'snapshot. Would you like to temporarily revert to the original ' +
  'layer(s)?';

const GRATICLE_WARNING =
  'The graticule layer cannot be used to take a snapshot. Would you ' +
  'like to hide this layer?';

const ROTATE_WARNING =
  'Image may not be downloaded when rotated. Would you like to reset rotation?';

export function imageRubberband(models, ui, config) {
  var self = {};

  var containerId = 'wv-image-button';
  var container;
  var selector = '#' + containerId;
  var coords = null;
  var previousCoords = null;
  var $cropee = $('#wv-map'); // TODO: Test on non-canvas
  var state = 'off';
  var jcropAPI = null;
  var previousPalettes = null;
  var $button;
  var $label;

  self.panel = imagePanel(models, ui, config, dialogConfig);
  self.events = util.events();

  /**
   * Initializes the RubberBand component.
   *
   * @this {RubberBand}
   */
  var init = function() {
    var compareModel = models.compare;

    container = document.getElementById(containerId);
    if (container === null) {
      throw new Error("Error: element '" + containerId + "' not found!");
    }
    $button = $('<input></input>')
      .attr('type', 'checkbox')
      .attr('id', 'wv-image-button-check')
      .val('');
    $label = $('<label></label>')
      .attr('for', 'wv-image-button-check')
      .attr('title', 'Take a snapshot');
    var $icon = $('<i></i>')
      .addClass('fa')
      .addClass('fa-camera')
      .addClass('fa-2x');
    $label.append($icon);
    $(selector).append($label);
    $(selector).append($button);
    $button.button({
      text: false
    });
    $button.on('click', toggle);
    if (compareModel) {
      compareModel.events.on('toggle', toggleButton);
    }
    toggleButton();
  };
  var toggleButton = function() {
    var compareModel = models.compare;
    if (compareModel && compareModel.active) {
      $button.button('disable');
      $label.attr(
        'title',
        'You must exit comparison mode to use the snapshot feature'
      );
    } else {
      $button.button('enable');
      $label.attr('title', 'Take a snapshot');
    }
  };
  var toolbarButtons = function(action) {
    $('#wv-info-button input').button(action);
    $('#wv-proj-button input').button(action);
    $('#wv-link-button input').button(action);
  };

  var toggle = function() {
    var geographic = models.proj.selected.id === 'geographic';
    // Enables UI to select an area on the map while darkening the view
    var toggleOn = function() {
      state = 'on';
      toolbarButtons('disable');
      self.panel.show();
      $('.ui-dialog').on('dialogclose', function() {
        if (state === 'on') {
          toggle();
        }
        document.activeElement.blur();
      });
      draw();
    };
    var resetRotation = function() {
      ui.map.selected.getView().animate({
        rotation: 0,
        duration: 400
      });
    };

    var disablePalettes = function() {
      // Save the previous state to be restored later
      previousPalettes = models.palettes.active;
      models.palettes.clear();
      toggle();
    };

    var disableGraticle = function() {
      models.layers.setVisibility('Graticule', false);
      toggle();
    };
    if (state === 'off') {
      var layers = models.layers.get({
        renderable: true
      });
      if (
        lodashFind(layers, {
          id: 'Graticule'
        }) &&
        geographic
      ) {
        wvui.ask({
          header: 'Notice',
          message: GRATICLE_WARNING,
          onOk: disableGraticle,
          onCancel: function() {
            $button.prop('checked', false).button('refresh');
          }
        });
        return;
      }

      // Confirm with the user they want to continue, and if so, disable
      // the palettes before bringing up the crop box.
      if (models.palettes.inUse()) {
        wvui.ask({
          header: 'Notice',
          message: PALETTE_WARNING,
          onOk: disablePalettes,
          onCancel: function() {
            $button.prop('checked', false).button('refresh');
          }
        });
        return;
      }
      // Don't toggle area select UI for downloading image if image rotated
      if (ui.map.selected.getView().getRotation() === 0.0) {
        toggleOn();
      } else {
        wvui.ask({
          header: 'Reset rotation?',
          message: ROTATE_WARNING,
          onOk: function() {
            resetRotation();
            setTimeout(toggle, 500); // Let rotation finish before image download can occur
          }
        });
      }
    } else {
      state = 'off';
      $button.prop('checked', false).button('refresh');
      $cropee.insertAfter('#productsHolder');
      jcropAPI.destroy();
      if (geographic) {
        ui.map.events.trigger('selectiondone');
      } // Should be a changed to a image event
      if (previousPalettes) {
        models.palettes.restore(previousPalettes);
        previousPalettes = null;
      }
      toolbarButtons('enable');
      wvui.closeDialog();
      $('.wv-image-coords').hide();
    }
  };

  /**
   * Sets the values for the rubberband (x1, y1, x2, y2, width, height) from the passed "coordinates" object of JCrop  *
   * @this {RBand}
   * @param {String} coordinates object of JCrop
   *
   */
  var setCoords = function(c, panel) {
    previousCoords = coords;
    coords = c;
    self.panel.update(coords);
  };

  /**
   * Activates the drawing on the map.
   *
   * @this {RBand}
   *
   *
   */
  var draw = function() {
    $cropee.Jcrop({
      bgColor: 'black',
      bgOpacity: 0.3,
      onSelect: function(c) {
        previousCoords = coords;
        handleChange(c);
      },
      onChange: function(c) {
        handleChange(c);
      },
      onRelease: function(c) {
        coords = previousCoords;
        toggle();
      },
      fullScreen: true
    });

    jcropAPI = $cropee.data('Jcrop');
    if (models.proj.selected.id === 'geographic') {
      ui.map.events.trigger('selecting');
    } // Should be a changed to a image event
    if (coords) {
      jcropAPI.setSelect([coords.x, coords.y, coords.x2, coords.y2]);
    } else {
      jcropAPI.setSelect([
        $(window).width() / 2 - 100,
        $(window).height() / 2 - 100,
        $(window).width() / 2 + 100,
        $(window).height() / 2 + 100
      ]);
    }
  };

  var handleChange = function(c) {
    setCoords(c);
  };

  init();
  return self;
}
