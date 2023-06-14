import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
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
import ShareLinks from '../components/toolbar/share/links';
import ShareToolTips from '../components/toolbar/share/tooltips';
import {
  getPermalink, getShareLink, wrapWithIframe,
} from '../modules/link/util';
import { getSelectedDate } from '../modules/date/selectors';
import Checkbox from '../components/util/checkbox';
import HoverTooltip from '../components/util/hover-tooltip';
import { requestShortLink } from '../modules/link/actions';
import history from '../main';
import {
  getDownloadUrl,
} from '../modules/image-download/util';
import {
  getLayers,
} from '../modules/layers/selectors';

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

const SOCIAL_SHARE_TABS = ['link', 'social'];

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
      downloadUrl: '',
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

    const {
      bbox, getLayers, height, imageDownload, locationSearch, proj, width, selectedDate,
    } = this.props;
    const { isWorldfile, fileType } = imageDownload;
    const markerCoordinates = locationSearch.coordinates;
    const url = 'https://wvs.earthdata.nasa.gov/api/v1/snapshot';
    const lonlats = [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ];
    const layerDefs = getLayers();
    const downloadURL = getDownloadUrl(url, proj, layerDefs, lonlats, { width, height }, selectedDate, fileType, isWorldfile, markerCoordinates);
    this.setState({
      downloadUrl: downloadURL,
    });
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

  onLinkClick = (type) => {
    const permalink = this.getPermalink();
    let shareLink = getShareLink(type, permalink);

    googleTagManager.pushEvent({
      event: 'share_social_platform',
      social_type: type,
    });

    // If a short link can be generated, replace the full link.
    if (type === 'twitter') {
      const newTab = window.open('', '_blank');
      this.getShortLink().then(({ link }) => {
        shareLink = getShareLink(type, link);
      }).finally(() => {
        newTab.location = shareLink;
      });
    } else if (type === 'email') {
      this.getShortLink().then(({ link }) => {
        shareLink = getShareLink(type, link);
      }).finally(() => {
        window.location = shareLink;
      });
    } else {
      window.open(shareLink, '_blank');
    }
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  renderNavTabs = () => {
    const { embedDisableNavLink, isMobileDevice } = this.props;
    const { activeTab } = this.state;
    const isDisabled = {
      embed: embedDisableNavLink,
    };
    return (
      <Nav tabs>
        {SOCIAL_SHARE_TABS.map((type) => {
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
                    isMobileDevice={isMobileDevice}
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

  renderLinkTab = () => {
    const { shortLink, urlShortening } = this.props;
    const {
      activeTab,
      isShort,
      downloadUrl,
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
      <>
        <TabPane tabId="link" className="share-tab-link">
          {activeTab === 'link' && (
          <>
            {this.renderInputGroup(value, 'link')}
            <div className="link-parent">
              <div>
                Copy URL to share link.
              </div>
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
            </div>
          </>
          )}
        </TabPane>
        <div className="share-img-preview-container"><img className="share-img-preview" src={downloadUrl} /></div>
      </>
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
              Embed @NAME@ in your website. See our
              {' '}
              <a id="share-embed-doc-link" className="share-embed-doc-link" href="https://github.com/nasa-gibs/worldview/blob/main/doc/embed.md" target="_blank" rel="noopener noreferrer">documentation</a>
              {' '}
              for a guide.
            </p>
          </>
        )}
      </TabPane>
    );
  };

  renderSocialTab = () => {
    const { isMobileDevice } = this.props;
    const {
      activeTab,
    } = this.state;

    return (
      <TabPane tabId="social" className="share-tab-social">
        {activeTab === 'social' && (
          <>
            <ShareLinks
              isMobileDevice={isMobileDevice}
              onClick={this.onLinkClick}
            />
            <p>
              Share @NAME@ on social media.
            </p>
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
      <div className="share-body">
        <ShareToolTips
          activeTab={activeTab}
          tooltipErrorTime={tooltipErrorTime}
          tooltipToggleTime={tooltipToggleTime}
        />
        <div className="share-nav-container">
          {this.renderNavTabs()}
          <TabContent activeTab={activeTab}>
            {this.renderLinkTab()}
            {/* {this.renderEmbedTab()} */}
            {this.renderSocialTab()}
          </TabContent>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    screenSize, config, imageDownload, locationSearch, map, proj, shortLink, sidebar, tour,
  } = state;
  const bbox = map.extent;
  const { features: { urlShortening } } = config;
  const { isMobileDevice, screenHeight: height, screenWidth: width } = screenSize;
  const embedDisableNavLink = sidebar.activeTab === 'download' || tour.active;
  return {
    bbox,
    embedDisableNavLink,
    height,
    imageDownload,
    isMobileDevice,
    locationSearch,
    proj,
    selectedDate: getSelectedDate(state),
    shortLink,
    urlShortening,
    width,
    mock:
      config.parameters && config.parameters.shorten
        ? config.parameters.shorten
        : '',
    getLayers: () => getLayers(
      state,
      {
        reverse: true,
        renderable: true,
      },
    ),
  };
}
const mapDispatchToProps = (dispatch) => ({
  requestShortLinkAction: (location, options) => dispatch(
    requestShortLink(location, 'application/json', null, options),
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  bbox: PropTypes.array,
  embedDisableNavLink: PropTypes.bool,
  imageDownload: PropTypes.object,
  isMobileDevice: PropTypes.bool,
  mock: PropTypes.string,
  locationSearch: PropTypes.object,
  proj: PropTypes.object,
  requestShortLinkAction: PropTypes.func,
  height: PropTypes.number,
  width: PropTypes.number,
  selectedDate: PropTypes.object,
  shortLink: PropTypes.object,
  urlShortening: PropTypes.bool,
};
