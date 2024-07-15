import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import copy from 'copy-to-clipboard';
import {
  startCase as lodashStartCase,
} from 'lodash';
import {
  Input,
  InputGroup,
  Button,
  Nav, NavItem, NavLink,
  TabContent, TabPane,
} from 'reactstrap';
import googleTagManager from 'googleTagManager';
import ShareToolTips from '../components/toolbar/share/tooltips';
import {
  getPermalink, wrapWithIframe,
} from '../modules/link/util';
import onClickFeedback from '../modules/feedback/util';
import initFeedback from '../modules/feedback/actions';
import { getSelectedDate } from '../modules/date/selectors';
import Checkbox from '../components/util/checkbox';
import HoverTooltip from '../components/util/hover-tooltip';
import { requestShortLink } from '../modules/link/actions';
import history from '../main';

const getShortenRequestString = (mock, permalink) => {
  const mockStr = mock || '';
  if (/localhost/.test(window.location.href)) {
    return 'mock/short_link.json';
  }
  return (
    `service/link/shorten${
      mockStr
    }?url=${
      encodeURIComponent(permalink)}`
  );
};

const DESKTOP_SHARE_TABS = ['link', 'embed', 'cite-us'];
const MOBILE_SHARE_TABS = ['link', 'cite-us'];

class ShareLinkContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'link',
      shortLinkKey: '',
      isShort: false,
      tooltipToggleTime: 0,
      tooltipErrorTime: 0,
      queryString: history.location.search || '',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { shortLink } = nextProps;
    const errorNoResponse = shortLink.response === null;
    const errorExplicit = shortLink.error;
    if ((errorNoResponse || errorExplicit) && prevState.isShort) {
      return {
        isShort: false,
        tooltipErrorTime: Date.now(),
      };
    }
    return null;
  }

  componentDidMount() {
    this.unlisten = history.listen((location, action) => {
      const newString = location.search;
      const { queryString } = this.state;
      if (newString === undefined) { return; }
      if (queryString !== newString) {
        this.setState({
          queryString: newString,
          isShort: false,
          shortLinkKey: '',
        });
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (history.location.search !== prevState.queryString) {
      this.setState({
        queryString: history.location.search || '',
      });
    }
  }

  componentWillUnmount() {
    if (this.unlisten) this.unlisten();
  }

  getShortLink = () => {
    const { requestShortLinkAction, mock } = this.props;
    const link = this.getPermalink();
    const location = getShortenRequestString(mock, link);
    return requestShortLinkAction(location);
  };

  onToggleShorten = () => {
    const { shortLinkKey, isShort, queryString } = this.state;
    if (!isShort && shortLinkKey !== queryString) {
      this.getShortLink().then(() => {
        googleTagManager.pushEvent({
          event: 'share_link_shorten',
        });
        this.setState({
          shortLinkKey: queryString,
          isShort: !isShort,
        });
      });
    } else {
      this.setState({
        isShort: !isShort,
      });
    }
  };

  copyToClipboard = (url) => {
    const { activeTab } = this.state;
    const options = window.clipboardData ? {} : { format: 'text/plain' };
    googleTagManager.pushEvent({
      event: 'share_link_copy',
      link_type: activeTab,
    });
    options.onCopy = () => {
      this.setState({
        tooltipToggleTime: Date.now(),
      });
    };
    copy(url, options);
  };

  getPermalink = (isEmbed) => {
    const { queryString } = this.state;
    const { selectedDate } = this.props;
    return getPermalink(queryString, selectedDate, isEmbed);
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  openFeedback = () => {
    const {
      isMobile,
      feedbackIsInitiated,
      feedbackEnabled,
      sendFeedback,
    } = this.props;
    if (feedbackEnabled) sendFeedback(feedbackIsInitiated, isMobile);
  };

  renderNavTabs = () => {
    const { embedDisableNavLink, isMobile } = this.props;
    const { activeTab } = this.state;
    const isDisabled = {
      embed: embedDisableNavLink,
    };
    const shareTabs = isMobile ? MOBILE_SHARE_TABS : DESKTOP_SHARE_TABS;
    return (
      <Nav tabs>
        {shareTabs.map((type) => {
          const navTitle = lodashStartCase(type);
          const navDisabledMessage = `${navTitle} is not available when the current application features are in use.`;
          const navTitleClass = `${type}-share-nav`;
          return (
            <NavItem key={type} className={navTitleClass}>
              <NavLink
                onClick={() => this.setActiveTab(type)}
                active={activeTab === type}
                disabled={isDisabled[type]}
              >
                {isDisabled[type] && (
                  <HoverTooltip
                    isMobile={isMobile}
                    labelText={navDisabledMessage}
                    target={`.${navTitleClass}`}
                    placement="top"
                  />
                )}
                {navTitle}
              </NavLink>
            </NavItem>
          );
        })}
      </Nav>
    );
  };

  renderInputGroup = (value, type) => (
    <InputGroup>
      <Input
        type="text"
        value={value}
        name={`permalink-content-${type}`}
        id={`permalink-content-${type}`}
        onChange={(e) => {
          e.preventDefault();
        }}
      />
      <Button
        id={`copy-to-clipboard-button-${type}`}
        onClick={() => this.copyToClipboard(value)}
        onTouchEnd={() => this.copyToClipboard(value)}
      >
        COPY
      </Button>
    </InputGroup>
  );

  renderTextareaGroup = (value, type) => (
    <InputGroup>
      <textarea
        value={value}
        name={`permalink-content-${type}`}
        id={`permalink-content-${type}`}
        className="form-control"
        onChange={(e) => {
          e.preventDefault();
        }}
      />
      <Button
        id={`copy-to-clipboard-button-${type}`}
        onClick={() => this.copyToClipboard(value)}
        onTouchEnd={() => this.copyToClipboard(value)}
      >
        COPY
      </Button>
    </InputGroup>
  );

  renderLinkTab = () => {
    const { shortLink, urlShortening } = this.props;
    const {
      activeTab,
      isShort,
    } = this.state;
    const value = shortLink.isLoading && isShort
      ? 'Please wait...'
      : isShort
          && shortLink.response
          && shortLink.response.link
        ? shortLink.response.link
        : this.getPermalink();

    const url = window.location.href;
    const preventShorten = url.length > 2048;
    const isDisabled = shortLink.isLoading || preventShorten;
    const tooltipText = isDisabled ? preventShorten ? 'URL has too many characters to shorten' : 'Link cannot be shortened at this time' : '';

    return (
      <TabPane tabId="link" className="share-tab-link">
        {activeTab === 'link' && (
          <>
            {this.renderInputGroup(value, 'link')}
            <p>
              Copy URL to share link.
            </p>
            {' '}
            {urlShortening && (
              <Checkbox
                label="Shorten link"
                id="wv-link-shorten"
                onCheck={!preventShorten ? this.onToggleShorten : null}
                checked={isShort}
                disabled={isDisabled}
                title={tooltipText}
              />
            )}
          </>
        )}
      </TabPane>
    );
  };

  renderEmbedTab = () => {
    const {
      activeTab,
    } = this.state;
    const embedValue = this.getPermalink(true);
    const embedIframeHTMLCode = wrapWithIframe(embedValue);

    return (
      <TabPane tabId="embed" className="share-tab-embed">
        {activeTab === 'embed' && (
          <>
            {this.renderInputGroup(embedIframeHTMLCode, 'embed')}
            <p>
              Please
              {' '}
              <a onClick={this.openFeedback} id="feedback-url">contact us</a>
              {' '}
              to enable Worldview embedding on your website.
            </p>
            <p>
              View the
              {' '}
              <a href="https://nasa-gibs.github.io/gibs-api-docs/" target="_blank" rel="noopener noreferrer" id="api-doc-url">API documentation</a>
              {' '}
              to learn how to directly access the imagery via GIBS.
            </p>
          </>
        )}
      </TabPane>
    );
  };

  renderCiteUsTab = () => {
    const {
      activeTab,
    } = this.state;
    const citeUsValue = 'We acknowledge the use of imagery from the NASA Worldview application (https://worldview.earthdata.nasa.gov), part of the NASA Earth Science Data and Information System (ESDIS).';

    return (
      <TabPane tabId="cite-us" className="share-tab-cite-us">
        {activeTab === 'cite-us' && (
          <>
            {this.renderTextareaGroup(citeUsValue, 'cite-us')}
          </>
        )}
      </TabPane>
    );
  };

  render() {
    const {
      activeTab,
      tooltipErrorTime,
      tooltipToggleTime,
    } = this.state;

    return (
      <div className={`share-body${activeTab === 'embed' ? '-tall' : ''}`}>
        <ShareToolTips
          activeTab={activeTab}
          tooltipErrorTime={tooltipErrorTime}
          tooltipToggleTime={tooltipToggleTime}
        />
        <div className="share-nav-container">
          {this.renderNavTabs()}
          <TabContent activeTab={activeTab}>
            {this.renderLinkTab()}
            {this.renderEmbedTab()}
            {this.renderCiteUsTab()}
          </TabContent>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    screenSize, config, shortLink, sidebar, tour, feedback,
  } = state;

  const { features: { urlShortening } } = config;
  const isMobile = screenSize.isMobileDevice;
  const embedDisableNavLink = sidebar.activeTab === 'download' || tour.active;
  const { features: { feedback: feedbackEnabled } } = config;

  return {
    feedbackEnabled,
    feedbackIsInitiated: feedback.isInitiated,
    urlShortening,
    embedDisableNavLink,
    isMobile,
    shortLink,
    selectedDate: getSelectedDate(state),
    mock:
      config.parameters && config.parameters.shorten
        ? config.parameters.shorten
        : '',
  };
}
const mapDispatchToProps = (dispatch) => ({
  requestShortLinkAction: (location, options) => dispatch(
    requestShortLink(location, 'application/json', null, options),
  ),
  sendFeedback: (isInitiated, isMobile) => {
    onClickFeedback(isInitiated, isMobile);
    if (!isInitiated) {
      dispatch(initFeedback());
    }
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  embedDisableNavLink: PropTypes.bool,
  feedbackIsInitiated: PropTypes.bool,
  feedbackEnabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  mock: PropTypes.string,
  requestShortLinkAction: PropTypes.func,
  selectedDate: PropTypes.object,
  sendFeedback: PropTypes.func,
  shortLink: PropTypes.object,
  urlShortening: PropTypes.bool,
};
