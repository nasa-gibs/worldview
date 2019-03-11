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
// Modal
import Modal from './containers/modal';
// Notifications
import {
  STATUS_REQUEST_URL,
  REQUEST_NOTIFICATIONS
} from './modules/notifications/constants';
import {
  requestNotifications,
  setNotifications
} from './modules/notifications/actions';
// Other
import Brand from './brand';
import { debugConfig } from './debug';

// Crutch between state systems
import { updateLegacyInitComplete } from './modules/migration/actions';
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
    return (
      <div className="wv-content" id="wv-content" data-role="content">
        <Toolbar />
        <section id="wv-sidebar" />
        <div id="layer-modal" className="layer-modal" />
        <div id="layer-settings-modal" />
        <div id="wv-map" className="wv-map" />
        <div id="eventsHolder" />
        <div id="imagedownload" />
        <div id="dlMap" />

        <div id="timewheels" style={{ display: 'none' }} />

        <section
          id="timeline"
          className="timeline-inner clearfix"
          style={{ display: 'none' }}
        >
          <div id="timeline-header">
            <div id="date-selector-main" />
            <div id="zoom-buttons-group">
              <div id="zoom-btn-container">
                <span
                  id="current-zoom"
                  className="zoom-btn zoom-btn-active"
                  data-zoom="3"
                >
                  Days
                </span>
                <div className="wv-tooltip">
                  <div id="timeline-zoom" className="timeline-zoom">
                    <span
                      id="zoom-years"
                      className="zoom-btn zoom-btn-inactive zoom-years"
                      data-zoom="1"
                    >
                      Years
                    </span>
                    <span
                      id="zoom-months"
                      className="zoom-btn zoom-btn-inactive zoom-months"
                      data-zoom="2"
                    >
                      Months
                    </span>
                    <span
                      id="zoom-days"
                      className="zoom-btn zoom-btn-inactive zoom-days"
                      data-zoom="3"
                    >
                      Days
                    </span>
                    <span
                      id="zoom-minutes"
                      className="zoom-btn zoom-btn-inactive zoom-minutes"
                      data-zoom="4"
                    >
                      Minutes
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="button-action-group"
                id="left-arrow-group"
                title="Click and hold to animate backwards"
              >
                <svg id="timeline-svg" width="24" height="30">
                  <path
                    d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
                    className="arrow"
                  />
                </svg>
              </div>
              <div
                className="button-action-group"
                id="right-arrow-group"
                title="Click and hold to animate forwards"
              >
                <svg width="24" height="30">
                  <path
                    d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
                    className="arrow"
                  />
                </svg>
              </div>
            </div>
            <div
              className="button-action-group animate-button"
              id="animate-button"
              title="Set up animation"
            >
              <i id="wv-animate" className="fas fa-video wv-animate" />
            </div>
          </div>
          <div id="timeline-footer">
            <div id="wv-animation-widet-case"> </div>
          </div>
          <div id="timeline-hide">
            <svg className="hamburger" width="10" height="9">
              <path d="M 0,0 0,1 10,1 10,0 0,0 z M 0,4 0,5 10,5 10,4 0,4 z M 0,8 0,9 10,9 10,8 0,8 z" />
            </svg>
          </div>
        </section>
        <OlCoordinates mouseEvents={this.props.mapMouseEvents} />
        <Modal />
      </div>
    );
  }

  onload() {
    var self = this;
    var config;
    var state = self.props.parameters;

    config = self.props.config;
    config.parameters = state;
    debugConfig(config);
    // Load any additional scripts as needed
    if (config.scripts) {
      lodashEach(config.scripts, function(script) {
        $.getScript(script);
      });
    }
    const main = function() {
      const models = self.props.models;

      if (config.features.googleTagManager) {
        googleTagManager.init(config.features.googleTagManager.id); // Insert google tag manager
      }
      document.activeElement.blur();
      $('input').blur();
      $('#eventsHolder').hide();

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

      models.wv.events.trigger('startup');

      // Reset Worldview when clicking on logo
      $(document).click(function(e) {
        if (e.target.id === 'wv-logo') resetWorldview(e);
      });
      self.props.updateLegacyInitComplete();
    };

    var resetWorldview = function(e) {
      e.preventDefault();
      if (window.location.search === '') return; // Nothing to reset
      var msg =
        'Do you want to reset Worldview to its defaults? You will lose your current state.';
      if (confirm(msg)) document.location.href = '/';
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
  requestNotifications: location => {
    const promise = dispatch(
      requestNotifications(location, REQUEST_NOTIFICATIONS, 'json')
    );
    promise.then(data => {
      const obj = JSON.parse(data);
      if (obj.notifications) {
        dispatch(setNotifications(obj.notifications));
      }
    });
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
App.propTypes = {
  mapMouseEvents: PropTypes.object
};
