import { useState, useEffect, useRef } from 'react';
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
  getPermalink as getPermalinkFunc,
  wrapWithIframe,
} from '../modules/link/util';
import onClickFeedback from '../modules/feedback/util';
import initFeedback from '../modules/feedback/actions';
import { getSelectedDate } from '../modules/date/selectors';
import Checkbox from '../components/util/checkbox';
import HoverTooltip from '../components/util/hover-tooltip';
import { requestShortLink } from '../modules/link/actions';
import history from '../main';
import usePrevious from '../util/customHooks';

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

function ShareLinkContainer(props) {
  const {
    requestShortLinkAction,
    mock,
    selectedDate,
    isMobile,
    feedbackIsInitiated,
    feedbackEnabled,
    sendFeedback,
    embedDisableNavLink,
    shortLink,
    urlShortening,
  } = props;

  const [activeTab, setActiveTab] = useState('link');
  const [shortLinkKey, setShortLinkKey] = useState('');
  const [isShort, setIsShort] = useState(false);
  const [tooltipToggleTime, setTooltipToggleTime] = useState(0);
  const [tooltipErrorTime, setTooltipErrorTime] = useState(0);
  const [queryString, setQueryString] = useState(history.location.search || '');

  const unlistenRef = useRef();

  const prevQueryString = usePrevious(queryString);

  useEffect(() => {
    unlistenRef.current = history.listen((location, action) => {
      const newString = location.search;
      if (newString === undefined) { return; }
      if (queryString !== newString) {
        setQueryString(newString);
        setIsShort(false);
        setShortLinkKey('');
      }
    });

    return () => {
      if (unlistenRef.current) unlistenRef.current();
    };
  }, []);

  useEffect(() => {
    if (history.location.search !== prevQueryString) {
      setQueryString(history.location.search || '');
    }
  }, [history.location.search]);

  useEffect(() => {
    const errorNoResponse = shortLink.response === null;
    const errorExplicit = shortLink.error;
    if ((errorNoResponse || errorExplicit) && isShort) {
      setIsShort(false);
      setTooltipErrorTime(Date.now());
    }
  }, [shortLink, isShort]);

  const getShortLink = () => {
    const link = getPermalink();
    const location = getShortenRequestString(mock, link);
    return requestShortLinkAction(location);
  };

  const onToggleShorten = () => {
    if (!isShort && shortLinkKey !== queryString) {
      getShortLink().then(() => {
        googleTagManager.pushEvent({
          event: 'share_link_shorten',
        });
        setShortLinkKey(queryString);
        setIsShort(!isShort);
      });
    } else {
      setIsShort(!isShort);
    }
  };

  const copyToClipboard = (url) => {
    googleTagManager.pushEvent({
      event: 'share_link_copy',
      link_type: activeTab,
    });
    copy(url, { format: 'text/plain' }).then(() => {
      setTooltipToggleTime(Date.now());
    });
  };

  const getPermalink = (isEmbed) => {
    return getPermalinkFunc(queryString, selectedDate, isEmbed);
  };

  const setActiveTabFunc = (activeTab) => {
    setActiveTab(activeTab);
  };

  const openFeedback = () => {
    if (feedbackEnabled) sendFeedback(feedbackIsInitiated, isMobile);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      return openFeedback();
    }
    return null;
  };

  const renderNavTabs = () => {
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
                onClick={() => setActiveTabFunc(type)}
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

  const renderInputGroup = (value, type) => (
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
        onClick={() => copyToClipboard(value)}
        onTouchEnd={() => copyToClipboard(value)}
      >
        COPY
      </Button>
    </InputGroup>
  );

  const renderTextareaGroup = (value, type) => (
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
        onClick={() => copyToClipboard(value)}
        onTouchEnd={() => copyToClipboard(value)}
      >
        COPY
      </Button>
    </InputGroup>
  );

  const renderLinkTab = () => {
    const shortLinkValue = isShort &&
          shortLink.response &&
          shortLink.response.link
      ? shortLink.response.link
      : getPermalink();
    const value = shortLink.isLoading && isShort
      ? 'Please wait...'
      : shortLinkValue;

    const url = window.location.href;
    const preventShorten = url.length > 2048;
    const isDisabled = shortLink.isLoading || preventShorten;
    const shortenWarning = preventShorten ? 'URL has too many characters to shorten' : 'Link cannot be shortened at this time';
    const tooltipText = isDisabled ? shortenWarning : '';

    return (
      <TabPane tabId="link" className="share-tab-link">
        {activeTab === 'link' && (
          <>
            {renderInputGroup(value, 'link')}
            <p>
              Copy URL to share link.
            </p>
            {' '}
            {urlShortening && (
              <Checkbox
                label="Shorten link"
                id="wv-link-shorten"
                onCheck={!preventShorten ? onToggleShorten : null}
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

  const renderEmbedTab = () => {
    const embedValue = getPermalink(true);
    const embedIframeHTMLCode = wrapWithIframe(embedValue);

    return (
      <TabPane tabId="embed" className="share-tab-embed">
        {activeTab === 'embed' && (
          <>
            {renderInputGroup(embedIframeHTMLCode, 'embed')}
            <p>
              Please
              {' '}
              <a role="link" tabIndex={0} onKeyDown={handleKeyDown} onClick={openFeedback} id="feedback-url">contact us</a>
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

  const renderCiteUsTab = () => {
    const citeUsValue = 'We acknowledge the use of imagery from the NASA Worldview application (https://worldview.earthdata.nasa.gov), part of the NASA Earth Science Data and Information System (ESDIS).';

    return (
      <TabPane tabId="cite-us" className="share-tab-cite-us">
        {activeTab === 'cite-us' && (
          <>
            {renderTextareaGroup(citeUsValue, 'cite-us')}
          </>
        )}
      </TabPane>
    );
  };

  return (
    <div className={`share-body${activeTab === 'embed' ? ' tall' : ''}`}>
      <ShareToolTips
        activeTab={activeTab}
        tooltipErrorTime={tooltipErrorTime}
        tooltipToggleTime={tooltipToggleTime}
      />
      <div className="share-nav-container">
        {renderNavTabs()}
        <TabContent activeTab={activeTab}>
          {renderLinkTab()}
          {renderEmbedTab()}
          {renderCiteUsTab()}
        </TabContent>
      </div>
    </div>
  );
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
  selectedDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  sendFeedback: PropTypes.func,
  shortLink: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  urlShortening: PropTypes.bool,
};
