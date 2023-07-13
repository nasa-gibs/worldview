import React from 'react';
import { Container, Row, Col } from 'reactstrap';

function VectorAlertModalBody() {
  return (
    <Container className="event-alert-modal-body">
      <Row className="p-2">
        <Col>

          <h2>
            What are vector layers and how do they differ from raster (image) layers?
          </h2>
        </Col>
      </Row>

      <Row className="p-3">
        <Col>

          <p>
            Vector layers identify locations on earth using points, line segments or polygons while raster layers represent locations on earth through a grid of cells or pixels that have associated color values. The vector layers have attribute information that can be examined when a vector feature is clicked. For example, when a point is clicked on in the Dams layer, a table of attributes will appear including the dam name, river, main use, representative capacity, etc.
          </p>
        </Col>
      </Row>
      <Row className="p-2">
        <Col>
          <h2>
            Why can’t I click on a feature in a vector layer?
          </h2>
        </Col>
      </Row>
      <Row className="p-3">
        <Col>

          <p>
            To speed up map interactions, vector layers that have a vast number of features are rendered as raster images in outer zoom levels. Zoom in to be able to query the vector layer.
          </p>
        </Col>
      </Row>
      <Row className="p-2">
        <Col>
          <h2>
            How can I determine which layers have clickable features?
          </h2>
        </Col>
      </Row>
      <Row className="p-3">
        <Col>
          <p>
            If you see the blue pointer icon next to the layer in the sidebar Layer List, you should be able to click on that layer’s features in order to access attribute information associated with that vector feature. If you see the blue pointer with a red X over it, you are zoomed out too far and the layer is being rendered as a raster, zoom in to be able to examine the attribute information of the vector layer.
          </p>
        </Col>
        <Col>
          <img src="images/vector-alert.png" />
        </Col>
      </Row>
    </Container>
  );
}

export default VectorAlertModalBody;
