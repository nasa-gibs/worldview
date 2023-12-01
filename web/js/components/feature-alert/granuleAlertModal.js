import React from 'react';
import { Container, Row, Col } from 'reactstrap';

function GranuleAlertModalBody() {
  return (
    <Container className="event-alert-modal-body">
      <Row className="p-2">
        <Col>
          <h2>
            Why can&apos;t I see the imagery for this layer?
          </h2>
        </Col>
      </Row>

      <Row className="p-3">
        <Col>
          <p>
            Certain imagery visualization layers have narrower and smaller footprints so there isn&apos;t imagery to view at every location across the globe. Some imagery layers also have lower temporal revisit periods meaning there won&apos;t be daily imagery for a specific location on earth. Click on “View Options” in the layer list to access a date picker to locate imagery for your desired location.
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default GranuleAlertModalBody;
