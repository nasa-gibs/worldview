import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import googleTagManager from 'googleTagManager';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  InputGroupAddon,
  Input,
  InputGroup,
  Button,
  Tooltip,
} from 'reactstrap';
import ShareLinks from '../components/toolbar/share/links';
import { getSharelink, openPromisedSocial } from '../modules/link/util';
import Checkbox from '../components/util/checkbox';
import { requestShortLink } from '../modules/link/actions';
import history from '../main';

const getShortenRequestString = function(mock, permalink) {
  const mockStr = mock || '';
  if (/localhost/.test(window.location)) {
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
      shortLinkKey: '',
      isShort: false,
      tooltipOpen: false,
      queryString: history.location.search || '',
    };
    this.onToggleShorten = this.onToggleShorten.bind(this);
    this.onLinkClick = this.onLinkClick.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.shortLink.error && prevState.isShort) {
      return { isShort: false, showErrorTooltip: true };
    } return null;
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

  getShortLink() {
    const { requestShortLink, mock } = this.props;
    const link = this.getPermalink();
    const location = getShortenRequestString(mock, link);
    return requestShortLink(location);
  }

  onToggleShorten() {
    const { shortLinkKey, isShort, queryString } = this.state;
    if (!isShort && shortLinkKey !== queryString) {
      this.getShortLink();
      googleTagManager.pushEvent({
        event: 'social_link_shorten',
      });
      this.setState({
        shortLinkKey: queryString,
        isShort: !isShort,
      });
    } else {
      this.setState({ isShort: !isShort });
    }
  }

  getPermalink() {
    const { queryString } = this.state;
    const url = window.location.href;
    let prefix = url.split('?')[0];
    prefix = prefix !== null && prefix !== undefined ? prefix : url;
    return !queryString ? prefix : prefix + queryString;
  }

  onLinkClick(type) {
    const permalink = this.getPermalink();
    googleTagManager.pushEvent({
      event: 'social_share_platform',
      social_type: type,
    });
    // If a short link can be generated, replace the full link.
    if (type === 'twitter' || type === 'email') {
      const promise = this.getShortLink();
      let win = window;
      if (type === 'twitter') {
        win = window.open('', '_blank');
      }
      promise
        .then((result) => {
          if (result.status_code === 200) {
            const href = getSharelink(type, result.data.url);
            openPromisedSocial(href, win);
          }
        })
        .catch(() => {
          const href = getSharelink(type, permalink);
          openPromisedSocial(href, win);
          console.warn('Unable to shorten URL, full link generated.');
        });
    } else {
      const href = getSharelink(type, permalink);
      window.open(href, '_blank');
    }
  }

  renderToolTips() {
    const { showErrorTooltip, tooltipOpen } = this.state;
    if (showErrorTooltip) {
      setTimeout(() => {
        this.setState({ showErrorTooltip: false });
      }, 2000);
    }
    return (
      <>
        <Tooltip
          placement="left"
          isOpen={showErrorTooltip}
          target="permalink_content"
        >
          Link cannot be shortened at this time.
        </Tooltip>
        <Tooltip
          placement="right"
          isOpen={tooltipOpen}
          target="copy-to-clipboard-button"
        >
          Copied!
        </Tooltip>
      </>
    );
  }

  render() {
    const { shortLink } = this.props;
    const { isShort } = this.state;
    const value = shortLink.isLoading && isShort
      ? 'Please wait...'
      : isShort
          && shortLink.response
          && shortLink.response.data
          && shortLink.response.data.url
        ? shortLink.response.data.url
        : this.getPermalink();

    return (
      <>
        <div>
          {this.renderToolTips()}
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

            <CopyToClipboard
              options={window.clipboardData ? {} : { format: 'text/plain' }}
              text={value}
              onCopy={() => {
                this.setState({ tooltipOpen: true });
                setTimeout(() => {
                  this.setState({ tooltipOpen: false });
                }, 2000);
              }}
            >
              <InputGroupAddon addonType="append">
                <Button id="copy-to-clipboard-button">COPY</Button>
              </InputGroupAddon>
            </CopyToClipboard>
          </InputGroup>
          <br />
          <Checkbox
            label="Shorten link"
            id="wv-link-shorten"
            onCheck={this.onToggleShorten}
            checked={isShort}
            disabled={!shortLink.isLoading}
          />
          <br />
        </div>
        <ShareLinks onClick={this.onLinkClick} />
      </>
    );
  }
}

function mapStateToProps(state) {
  const { config } = state;

  return {
    shortLink: state.shortLink,
    mock:
      config.parameters && config.parameters.shorten
        ? config.parameters.shorten
        : '',
  };
}
const mapDispatchToProps = (dispatch) => ({
  requestShortLink: (location, signal) => dispatch(
    requestShortLink(location, 'application/json', null, signal),
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  mock: PropTypes.string,
  requestShortLink: PropTypes.func,
  shortLink: PropTypes.object,
};
