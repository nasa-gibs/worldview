import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import copy from 'copy-to-clipboard';
import {
  startCase as lodashStartCase,
} from 'lodash';
import {
  InputGroupAddon,
  Input,
  InputGroup,
  Button,
  Nav, NavItem, NavLink,
  TabContent, TabPane,
} from 'reactstrap';
import ShareLinks from '../components/toolbar/share/links';
import ShareToolTips from '../components/toolbar/share/tooltips';
import { getPermalink, getShareLink, wrapWithIframe } from '../modules/link/util';
import getSelectedDate from '../modules/date/selectors';
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
    `service/link/shorten.cgi${
      mockStr
    }?url=${
      encodeURIComponent(permalink)}`
  );
};

const SOCIAL_SHARE_TABS = ['link', 'embed', 'social'];

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
      if (queryString !== newString) {
        this.setState({
          queryString: newString,
          isShort: false,
          shortLinkKey: '',
        });
      }
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
  }

  onToggleShorten = () => {
    const { shortLinkKey, isShort, queryString } = this.state;
    if (!isShort && shortLinkKey !== queryString) {
      this.getShortLink().then(() => {
        googleTagManager.pushEvent({
          event: 'social_link_shorten',
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
  }

  copyToClipboard = (url) => {
    const options = window.clipboardData ? {} : { format: 'text/plain' };
    options.onCopy = () => {
      this.setState({
        tooltipToggleTime: Date.now(),
      });
    };
    copy(url, options);
  }

  getPermalink = (isEmbed) => {
    const { queryString } = this.state;
    const { selectedDate } = this.props;
    return getPermalink(queryString, selectedDate, isEmbed);
  }

  onLinkClick = (type) => {
    const permalink = this.getPermalink();
    let shareLink = getShareLink(type, permalink);

    googleTagManager.pushEvent({
      event: 'social_share_platform',
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
  }

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  }

  renderNavTabs = () => {
    const { embedDisableNavLink, isMobile } = this.props;
    const { activeTab } = this.state;
    const isDisabled = {
      embed: embedDisableNavLink,
    };
    return (
      <Nav tabs>
        {SOCIAL_SHARE_TABS.map((type) => {
          const navTitle = lodashStartCase(type);
          const navDisabledMessage = `${navTitle} is not available when the current application features are in use.`;
          const navTitleClass = `${navTitle}-nav`;
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
  }

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
      <InputGroupAddon addonType="append">
        <Button
          id={`copy-to-clipboard-button-${type}`}
          onClick={() => this.copyToClipboard(value)}
          onTouchEnd={() => this.copyToClipboard(value)}
        >
          COPY
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )

  renderLinkTab = () => {
    const { shortLink } = this.props;
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

    return (
      <TabPane tabId="link" className="share-tab-link">
        {activeTab === 'link' && (
          <>
            {this.renderInputGroup(value, 'link')}
            <p>
              Copy URL to share link.
            </p>
            {' '}
            <Checkbox
              label="Shorten link"
              id="wv-link-shorten"
              onCheck={this.onToggleShorten}
              checked={isShort}
              disabled={!shortLink.isLoading}
            />
            {/* {this.renderInputGroup(value, 'link')} */}
          </>
        )}
      </TabPane>
    );
  }

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
              Embed Worldview in your website. See our
              {' '}
              <a className="share-embed-doc-link" href="https://github.com/nasa-gibs/worldview/blob/main/doc/embed.md" target="_blank" rel="noopener noreferrer">documentation</a>
              {' '}
              for a guide.
            </p>
            {/* {this.renderInputGroup(embedIframeHTMLCode, 'embed')} */}
          </>
        )}
      </TabPane>
    );
  }

  renderSocialTab = () => {
    const {
      activeTab,
    } = this.state;

    return (
      <TabPane tabId="social" className="share-tab-social">
        {activeTab === 'social' && (
          <>
            <ShareLinks onClick={this.onLinkClick} />
            <p>
              Share Worldview on social media.
            </p>
          </>
        )}
      </TabPane>
    );
  }

  render() {
    const {
      activeTab,
      tooltipErrorTime,
      tooltipToggleTime,
    } = this.state;

    return (
      <>
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
              {this.renderEmbedTab()}
              {this.renderSocialTab()}
            </TabContent>
          </div>
        </div>
      </>
    );
  }
}

function mapStateToProps(state) {
  const {
    browser, config, shortLink, sidebar, tour,
  } = state;

  const isMobile = browser.lessThan.medium;
  const embedDisableNavLink = sidebar.activeTab === 'download' || tour.active;
  return {
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
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  embedDisableNavLink: PropTypes.bool,
  isMobile: PropTypes.bool,
  mock: PropTypes.string,
  requestShortLinkAction: PropTypes.func,
  selectedDate: PropTypes.object,
  shortLink: PropTypes.object,
};
