/**
 * Copyright Management System
 * Handles copyright generation, verification, and management
 */
/* exported initCopyrightPage, showCopyrightDetail, closeDetailView, printCertificate, exportAllCopyrights */

// Global copyright store
let copyrightStore = [];

/**
 * Initialize the copyright page
 */
function initCopyrightPage() {
    loadCopyrightStore();
    updateStats();
    renderCopyrightList();
    setupEventListeners();
}

/**
 * Load copyright store from localStorage
 */
function loadCopyrightStore() {
    copyrightStore = JSON.parse(localStorage.getItem('copyrightStore')) || [];
}

/**
 * Save copyright store to localStorage
 */
function saveCopyrightStore() {
    localStorage.setItem('copyrightStore', JSON.stringify(copyrightStore));
}

/**
 * Update statistics display
 */
function updateStats() {
    document.getElementById('total-copyrights').textContent = copyrightStore.length;

    // Count verified (we consider all stored as verified)
    document.getElementById('verified-count').textContent = copyrightStore.length;

    // Count today's designs
    const today = new Date().toDateString();
    const todayCount = copyrightStore.filter(c => {
        return new Date(c.createdAt).toDateString() === today;
    }).length;
    document.getElementById('today-count').textContent = todayCount;
}

/**
 * Render the copyright list
 */
function renderCopyrightList() {
    const listContainer = document.getElementById('copyright-list');

    if (copyrightStore.length === 0) {
        listContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">No copyrights yet. Create your first design!</p>';
        return;
    }

    // Sort by date (newest first)
    const sorted = [...copyrightStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    listContainer.innerHTML = sorted.map(copyright => `
        <div class="copyright-item" onclick="showCopyrightDetail('${copyright.id}')">
            <div class="copyright-item-id">${copyright.id}</div>
            <div class="copyright-item-date">${formatDate(copyright.createdAt)}</div>
            ${copyright.data.canvasData ? `<img class="copyright-item-preview" src="${copyright.data.canvasData}" alt="Preview">` : ''}
        </div>
    `).join('');
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Enter key to verify
    document.getElementById('verify-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyCopyright();
        }
    });
}

/**
 * Verify a copyright ID
 */
function verifyCopyright() {
    const verifyId = document.getElementById('verify-id').value.trim();
    const resultDiv = document.getElementById('verify-result');
    const statusEl = document.getElementById('verify-status');
    const messageEl = document.getElementById('verify-message');
    const hashEl = document.getElementById('verify-hash');

    if (!verifyId) {
        resultDiv.className = 'verify-result error';
        statusEl.textContent = '❌ No ID Provided';
        messageEl.textContent = 'Please enter a copyright ID to verify.';
        hashEl.style.display = 'none';
        return;
    }

    // Search in copyright store
    const copyright = copyrightStore.find(c => c.id === verifyId);

    if (copyright) {
        resultDiv.className = 'verify-result success';
        statusEl.textContent = '✅ Copyright Verified';
        messageEl.innerHTML = `
            <strong>Certificate ID:</strong> ${copyright.id}<br>
            <strong>Created:</strong> ${formatDate(copyright.createdAt)}<br>
            <strong>Category:</strong> ${copyright.data.category || 'N/A'}<br>
            <strong>Style:</strong> ${copyright.data.style || 'N/A'}
        `;
        hashEl.textContent = copyright.hash;
        hashEl.style.display = 'block';
    } else {
        resultDiv.className = 'verify-result error';
        statusEl.textContent = '❌ Copyright Not Found';
        messageEl.textContent = 'This copyright ID was not found in our records. It may have been created on a different device or browser.';
        hashEl.style.display = 'none';
    }
}

/**
 * Show copyright detail view
 */
function showCopyrightDetail(copyrightId) {
    const copyright = copyrightStore.find(c => c.id === copyrightId);
    if (!copyright) return;

    document.getElementById('detail-id').textContent = copyright.id;
    document.getElementById('detail-date').textContent = formatDate(copyright.createdAt);
    document.getElementById('detail-category').textContent = copyright.data.category || 'N/A';
    document.getElementById('detail-style').textContent = copyright.data.style || 'N/A';
    document.getElementById('detail-hash').textContent = copyright.hash;

    if (copyright.data.canvasData) {
        document.getElementById('detail-preview').src = copyright.data.canvasData;
    }

    document.getElementById('detail-view').classList.add('active');
}

/**
 * Close detail view
 */
