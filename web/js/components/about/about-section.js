import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function AboutSection(props) {
  const { section } = props;

  const [sectionDescription, setSectionDescription] = useState();

  const fetchHTML = () => {
    let controller = new AbortController();
    (async () => {
      if (!section) {
        setSectionDescription('no section name provided');
        return;
      }
      try {
        const data = await fetch(`brand/about/${section}.html`);
        const dataHTML = await data.text();
        controller = null;
        const setData = data.ok ? dataHTML : '';
        setSectionDescription(setData);
      } catch (e) {
        if (!controller.signal.aborted) {
        // eslint-disable-next-line no-console
          console.error(e);
          setSectionDescription('could not load metadata');
        }
      }
    })();
    return controller ? controller.abort() : null;
  };

  fetchHTML();
  return (
    <div dangerouslySetInnerHTML={{ __html: sectionDescription }} />
  );
}

AboutSection.propTypes = {
  section: PropTypes.string.isRequired,
};
