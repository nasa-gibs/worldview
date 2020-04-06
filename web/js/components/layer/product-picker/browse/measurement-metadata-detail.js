import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faMeteor } from '@fortawesome/free-solid-svg-icons';
import util from '../../../../util/util';
import { getMeasurementSource } from '../../../../modules/product-picker/selectors';

class MeasurementMetadataDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMetadataExpanded: false,
      sourceMetaData: {},
    };
  }

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @return {void}
   */
  toggleMetadataExpansion() {
    this.setState((prevState) => ({
      isMetadataExpanded: !prevState.isMetadataExpanded,
    }));
  }

  getSourceMetadata() {
    const { source } = this.props;
    if (source.description) {
      util.get(`config/metadata/layers/${source.description}.html`).then((data) => {
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
          className={isMetaVisible ? 'source-metadata ' : 'source-metadata overflow'}
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
    const { source } = this.props;
    const { title } = source;
    return (
      <div className="layers-all-layer">
        <div className="layers-all-header">
          <h3>{title}</h3>
        </div>
        <div className="source-metadata">
          <div dangerouslySetInnerHTML={{ __html: data }} />
        </div>
      </div>
    );
  }

  render() {
    const { isMobile, source, categoryTitle } = this.props;
    const { sourceMetaData } = this.state;

    if (!isMobile && !source) {
      return (
        <div className="no-results">
          <FontAwesomeIcon icon={faMap} />
          <h3>{categoryTitle}</h3>
          <h5> Select a measurement to view details here!</h5>
        </div>
      );
    }

    const description = source && source.description;
    if (!description) {
      return (
        <div className="no-results">
          <FontAwesomeIcon icon={faMeteor} />
          <h3> No metadata found. </h3>
        </div>
      );
    }

    const data = sourceMetaData[description] && sourceMetaData[description].data;
    if (!data) {
      this.getSourceMetadata(source);
      return (
        <div className="no-results">
          <h3> Loading metadata ... </h3>
        </div>
      );
    }

    return isMobile ? this.renderMobile(data) : this.renderDesktop(data);
  }
}

MeasurementMetadataDetail.propTypes = {
  categoryTitle: PropTypes.string,
  isMobile: PropTypes.bool,
  source: PropTypes.object,
};

const mapStateToProps = (state) => {
  const { category } = state.productPicker;
  return {
    categoryTitle: category.title,
    source: getMeasurementSource(state),
  };
};

export default connect(
  mapStateToProps,
  () => ({}),
)(MeasurementMetadataDetail);