function closeDetailView() {
    document.getElementById('detail-view').classList.remove('active');
}

/**
 * Print certificate
 */
function printCertificate() {
    const content = document.querySelector('.detail-content').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Copyright Certificate</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Georgia', serif;
                    background: #fff;
                    color: #000;
                    padding: 40px;
                }
                .detail-content {
                    max-width: 700px;
                    margin: 0 auto;
                    border: 3px solid #667eea;
                    border-radius: 20px;
                    padding: 40px;
                }
                .detail-header { text-align: center; margin-bottom: 30px; }
                .detail-header h2 { color: #667eea; margin-bottom: 10px; }
                .detail-preview {
                    width: 100%;
                    max-width: 400px;
                    display: block;
                    margin: 20px auto;
                    border-radius: 10px;
                }
                .detail-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin: 20px 0;
                }
                .detail-info-item {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 10px;
                }
                .detail-info-item label {
                    display: block;
                    color: #667eea;
                    font-size: 0.8rem;
                    margin-bottom: 5px;
                }
                .hash-display {
                    font-family: monospace;
                    font-size: 0.7rem;
                    word-break: break-all;
                    background: #f5f5f5;
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 10px;
                }
                .print-cert-btn { display: none; }
            </style>
        </head>
        <body>
            <div class="detail-content">
                ${content}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * Export all copyrights as PDF
 */
function exportAllCopyrights() {
    if (copyrightStore.length === 0) {
        alert('No copyrights to export!');
        return;
    }

    // Create a summary document
    const exportWindow = window.open('', '_blank', 'width=800,height=600');

    let content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Copyright Export - N.L.B.L.I.T.M.W.I</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background: #0a0a0f;
                    color: #fff;
                    padding: 40px;
                }
                h1 {
                    text-align: center;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 30px;
                }
                .copyright-entry {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .copyright-id {
                    font-family: monospace;
                    color: #38ef7d;
                    font-size: 1.1rem;
                    margin-bottom: 10px;
                }
                .copyright-date {
                    color: rgba(255,255,255,0.6);
                    font-size: 0.9rem;
                }
                .copyright-hash {
                    font-family: monospace;
                    font-size: 0.7rem;
                    word-break: break-all;
                    background: rgba(0,0,0,0.3);
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 10px;
                    color: #f093fb;
                }
                .print-btn {
                    display: block;
                    width: 200px;
                    margin: 30px auto;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 1rem;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>☽ Copyright Export ☽<br><small>No Limits Beyond Limitations</small></h1>
    `;

    const sorted = [...copyrightStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sorted.forEach(copyright => {
        content += `
            <div class="copyright-entry">
                <div class="copyright-id">${copyright.id}</div>
                <div class="copyright-date">Created: ${formatDate(copyright.createdAt)}</div>
                <div class="copyright-hash">${copyright.hash}</div>
            </div>
        `;
    });

    content += `
            <button class="print-btn" onclick="window.print()">🖨️ Print Export</button>
        </body>
        </html>
    `;

    exportWindow.document.write(content);
    exportWindow.document.close();
}

/**
 * Generate a new copyright ID
 */
function generateCopyrightId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NLB-${timestamp}-${random}`;
}

/**
 * Generate SHA-256 hash
 */
async function generateHash(data) {
    const dataString = JSON.stringify(data) + Date.now() + Math.random().toString(36);

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.warn('[Copyright] Hash generation fallback', error);
        // Fallback
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }
}

/**
 * Register a new copyright
 */
async function registerCopyright(designData) {
    const copyrightId = generateCopyrightId();
    const hash = await generateHash(designData);

    const copyright = {
        id: copyrightId,
        hash: hash,
        data: designData,
        createdAt: new Date().toISOString()
    };

    copyrightStore.push(copyright);
    saveCopyrightStore();
    updateStats();

    return { id: copyrightId, hash };
}

/**
 * Get copyright by ID
 */
function getCopyright(id) {
    return copyrightStore.find(c => c.id === id);
}

/**
 * Export for use in other scripts
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerCopyright,
        getCopyright,
        generateCopyrightId,
        generateHash,
        loadCopyrightStore
    };
}

if (typeof window !== 'undefined') {
    window.initCopyrightPage = initCopyrightPage;
    window.showCopyrightDetail = showCopyrightDetail;
    window.closeDetailView = closeDetailView;
    window.printCertificate = printCertificate;
    window.exportAllCopyrights = exportAllCopyrights;
}
