import React from 'react';
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

  renderMobile(data) {
    const { isMetadataExpanded } = this.state;
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
  }

  renderDesktop(data) {
    const { height, source } = this.props;
    const { title } = source;

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
  }

  render() {
    const { isMobile, source, categoryTitle } = this.props;
    const { sourceMetaData } = this.state;

    if (!isMobile && !source) {
      return (
        <div className="no-selection">
          <h3> {categoryTitle} </h3>
          <h5> (Select a measurement) </h5>
        </div>
      );
    }

    const description = source && source.description;
    if (!description) {
      return (
        <div className="no-selection">
          <h5>No metadata found</h5>
        </div>
      );
    }

    const data = sourceMetaData[description] && sourceMetaData[description].data;
    if (!data) {
      this.getSourceMetadata(source);
      return (
        <div className="no-selection">
          <h5>Loading metadata ... </h5>
        </div>
      );
    }

    return (isMobile ? this.renderMobile(data) : this.renderDesktop(data));
  }
}

MeasurementMetadataDetail.propTypes = {
  categoryTitle: PropTypes.string,
  height: PropTypes.number,
  isMobile: PropTypes.bool,
  source: PropTypes.object
};

export default MeasurementMetadataDetail;
