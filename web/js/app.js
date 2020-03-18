import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { each as lodashEach } from 'lodash';
// eslint-disable-next-line no-unused-vars
import whatInput from 'what-input';

// eslint-disable-next-line import/no-unresolved
import googleTagManager from 'googleTagManager';

// Utils
import { calculateResponsiveState } from 'redux-responsive';
import util from './util/util';
// eslint-disable-next-line import/no-named-as-default
import MapInteractions from './containers/map-interactions';
// Toolbar
import Toolbar from './containers/toolbar';
import Sidebar from './containers/sidebar/sidebar';
// Modal
import Modal from './containers/modal';

// Other
import Brand from './brand';
import MeasureButton from './components/measure-tool/measure-button';
import FeatureAlert from './components/feature-alert/alert';

// actions
import Tour from './containers/tour';
import Timeline from './containers/timeline/timeline';
import AnimationWidget from './containers/animation-widget';
import ErrorBoundary from './containers/error-boundary';
import Debug from './components/util/debug';

// Dependency CSS
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../../node_modules/jquery-ui-bundle/jquery-ui.structure.min.css';
import '../../node_modules/jquery-ui-bundle/jquery-ui.theme.min.css';
import '../../node_modules/ol/ol.css';
import '../../node_modules/rc-slider/dist/rc-slider.min.css';
import '../../node_modules/simplebar/dist/simplebar.min.css';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-resizable/css/styles.css';
// App CSS
import '../css/fonts.css';
import '../css/alert.css';
import '../css/reset.css';
import '../css/compare.css';
import '../css/jquery-ui-override.css';
import '../css/rc-slider-overrides.css';
import '../css/util.css';
import '../css/toolbar.css';
import '../css/notifications.css';
import '../css/sidebar-panel.css';
import '../css/button.css';
import '../css/modal.css';
import '../css/checkbox.css';
import '../css/map.css';
import '../css/link.css';
import '../css/palettes.css';
import '../css/image.css';
import '../css/debug.css';
import '../css/projection.css';
import '../css/menuPicker.css';
import '../css/tour.css';
import '../css/products.css';
import '../css/indicator.css';
import '../css/events.css';
import '../css/dataDownload.css';
import '../css/sidebar.css';
import '../css/layers.css';
import '../css/scrollbar.css';
import '../css/switch.css';
import '../css/timeline.css';
import '../css/anim.widget.css';
import '../css/dateselector.css';
import '../css/tooltip.css';
import '../css/mobile.css';
import '../css/measure.css';
import '../css/list.css';
import '../css/vectorMeta.css';
import '../css/geostationary-modal.css';
import '../css/orbitTracks.css';
import '../pages/css/document.css';
import { keyPress } from './modules/key-press/actions';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.onload();
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleKeyPress(event) {
    const ctrlOrCmdKey = event.ctrlKey || event.metaKey;
    this.props.keyPressAction(event.keyCode, event.shiftKey, ctrlOrCmdKey);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyPress);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  render() {
    const {
      isAnimationWidgetActive, isTourActive, locationKey, modalId, mapMouseEvents,
    } = this.props;

    return (
      <div className="wv-content" id="wv-content" data-role="content">
        <Toolbar />
        <MapInteractions mouseEvents={mapMouseEvents} />
        <div id="wv-alert-container" className="wv-alert-container">
          <FeatureAlert />
        </div>
        <Sidebar />
        {isTourActive ? <Tour /> : null}
        <div id="layer-modal" className="layer-modal" />
        <div id="layer-settings-modal" />
        <div id="eventsHolder" />
        <div id="imagedownload" />
        <div id="dlMap" />
        <Timeline key={locationKey || '1'} />
        <div id="wv-animation-widet-case">
          {isAnimationWidgetActive ? <AnimationWidget key={locationKey || '2'} /> : null}
        </div>
        <MeasureButton />

        <Modal key={modalId} />
        <ErrorBoundary>
          <Debug parameters={this.props.parameters} />
        </ErrorBoundary>
      </div>
    );
  }

  onload() {
    const self = this;
    let config;
    const state = self.props.parameters;

    config = self.props.config;
    config.parameters = state;

    // get user IP address for GTM/GA using https://www.ipify.org/ API
    const getIpAddress = async() => {
      const response = await fetch('https://api.ipify.org?format=json');
      const json = await response.json();
      const ipAddress = json.ip;

      googleTagManager.pushEvent({
        event: 'ipAddress',
        ipAddress,
      });
    };

    const main = function() {
      const { models } = self.props;

      // Load any additional scripts as needed
      if (config.scripts) {
        lodashEach(config.scripts, (script) => {
          $.getScript(script);
        });
      }
      if (config.features.googleTagManager) {
        googleTagManager.init(config.features.googleTagManager.id); // Insert google tag manager
        getIpAddress();
      }

      // Console notifications
      if (Brand.release()) {
        console.info(
          `${Brand.NAME
          } - Version ${
            Brand.VERSION
          } - ${
            Brand.BUILD_TIMESTAMP}`,
        );
      } else {
        console.warn('Development version');
      }
      window.addEventListener('resize', () => {
        self.props.screenResize(window);
      });
      self.props.screenResize(window);
      models.wv.events.trigger('startup');
    };
    util.wrap(main)();
  }
}
function mapStateToProps(state, ownProps) {
  return {
    state,
    isAnimationWidgetActive: state.animation.isActive,
    isTourActive: state.tour.active,
    tour: state.tour,
    config: state.config,
    parameters: state.parameters,
    models: ownProps.models,
    mapMouseEvents: ownProps.mapMouseEvents,
    locationKey: state.location.key,
    modalId: state.modal.id,
  };
}
const mapDispatchToProps = (dispatch) => ({
  keyPressAction: (keyCode, shiftKey, ctrlOrCmdKey) => {
    dispatch(keyPress(keyCode, shiftKey, ctrlOrCmdKey));
  },
  screenResize: (width, height) => {
    dispatch(calculateResponsiveState(window));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
App.propTypes = {
  isAnimationWidgetActive: PropTypes.bool,
  isTourActive: PropTypes.bool,
  keyPressAction: PropTypes.func,
  locationKey: PropTypes.string,
  mapMouseEvents: PropTypes.object,
  modalId: PropTypes.string,
  parameters: PropTypes.object,
  state: PropTypes.object,
};
