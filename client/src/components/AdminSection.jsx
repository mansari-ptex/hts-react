import React, { useState, useEffect } from 'react';

function AdminSection({ totalRecords, status }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 🔑 Admin conditions
    const isAdminByURL = new URLSearchParams(window.location.search).get("admin") === "true";
    const isAdminByStorage = localStorage.getItem("hts_admin") === "true";
    setIsAdmin(isAdminByURL || isAdminByStorage);
  }, []);

  if (!isAdmin) return null;

  return (
    <div id="adminSection" className="admin-section" style={{ display: 'block' }}>
      <div className="stats" style={{ display: 'flex', gap: '20px' }}>
        <div className="stat-box">
          <div className="stat-label">Total Records</div>
          <div className="stat-value" id="totalResults">{totalRecords}</div>
        </div>
        {status.lastUpdated && (
          <div className="stat-box">
            <div className="stat-label">Last Database Sync</div>
            <div className="stat-value" style={{ fontSize: '14px', marginTop: '5px' }}>
              {new Date(status.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}
      </div>
      <div className="upload-section">
        <h3>Import Chapter JSON File (Admin Only)</h3>
        <div className="file-input-wrapper">
          <input type="file" id="jsonFileInput" accept=".json" multiple />
          <button className="btn btn-primary">Import</button>
        </div>
        {status.message && (
          <div className={`status-message ${status.type}`} style={{ display: 'block' }}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSection;
