import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {
  Button,
  Row,
  Col,
} from 'reactstrap';
import { history } from '../../main';

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
    const { isMobile } = this.props;

    return (
      <Row className="geostationary-modal">
        <Col lg="6" md="12">
          {!isMobile
            && (
            <figure className="figure">
              <img src="images/geostationary.gif" className="figure-img img-fluid rounded" />
              <figcaption className="figure-caption mx-auto">
                GOES-East / ABI Red Visible (0.64 µm, Band 2, 10 minute)
              </figcaption>
            </figure>
            )}
        </Col>
        <Col lg="6" md="12">
          <p>
            Our latest release includes new layers from geostationary satellites –
            GOES-East, GOES-West and Himawari-8. Find these new layers in the new
            “Featured” tab of the “Add Layers” menu.
          </p>
          <p>
            These geostationary layers have a much higher temporal frequency than other
            imagery in Worldview - A new image is available every 10 minutes!
          </p>
          <p>
            To take full advantage of this, the time (and timescale) of the timeline
            can now be set down to the hour and minute whenever any geostationary products
            are in the current list of overlays.
          </p>
          <p>
            For an optimal experience, set the time increment in the custom
            interval selector to 10 minute.
          </p>

          {isMobile
            ? <p> Click below to see geostationary in action! </p>
            : (
              <p>
                The animation tool has also been updated to allow adjustments down to
                the hour and minute. Click below to set up an animation to see
                geostationary in action!
              </p>
            )}

        </Col>

        <Button
          className="btn btn-lg"
          onClick={this.tryIt}
        >
          Try it!
        </Button>

      </Row>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  isMobile: state.browser.lessThan.medium,
});

const getLocation = (isMobile) => {
  const paramArr = [
    'p=geographic&',
    'l=Reference_Labels,Reference_Features(hidden),Coastlines(hidden),GOES-East_ABI_Band2_Red_Visible_1km,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&',
    't=2019-09-01-T16%3A00%3A00Z&',
    'v=-84.25409131402579,21.881949559541848,-69.48846631402579,30.213980809541848&',
    'z=4&ics=true&ici=5&icd=10',
  ];

  if (!isMobile) {
    paramArr.push('&ab=on&as=2019-09-01-T16%3A00%3A00Z&ae=2019-09-01-T17%3A40%3A00Z&al=true');
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
