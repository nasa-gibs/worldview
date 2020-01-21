import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import util from '../../../util/util.js';
import Scrollbars from '../../util/scrollbar';

class MeasurementMetadataDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMetadataExpanded: false,
      sourceMetaData: {}
    };
  }

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @return {void}
   */
  toggleMetadataExpansion() {
    this.setState({ isMetadataExpanded: !this.state.isMetadataExpanded });
  }

  getSourceMetadata() {
    const { source } = this.props;
    if (source.description) {
      util.get('config/metadata/layers/' + source.description + '.html').then(data => {
        if (data) {
          const { sourceMetaData } = this.state;
          sourceMetaData[source.description] = { data };
          this.setState({ sourceMetaData });
        }
      });
    }
  }

  renderMobile() {
    const { source } = this.props;
    const { isMetadataExpanded, sourceMetaData } = this.state;
    const description = source && source.description;

    if (description) {
      if (sourceMetaData[description]) {
        const { data } = sourceMetaData[description];
        const doesMetaDataNeedExpander = data.length >= 1000;
        const isMetaVisible = isMetadataExpanded || !doesMetaDataNeedExpander;
        return (
          <div>
            <div
              className={ isMetaVisible ? 'source-metadata ' : 'source-metadata overflow' }
              dangerouslySetInnerHTML={{ __html: data }}
            />
            {doesMetaDataNeedExpander && (
              <div
                className="metadata-more"
                onClick={() => this.toggleMetadataExpansion()}
              >
                <span className={isMetadataExpanded ? 'ellipsis up' : 'ellipsis'}>
                  {isMetadataExpanded ? '^' : '...'}
                </span>
              </div>
            )}
          </div>
        );
      } else {
        this.getSourceMetadata(source);
        return (
          <div className="no-results">
            <h5>Loading metadata ... </h5>
          </div>
        );
      }
    }
  }

  renderDesktop() {
    const { source, height, categoryTitle } = this.props;
    const { sourceMetaData } = this.state;
    if (!source) {
      return (
        <div className="no-results">
          <h3> {categoryTitle} </h3>
          <h5> (Select a measurement) </h5>
        </div>
      );
    }
    const { description, title } = source;

    if (sourceMetaData[description]) {
      const { data } = sourceMetaData[description];
      return (
        <Scrollbars style={{ maxHeight: height + 'px' }}>
          <div className="layers-all-layer">
            <div className="layers-all-header">
              <h3>{title}</h3>
            </div>
            <div className="source-metadata">
              <div dangerouslySetInnerHTML={{ __html: data }} />
            </div>
          </div>
        </Scrollbars>
      );
    } else {
      this.getSourceMetadata(source);
      return (
        <div className="no-results">
          <h5>Loading metadata ... </h5>
        </div>
      );
    }
  }

  render() {
    const { isMobile } = this.props;
    return (isMobile ? this.renderMobile() : this.renderDesktop());
  }
}

MeasurementMetadataDetail.propTypes = {
  categoryTitle: PropTypes.string,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  source: PropTypes.object
};

export default MeasurementMetadataDetail;
