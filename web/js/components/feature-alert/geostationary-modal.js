import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
// import {
//   Button,
//   Row,
//   Col,
// } from 'reactstrap';
import history from '../../main';

class GeostationaryModalBody extends React.Component {
  constructor(props) {
    super(props);
    this.tryIt = this.tryIt.bind(this);
  }

  tryIt() {
    const { isMobile, prepareAnimate, closeModal } = this.props;
    prepareAnimate(isMobile);
    closeModal();
  }

  render() {
    // const { isMobile } = this.props;

    return '';
    // return (
    //   <Row className="geostationary-modal">
    //     <Col lg="6" md="12">
    //       {!isMobile
    //         && (
    //         <figure className="figure">
    //           <img src="" className="figure-img img-fluid rounded" />
    //           <figcaption className="figure-caption mx-auto">
    //           </figcaption>
    //         </figure>
    //         )}
    //     </Col>
    //     <Col lg="6" md="12">
    //       <p></p>

    //       {isMobile
    //         ? <p> Click below to see geostationary in action! </p>
    //         : (
    //           <p>
    //             The animation tool has also been updated to allow adjustments down to
    //             the hour and minute. Click below to set up an animation to see
    //             geostationary in action!
    //           </p>
    //         )}

    //     </Col>

    //     <Button
    //       className="btn btn-lg"
    //       onClick={this.tryIt}
    //     >
    //       Try it!
    //     </Button>

    //   </Row>
    // );
  }
}

const mapStateToProps = (state) => ({
  isMobile: state.browser.lessThan.medium,
});

const getLocation = (isMobile) => {
  const paramArr = [
    '',
  ];

  if (!isMobile) {
    paramArr.push('');
  }
  const urlParams = paramArr.reduce((prev, curr) => prev + curr, '');
  const search = urlParams.split('/?').pop();
  const location = update(history.location, {
    search: { $set: search },
  });
  return location;
};

const mapDispatchToProps = (dispatch) => ({
  prepareAnimate: (isMobile) => {
    dispatch({
      type: 'REDUX-LOCATION-POP-ACTION',
      payload: getLocation(isMobile),
    });
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GeostationaryModalBody);

GeostationaryModalBody.propTypes = {
  closeModal: PropTypes.func,
  isMobile: PropTypes.bool,
  prepareAnimate: PropTypes.func,
};
