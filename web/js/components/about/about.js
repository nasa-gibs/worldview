import React from 'react';
import Scrollbar from '../util/scrollbar';
import AboutSection from './about-section';

export default function AboutModal() {
  return (
    <Scrollbar style={{ height: 'calc(var(--vh, 1vh) * 100 - 100px)' }}>
      <div className="about-page">
        <AboutSection section="welcome" />
        <AboutSection section="keyboard" />
        <AboutSection section="imagery" />
        <AboutSection section="acknowledgements" />
        <AboutSection section="disclaimer" />
        <AboutSection section="license" />
      </div>
    </Scrollbar>
  );
}
