/* eslint-disable no-restricted-syntax */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  ModalBody, ModalHeader, Nav, NavItem, NavLink,
} from 'reactstrap';
import Scrollbars from '../components/util/scrollbar';
import VectorMetaTable from '../components/vector-metadata/table';

class VectorDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeIndex: 0 };
    this.updateIndex = this.updateIndex.bind(this);
  }

  updateIndex(activeIndex) {
    // eslint-disable-next-line react/destructuring-assignment
    if (activeIndex === this.state.activeIndex) return;
    this.setState({ activeIndex });
  }

  render() {
    const {
      toggleWithClose, vectorMetaObject, modalHeight, dialogKey,
    } = this.props;
    const { activeIndex } = this.state;
    const navArray = [];
    const keyArray = [];
    let i = 0;
    for (const [key, value] of Object.entries(vectorMetaObject)) {
      const stringLength = 20;
      const title = value[0].title || key;
      const { subTitle } = value[0];
      const titleText = title.length > stringLength ? `${title.substring(0, stringLength)}...` : title;
      const combinedTitles = subTitle ? `${title} - ${subTitle}` : title;
      const index = i;
      keyArray.push(key);
      navArray.push(
        <NavItem
          key={key}
          className="vector-meta-nav-item"
          active={activeIndex === i}
        >
          <NavLink onClick={() => this.updateIndex(index)} title={combinedTitles}>
            {`${titleText} [${value.length}]`}
          </NavLink>
        </NavItem>,
      );
      i += 1;
    }
    const activeMetaArray = vectorMetaObject[keyArray[activeIndex]];
    const closeBtn = (
      <button onClick={toggleWithClose} type="button" className="vector-close-btn">
        &times;
      </button>
    );
    return (
      <div className="draggable-modal-content">
        {activeMetaArray[0].id.includes('AERONET')
          ? (
            <div style={{ padding: '10px', position: 'relative' }}>
              <span style={{ position: 'absolute', right: '0px', top: '3px' }}>{closeBtn}</span>
              <div style={{ marginBottom: '5px', fontSize: '16px', color: '#2222aa' }}>
                <a
                  style={{ color: '#2222aa' }}
                  href={
                    `https://aeronet.gsfc.nasa.gov/new_web/photo_db_v3/${activeMetaArray[0].features.name}.html`
                  }
                  rel="noreferrer"
                  target="_blank"
                >
                  {activeMetaArray[0].features.name}
                </a>
              </div>
              <div style={{ marginBottom: '15px', color: '#666666' }}>
                {` (${activeMetaArray[0].features.coordinates[0]}, ${activeMetaArray[0].features.coordinates[1]})`}
              </div>
              <div style={{ marginBottom: '5px' }}>
                {`Site is ${activeMetaArray[0].features.active ? 'online' : 'currently offline'}`}
              </div>
              {activeMetaArray[0].features.active && (
              <div style={{ marginBottom: '5px' }}>
                <b>
                  {`Most recent reading: ${activeMetaArray[0].features.value}`}
                </b>
              </div>
              )}
              {activeMetaArray[0].features.active && (
              <div style={{ marginBottom: '15px' }}>
                {`As of ${activeMetaArray[0].features.date.toUTCString().split(' ').slice(1).join(' ')
                  .replace('GMT', 'UTC')}`}
              </div>
              )}
              <div>
                <a
                  style={{ color: '#2222aa' }}
                  href={
                    `https://aeronet.gsfc.nasa.gov/cgi-bin/data_display_aod_v3?site=${activeMetaArray[0].features.name}&nachal=0&year=${activeMetaArray[0].features.date.getUTCFullYear()}&month=${activeMetaArray[0].features.date.getUTCMonth() + 1}&day=${activeMetaArray[0].features.date.getUTCDate()}&aero_water=0&level=1&if_day=0&if_err=0&place_code=10&year_or_month=0`
                  }
                  rel="noreferrer"
                  target="_blank"
                >
                  View More Data
                </a>
              </div>
            </div>
          ) : (
            <div>
              <ModalHeader toggle={toggleWithClose} close={closeBtn}>
                <Nav tabs id="vector-meta-nav" className="vector-meta-nav">
                  {navArray}
                </Nav>
              </ModalHeader>

              <ModalBody>
                <Scrollbars style={{ maxHeight: `${modalHeight - 70}px` }}>
                  <VectorMetaTable
                    id={dialogKey}
                    metaArray={activeMetaArray}
                    title={keyArray[activeIndex]}
                  />
                </Scrollbars>
              </ModalBody>
            </div>
          )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {};
}
export default connect(
  mapStateToProps,
  null,
)(VectorDialog);
VectorDialog.propTypes = {
  dialogKey: PropTypes.number,
  modalHeight: PropTypes.number,
  toggleWithClose: PropTypes.func,
  vectorMetaObject: PropTypes.object,
};
