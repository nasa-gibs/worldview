import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const VectorAlertModalBody = () => (

  <Container className="event-alert-modal-body">
    <Row className="p-2">
      <h2>
        Why can’t I click on a feature in a vector layer?
      </h2>
    </Row>
    <Row className="p-2">
      <p>
        Some vector layers are rendered as raster images in outer zoom levels to enhance visibility
      </p>
    </Row>
    <Row className="p-2">
      <Col>
        <p>
          If you see the pointer icon next to the layer, you should be able to click on the layer&#39;s features to access feature metadata.
        </p>
      </Col>
      <Col>
        <img src="images/vector-alert.png" />
      </Col>
    </Row>
  </Container>
);

export default VectorAlertModalBody;
