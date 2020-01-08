import React from 'react';
import PropTypes from 'prop-types';
import util from '../../../util/util.js';
import { ListGroup, ListGroupItem } from 'reactstrap';
import Scrollbars from '../../util/scrollbar';

class MeasurementMetadataDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDateRangesExpanded: false,
      sourceMetaData: {}
    };
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

  /**
   * Request metadata if row is active and
   * hide metadata when too many chars
   * @param {Object} source | Source Object
   */
  render() {
    const { source, height } = this.props;
    const { sourceMetaData } = this.state;
    if (!source) {
      return (<div> Select a source. </div>);
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
      return <div className="text-white">Loading metadata ... </div>;
    }
  }
}

MeasurementMetadataDetail.propTypes = {
  height: PropTypes.number,
  source: PropTypes.object
};

export default MeasurementMetadataDetail;
