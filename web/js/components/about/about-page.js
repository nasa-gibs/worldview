import React from 'react';
import Scrollbar from '../util/scrollbar';

export default function AboutPage() {
  const [welcomeDescription, setwelcomeDescription] = useState();

  const fetchHTML = (sectionName, setFn) => {
    let controller = new AbortController();
    (async () => {
      if (!sectionName) {
        return;
      }
      try {
      // const options = { signal: controller.signal };
        const data = await fetch(`brand/about/${sectionName}.html`);
        const dataHTML = await data.text();
        controller = null;
        setFn(dataHTML || 'No description was found for this section.');
      } catch (e) {
        if (!controller.signal.aborted) {
        // eslint-disable-next-line no-console
          console.error(e);
        }
      }
    })();
    return controller ? controller.abort() : null;
  };

  const welcomeHTML = fetchHTML('welcome');

  return (
    <Scrollbar style={{ height: 'calc(var(--vh, 1vh) * 100 - 100px)' }}>
      <div className="about-page">
        {welcomeHTML}
      </div>
    </Scrollbar>
  );
}
