const path = require('path');
const glob = require('glob');
const pkg = require('./package.json');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var legacyVendorAssets = [
  './web/ext/ui/jquery-ui-1.11.4/jquery-ui.css',
  './web/ext/node_modules/font-awesome/css/font-awesome.min.css',
  './web/ext/ui/iCheck-1.0.2-patch/skins/square/grey.css',
  './web/ext/ui/iCheck-1.0.2-patch/skins/square/red.css',
  './web/ext/ui/iCheck-1.0.2-patch/skins/line/red.css',
  './web/ext/ui/jquery.jscrollpane-2.0.22/jquery.jscrollpane.css',
  './web/ext/ui/perfect-scrollbar/perfect-scrollbar.css',
  './web/ext/date/mobiscroll-2.6.0/mobiscroll.css',
  './web/ext/tour/joyride-2.0.3-3/joyride.css',
  './web/ext/image/jcrop-0.9.12/jquery.Jcrop.css',
  './web/ext/ui/noUiSlider-6.1.10/jquery.nouislider.css',
  './web/ext/map/openlayers-3.17.1.wv1/ol.css',
  './web/ext/main/jquery-2.1.4/jquery.js',
  './web/ext/main/jquery.migrate-1.2.1/jquery-migrate.min.js',
  './web/ext/ui/jquery-ui-1.11.4/jquery-ui.js'
];

var legacyAppAssets = [
  './web/js/wv.brand.js',
  './web/js/util/wv.util.browser.js',
  './web/js/util/wv.util.js',
  './web/js/util/wv.util.load.js',
  './web/js/util/wv.util.events.js',
  './web/js/ui/wv.ui.js',
  './web/js/ui/wv.ui.mouse.js',
  './web/js/ui/wv.ui.indicator.js',
  './web/js/ui/wv.ui.info.js',
  './web/js/notifications/wv.notifications.ui.js',
  './web/js/proj/wv.proj.js',
  './web/js/proj/wv.proj.change.js',
  './web/js/proj/wv.proj.model.js',
  './web/js/proj/wv.proj.ui.js',
  './web/js/animation/wv.anim.js',
  './web/js/animation/wv.anim.gif.js',
  './web/js/animation/wv.anim.ui.js',
  './web/js/animation/wv.anim.model.js',
  './web/js/animation/wv.anim.rangeselect.js',
  './web/js/animation/wv.anim.widget.js',
  './web/js/date/wv.date.js',
  './web/js/date/wv.date.model.js',
  './web/js/date/wv.date.label.js',
  './web/js/date/wv.date.timeline.js',
  './web/js/date/wv.date.timeline.data.js',
  './web/js/date/wv.date.timeline.ticks.js',
  './web/js/date/wv.date.timeline.zoom.js',
  './web/js/date/wv.date.timeline.pick.js',
  './web/js/date/wv.date.timeline.pan.js',
  './web/js/date/wv.date.timeline.input.js',
  './web/js/date/wv.date.timeline.config.js',
  './web/js/date/wv.date.wheels.js',
  './web/js/layers/wv.layers.js',
  './web/js/layers/wv.layers.model.js',
  './web/js/layers/wv.layers.sidebar.js',
  './web/js/layers/wv.layers.active.js',
  './web/js/layers/wv.layers.modal.js',
  './web/js/layers/wv.layers.options.js',
  './web/js/layers/wv.layers.info.js',
  './web/js/image/wv.image.rubberband.js',
  './web/js/image/wv.image.panel.js',
  './web/js/palettes/wv.palettes.js',
  './web/js/palettes/wv.palettes.legend.js',
  './web/js/palettes/wv.palettes.model.js',
  './web/js/data/wv.data.js',
  './web/js/data/wv.data.cmr.js',
  './web/js/data/wv.data.handler.js',
  './web/js/data/wv.data.map.js',
  './web/js/data/wv.data.model.js',
  './web/js/data/wv.data.results.js',
  './web/js/data/wv.data.ui.js',
  './web/js/naturalEvents/wv.naturalEvents.request.js',
  './web/js/naturalEvents/wv.naturalEvents.model.js',
  './web/js/naturalEvents/wv.naturalEvents.ui.js',
  './web/js/naturalEvents/wv.naturalEvents.map.js',
  './web/js/map/wv.map.js',
  './web/js/map/wv.map.model.js',
  './web/js/map/wv.map.rotate.js',
  './web/js/map/wv.map.runningdata.js',
  './web/js/map/wv.map.layerbuilder.js',
  './web/js/map/wv.map.datelinebuilder.js',
  './web/js/map/wv.map.precachetile.js',
  './web/js/map/wv.map.ui.js',
  './web/js/map/wv.map.animate.js',
  './web/js/link/wv.link.model.js',
  './web/js/link/wv.link.ui.js',
  './web/js/wv.feedback.js',
  './web/js/wv.tour.js',
  './web/js/wv.debug.js',
  './web/js/wv.main.js'
];

module.exports = {
  entry: {
    app: glob.sync('./web/js/**/!(wv.)*.js').concat(legacyAppAssets),
    vendor: Object.keys(pkg.dependencies).concat(legacyVendorAssets)
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'web/dist')
  },
  module: {
    rules: [
      {
        // Legacy app scripts
        test: /wv\..*\.js$/,
        include: [ path.resolve(__dirname, 'web/js') ],
        use: [ 'script-loader' ]
      },
      {
        // Legacy vendor scripts
        test: /.*\.js$/,
        include: [ path.resolve(__dirname, 'web/ext') ],
        use: [ 'script-loader' ]
      },
      {
        // Legacy vendor stylesheets
        test: /.*\.css$/,
        include: [ path.resolve(__dirname, 'web/ext') ],
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|ttf|eot|svg)$/,
        use: [ 'url-loader' ]
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin()
  ]
};
