export default function parse(state, errors, config) {
  let newState = { ...state };

  // Permalink version 1.0 - 1.1
  if (newState.switch) {
    newState = {
      ...newState,
      p: newState.switch,
    };
    delete newState.switch;
  }

  const projId = newState.p;
  if (projId) {
    if (!config.projections[projId]) {
      newState = { ...newState };
      delete newState.p;
      errors.push({
        message: `Unsupported projection: ${projId}`,
      });
    }
  }

  return newState;
}
