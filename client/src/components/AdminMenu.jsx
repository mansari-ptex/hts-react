import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

/**
 * A hidden Admin Menu for database synchronization.
 * Now only accessible via a cryptic hash route: /#/system-sync-301
 */
function AdminMenu() {
    const [isVisible, setIsVisible] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);

    useEffect(() => {
        // --- Cryptic Route Handler ---
        const checkHash = () => {
            if (window.location.hash === '#/system-sync-301') {
                setIsVisible(true);
            }
        };

        // Check on mount
        checkHash();

        // Listen for changes
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

    const handleSync = async () => {
        if (!window.confirm('This will download the latest data from USITC and rebuild the database. Proceed?')) return;
        
        try {
            setIsSyncing(true);
            setSyncStatus('Downloading data from USITC...');
            
            const response = await apiService.syncHTS();
            
            if (response.success) {
                setSyncStatus(`Success! Synchronized ${response.records} records.`);
                setTimeout(() => {
                    setIsVisible(false);
                    // Clear the hash to hide the portal
                    window.location.hash = '';
                }, 3000);
                window.location.reload(); 
            } else {
                setSyncStatus('Sync Error: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Sync Error:', err);
            setSyncStatus(`Sync Error: ${err.message || 'Connection lost'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="admin-menu-container">
            <div className="admin-modal-overlay">
                <div className="admin-panel shadow-premium">
                    <div className="admin-header">
                        <h3>System Data Portal</h3>
                        <button className="close-btn" onClick={() => setIsVisible(false)}>&times;</button>
                    </div>
                    
                    <div className="admin-content">
                        <p className="admin-help-text">
                            USITC Direct Sync: Chapters 61, 62, and 99.
                        </p>
                        
                        <button 
                            className={`btn-primary sync-btn ${isSyncing ? 'loading' : ''}`}
                            onClick={handleSync}
                            disabled={isSyncing}
                        >
                            {isSyncing ? 'Syncing...' : 'Start Official USITC Sync'}
                        </button>

                        {syncStatus && (
                            <div className={`sync-status-msg ${syncStatus.includes('Error') ? 'error' : 'success'}`}>
                                {syncStatus}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(4px);
                    z-index: 10000;
                }
                .admin-panel {
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .admin-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: #1a202c;
                }
                .admin-help-text {
                    font-size: 14px;
                    color: #4a5568;
                    margin-bottom: 24px;
                    line-height: 1.6;
                }
                .sync-btn {
                    width: 100%;
                    padding: 14px;
                    background: #2d3748;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: background 0.2s;
                }
                .sync-btn:hover:not(:disabled) {
                    background: #1a202c;
                }
                .sync-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .sync-status-msg {
                    margin-top: 20px;
                    font-size: 14px;
                    padding: 12px;
                    border-radius: 8px;
                }
                .sync-status-msg.success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
                .sync-status-msg.error { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
                .close-btn { 
                    background: none; 
                    border: none; 
                    font-size: 28px; 
                    cursor: pointer; 
                    color: #a0aec0; 
                    transition: color 0.2s;
                    line-height: 1;
                }
                .close-btn:hover {
                    color: #4a5568;
                }
            `}} />
        </div>
    );
}

export default AdminMenu;
