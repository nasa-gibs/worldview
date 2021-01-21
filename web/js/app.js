import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import whatInput from 'what-input';
// import googleTagManager from 'googleTagManager';

// Utils
import { calculateResponsiveState } from 'redux-responsive';
import util from './util/util';
// eslint-disable-next-line import/no-named-as-default
import MapInteractions from './containers/map-interactions/map-interactions';
// Toolbar
import Toolbar from './containers/toolbar';
import Sidebar from './containers/sidebar/sidebar';
// Modal
import Modal from './containers/modal';
// Geosearch
import Geosearch from './components/geosearch/geosearch';

// Other/MISC
import Brand from './brand';
import MeasureButton from './components/measure-tool/measure-button';
import FeatureAlert from './components/feature-alert/alert';
import Alerts from './containers/alerts';
import './font-awesome-library';

// actions
import Tour from './containers/tour';
import Timeline from './containers/timeline/timeline';
import AnimationWidget from './containers/animation-widget';
import ErrorBoundary from './containers/error-boundary';
import Debug from './components/util/debug';
import keyPress from './modules/key-press/actions';

// Dependency CSS
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../../node_modules/ol/ol.css';
import '../../node_modules/rc-slider/dist/rc-slider.min.css';
import '../../node_modules/simplebar/dist/simplebar.min.css';
import '../../node_modules/react-swipe-to-delete-component/dist/swipe-to-delete.css';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-resizable/css/styles.css';
// App CSS
import '../css/fonts.css';
import '../css/alert.css';
import '../css/reset.css';
import '../css/compare.css';
import '../css/search-ui-override.css';
import '../css/rc-slider-overrides.css';
import '../css/react-joyride-override.css';
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
import '../css/projection.css';
import '../css/tour.css';
import '../css/products.css';
import '../css/events.css';
import '../css/smart-handoff.css';
import '../css/sidebar.css';
import '../css/layer-categories.css';
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
import '../css/facets.css';
import '../css/recent-layers.css';
import '../css/geosearch.css';
import '../pages/css/document.css';

require('@elastic/react-search-ui-views/lib/styles/styles.css');

const { events } = util;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.onload();
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.setVhCSSProperty = this.setVhCSSProperty.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyPress);
    // We listen to the resize event
    window.addEventListener('resize', this.setVhCSSProperty);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  setVhCSSProperty = () => {
    // We execute the same script as before
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  handleKeyPress(event) {
    const { keyPressAction } = this.props;
    const ctrlOrCmdKey = event.ctrlKey || event.metaKey;
    const isInput = event.srcElement.nodeName === 'INPUT';
    keyPressAction(event.keyCode, event.shiftKey, ctrlOrCmdKey, isInput);
  }

  onload() {
    const self = this;
    const state = self.props.parameters;
    const { config } = self.props;
    config.parameters = state;

    // get user IP address for GTM/GA using https://www.ipify.org/ API
    // const getIpAddress = async() => {
    //   const response = await fetch('https://api.ipify.org?format=json');
    //   const json = await response.json();
    //   const ipAddress = json.ip;

    //   googleTagManager.pushEvent({
    //     event: 'ipAddress',
    //     ipAddress,
    //   });
    // };

    const main = function() {
      // Load any additional scripts as needed
      if (config.scripts) {
        util.loadScipts(config.scripts);
      }
      // if (config.features.googleTagManager) {
      //   googleTagManager.init(config.features.googleTagManager.id); // Insert google tag manager
      //   if (!/localhost/.test(window.location.href)) {
      //     getIpAddress();
      //   }
      // }

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
      events.trigger('startup');
      self.setVhCSSProperty();
    };
    util.wrap(main)();
  }

  render() {
    const {
      isAnimationWidgetActive,
      isMobile,
      isTourActive,
      locationKey,
      modalId,
      parameters,
    } = this.props;
    return (
      <div className="wv-content" id="wv-content" data-role="content">
        {!isMobile && <Geosearch />}
        <Toolbar />
        <MapInteractions />
        <div id="wv-alert-container" className="wv-alert-container">
          <FeatureAlert />
          <Alerts />
        </div>
        <Sidebar />
        {isTourActive ? <Tour /> : null}
        <div id="layer-modal" className="layer-modal" />
        <div id="layer-settings-modal" />
        <div id="eventsHolder" />
        <div id="imagedownload" />
        <Timeline />
        <div id="wv-animation-widet-case">
          {isAnimationWidgetActive ? <AnimationWidget key={locationKey || '2'} /> : null}
        </div>
        <MeasureButton />
        <Modal key={modalId} />
        <ErrorBoundary>
          <Debug parameters={parameters} />
        </ErrorBoundary>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state,
    isAnimationWidgetActive: state.animation.isActive,
    isMobile: state.browser.lessThan.medium,
    isTourActive: state.tour.active,
    tour: state.tour,
    config: state.config,
    parameters: state.parameters,
    locationKey: state.location.key,
    modalId: state.modal.id,
  };
}
const mapDispatchToProps = (dispatch) => ({
  keyPressAction: (keyCode, shiftKey, ctrlOrCmdKey, isInput) => {
    dispatch(keyPress(keyCode, shiftKey, ctrlOrCmdKey, isInput));
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
  isMobile: PropTypes.bool,
  isTourActive: PropTypes.bool,
  keyPressAction: PropTypes.func,
  locationKey: PropTypes.string,
  modalId: PropTypes.string,
  parameters: PropTypes.object,
};
