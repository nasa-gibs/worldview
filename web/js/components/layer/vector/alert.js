import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const VectorAlertModalBody = () => (

  <Container className="event-alert-modal-body">
    <Row className="p-2">
      <h2>
        What are vector layers and how do they differ from raster(image) layers?
      </h2>
    </Row>
    <Row className="p-3">
      <p>
        Vector layers are layers that have sets of information associated with each&nbsp;
        pixel. Raster layers provide tiled PNGs or JPEGs that only have color values associated with each pixel.
      </p>
    </Row>
    <Row className="p-2">
      <h2>
        Why can’t I click on a feature in a vector layer?
      </h2>
    </Row>
    <Row className="p-3">
      <p>
        Some vector layers that have a vast number of features are&nbsp;
        rendered as raster images in outer zoom levels to enhance the&nbsp;
        speed of map interactions (dragging and zooming) these
        layers are render.
      </p>
    </Row>
    <Row className="p-2">
      <h2>
        How can I determine which layers have clickable features?
      </h2>
    </Row>
    <Row className="p-3">
      <Col>
        <p>
          If you see the pointer icon next to the layer, you should be able to click on that layer&#39;s features in order to access metadata associated with that feature.
        </p>
      </Col>
      <Col>
        <img src="images/vector-alert.png" />
      </Col>
    </Row>
  </Container>
);

export default VectorAlertModalBody;
