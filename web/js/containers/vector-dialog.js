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
