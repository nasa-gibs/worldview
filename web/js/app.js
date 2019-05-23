import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { each as lodashEach } from 'lodash';
import googleTagManager from 'googleTagManager';
// Utils
import util from './util/util';
import OlCoordinates from './components/map/ol-coordinates';
// Toolbar
import Toolbar from './containers/toolbar';
import Sidebar from './containers/sidebar/sidebar';
// Modal
import Modal from './containers/modal';

// Other
import Brand from './brand';

// Crutch between state systems
import { updateLegacyInitComplete } from './modules/migration/actions';

// actions
// import { screenResize } from './modules/browser/actions';
import { calculateResponsiveState } from 'redux-responsive';
import Tour from './containers/tour';
import Timeline from './containers/timeline/timeline';
// import AnimationWidget from './containers/animation-widget';
import ErrorBoundary from './containers/error-boundary';
import Debug from './components/util/debug';

// Dependency CSS
import '../../node_modules/bootstrap/dist/css/bootstrap.css';
import '../../node_modules/jquery-ui-bundle/jquery-ui.structure.css';
import '../../node_modules/jquery-ui-bundle/jquery-ui.theme.css';
import '../../node_modules/icheck/skins/square/grey.css';
import '../../node_modules/icheck/skins/square/red.css';
import '../../node_modules/icheck/skins/line/red.css';
import '../../node_modules/jscrollpane/style/jquery.jscrollpane.css';
import '../../node_modules/perfect-scrollbar/dist/css/perfect-scrollbar.css';
import '../ext/mobiscroll-2.6.0/mobiscroll.css';
import '../../node_modules/jquery-jcrop/css/jquery.Jcrop.css';
import '../../node_modules/ol/ol.css';
import '../../node_modules/rc-slider/dist/rc-slider.css';
import '../../node_modules/simplebar/dist/simplebar.css';
import '../../node_modules/@fortawesome/fontawesome-free/css/all.css';
import 'react-image-crop/dist/ReactCrop.css';
// App CSS
import '../css/fonts.css';
import '../css/reset.css';
import '../css/compare.css';
import '../css/jquery-ui-override.css';
import '../css/rc-slider-overrides.css';
import '../css/util.css';
import '../css/toolbar.css';
import '../css/notifications.css';
import '../css/sidebar-panel.css';
import '../css/button.css';
import '../css/checkbox.css';
import '../css/map.css';
import '../css/link.css';
import '../css/palettes.css';
import '../css/image.css';
import '../css/debug.css';
import '../css/projection.css';
import '../css/date.css';
import '../css/menuPicker.css';
import '../css/tour.css';
import '../css/products.css';
import '../css/indicator.css';
import '../css/events.css';
import '../css/dataDownload.css';
import '../css/sidebar.css';
import '../css/layers.css';
import '../css/scrollbar.css';
import '../css/timeline.css';
import '../css/anim.widget.css';
import '../css/dateselector.css';
import '../css/tooltip.css';
import '../css/mobile.css';
import '../css/modal.css';
import '../css/list.css';
import '../pages/css/document.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.onload();
  }
  render() {
    //  const { config } = this.props;
    return (
      <div className="wv-content" id="wv-content" data-role="content">
        <Toolbar />
        <Sidebar />
        <Tour />
        <div id="layer-modal" className="layer-modal" />
        <div id="layer-settings-modal" />
        <div id="wv-map" className="wv-map" />
        <div id="eventsHolder" />
        <div id="imagedownload" />
        <div id="dlMap" />

        <div id="timewheels" style={{ display: 'none' }} />
        <Timeline />
        <OlCoordinates mouseEvents={this.props.mapMouseEvents} />
        {/* <div id="wv-animation-widet-case"> */}
          {/* {config.features.animation ? <AnimationWidget /> : ''} */}
        {/* </div> */}
        <Modal />
        <ErrorBoundary>
          <Debug parameters={this.props.parameters} />
        </ErrorBoundary>
      </div>
    );
  }

  onload() {
    var self = this;
    var config;
    var state = self.props.parameters;

    config = self.props.config;
    config.parameters = state;

    const main = function() {
      const models = self.props.models;

      // Load any additional scripts as needed
      if (config.scripts) {
        lodashEach(config.scripts, function(script) {
          $.getScript(script);
        });
      }
      if (config.features.googleTagManager) {
        googleTagManager.init(config.features.googleTagManager.id); // Insert google tag manager
      }

      // Console notifications
      if (Brand.release()) {
        console.info(
          Brand.NAME +
            ' - Version ' +
            Brand.VERSION +
            ' - ' +
            Brand.BUILD_TIMESTAMP
        );
      } else {
        console.warn('Development version');
      }
      window.addEventListener('resize', () => {
        self.props.screenResize(window);
      });
      self.props.screenResize(window);
      models.wv.events.trigger('startup');
      self.props.updateLegacyInitComplete(); // notify state that legacy initiation has finished
    };
    util.wrap(main)();
  }
}
function mapStateToProps(state, ownProps) {
  return {
    legacy: state.legacy,
    state: state,
    config: state.config,
    parameters: state.parameters,
    models: ownProps.models,
    mapMouseEvents: ownProps.mapMouseEvents
  };
}
const mapDispatchToProps = dispatch => ({
  updateLegacyInitComplete: () => {
    dispatch(updateLegacyInitComplete());
  },
  screenResize: (width, height) => {
    dispatch(calculateResponsiveState(window));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
App.propTypes = {
  mapMouseEvents: PropTypes.object
};
