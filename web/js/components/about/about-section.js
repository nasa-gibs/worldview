import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function AboutSection(props) {
  const { section } = props;

  const [sectionDescription, setSectionDescription] = useState();

  const fetchHTML = (sectionName, setFn) => {
    let controller = new AbortController();
    (async () => {
      if (!sectionName) {
        setFn('no section name provided');
        return;
      }
      try {
        const data = await fetch(`brand/about/${sectionName}.html`);
        const dataHTML = await data.text();
        controller = null;
        const setData = data.ok ? dataHTML : 'No description available for this section.';
        setFn(setData);
      } catch (e) {
        if (!controller.signal.aborted) {
        // eslint-disable-next-line no-console
          console.error(e);
          setFn('there was an error');
        }
      }
    })();
    return controller ? controller.abort() : null;
  };

  fetchHTML(section, setSectionDescription);
  return (
    <div dangerouslySetInnerHTML={{ __html: sectionDescription }} />
  );
}

AboutSection.propTypes = {
  section: PropTypes.string.isRequired,
};
