import React, { useState } from 'react';
import { apiService } from '../services/apiService';

/**
 * A hidden Admin Menu for database synchronization.
 * Only accessible via a "triple-click" on the footer status text or a hidden key.
 */
function AdminMenu() {
    const [isVisible, setIsVisible] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);
    const [clickCount, setClickCount] = useState(0);

    const handleSecretClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 5) {
            setIsVisible(true);
            setClickCount(0);
        }
        // Reset count after 2 seconds of inactivity
        setTimeout(() => setClickCount(0), 2000);
    };

    const handleSync = async () => {
        if (!window.confirm('This will download the latest data from USITC and rebuild the database. Proceed?')) return;
        
        try {
            setIsSyncing(true);
            setSyncStatus('Downloading data from USITC...');
            
            const response = await apiService.syncHTS();
            
            if (response.success) {
                setSyncStatus(`Success! Synchronized ${response.records} records.`);
                setTimeout(() => setIsVisible(false), 3000);
                window.location.reload(); // Refresh to load new data
            } else {
                setSyncStatus('Sync failed: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Sync Error:', err);
            setSyncStatus(`Sync Error: ${err.message || 'Connection lost'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="admin-menu-container">
            {/* The "Invisible" Trigger */}
            <div 
                className="admin-trigger" 
                onClick={handleSecretClick}
                title="System Status"
            >
                &bull;
            </div>

            {isVisible && (
                <div className="admin-modal-overlay">
                    <div className="admin-panel shadow-premium">
                        <div className="admin-header">
                            <h3>Database Administration</h3>
                            <button className="close-btn" onClick={() => setIsVisible(false)}>&times;</button>
                        </div>
                        
                        <div className="admin-content">
                            <p className="admin-help-text">
                                Fetch latest Chapters 61, 62, and 99 directly from USITC servers.
                            </p>
                            
                            <button 
                                className={`btn-primary sync-btn ${isSyncing ? 'loading' : ''}`}
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? 'Syncing...' : 'Sync with USITC Official'}
                            </button>

                            {syncStatus && (
                                <div className={`sync-status-msg ${syncStatus.includes('Error') ? 'error' : 'success'}`}>
                                    {syncStatus}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-menu-container {
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    z-index: 9999;
                }
                .admin-trigger {
                    width: 20px;
                    height: 20px;
                    color: rgba(0,0,0,0.05);
                    cursor: default;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    transition: color 0.3s;
                }
                .admin-trigger:hover {
                    color: rgba(0,0,0,0.2);
                }
                .admin-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(2px);
                }
                .admin-panel {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    width: 350px;
                    text-align: center;
                }
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .admin-help-text {
                    font-size: 13px;
                    color: #666;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }
                .sync-btn {
                    width: 100%;
                    padding: 12px;
                    background: #1a365d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .sync-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .sync-status-msg {
                    margin-top: 15px;
                    font-size: 12px;
                    padding: 8px;
                    border-radius: 4px;
                }
                .sync-status-msg.success { background: #f0fff4; color: #276749; }
                .sync-status-msg.error { background: #fff5f5; color: #c53030; }
                .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
            `}} />
        </div>
    );
}

export default AdminMenu;
