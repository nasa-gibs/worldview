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
      bbox, height, imageDownload, locationSearch, proj, width, selectedDate,
    } = this.props;
    const { isWorldfile, fileType } = imageDownload;
    const markerCoordinates = locationSearch.coordinates;
    const url = 'https://wvs.earthdata.nasa.gov/api/v1/snapshot';
    console.log(this.state);
    const lonlats = [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ];

    // Static values to test image insertion
    // \web\js\containers\image-download.js for reference
    // getLayers()
    const layerDefs = [
      {
        id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
        type: 'wmts',
        format: 'image/jpeg',
        period: 'daily',
        startDate: '2000-02-24T00:00:00Z',
        dateRanges: [
          {
            startDate: '2000-02-24T00:00:00Z',
            endDate: '2023-06-13T00:00:00Z',
            dateInterval: [
              '1',
            ],
          },
        ],
        projections: {
          antarctic: {
            source: 'GIBS:antarctic',
            matrixSet: '250m',
          },
          geographic: {
            source: 'GIBS:geographic',
            matrixSet: '250m',
          },
          arctic: {
            source: 'GIBS:arctic',
            matrixSet: '250m',
          },
        },
        title: 'Corrected Reflectance (True Color)',
        subtitle: 'Terra / MODIS',
        ongoing: true,
        daynight: [
          'day',
        ],
        conceptIds: [
          {
            type: 'NRT',
            value: 'C1426414410-LANCEMODIS',
            shortName: 'MOD021KM',
            title: 'MODIS/Terra Calibrated Radiances 5-Min L1B Swath 1km - NRT',
            version: '6.1NRT',
          },
          {
            type: 'NRT',
            value: 'C1426415307-LANCEMODIS',
            shortName: 'MOD02HKM',
            title: 'MODIS/Terra Calibrated Radiances 5-Min L1B Swath 500m - NRT',
            version: '6.1NRT',
          },
          {
            type: 'NRT',
            value: 'C1426416980-LANCEMODIS',
            shortName: 'MOD02QKM',
            title: 'MODIS/Terra Calibrated Radiances 5-Min L1B Swath 250m - NRT',
            version: '6.1NRT',
          },
          {
            type: 'NRT',
            value: 'C1426422512-LANCEMODIS',
            shortName: 'MOD03',
            title: 'MODIS/Terra Geolocation Fields 5-Min L1A Swath 1km - NRT',
            version: '6.1NRT',
          },
          {
            type: 'STD',
            value: 'C1378579425-LAADS',
            shortName: 'MOD02QKM',
            title: 'MODIS/Terra Calibrated Radiances 5-Min L1B Swath 250m',
            version: '6.1',
          },
          {
            type: 'STD',
            value: 'C1378577630-LAADS',
            shortName: 'MOD02HKM',
            title: 'MODIS/Terra Calibrated Radiances 5-Min L1B Swath 500m',
            version: '6.1',
          },
          {
            type: 'STD',
            value: 'C1378227407-LAADS',
            shortName: 'MOD021KM',
            title: 'MODIS/Terra Calibrated Radiances 5-Min L1B Swath 1km',
            version: '6.1',
          },
        ],
        orbitTracks: [
          'OrbitTracks_Terra_Descending',
        ],
        orbitDirection: [
          'descending',
        ],
        layerPeriod: 'Daily',
        dataCenter: [
          'MODAPS SIPS',
          'LAADS DAAC',
        ],
        description: 'modis/terra/MODIS_Terra_CorrectedReflectance_TrueColor',
        tags: 'natural color cr',
        group: 'baselayers',
        wrapadjacentdays: true,
        layergroup: 'Corrected Reflectance',
        disableSmartHandoff: true,
        visible: true,
        opacity: 1,
      },
      {
        title: 'Coastlines',
        subtitle: 'Reference',
        ongoing: false,
        id: 'Coastlines_15m',
        description: 'reference/Coastlines_15m',
        group: 'overlays',
        format: 'image/png',
        layergroup: 'Reference',
        noTransition: true,
        projections: {
          antarctic: {
            id: 'Coastlines',
            subtitle: 'SCAR Antarctic Digital Database / Coastlines',
            tags: 'borders reference',
            source: 'GIBS:antarctic',
            matrixSet: '250m',
          },
          geographic: {
            subtitle: '&copy; OpenStreetMap contributors',
            tags: 'borders reference osm',
            source: 'GIBS:geographic',
            matrixSet: '15.625m',
          },
          arctic: {
            id: 'Coastlines',
            subtitle: '&copy; OpenStreetMap contributors',
            tags: 'borders reference osm',
            source: 'GIBS:arctic',
            matrixSet: '250m',
          },
        },
        wrapX: true,
        type: 'wmts',
        visible: true,
        opacity: 1,
      },
    ];
    // End static values

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
            </div>
          </>
          )}
        </TabPane>
        <p><img className="share-img-preview" src={downloadUrl} /></p>
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
  console.log(state);

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
