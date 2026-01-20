import React from 'react';

function SnapshotError() {
  const msg = 'An error occurred while creating this snapshot. Please try again.';
  return (
    <div className="snapshot-error-container">
      <div className="snapshot-error-text">
        {msg}
      </div>
    </div>
  );
}

export default SnapshotError;
