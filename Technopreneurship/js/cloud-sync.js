/* =========================================================================
   MOCHI.OLED // Dual-Cloud Sync Engine (Firebase Realtime DB + Google Sheets)
   & Security Hash Helper (js/cloud-sync.js)
   ========================================================================= */

(function (global) {
    'use strict';

    const STORAGE_KEY_CLOUD_OVERRIDE = 'MOCHI_CLOUD_OVERRIDE_V1';
    const STORAGE_KEY_ADMIN_ACCOUNTS = 'MOCHI_ADMIN_ACCOUNTS_SEC_V1';
    const ADMIN_SALT = 'MOCHI_ADMIN_SALT_2026::';

    const KEY_TO_COLLECTION = {
        MOCHI_SHARED_PRODUCTS_V3: 'products',
        MOCHI_ORDERS_DB_V1: 'orders',
        MOCHI_USERS_DB_V1: 'users',
        MOCHI_PAYMENT_CONFIG_V3: 'paymentConfig',
        MOCHI_SHARED_SYNCLOGS_V1: 'logs',
        MOCHI_ADMIN_ACCOUNTS_SEC_V1: 'adminAccounts'
    };

    // Pure-JS SHA-256 (bekerja konsisten di https://, localhost, maupun file://)
    function sha256Hex(ascii) {
        const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
        const mathPow = Math.pow;
        const maxWord = mathPow(2, 32);
        let result = '';
        const words = [];
        const utf8 = unescape(encodeURIComponent(String(ascii)));
        const asciiBitLength = utf8.length * 8;

        const hash = sha256Hex._h || (sha256Hex._h = []);
        const k = sha256Hex._k || (sha256Hex._k = []);
        let primeCounter = k.length;

        const isComposite = {};
        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
                hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }

        const padded = utf8 + '\x80';
        let str = padded;
        while (str.length % 64 - 56) str += '\x00';
        for (let i = 0; i < str.length; i++) {
            const j = str.charCodeAt(i);
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words.length] = (asciiBitLength / maxWord) | 0;
        words[words.length] = asciiBitLength;

        const h = hash.slice(0, 8);
        for (let j = 0; j < words.length;) {
            const w = words.slice(j, j += 16);
            const oldHash = h.slice(0);
            for (let i = 0; i < 64; i++) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const a = h[0], e = h[4];
                const temp1 = h[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & h[5]) ^ (~e & h[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0);
                const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));

                h.unshift((temp1 + temp2) | 0);
                h[4] = (h[4] + temp1) | 0;
                h.pop();
            }
            for (let i = 0; i < 8; i++) h[i] = (h[i] + oldHash[i]) | 0;
        }

        for (let i = 0; i < 8; i++) {
            for (let j = 3; j + 1; j--) {
                const b = (h[i] >> (j * 8)) & 255;
                result += ((b < 16) ? '0' : '') + b.toString(16);
            }
        }
        return result;
    }

    function hashAdminSecret(secret) {
        return sha256Hex(ADMIN_SALT + String(secret || ''));
    }

    function getCloudConfig() {
        const base = (global.MOCHI_CLOUD_CONFIG && typeof global.MOCHI_CLOUD_CONFIG === 'object')
            ? global.MOCHI_CLOUD_CONFIG
            : {};
        let override = {};
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CLOUD_OVERRIDE);
            if (raw) override = JSON.parse(raw);
        } catch (e) {}

        const firebaseDatabaseUrl = String(override.firebaseDatabaseUrl !== undefined ? override.firebaseDatabaseUrl : (base.firebaseDatabaseUrl || '')).trim().replace(/\/+$/, '');
        const firebaseAuthToken = String(override.firebaseAuthToken !== undefined ? override.firebaseAuthToken : (base.firebaseAuthToken || '')).trim();
        const googleSheetsWebAppUrl = String(override.googleSheetsWebAppUrl !== undefined ? override.googleSheetsWebAppUrl : (base.googleSheetsWebAppUrl || '')).trim();

        return {
            firebaseDatabaseUrl,
            firebaseAuthToken,
            googleSheetsWebAppUrl,
            syncIntervalMs: Number(override.syncIntervalMs || base.syncIntervalMs || 8000),
            adminAccounts: Array.isArray(base.adminAccounts) ? base.adminAccounts : []
        };
    }

    function saveCloudOverride(cfg) {
        try {
            const current = getCloudConfig();
            const merged = {
                firebaseDatabaseUrl: String(cfg.firebaseDatabaseUrl || '').trim().replace(/\/+$/, ''),
                firebaseAuthToken: String(cfg.firebaseAuthToken || '').trim(),
                googleSheetsWebAppUrl: String(cfg.googleSheetsWebAppUrl || '').trim(),
                syncIntervalMs: Number(cfg.syncIntervalMs || current.syncIntervalMs || 8000)
            };
            localStorage.setItem(STORAGE_KEY_CLOUD_OVERRIDE, JSON.stringify(merged));
            return merged;
        } catch (e) {
            return cfg;
        }
    }

    function clearCloudOverride() {
        try { localStorage.removeItem(STORAGE_KEY_CLOUD_OVERRIDE); } catch (e) {}
    }

    function getAdminAccounts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_ADMIN_ACCOUNTS);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        const cfg = getCloudConfig();
        return JSON.parse(JSON.stringify(cfg.adminAccounts || []));
    }

    function saveAdminAccounts(accounts) {
        try {
            localStorage.setItem(STORAGE_KEY_ADMIN_ACCOUNTS, JSON.stringify(accounts));
        } catch (e) {}
        return pushCollection('MOCHI_ADMIN_ACCOUNTS_SEC_V1', accounts);
    }

    function buildFirebaseUrl(collectionPath) {
        const cfg = getCloudConfig();
        if (!cfg.firebaseDatabaseUrl) return '';
        const cleanPath = collectionPath ? `/${collectionPath}` : '';
        const authQuery = cfg.firebaseAuthToken ? `?auth=${encodeURIComponent(cfg.firebaseAuthToken)}` : '';
        return `${cfg.firebaseDatabaseUrl}/mochi_store${cleanPath}.json${authQuery}`;
    }

    async function firebaseRequest(method, collectionPath, data) {
        const url = buildFirebaseUrl(collectionPath);
        if (!url) return { ok: false, skipped: true };
        const options = { method, headers: {} };
        if (data !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`Firebase HTTP ${res.status}`);
        const json = await res.json();
        return { ok: true, data: json };
    }

    async function sheetsGet(action) {
        const cfg = getCloudConfig();
        if (!cfg.googleSheetsWebAppUrl) return { ok: false, skipped: true };
        const sep = cfg.googleSheetsWebAppUrl.includes('?') ? '&' : '?';
        const url = `${cfg.googleSheetsWebAppUrl}${sep}action=${encodeURIComponent(action)}&t=${Date.now()}`;
        const res = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (!res.ok) throw new Error(`Sheets HTTP ${res.status}`);
        const json = await res.json();
        return { ok: true, data: json };
    }

    async function sheetsPost(payload) {
        const cfg = getCloudConfig();
        if (!cfg.googleSheetsWebAppUrl) return { ok: false, skipped: true };
        const res = await fetch(cfg.googleSheetsWebAppUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Sheets POST HTTP ${res.status}`);
        const text = await res.text();
        try {
            return { ok: true, data: JSON.parse(text) };
        } catch (e) {
            return { ok: true, data: { raw: text } };
        }
    }

    function applyCloudPayloadToLocal(payload) {
        let changed = false;
        if (!payload || typeof payload !== 'object') return false;

        Object.entries(KEY_TO_COLLECTION).forEach(([storageKey, colName]) => {
            const val = payload[colName];
            if (val !== undefined && val !== null) {
                if (Array.isArray(val) && val.length === 0 && (colName === 'products' || colName === 'adminAccounts')) {
                    return;
                }
                try {
                    const nextStr = JSON.stringify(val);
                    const prevStr = localStorage.getItem(storageKey);
                    if (nextStr !== prevStr) {
                        localStorage.setItem(storageKey, nextStr);
                        changed = true;
                    }
                } catch (e) {}
            }
        });

        return changed;
    }

    async function pullAll() {
        const cfg = getCloudConfig();
        const result = {
            firebaseActive: !!cfg.firebaseDatabaseUrl,
            sheetsActive: !!cfg.googleSheetsWebAppUrl,
            updated: false,
            source: 'local',
            errors: []
        };

        if (cfg.firebaseDatabaseUrl) {
            try {
                const fbRes = await firebaseRequest('GET', '');
                if (fbRes.ok && fbRes.data && typeof fbRes.data === 'object') {
                    result.updated = applyCloudPayloadToLocal(fbRes.data) || result.updated;
                    result.source = 'firebase';
                    return result;
                }
            } catch (err) {
                result.errors.push('Firebase: ' + err.message);
            }
        }

        if (cfg.googleSheetsWebAppUrl) {
            try {
                const shRes = await sheetsGet('pullAll');
                if (shRes.ok && shRes.data && shRes.data.data) {
                    result.updated = applyCloudPayloadToLocal(shRes.data.data) || result.updated;
                    result.source = 'sheets';
                }
            } catch (err) {
                result.errors.push('Google Sheets: ' + err.message);
            }
        }

        return result;
    }

    async function pushCollection(storageKey, data) {
        const colName = KEY_TO_COLLECTION[storageKey];
        if (!colName) return { ok: false };
        const cfg = getCloudConfig();
        const tasks = [];

        if (cfg.firebaseDatabaseUrl) {
            tasks.push(firebaseRequest('PUT', colName, data));
        }
        if (cfg.googleSheetsWebAppUrl && colName !== 'adminAccounts') {
            tasks.push(sheetsPost({ action: 'syncCollection', collection: colName, data }));
        }

        if (tasks.length === 0) return { ok: true, localOnly: true };
        const settled = await Promise.allSettled(tasks);
        return { ok: true, results: settled };
    }

    async function pushAllFromLocal() {
        const bundle = {};
        Object.entries(KEY_TO_COLLECTION).forEach(([storageKey, colName]) => {
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    bundle[colName] = JSON.parse(raw);
                } else if (storageKey === STORAGE_KEY_ADMIN_ACCOUNTS) {
                    bundle[colName] = getAdminAccounts();
                }
            } catch (e) {}
        });

        const cfg = getCloudConfig();
        const tasks = [];
        if (cfg.firebaseDatabaseUrl) {
            tasks.push(firebaseRequest('PUT', '', bundle));
        }
        if (cfg.googleSheetsWebAppUrl) {
            const sheetsBundle = { ...bundle };
            delete sheetsBundle.adminAccounts;
            tasks.push(sheetsPost({ action: 'pushAll', data: sheetsBundle }));
        }

        if (tasks.length === 0) {
            throw new Error('Isi minimal URL Firebase Realtime Database atau URL Google Sheets Web App terlebih dahulu.');
        }

        const results = await Promise.allSettled(tasks);
        const failures = results.filter(r => r.status === 'rejected').map(r => r.reason && r.reason.message);
        if (failures.length === results.length) {
            throw new Error(failures.join(' | '));
        }
        return { ok: true, warnings: failures };
    }

    async function testFirebase(urlInput, authTokenInput) {
        const cleanUrl = String(urlInput || '').trim().replace(/\/+$/, '');
        if (!cleanUrl) throw new Error('Masukkan URL Firebase Realtime Database terlebih dahulu.');
        const authQuery = authTokenInput ? `?auth=${encodeURIComponent(authTokenInput.trim())}` : '';
        const res = await fetch(`${cleanUrl}/mochi_store.json${authQuery}`, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status} — Periksa URL atau Firebase Database Rules`);
        await res.json();
        return { ok: true };
    }

    async function testGoogleSheets(urlInput) {
        const cleanUrl = String(urlInput || '').trim();
        if (!cleanUrl) throw new Error('Masukkan URL Web App Google Apps Script terlebih dahulu.');
        const sep = cleanUrl.includes('?') ? '&' : '?';
        const res = await fetch(`${cleanUrl}${sep}action=ping&t=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        if (!res.ok) throw new Error(`HTTP ${res.status} — Pastikan Apps Script di-deploy dengan akses "Anyone"`);
        const json = await res.json();
        if (!json || !json.ok) throw new Error('Respons bukan JSON valid dari script MOCHI.OLED');
        return { ok: true, info: json };
    }

    function generateCloudConfigFileContent() {
        const cfg = getCloudConfig();
        const accounts = getAdminAccounts();
        const exportObj = {
            firebaseDatabaseUrl: cfg.firebaseDatabaseUrl || '',
            firebaseAuthToken: cfg.firebaseAuthToken || '',
            googleSheetsWebAppUrl: cfg.googleSheetsWebAppUrl || '',
            syncIntervalMs: cfg.syncIntervalMs || 8000,
            adminAccounts: accounts
        };
        return `/* =========================================================================\n`
            + `   MOCHI.OLED // Konfigurasi Cloud Database (Firebase & Google Sheets) & Keamanan Admin\n`
            + `   Generated from Admin Dashboard pada ${new Date().toISOString()}\n`
            + `   ========================================================================= */\n\n`
            + `window.MOCHI_CLOUD_CONFIG = ${JSON.stringify(exportObj, null, 4)};\n`;
    }

    function startAutoSync(onCloudUpdate) {
        const cfg = getCloudConfig();
        if (!cfg.firebaseDatabaseUrl && !cfg.googleSheetsWebAppUrl) return null;

        pullAll().then(res => {
            if (res.updated && typeof onCloudUpdate === 'function') onCloudUpdate(res);
        }).catch(() => {});

        return setInterval(async () => {
            try {
                const res = await pullAll();
                if (res.updated && typeof onCloudUpdate === 'function') {
                    onCloudUpdate(res);
                }
            } catch (e) {}
        }, Math.max(4000, cfg.syncIntervalMs || 8000));
    }

    global.MochiCloud = {
        sha256Hex,
        hashAdminSecret,
        getCloudConfig,
        saveCloudOverride,
        clearCloudOverride,
        getAdminAccounts,
        saveAdminAccounts,
        pullAll,
        pushCollection,
        pushAllFromLocal,
        testFirebase,
        testGoogleSheets,
        generateCloudConfigFileContent,
        startAutoSync
    };
})(window);
