import React from 'react';
import { Container, Row, Col } from 'reactstrap';

function ZoomAlertModalBody() {
  return (
    <Container className="event-alert-modal-body">
      <Row className="p-2">
        <Col>
          <h2>
            Why can&apos;t I see the imagery at this zoom level?
          </h2>
        </Col>
      </Row>

      <Row className="p-3">
        <Col>
          <p>
            Imagery for certain layers is dynamically generated and only available when zoomed in. Please zoom in to view this product.
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default ZoomAlertModalBody;
