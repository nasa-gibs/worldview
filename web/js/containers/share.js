import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ShareLinks from '../components/share/links';
import { getSharelink, openPromisedSocial } from '../modules/link/util';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Checkbox } from '../components/util/checkbox';

class ShareLinkContainer extends Component {
  onToggleShorten() {}
  onLinkClick(type) {
    const { models } = this.props;
    var href, win;
    var shareLink = models.link.get();
    var promise = models.link.shorten();

    // If a short link can be generated, replace the full link.
    if (type === 'twitter' || type === 'email') {
      win = window;
      if (type === 'twitter') {
        win = window.open('', '_blank');
      }
      promise
        .done(function(result) {
          if (result.status_code === 200) {
            href = getSharelink(type, result.data.url);
            openPromisedSocial(href, win);
          }
        })
        .fail(function() {
          href = getSharelink(type, shareLink);
          openPromisedSocial(href, win);
          console.warn('Unable to shorten URL, full link generated.');
        });
    } else {
      href = getSharelink(type, shareLink);
      window.open(href, '_blank');
    }
  }
  render() {
    const { models } = this.props;
    return (
      <React.Fragment>
        <div className="wv-link" id="wv-link">
          <input
            type="text"
            value=""
            name="permalink_content"
            id="permalink_content"
          />
          <CopyToClipboard text="Copied!">
            <button>COPY</button>
          </CopyToClipboard>
          <Checkbox
            label="Shorten link"
            id="wv-link-shorten"
            onCheck={this.onToggleShorten.bind(this)}
            checked={false}
          />
        </div>
        <ShareLinks onClick={this.onLinkClick.bind(this)} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { models } = state.models;

  return {
    models
  };
}

export default connect(mapStateToProps)(ShareLinkContainer);

ShareLinkContainer.propTypes = {
  projection: PropTypes.string
};
