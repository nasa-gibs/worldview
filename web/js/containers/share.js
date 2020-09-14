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
} from 'reactstrap';
import ShareLinks from '../components/toolbar/share/links';
import ShareToolTips from '../components/toolbar/share/tooltips';
import { encode, getSharelink } from '../modules/link/util';
import { serializeDate } from '../modules/date/util';
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

  // set copy tooltip time
  onCopyToClipboard = () => {
    this.setState({
      tooltipToggleTime: Date.now(),
    });
  }

  getPermalink = () => {
    const { queryString } = this.state;
    const { selectedDate } = this.props;
    const url = window.location.href;
    const prefix = url.split('?')[0];

    // if no time query string parameter, add to permalink
    const isTimeInQueryString = queryString.includes('t=');
    let timeParam = '';
    if (!isTimeInQueryString) {
      const serialized = serializeDate(selectedDate);
      const encoded = encode(serialized);
      timeParam = `t=${encoded}`;
    }

    // add to permalink based on existing querystring
    let permalink = prefix;
    if (!queryString) {
      permalink += `?${timeParam}`;
    } else if (!isTimeInQueryString) {
      permalink += `${queryString}&${timeParam}`;
    } else {
      permalink = url;
    }

    return permalink;
  }

  onLinkClick = (type) => {
    const permalink = this.getPermalink();
    let shareLink = getSharelink(type, permalink);

    googleTagManager.pushEvent({
      event: 'social_share_platform',
      social_type: type,
    });

    // If a short link can be generated, replace the full link.
    if (type === 'twitter') {
      const newTab = window.open('', '_blank');
      this.getShortLink().then(({ link }) => {
        shareLink = getSharelink(type, link);
      }).finally(() => {
        newTab.location = shareLink;
      });
    } else if (type === 'email') {
      this.getShortLink().then(({ link }) => {
        shareLink = getSharelink(type, link);
      }).finally(() => {
        window.location = shareLink;
      });
    } else {
      window.open(shareLink, '_blank');
    }
  }

  render() {
    const { shortLink } = this.props;
    const {
      isShort,
      tooltipErrorTime,
      tooltipToggleTime,
    } = this.state;
    const value = shortLink.isLoading && isShort
      ? 'Please wait...'
      : isShort
          && shortLink.response
          && shortLink.response.link
        ? shortLink.response.link
        : this.getPermalink();

    return (
      <>
        <div>
          <ShareToolTips
            tooltipErrorTime={tooltipErrorTime}
            tooltipToggleTime={tooltipToggleTime}
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
            <CopyToClipboard
              options={window.clipboardData ? {} : { format: 'text/plain' }}
              text={value}
              onCopy={this.onCopyToClipboard}
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
    selectedDate: getSelectedDate(state),
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
  selectedDate: PropTypes.object,
  shortLink: PropTypes.object,
};
