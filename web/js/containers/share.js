import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ShareLinks from '../components/toolbar/share/links';
import { getSharelink, openPromisedSocial } from '../modules/link/util';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Checkbox } from '../components/util/checkbox';
import { requestShortLink } from '../modules/link/actions';
import {
  InputGroupAddon,
  Input,
  InputGroup,
  Button,
  Tooltip
} from 'reactstrap';

import { history } from '../main';

const getShortenRequestString = function(mock, permalink) {
  const mockStr = mock || '';
  if (/localhost/.test(location)) {
    return 'mock/short_link.json';
  }
  return (
    'service/link/shorten.cgi' +
    mockStr +
    '?url=' +
    encodeURIComponent(permalink)
  );
};
class ShareLinkContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shortLinkKey: '',
      isShort: false,
      tooltipOpen: false,
      queryString: history.location.search || ''
    };
  }
  componentDidMount() {
    this.unlisten = history.listen((location, action) => {
      const newString = location.search;
      const { queryString } = this.state;
      if (queryString !== newString) {
        this.setState({
          queryString: newString,
          isShort: false,
          shortLinkKey: ''
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
      this.setState({
        shortLinkKey: queryString,
        isShort: !isShort
      });
    } else {
      this.setState({ isShort: !isShort });
    }
  }
  getPermalink() {
    const { queryString } = this.state;
    let url = window.location.href;
    let prefix = url.split('?')[0];
    prefix = prefix !== null && prefix !== undefined ? prefix : url;
    return !queryString ? prefix : prefix + queryString;
  }
  onLinkClick(type) {
    const permalink = this.getPermalink();
    // If a short link can be generated, replace the full link.
    if (type === 'twitter' || type === 'email') {
      let promise = this.getShortLink();
      let win = window;
      if (type === 'twitter') {
        win = window.open('', '_blank');
      }
      promise
        .then(function(result) {
          if (result.status_code === 200) {
            const href = getSharelink(type, result.data.url);
            openPromisedSocial(href, win);
          }
        })
        .catch(function() {
          const href = getSharelink(type, permalink);
          openPromisedSocial(href, win);
          console.warn('Unable to shorten URL, full link generated.');
        });
    } else {
      let href = getSharelink(type, permalink);
      window.open(href, '_blank');
    }
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.shortLink.error && prevState.isShort) {
      return { isShort: false, showErrorTooltip: true };
    } else return null;
  }
  renderToolTips() {
    const { showErrorTooltip, tooltipOpen } = this.state;
    if (showErrorTooltip) {
      setTimeout(() => {
        this.setState({ showErrorTooltip: false });
      }, 2000);
    }
    return (
      <React.Fragment>
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
      </React.Fragment>
    );
  }
  render() {
    const { shortLink } = this.props;
    const { isShort } = this.state;
    const value =
      shortLink.isLoading && isShort
        ? 'Please wait...'
        : isShort &&
          shortLink.response &&
          shortLink.response.data &&
          shortLink.response.data.url
          ? shortLink.response.data.url
          : this.getPermalink();

    return (
      <React.Fragment>
        <div>
          {this.renderToolTips()}
          <InputGroup>
            <Input
              type="text"
              value={value}
              name="permalink_content"
              id="permalink_content"
              onChange={e => {
                e.preventDefault();
              }}
            />

            <CopyToClipboard
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
            onCheck={this.onToggleShorten.bind(this)}
            checked={isShort}
            disabled={!shortLink.isLoading}
          />
          <br />
        </div>
        <ShareLinks onClick={this.onLinkClick.bind(this)} />
      </React.Fragment>
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
        : ''
  };
}
const mapDispatchToProps = dispatch => ({
  requestShortLink: (location, signal) => {
    return dispatch(requestShortLink(location, 'application/json', signal));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  projection: PropTypes.string,
  queryString: PropTypes.string,
  requestShortLink: PropTypes.func,
  shortLink: PropTypes.object,
  mock: PropTypes.string
};
