import React from 'react';

function Header() {
  return (
    <div className="page-header">
      <h1>🔍 HTS Code Search Dashboard</h1>
      <span className="hts-revision tooltip">
        2026 HTS Revision 3 -
        <span className="tooltip-text">v1.0.13</span>
      </span>
    </div>
  );
}

export default Header;
