import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import copy from 'copy-to-clipboard';
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
import { getPermalink, getShareLink } from '../modules/link/util';
import getSelectedDate from '../modules/date/selectors';
import Checkbox from '../components/util/checkbox';
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
    const { requestShortLink, mock } = this.props;
    const link = this.getPermalink();
    const location = getShortenRequestString(mock, link);
    return requestShortLink(location);
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
    const {
      activeTab,
    } = this.state;

    return (
      <Nav tabs>
        <NavItem>
          <NavLink onClick={() => this.setActiveTab('link')} active={activeTab === 'link'}>Link</NavLink>
        </NavItem>
        <NavItem>
          <NavLink onClick={() => this.setActiveTab('embed')} active={activeTab === 'embed'}>Embed</NavLink>
        </NavItem>
        <NavItem>
          <NavLink onClick={() => this.setActiveTab('social')} active={activeTab === 'social'}>Social</NavLink>
        </NavItem>
      </Nav>
    );
  }

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
            <InputGroup>
              <Input
                type="text"
                value={value}
                name="permalink_content"
                id="permalink_content"
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon addonType="append">
                <Button
                  id="copy-to-clipboard-button"
                  onClick={() => this.copyToClipboard(value)}
                  onTouchEnd={() => this.copyToClipboard(value)}
                >
                  COPY
                </Button>
              </InputGroupAddon>
            </InputGroup>
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

    return (
      <TabPane tabId="embed" className="share-tab-embed">
        {activeTab === 'embed' && (
          <>
            <p>
              Embed Worldview in your website. See our
              {' '}
              <a className="share-embed-doc-link" href="https://github.com/nasa-gibs/worldview/blob/main/doc/embed.md" target="_blank" rel="noopener noreferrer">documentation</a>
              {' '}
              for a guide.
            </p>
            <InputGroup>
              <Input
                type="text"
                value={embedValue}
                name="permalink_content"
                id="permalink_content"
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon addonType="append">
                <Button
                  id="copy-to-clipboard-button"
                  onClick={() => this.copyToClipboard(embedValue)}
                  onTouchEnd={() => this.copyToClipboard(embedValue)}
                >
                  COPY
                </Button>
              </InputGroupAddon>
            </InputGroup>
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
            <p>
              Share Worldview on social media.
            </p>
            <ShareLinks onClick={this.onLinkClick} />
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
  const { config } = state;

  return {
    shortLink: state.shortLink,
    selectedDate: getSelectedDate(state),
    mock:
      config.parameters && config.parameters.shorten
        ? config.parameters.shorten
        : '',
  };
}
const mapDispatchToProps = (dispatch) => ({
  requestShortLink: (location, options) => dispatch(
    requestShortLink(location, 'application/json', null, options),
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  mock: PropTypes.string,
  requestShortLink: PropTypes.func,
  selectedDate: PropTypes.object,
  shortLink: PropTypes.object,
};
