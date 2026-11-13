/* =========================================================================
   MOCHI.OLED // Main Storefront & deskBuddy Simulator - Script (js/storefront.js)
   ========================================================================= */

// ==========================================
// 1. DATA PRODUK GANCI MOCHI OLED (KATALOG PENJUALAN)
// ==========================================
const STORAGE_KEY_PRODUCTS = 'MOCHI_SHARED_PRODUCTS_V3';
const STORAGE_KEY_LOGS = 'MOCHI_SHARED_SYNCLOGS_V1';
const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('mochi_store_sync_channel') : null;

const defaultProducts = [
    {
        id: 'mochi-white',
        name: 'Ganci Mochi OLED - Classic White',
        category: 'standard',
        price: 189000,
        oldPrice: 229000,
        badge: 'TERLARIS',
        badgeColor: 'bg-cyan-400 text-slate-900',
        casingColor: '#f8fafc',
        borderColor: '#cbd5e1',
        oledAccent: '#00f0ff',
        defaultExp: 'normal',
        specs: [
            'Layar OLED 0.96" Tajam + Wi-Fi Bawaan',
            '6 Mini-Games (Flappy, Dino, Pong, Snake+)',
            'Jam Meja Otomatis, Pomodoro & Stopwatch',
            '100+ Quotes Motivasi + Efek Suara (Bisa Mute)',
            'Baterai Charger Type-C + Bonus Ring Ganci'
        ],
        stock: 24
    },
    {
        id: 'mochi-black',
        name: 'Ganci Mochi OLED - Stealth Black',
        category: 'standard',
        price: 189000,
        oldPrice: 229000,
        badge: 'FAVORIT',
        badgeColor: 'bg-slate-900 text-cyan-400',
        casingColor: '#1e293b',
        borderColor: '#0f172a',
        oledAccent: '#00f0ff',
        defaultExp: 'happy',
        specs: [
            'Casing Matte Stealth Black Elegan',
            '6 Mini-Games Retro + High Score Tersimpan',
            'Jam Meja Wi-Fi Otomatis + Pomodoro Timer',
            '100+ Quotes Motivasi + Mode Silent',
            'Praktis 1 Tombol + Bonus Ring & Kabel Type-C'
        ],
        stock: 19
    },
    {
        id: 'mochi-red',
        name: 'Ganci Mochi OLED - Mecha Red RX',
        category: 'special',
        price: 215000,
        oldPrice: 259000,
        badge: 'SPECIAL EDITION',
        badgeColor: 'bg-rose-500 text-white',
        casingColor: '#e11d48',
        borderColor: '#881337',
        oledAccent: '#ff2a6d',
        defaultExp: 'angry',
        specs: [
            'Edisi Mecha Red RX + Animasi Eksklusif',
            'Layar OLED 0.96" Tajam + Efek Suara Buzzer',
            '6 Game: Flappy, Dino, Pong, Snake, Breakout, Stacker',
            'Jam Meja Wi-Fi Otomatis + Setting Mudah via HP',
            'Bonus Carabiner Metal + Kabel USB Type-C'
        ],
        stock: 8
    },
    {
        id: 'mochi-clear',
        name: 'Ganci Mochi OLED - Cyber Transparent',
        category: 'special',
        price: 225000,
        oldPrice: 269000,
        badge: 'LIMITED',
        badgeColor: 'bg-amber-400 text-slate-900',
        casingColor: '#e2e8f0',
        borderColor: '#64748b',
        oledAccent: '#05ffa1',
        defaultExp: 'dizzy',
        specs: [
            'Casing Transparan Estetik Edisi Terbatas',
            'Layar OLED 0.96" Responsif + Suara Chiptune',
            '6 Mini-Games, Jam Meja, Pomodoro & Stopwatch',
            '100+ Quotes Harian + Mode Mute Malam',
            'Bonus Kabel Type-C Braided + Stand Meja'
        ],
        stock: 4
    },
    {
        id: 'mochi-sakura',
        name: 'Ganci Mochi OLED - Sakura Pink',
        category: 'standard',
        price: 195000,
        oldPrice: 235000,
        badge: 'CUTE EDITION',
        badgeColor: 'bg-pink-300 text-slate-900',
        casingColor: '#fbcfe8',
        borderColor: '#f472b6',
        oledAccent: '#ff2a6d',
        defaultExp: 'love',
        specs: [
            'Casing Pastel Sakura Pink Cantik',
            'Animasi Mata Kawaii/Love + Efek Suara Imut',
            'Pomodoro Timer Belajar & Jam Meja Otomatis',
            '6 Mini-Games + 100+ Quotes Penyemangat',
            'Bonus Strap Tas Silikon + Ring Ganci'
        ],
        stock: 14
    },
    {
        id: 'mochi-atomic',
        name: 'Ganci Mochi OLED - Atomic Purple',
        category: 'special',
        price: 219000,
        oldPrice: 259000,
        badge: 'RETRO 90s',
        badgeColor: 'bg-purple-600 text-white',
        casingColor: '#7e22ce',
        borderColor: '#4c1d95',
        oledAccent: '#00f0ff',
        defaultExp: 'sleep',
        specs: [
            'Warna Retro GameBoy 90-an Transparan',
            '6 Game Klasik (Stacker 12/12, Breakout, Pong+)',
            'Efek Suara Retro 8-Bit (Bisa Mode Silent)',
            'Jam Meja Wi-Fi Otomatis + Stopwatch + Pomodoro',
            'Bonus Ring Ganci + Dudukan Meja Kerja'
        ],
        stock: 11
    }
];

let products = [];

function loadProductsFromSharedDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (raw) {
            products = JSON.parse(raw);
        } else {
            products = JSON.parse(JSON.stringify(defaultProducts));
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
        }
    } catch (e) {
        products = JSON.parse(JSON.stringify(defaultProducts));
    }
}

loadProductsFromSharedDB();

// State Keranjang
let cart = [
    { id: 'mochi-white', qty: 1 }
];

// State Pembayaran
let currentPaymentCategory = 'qris'; // 'qris' | 'ewallet' | 'transfer' | 'cod'
let currentFilter = 'all';

// ==========================================
// 2. SIMULATOR FIRMWARE ASLI (ESP32-S3 DESKBUDDY // SSD1306)
// ==========================================
const expressionOrder = ['normal', 'happy', 'angry', 'dizzy', 'love', 'sleep'];
let currentExpIndex = 0;
let activeSimScreen = 'eye'; // 'eye' | 'menu' | 'games' | 'clock' | 'pomodoro' | 'stopwatch' | 'quotes' | 'sound' | 'wifi'
let simIdleSoundOn = true;
let simMenuIndex = 0;
let simGameIndex = 0;
let simQuoteIndex = 0;
let simPomodoroMin = 25;
let simStopwatchRunning = false;
let simStopwatchTenths = 0;
let simStopwatchInterval = null;

const firmwareMenuItems = ['Games', 'Desk Clock', 'Quotes', 'Idle Sound', 'Change WiFi'];
const firmwareGamesList = [
    { name: 'FLAPPY BIRD', sub: 'Tap to start', score: 'BEST: 28', hint: '1xTap: Ganti Game | Hold: Main' },
    { name: 'DINO RUN', sub: '[ JUMP OBSTACLE ]', score: 'BEST: 420', hint: '1xTap: Ganti Game | Hold: Main' },
    { name: 'PONG (YOU vs AI)', sub: 'YOU 5 - 3 AI', score: 'Hold-Up | Free-Down', hint: '1xTap: Ganti Game | Hold: Quit' },
    { name: 'SNAKE', sub: 'Tap: Start / Turn', score: 'BEST: 64', hint: '1xTap: Ganti Game | Hold: Quit' },
    { name: 'BREAKOUT', sub: 'LEVEL UP! NEXT: L2', score: 'SCORE: 310', hint: '1xTap: Ganti Game | Hold: Quit' },
    { name: 'STACKER', sub: 'MAJOR PRIZE!', score: '12 / 12 STACK!', hint: '1xTap: Ganti Game | Hold: Quit' }
];
const firmwareQuotesList = [
    'When you feel like quitting, remember why you started.',
    'Discipline equals freedom.',
    'Dream big. Start small. Act now.',
    'Consistency is what transforms average into excellence.',
    'Focus on your goals, not your fear.',
    'Small daily improvements over time lead to stunning results.',
    'Make your future self proud.'
];

// Synthesizer Piezo Buzzer 8-Bit (Meniru LEDC PWM toneTask pada ESP32-S3)
function playPiezoBeep(freq = 1400, durationMs = 55) {
    if (!simIdleSoundOn) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);
        setTimeout(() => ctx.close(), durationMs + 50);
    } catch (e) {}
}

function getOledFaceSVG(type) {
    switch (type) {
        case 'happy':
            return `
                <svg viewBox="0 0 120 60" class="w-36 h-20 oled-glow animate-pixel-bounce">
                    <path d="M 18 36 Q 32 14 46 36" fill="none" stroke="#00f0ff" stroke-width="7" stroke-linecap="round"/>
                    <path d="M 74 36 Q 88 14 102 36" fill="none" stroke="#00f0ff" stroke-width="7" stroke-linecap="round"/>
                    <rect x="12" y="42" width="10" height="4" rx="2" fill="#ff2a6d"/>
                    <rect x="98" y="42" width="10" height="4" rx="2" fill="#ff2a6d"/>
                    <path d="M 54 40 Q 60 47 66 40" fill="none" stroke="#00f0ff" stroke-width="4" stroke-linecap="round"/>
                </svg>
            `;
        case 'angry':
            return `
                <svg viewBox="0 0 120 60" class="w-36 h-20 oled-glow-red animate-pixel-bounce">
                    <line x1="16" y1="14" x2="48" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/>
                    <line x1="104" y1="14" x2="72" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/>
                    <path d="M 18 26 H 46 V 38 Q 32 42 18 38 Z" fill="#ff2a6d"/>
                    <path d="M 74 26 H 102 V 38 Q 88 42 74 38 Z" fill="#ff2a6d"/>
                </svg>
            `;
        case 'dizzy':
            return `
                <svg viewBox="0 0 120 60" class="w-36 h-20 oled-glow-green animate-pixel-bounce">
                    <line x1="20" y1="18" x2="44" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/>
                    <line x1="44" y1="18" x2="20" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/>
                    <line x1="76" y1="18" x2="100" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/>
                    <line x1="100" y1="18" x2="76" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/>
                    <path d="M 48 48 Q 54 42 60 48 T 72 48" fill="none" stroke="#05ffa1" stroke-width="4" stroke-linecap="round"/>
                </svg>
            `;
        case 'love':
            return `
                <svg viewBox="0 0 120 60" class="w-36 h-20 oled-glow-red animate-pixel-bounce">
                    <path d="M32 44 L18 30 A8 8 0 0 1 32 20 A8 8 0 0 1 46 30 Z" fill="#ff2a6d"/>
                    <path d="M88 44 L74 30 A8 8 0 0 1 88 20 A8 8 0 0 1 102 30 Z" fill="#ff2a6d"/>
                </svg>
            `;
        case 'sleep':
            return `
                <svg viewBox="0 0 120 60" class="w-36 h-20 oled-glow">
                    <path d="M 18 32 Q 32 42 46 32" fill="none" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/>
                    <path d="M 74 32 Q 88 42 102 32" fill="none" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/>
                    <text x="88" y="20" fill="#00f0ff" font-family="monospace" font-weight="bold" font-size="14" class="animate-zzz">Zzz</text>
                </svg>
            `;
        case 'normal':
        default:
            return `
                <svg viewBox="0 0 120 60" class="w-36 h-20 oled-glow animate-blink">
                    <rect x="20" y="14" width="24" height="32" rx="10" fill="#00f0ff"/>
                    <rect x="76" y="14" width="24" height="32" rx="10" fill="#00f0ff"/>
                    <circle cx="27" cy="22" r="3.5" fill="#050505"/>
                    <circle cx="83" cy="22" r="3.5" fill="#050505"/>
                </svg>
            `;
    }
}

function highlightActiveSimButton(key) {
    document.querySelectorAll('.sim-btn').forEach(btn => {
        if (btn.dataset.exp === key) {
            btn.classList.remove('bg-white');
            btn.classList.add('bg-cyan-400');
        } else {
            btn.classList.remove('bg-cyan-400');
            btn.classList.add('bg-white');
        }
    });
}

function setExpression(expType) {
    activeSimScreen = 'eye';
    const container = document.getElementById('oled-face-container');
    const label = document.getElementById('oled-status-label');
    container.innerHTML = getOledFaceSVG(expType);
    label.textContent = 'EXP: ' + expType.toUpperCase();
    highlightActiveSimButton(expType);
    currentExpIndex = Math.max(0, expressionOrder.indexOf(expType));
    playPiezoBeep(1350, 45);
}

function cycleExpression() {
    currentExpIndex = (currentExpIndex + 1) % expressionOrder.length;
    setExpression(expressionOrder[currentExpIndex]);
}

function setFirmwareScreen(mode) {
    activeSimScreen = mode;
    const container = document.getElementById('oled-face-container');
    const label = document.getElementById('oled-status-label');
    highlightActiveSimButton('fw-' + mode);
    playPiezoBeep(1680, 50);

    if (mode === 'menu') {
        const selected = firmwareMenuItems[simMenuIndex];
        label.textContent = 'OS: MAIN MENU';
        container.innerHTML = `
            <div class="w-full text-center font-mono-tech text-cyan-400 space-y-0.5 leading-tight">
                <div class="text-[9px] text-slate-400 border-b border-slate-800 pb-0.5">[ Menu // deskBuddy ]</div>
                <div class="text-xs font-extrabold text-white py-1">&gt; ${selected} &lt;</div>
                <div class="text-[9px] text-emerald-400">1xTap: Pilih | Hold: Buka</div>
            </div>
        `;
    } else if (mode === 'games') {
        const g = firmwareGamesList[simGameIndex];
        label.textContent = 'GAME: ' + g.name.split(' ')[0];
        container.innerHTML = `
            <div class="w-full text-center font-mono-tech space-y-0.5 leading-tight">
                <div class="text-[9px] text-amber-400 font-bold">Select Game (${simGameIndex + 1}/6)</div>
                <div class="text-xs font-extrabold text-cyan-300">${g.name}</div>
                <div class="text-[10px] text-emerald-400 font-bold">${g.score}</div>
                <div class="text-[8px] text-slate-400">${g.sub}</div>
            </div>
        `;
    } else if (mode === 'clock') {
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
        const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
        label.textContent = 'NTP: pool.ntp.org';
        container.innerHTML = `
            <div class="w-full text-center font-mono-tech leading-tight space-y-0.5">
                <div class="text-[9px] text-emerald-400">${dateStr} • WIFI OK</div>
                <div class="text-2xl font-extrabold text-cyan-300 tracking-wider oled-glow">${timeStr}</div>
                <div class="text-[8px] text-slate-400">Desk Clock (UTC+07:00 WIB)</div>
            </div>
        `;
    } else if (mode === 'pomodoro') {
        label.textContent = 'POMODORO TIMER';
        container.innerHTML = `
            <div class="w-full text-center font-mono-tech leading-tight space-y-0.5">
                <div class="text-[9px] text-rose-400 font-bold">Set Pomodoro // Focus</div>
                <div class="text-xl font-extrabold text-white">${simPomodoroMin}:00 <span class="text-[10px] text-cyan-400">min</span></div>
                <div class="text-[8px] text-slate-300">TAP to +5m | HOLD-START</div>
            </div>
        `;
    } else if (mode === 'stopwatch') {
        const sec = Math.floor(simStopwatchTenths / 10);
        const mins = String(Math.floor(sec / 60)).padStart(2, '0');
        const remSec = String(sec % 60).padStart(2, '0');
        const tenths = simStopwatchTenths % 10;
        label.textContent = simStopwatchRunning ? 'SW: RUNNING' : 'SW: PAUSED';
        container.innerHTML = `
            <div class="w-full text-center font-mono-tech leading-tight space-y-0.5">
                <div class="text-[9px] text-amber-400 font-bold">Stopwatch • ${simStopwatchRunning ? 'RUNNING' : 'TAP TO START'}</div>
                <div class="text-xl font-extrabold text-cyan-300">${mins}:${remSec}.${tenths}</div>
                <div class="text-[8px] text-slate-400">Tap-Pause | Hold-Reset</div>
            </div>
        `;
    } else if (mode === 'quotes') {
        const q = firmwareQuotesList[simQuoteIndex];
        label.textContent = `QUOTE #${simQuoteIndex + 1}/100`;
        container.innerHTML = `
            <div class="w-full text-center font-mono-tech px-1 leading-snug">
                <div class="text-[8px] text-amber-400 font-bold mb-0.5">DAILY QUOTE (1xTap: Next)</div>
                <div class="text-[10px] text-cyan-200 font-bold line-clamp-3">"${q}"</div>
            </div>
        `;
    } else if (mode === 'sound') {
        simIdleSoundOn = !simIdleSoundOn;
        const soundBadge = document.getElementById('sim-sound-indicator');
        if (soundBadge) {
            soundBadge.textContent = simIdleSoundOn ? '🔊 IDLE SOUND: ON' : '🔇 IDLE SOUND: OFF';
            soundBadge.className = simIdleSoundOn
                ? 'cursor-pointer px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-700 font-mono-tech text-[10px] font-bold'
                : 'cursor-pointer px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-500 font-mono-tech text-[10px] font-bold';
        }
        if (simIdleSoundOn) playPiezoBeep(1950, 90);
        label.textContent = simIdleSoundOn ? 'IDLE SOUND: ON' : 'IDLE SOUND: OFF';
        container.innerHTML = simIdleSoundOn
            ? `<div class="w-full text-center font-mono-tech leading-tight space-y-0.5">
                 <div class="text-xs font-extrabold text-emerald-400">IDLE SOUND: ON</div>
                 <div class="text-[10px] text-white font-bold">Yay! Voice back!</div>
                 <div class="text-[9px] text-cyan-300">I can make noise!</div>
               </div>`
            : `<div class="w-full text-center font-mono-tech leading-tight space-y-0.5">
                 <div class="text-xs font-extrabold text-rose-400">IDLE SOUND: OFF</div>
                 <div class="text-[10px] text-white font-bold">Shh! Quiet mode</div>
                 <div class="text-[9px] text-slate-400">Silent in idle!</div>
               </div>`;
    } else if (mode === 'wifi') {
        label.textContent = 'AP: 192.168.4.1';
        container.innerHTML = `
            <div class="w-full text-left font-mono-tech text-[9px] leading-tight space-y-0.5 px-1">
                <div class="text-amber-400 font-extrabold text-center border-b border-slate-800 pb-0.5">WI-FI SETUP</div>
                <div class="text-slate-300">1. Connect Wi-Fi: <span class="text-cyan-300 font-bold">"deskBuddy"</span></div>
                <div class="text-slate-300">2. Browser: <span class="text-emerald-400 font-bold">192.168.4.1</span></div>
                <div class="text-[8px] text-slate-500 text-center">Single tap to exit</div>
            </div>
        `;
    }
}

// Simulasi Tombol 1-Button Multi-Gesture Ganci Mochi (1x Tap, 2x Tap, Hold)
function simHardwareButton(gesture) {
    if (gesture === 'double') {
        if (simStopwatchInterval) {
            clearInterval(simStopwatchInterval);
            simStopwatchInterval = null;
            simStopwatchRunning = false;
        }
        setFirmwareScreen('menu');
        showToast('2x TAP: Masuk ke Menu Utama Ganci Mochi');
        return;
    }

    if (gesture === 'hold') {
        if (activeSimScreen === 'eye') {
            setFirmwareScreen('menu');
            showToast('HOLD: Membuka Menu Fitur Ganci Mochi');
        } else if (activeSimScreen === 'menu') {
            const map = ['games', 'clock', 'quotes', 'sound', 'wifi'];
            setFirmwareScreen(map[simMenuIndex] || 'games');
        } else if (activeSimScreen === 'stopwatch') {
            simStopwatchTenths = 0;
            simStopwatchRunning = false;
            if (simStopwatchInterval) clearInterval(simStopwatchInterval);
            setFirmwareScreen('stopwatch');
            showToast('HOLD: Timer di-reset ke 00:00.0');
        } else {
            setExpression('normal');
            showToast('HOLD: Kembali ke Mode Layar Mata Robot');
        }
        return;
    }

    // Default: 1x TAP
    if (activeSimScreen === 'eye') {
        cycleExpression();
    } else if (activeSimScreen === 'menu') {
        simMenuIndex = (simMenuIndex + 1) % firmwareMenuItems.length;
        setFirmwareScreen('menu');
    } else if (activeSimScreen === 'games') {
        simGameIndex = (simGameIndex + 1) % firmwareGamesList.length;
        setFirmwareScreen('games');
    } else if (activeSimScreen === 'pomodoro') {
        simPomodoroMin = simPomodoroMin >= 60 ? 15 : simPomodoroMin + 5;
        setFirmwareScreen('pomodoro');
    } else if (activeSimScreen === 'stopwatch') {
        simStopwatchRunning = !simStopwatchRunning;
        if (simStopwatchRunning) {
            if (simStopwatchInterval) clearInterval(simStopwatchInterval);
            simStopwatchInterval = setInterval(() => {
                simStopwatchTenths++;
                if (activeSimScreen === 'stopwatch') setFirmwareScreen('stopwatch');
            }, 100);
        } else if (simStopwatchInterval) {
            clearInterval(simStopwatchInterval);
            simStopwatchInterval = null;
        }
        setFirmwareScreen('stopwatch');
    } else if (activeSimScreen === 'quotes') {
        simQuoteIndex = (simQuoteIndex + 1) % firmwareQuotesList.length;
        setFirmwareScreen('quotes');
    } else if (activeSimScreen === 'sound') {
        setFirmwareScreen('sound');
    } else if (activeSimScreen === 'wifi') {
        setExpression('normal');
    } else {
        setFirmwareScreen('clock');
    }
}

// ==========================================
// 3. RENDER KATALOG PRODUK
// ==========================================
function formatRupiah(num) {
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const filtered = currentFilter === 'all' 
        ? products 
        : products.filter(p => p.category === currentFilter);

    grid.innerHTML = filtered.map(prod => {
        const isOut = prod.stock <= 0;
        const stockLabel = isOut 
            ? '<span class="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-800 rounded font-mono-tech text-[10px] font-bold">STOK HABIS</span>'
            : `<span class="font-mono-tech text-[11px] ${prod.stock <= 5 ? 'text-amber-700 font-bold' : 'text-slate-500'}">Stok: ${prod.stock} unit</span>`;

        return `
        <div class="wf-box rounded-2xl p-5 flex flex-col justify-between bg-white relative group ${isOut ? 'opacity-75' : ''}">
            <div>
                <!-- Header Kartu: Badge & Stok -->
                <div class="flex items-center justify-between mb-3">
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold border border-slate-900 ${prod.badgeColor}">
                        ${prod.badge}
                    </span>
                    ${stockLabel}
                </div>

                <!-- Visual Ilustrasi Ganci Mochi di Katalog -->
                <div class="h-44 rounded-xl bg-slate-100 border-2 border-slate-900 flex flex-col items-center justify-center p-4 mb-4 relative overflow-hidden">
                    <span class="absolute top-2 left-2.5 font-mono-tech text-[10px] text-slate-400">0.96" OLED</span>
                    <!-- Gantungan Atas -->
                    <div class="w-5 h-3 border-2 border-slate-500 rounded-t-full -mb-1"></div>
                    <!-- Casing Ganci Sesuai Varian -->
                    <div style="background-color: ${prod.casingColor}; border-color: #0f172a;" class="w-36 h-28 rounded-[1.5rem] border-[3px] shadow-[0_5px_0_#0f172a] flex items-center justify-center p-2.5">
                        <!-- Layar OLED Mini -->
                        <div class="oled-screen w-full h-full rounded-xl border border-slate-800 flex items-center justify-center">
                            <div class="scale-75">
                                ${getOledFaceSVG(prod.defaultExp)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Nama & Harga -->
                <h3 class="font-extrabold text-base leading-snug mb-1">${prod.name}</h3>
                <div class="flex items-baseline gap-2 mb-3">
                    <span class="font-mono-tech font-extrabold text-lg text-slate-900">${formatRupiah(prod.price)}</span>
                    <span class="font-mono-tech text-xs text-slate-400 line-through">${formatRupiah(prod.oldPrice)}</span>
                </div>

                <!-- List Spesifikasi Singkat -->
                <ul class="space-y-1 mb-5 border-t border-dashed border-slate-300 pt-3">
                    ${(prod.specs || []).map(s => `
                        <li class="text-xs text-slate-600 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            <span>${s}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <!-- Tombol Aksi Tambah ke Keranjang -->
            <div class="grid grid-cols-5 gap-2 pt-2">
                <button onclick="previewInHero('${prod.casingColor}', '${prod.defaultExp}', '${prod.name}')" title="Coba di Simulator Atas" class="col-span-1 wf-btn py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
                <button onclick="addToCart('${prod.id}')" ${isOut ? 'disabled' : ''} class="col-span-4 wf-btn py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${isOut ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-cyan-400 hover:bg-slate-800'}">
                    <i data-lucide="${isOut ? 'x-circle' : 'plus-circle'}" class="w-4 h-4"></i>
                    <span>${isOut ? 'Stok Habis' : '+ Tambah ke Keranjang'}</span>
                </button>
            </div>
        </div>
    `}).join('');

    lucide.createIcons();
}

function filterProducts(cat) {
    currentFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === cat) {
            btn.classList.remove('bg-white', 'text-slate-900');
            btn.classList.add('bg-slate-900', 'text-white');
        } else {
            btn.classList.remove('bg-slate-900', 'text-white');
            btn.classList.add('bg-white', 'text-slate-900');
        }
    });
    renderProducts();
}

function previewInHero(color, exp, name) {
    const casing = document.getElementById('simulator-casing');
    casing.style.backgroundColor = color;
    setExpression(exp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Menampilkan warna casing: ${name}`);
}

// ==========================================
// 4. MANAJEMEN KERANJANG & NAVIGASI TAB
// ==========================================
function switchTab(tabName) {
    const viewProduk = document.getElementById('view-produk');
    const viewKeranjang = document.getElementById('view-keranjang');
    const navProduk = document.getElementById('nav-produk');
    const navKeranjang = document.getElementById('nav-keranjang');

    if (tabName === 'produk') {
        viewProduk.classList.remove('hidden');
        viewKeranjang.classList.add('hidden');
        navProduk.classList.add('bg-cyan-400');
        navProduk.classList.remove('bg-white');
        navKeranjang.classList.add('bg-white');
        navKeranjang.classList.remove('bg-cyan-400');
    } else {
        viewProduk.classList.add('hidden');
        viewKeranjang.classList.remove('hidden');
        navKeranjang.classList.add('bg-cyan-400');
        navKeranjang.classList.remove('bg-white');
        navProduk.classList.add('bg-white');
        navProduk.classList.remove('bg-cyan-400');
        renderCart();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToCart(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod || prod.stock <= 0) {
        showToast('Maaf, stok produk ini sedang habis!');
        return;
    }
    const existing = cart.find(item => item.id === productId);
    const currentQty = existing ? existing.qty : 0;
    if (currentQty + 1 > prod.stock) {
        showToast(`Maksimal pembelian sesuai sisa stok (${prod.stock} unit).`);
        return;
    }
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    updateCartBadge();
    showToast(`"${prod.name}" ditambahkan ke keranjang!`);
}

function changeQty(productId, delta) {
    const idx = cart.findIndex(item => item.id === productId);
    if (idx !== -1) {
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
        }
    }
    updateCartBadge();
    renderCart();
}

function clearCart() {
    cart = [];
    updateCartBadge();
    renderCart();
    showToast('Keranjang telah dikosongkan.');
}

function updateCartBadge() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-badge').textContent = totalQty;
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const clearBtn = document.getElementById('btn-clear-cart');
    const submitBtn = document.getElementById('btn-submit-order');

    if (cart.length === 0) {
        clearBtn.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        container.innerHTML = `
            <div class="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-xl space-y-3">
                <i data-lucide="shopping-bag" class="w-10 h-10 mx-auto text-slate-400"></i>
                <div class="font-bold text-slate-700">Keranjang Belanja Anda Kosong</div>
                <p class="text-xs text-slate-500">Yuk pilih varian Ganci Mochi OLED favoritmu di katalog produk!</p>
                <button onclick="switchTab('produk')" class="wf-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-400 text-xs font-bold mt-2">
                    <span>Lihat Katalog Produk</span>
                </button>
            </div>
        `;
        lucide.createIcons();
        updateCheckoutSummary();
        return;
    }

    clearBtn.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    container.innerHTML = cart.map(item => {
        const prod = products.find(p => p.id === item.id);
        return `
            <div class="p-3.5 rounded-xl border-2 border-slate-900 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                    <!-- Mini Thumbnail Ganci -->
                    <div style="background-color: ${prod.casingColor};" class="w-14 h-12 rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 p-1">
                        <div class="w-full h-full bg-black rounded-lg flex items-center justify-center gap-1">
                            <span class="w-1.5 h-2 rounded-full bg-cyan-400"></span>
                            <span class="w-1.5 h-2 rounded-full bg-cyan-400"></span>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-slate-900">${prod.name}</h4>
                        <div class="font-mono-tech text-xs text-slate-600">${formatRupiah(prod.price)} / unit</div>
                    </div>
                </div>

                <div class="flex items-center justify-between w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <!-- Kontrol Kuantitas -->
                    <div class="flex items-center border-2 border-slate-900 rounded-lg bg-white overflow-hidden">
                        <button onclick="changeQty('${prod.id}', -1)" class="px-2.5 py-1 hover:bg-slate-100 font-mono-tech font-bold text-sm">-</button>
                        <span class="px-3 py-1 font-mono-tech font-bold text-xs border-x-2 border-slate-900">${item.qty}</span>
                        <button onclick="changeQty('${prod.id}', 1)" class="px-2.5 py-1 hover:bg-slate-100 font-mono-tech font-bold text-sm">+</button>
                    </div>
                    <!-- Subtotal per baris -->
                    <div class="font-mono-tech font-bold text-sm text-right min-w-[95px]">
                        ${formatRupiah(prod.price * item.qty)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
    updateCheckoutSummary();
}

// ==========================================
// 5. INTEGRASI PAYMENT GATEWAY & REKENING TUJUAN OWNER (TERHUBUNG KE ADMIN)
// ==========================================
const STORAGE_KEY_PAYMENT_CFG = 'MOCHI_PAYMENT_CONFIG_V3';
const STORAGE_KEY_ORDERS = 'MOCHI_ORDERS_DB_V1';
let pgTimerInterval = null;
let qrisAutoDetectTimeout = null;
let activeOrderDraft = null;
let isProcessingQrisScan = false;
let currentQrisMode = 'dynamic'; // 'dynamic' (EMVCo Tag 54 Auto-Nominal) | 'static' (qris_ds_store.jpg)

// String EMVCo Resmi dari QRIS DS Store (NMID: ID1026590649467 - DANA Acquirer 93600915)
const OFFICIAL_DS_STORE_STATIC_QRIS = '00020101021126570011ID.DANA.WWW011893600915303490475702090349047570303UMI51440014ID.CO.QRIS.WWW0215ID10265906494670303UMI5204481453033605802ID5908DS Store6011Kab. Sambas61057946563046D10';

const defaultPaymentConfig = {
    holderName: 'Dede Sapuriyandika',
    adminWa: '6283871535128',
    qrisMerchant: 'DS Store (NMID: ID1026590649467)',
    qrisImageDataUrl: 'qris_ds_store.jpg',
    ewalletNumber: '083871535128',
    banks: {
        seabank: '901768637410',
        bca: '901768637410',
        mandiri: '901768637410',
        bni: '901768637410',
        bri: '901768637410'
    }
};

let paymentConfig = JSON.parse(JSON.stringify(defaultPaymentConfig));

// Algoritma Checksum Resmi Bank Indonesia / EMVCo QRIS: CRC-16/CCITT-FALSE (Poly 0x1021, Init 0xFFFF)
function computeCrc16Ccitt(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Konversi QRIS Statis DS Store menjadi QRIS Dinamis EMVCo dengan Tag 54 (Nominal Otomatis) + CRC16 Baru
function buildDynamicEmvcoQris(amountNumber) {
    const cleanNum = Math.max(1, Math.round(Number(amountNumber) || 1));
    const amtStr = String(cleanNum);
    const tag54 = '54' + String(amtStr.length).padStart(2, '0') + amtStr;
    // Ubah 010211 (Statis) -> 010212 (Dinamis) & sisipkan Tag 54 sebelum 5802ID
    const baseWithoutCrc = OFFICIAL_DS_STORE_STATIC_QRIS.slice(0, -8).replace('010211', '010212');
    const parts = baseWithoutCrc.split('5802ID');
    const payloadNoCrc = parts[0] + tag54 + '5802ID' + parts[1] + '6304';
    return payloadNoCrc + computeCrc16Ccitt(payloadNoCrc);
}

function getActiveQrisNumericAmount() {
    const customInput = document.getElementById('input-custom-qris-amount');
    if (customInput && customInput.value && Number(customInput.value) > 0) {
        return Math.round(Number(customInput.value));
    }
    const totalEl = document.getElementById('summary-total');
    const rawText = totalEl ? totalEl.textContent : '204000';
    const parsed = parseInt(String(rawText).replace(/[^0-9]/g, ''), 10);
    return parsed > 0 ? parsed : 189000;
}

function resetCustomQrisAmount() {
    const customInput = document.getElementById('input-custom-qris-amount');
    if (customInput) customInput.value = '';
    refreshCheckoutQrisBarcode();
    showToast('Nominal QRIS Dinamis dikembalikan mengikuti Total Tagihan Keranjang.');
}

function setQrisMode(mode) {
    currentQrisMode = mode === 'static' ? 'static' : 'dynamic';
    const btnDyn = document.getElementById('btn-mode-dynamic');
    const btnSta = document.getElementById('btn-mode-static');
    const pgBtnDyn = document.getElementById('pg-btn-mode-dynamic');
    const pgBtnSta = document.getElementById('pg-btn-mode-static');
    const modeBadge = document.getElementById('qris-mode-badge');
    const customBox = document.getElementById('qris-custom-amount-box');

    if (currentQrisMode === 'dynamic') {
        if (btnDyn) btnDyn.className = 'px-3 py-1 bg-cyan-400 text-slate-900';
        if (btnSta) btnSta.className = 'px-3 py-1 bg-white text-slate-700 border-l-2 border-slate-900';
        if (pgBtnDyn) pgBtnDyn.className = 'px-2.5 py-1 bg-cyan-400 text-slate-900';
        if (pgBtnSta) pgBtnSta.className = 'px-2.5 py-1 bg-white text-slate-700 border-l-2 border-slate-900';
        if (modeBadge) {
            modeBadge.textContent = 'QRIS DINAMIS';
            modeBadge.className = 'px-2 py-0.5 bg-cyan-400 text-slate-900 border border-slate-900 rounded font-bold text-[10px]';
        }
        if (customBox) customBox.classList.remove('hidden');
    } else {
        if (btnDyn) btnDyn.className = 'px-3 py-1 bg-white text-slate-700';
        if (btnSta) btnSta.className = 'px-3 py-1 bg-cyan-400 text-slate-900 border-l-2 border-slate-900';
        if (pgBtnDyn) pgBtnDyn.className = 'px-2.5 py-1 bg-white text-slate-700';
        if (pgBtnSta) pgBtnSta.className = 'px-2.5 py-1 bg-cyan-400 text-slate-900 border-l-2 border-slate-900';
        if (modeBadge) {
            modeBadge.textContent = 'QRIS STATIS (CROP)';
            modeBadge.className = 'px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-700 rounded font-bold text-[10px]';
        }
        if (customBox) customBox.classList.add('hidden');
    }

    refreshCheckoutQrisBarcode();
}

// Generator Barcode QRIS Dinamis EMVCo (Level L agar titik QR besar, tajam & instan di-scan DANA/SeaBank/BCA)
function generateRealScannableQrHTML(payloadText) {
    try {
        if (typeof window.qrcode === 'function') {
            const qr = window.qrcode(0, 'L');
            qr.addData(payloadText);
            qr.make();
            const svgTag = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
            return svgTag.replace('<svg ', '<svg class="w-full h-full" shape-rendering="crispEdges" ');
        }
    } catch (e) {}
    const encoded = encodeURIComponent(payloadText);
    return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&ecc=L&margin=8&data=${encoded}" alt="QRIS Dinamis DS Store" class="w-full h-full object-contain" />`;
}

function refreshCheckoutQrisBarcode() {
    const qrisCustomImg = document.getElementById('qris-custom-img');
    const qrisDefaultSvg = document.getElementById('qris-default-svg');
    const lockedLabel = document.getElementById('qris-locked-amount-label');
    const crcBadge = document.getElementById('qris-crc-badge');
    const pgImg = document.getElementById('pg-qris-img');
    const pgSvgWrap = document.getElementById('pg-qris-svg-wrap');

    const numericAmount = getActiveQrisNumericAmount();
    const formattedAmount = formatRupiah(numericAmount);
    if (lockedLabel) lockedLabel.textContent = formattedAmount;

    const dynamicEmvcoPayload = buildDynamicEmvcoQris(numericAmount);
    const crcCode = dynamicEmvcoPayload.slice(-4);

    if (currentQrisMode === 'dynamic') {
        const svgHtml = generateRealScannableQrHTML(dynamicEmvcoPayload);
        if (qrisCustomImg) qrisCustomImg.classList.add('hidden');
        if (qrisDefaultSvg) {
            qrisDefaultSvg.classList.remove('hidden');
            qrisDefaultSvg.innerHTML = svgHtml;
        }
        if (pgImg) pgImg.classList.add('hidden');
        if (pgSvgWrap) {
            pgSvgWrap.classList.remove('hidden');
            pgSvgWrap.innerHTML = svgHtml;
        }
        if (crcBadge) {
            crcBadge.textContent = `✓ QRIS DINAMIS DS STORE (${formattedAmount} • CRC: ${crcCode})`;
        }
    } else {
        const imgSrc = paymentConfig.qrisImageDataUrl || 'qris_ds_store.jpg';
        if (qrisCustomImg) {
            qrisCustomImg.src = imgSrc;
            qrisCustomImg.classList.remove('hidden');
        }
        if (qrisDefaultSvg) qrisDefaultSvg.classList.add('hidden');
        if (pgImg) {
            pgImg.src = imgSrc;
            pgImg.classList.remove('hidden');
        }
        if (pgSvgWrap) pgSvgWrap.classList.add('hidden');
        if (crcBadge) {
            crcBadge.textContent = `✓ QRIS STATIS CROP ASLI DS STORE (CRC: 6D10)`;
        }
    }
}

function loadPaymentConfigFromDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PAYMENT_CFG);
        if (raw) {
            const parsed = JSON.parse(raw);
            paymentConfig = {
                ...defaultPaymentConfig,
                ...parsed,
                banks: { ...defaultPaymentConfig.banks, ...(parsed.banks || {}) }
            };
        } else {
            localStorage.setItem(STORAGE_KEY_PAYMENT_CFG, JSON.stringify(paymentConfig));
        }
    } catch (e) {
        paymentConfig = JSON.parse(JSON.stringify(defaultPaymentConfig));
    }
    applyPaymentConfigToUI();
}

function applyPaymentConfigToUI() {
    const qrisMerchantEl = document.getElementById('qris-merchant-label');
    const qrisHolderEl = document.getElementById('qris-holder-display');

    if (qrisMerchantEl) qrisMerchantEl.textContent = 'QRIS: ' + (paymentConfig.qrisMerchant || 'DS Store');
    if (qrisHolderEl) qrisHolderEl.textContent = paymentConfig.holderName;

    refreshCheckoutQrisBarcode();

    const ewNumEl = document.getElementById('ewallet-number-display');
    const ewHolderEl = document.getElementById('ewallet-holder-display');
    if (ewNumEl) ewNumEl.textContent = paymentConfig.ewalletNumber;
    if (ewHolderEl) ewHolderEl.textContent = paymentConfig.holderName;

    const bankHolderEl = document.getElementById('bank-holder-display');
    if (bankHolderEl) bankHolderEl.textContent = paymentConfig.holderName;

    updateBankSelection();
}

function selectPaymentCategory(category) {
    currentPaymentCategory = category;

    ['qris', 'ewallet', 'transfer', 'cod'].forEach(cat => {
        const btn = document.getElementById('paytab-' + cat);
        const panel = document.getElementById('panel-' + cat);
        if (cat === category) {
            btn.classList.remove('bg-white');
            btn.classList.add('bg-cyan-400');
            panel.classList.remove('hidden');
        } else {
            btn.classList.remove('bg-cyan-400');
            btn.classList.add('bg-white');
            panel.classList.add('hidden');
        }
    });

    updateCheckoutSummary();
}

function getSelectedBankNumber() {
    const checked = document.querySelector('input[name="bank_provider"]:checked');
    const key = checked ? checked.dataset.bankKey : 'seabank';
    return (paymentConfig.banks && paymentConfig.banks[key]) || paymentConfig.banks.seabank || '901768637410';
}

function updateBankSelection() {
    const vaDisplay = document.getElementById('va-number-display');
    if (vaDisplay) vaDisplay.textContent = getSelectedBankNumber();
    updateCheckoutSummary();
}

function updateSubPaymentLabel() {
    updateCheckoutSummary();
}

function copyTextValue(elementId, labelName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent.trim();
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(`${labelName} (${text}) berhasil disalin!`);
}

function copyVANumber() {
    copyTextValue('va-number-display', 'Nomor Rekening Tujuan');
}

function getSelectedPaymentDetailName() {
    if (currentPaymentCategory === 'qris') return 'QRIS Instan';
    if (currentPaymentCategory === 'cod') return 'COD (Bayar di Tempat)';
    if (currentPaymentCategory === 'ewallet') {
        const checked = document.querySelector('input[name="ewallet_provider"]:checked');
        return checked ? `E-Wallet (${checked.value})` : 'E-Wallet';
    }
    if (currentPaymentCategory === 'transfer') {
        const checked = document.querySelector('input[name="bank_provider"]:checked');
        return checked ? `Transfer ${checked.value}` : 'Transfer Bank';
    }
    return 'QRIS';
}

function getSelectedDestinationAccount() {
    if (currentPaymentCategory === 'qris') {
        return `QRIS (${paymentConfig.qrisMerchant}) a.n ${paymentConfig.holderName}`;
    }
    if (currentPaymentCategory === 'ewallet') {
        const checked = document.querySelector('input[name="ewallet_provider"]:checked');
        const prov = checked ? checked.value : 'DANA';
        return `${prov}: ${paymentConfig.ewalletNumber} (a.n ${paymentConfig.holderName})`;
    }
    if (currentPaymentCategory === 'transfer') {
        const checked = document.querySelector('input[name="bank_provider"]:checked');
        const bankName = checked ? checked.value : 'Bank BCA';
        return `${bankName}: ${getSelectedBankNumber()} (a.n ${paymentConfig.holderName})`;
    }
    return 'Bayar Tunai ke Kurir (COD)';
}

function updateCheckoutSummary() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => {
        const prod = products.find(p => p.id === item.id);
        return sum + (prod ? prod.price * item.qty : 0);
    }, 0);

    const kurirSelect = document.getElementById('select-kurir');
    const ongkir = totalQty > 0 ? parseInt(kurirSelect.value, 10) : 0;

    const serviceFee = (totalQty > 0 && currentPaymentCategory === 'cod') ? 2500 : 0;
    const grandTotal = subtotal + ongkir + serviceFee;

    document.getElementById('summary-qty').textContent = totalQty;
    document.getElementById('summary-subtotal').textContent = formatRupiah(subtotal);
    document.getElementById('summary-ongkir').textContent = formatRupiah(ongkir);
    document.getElementById('summary-pay-method').textContent = getSelectedPaymentDetailName();
    document.getElementById('summary-fee').textContent = serviceFee > 0 ? formatRupiah(serviceFee) : 'GRATIS';
    document.getElementById('summary-total').textContent = formatRupiah(grandTotal);

    refreshCheckoutQrisBarcode();
}

// ==========================================
// 6. PROSES CHECKOUT, SCAN QRIS & PESANAN SELESAI OTOMATIS
// ==========================================
function startPgCountdown(seconds) {
    if (pgTimerInterval) clearInterval(pgTimerInterval);
    let remaining = seconds;
    const el = document.getElementById('pg-countdown');
    const tick = () => {
        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        if (el) el.textContent = `${m}:${s}`;
        if (remaining > 0) remaining--;
    };
    tick();
    pgTimerInterval = setInterval(tick, 1000);
}

function resetModalToPaymentView() {
    isProcessingQrisScan = false;
    if (qrisAutoDetectTimeout) {
        clearTimeout(qrisAutoDetectTimeout);
        qrisAutoDetectTimeout = null;
    }
    const payView = document.getElementById('pg-payment-view');
    const doneView = document.getElementById('pg-completed-view');
    if (payView) payView.classList.remove('hidden');
    if (doneView) doneView.classList.add('hidden');

    const overlay = document.getElementById('pg-qris-scan-overlay');
    if (overlay) overlay.classList.add('hidden');

    const autoToggle = document.getElementById('pg-auto-detect-toggle');
    if (autoToggle) autoToggle.checked = false;

    const headerDot = document.getElementById('pg-header-dot');
    const headerTitle = document.getElementById('pg-header-title');
    const countdownEl = document.getElementById('pg-countdown');
    if (headerDot) headerDot.className = 'w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping';
    if (headerTitle) {
        headerTitle.textContent = 'MOCHI.PAY // SECURE GATEWAY';
        headerTitle.className = 'font-mono-tech text-xs font-bold tracking-wider text-cyan-400';
    }
    if (countdownEl) countdownEl.classList.remove('hidden');

    const btnText = document.getElementById('btn-finish-pg-text');
    if (btnText) btnText.textContent = 'Sudah Dibayar — Selesaikan Pesanan';
}

function processCheckout() {
    if (cart.length === 0) {
        showToast('Keranjang masih kosong!');
        return;
    }

    const nama = document.getElementById('input-nama').value.trim();
    const wa = document.getElementById('input-wa').value.trim();
    const alamat = document.getElementById('input-alamat').value.trim();

    if (!nama || !wa || !alamat) {
        showToast('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman!');
        return;
    }

    resetModalToPaymentView();

    const randomOrderId = '#MCH-' + Math.floor(10000 + Math.random() * 90000);
    const paymentName = getSelectedPaymentDetailName();
    const activeQrisAmount = getActiveQrisNumericAmount();
    const totalText = currentPaymentCategory === 'qris'
        ? formatRupiah(activeQrisAmount)
        : document.getElementById('summary-total').textContent;
    const senderInput = document.getElementById('pg-sender-name');
    if (senderInput) {
        senderInput.value = currentPaymentCategory === 'qris'
            ? `Scan QRIS DS Store a.n ${nama}`
            : `Transfer a.n ${nama}`;
    }

    document.getElementById('modal-order-id').textContent = `ORDER ID: ${randomOrderId}`;
    document.getElementById('modal-penerima').textContent = `${nama} (${wa})`;
    document.getElementById('modal-metode').textContent = paymentName;
    document.getElementById('modal-total').textContent = totalText;

    const statusEl = document.getElementById('modal-status');
    const instruksiEl = document.getElementById('modal-instruksi');
    const qrisPreview = document.getElementById('pg-qris-preview');
    const accRow = document.getElementById('pg-account-row');
    const accNumEl = document.getElementById('pg-account-number');
    const accHolderEl = document.getElementById('pg-account-holder');

    qrisPreview.classList.add('hidden');
    accRow.classList.remove('hidden');
    accHolderEl.textContent = paymentConfig.holderName;

    if (currentPaymentCategory === 'cod') {
        accNumEl.textContent = 'BAYAR TUNAI KE KURIR (COD)';
        statusEl.textContent = 'SIAP DIKEMAS (COD)';
        statusEl.className = 'px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono-tech font-bold';
        instruksiEl.innerHTML = `Paket segera dikemas. Siapkan uang tunai sebesar <strong>${totalText}</strong> saat kurir tiba di alamat pengiriman Anda.`;
    } else if (currentPaymentCategory === 'qris') {
        qrisPreview.classList.remove('hidden');
        refreshCheckoutQrisBarcode();
        const seaBankNum = (paymentConfig.banks && paymentConfig.banks.seabank) || '901768637410';
        accNumEl.textContent = `DS Store (NMID: ID1026590649467) • ${seaBankNum}`;
        statusEl.textContent = 'MENUNGGU SCAN QRIS DINAMIS';
        statusEl.className = 'px-2 py-0.5 bg-cyan-100 text-cyan-900 rounded font-mono-tech font-bold';
        instruksiEl.innerHTML = `Scan kode <strong>QRIS Dinamis DS Store</strong> di atas. Nominal <strong>${totalText}</strong> otomatis muncul di HP Anda (masuk ke <strong>${paymentConfig.holderName}</strong>). Setelah bayar, klik tombol selesai di bawah!`;
    } else if (currentPaymentCategory === 'ewallet') {
        accNumEl.textContent = paymentConfig.ewalletNumber;
        statusEl.textContent = 'MENUNGGU TRANSFER E-WALLET';
        statusEl.className = 'px-2 py-0.5 bg-sky-100 text-sky-900 rounded font-mono-tech font-bold';
        instruksiEl.innerHTML = `Transfer saldo <strong>${paymentName}</strong> sebesar <strong>${totalText}</strong> ke nomor <strong>${paymentConfig.ewalletNumber}</strong> a.n <strong>${paymentConfig.holderName}</strong>.`;
    } else {
        const rekNum = getSelectedBankNumber();
        accNumEl.textContent = rekNum;
        statusEl.textContent = 'MENUNGGU TRANSFER BANK';
        statusEl.className = 'px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono-tech font-bold';
        instruksiEl.innerHTML = `Transfer tepat <strong>${totalText}</strong> ke rekening <strong>${paymentName}: ${rekNum}</strong> a.n <strong>${paymentConfig.holderName}</strong>.`;
    }

    activeOrderDraft = {
        orderId: randomOrderId,
        buyerName: nama,
        buyerWa: wa,
        address: alamat,
        items: cart.map(i => {
            const p = products.find(prod => prod.id === i.id);
            return `${i.qty}x ${p ? p.name : i.id}`;
        }).join(', '),
        method: paymentName,
        destinationAccount: getSelectedDestinationAccount(),
        total: totalText,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    startPgCountdown(15 * 60 - 1);

    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

// Toggle Auto-Detect 5 detik untuk simulasi callback otomatis saat di-scan dari HP
function toggleQrisAutoDetect(enabled) {
    if (qrisAutoDetectTimeout) {
        clearTimeout(qrisAutoDetectTimeout);
        qrisAutoDetectTimeout = null;
    }
    if (enabled) {
        showToast('Auto-Detect QRIS aktif: Pembayaran akan terdeteksi otomatis dalam 5 detik...');
        qrisAutoDetectTimeout = setTimeout(() => {
            simulateQrisScanAndPay();
        }, 4500);
    }
}

// Fungsi ketika QRIS di-scan / diklik untuk membayar -> Langsung Pesanan Selesai!
function simulateQrisScanAndPay() {
    if (isProcessingQrisScan || !activeOrderDraft) return;
    isProcessingQrisScan = true;
    if (qrisAutoDetectTimeout) {
        clearTimeout(qrisAutoDetectTimeout);
        qrisAutoDetectTimeout = null;
    }

    const overlay = document.getElementById('pg-qris-scan-overlay');
    const titleEl = document.getElementById('pg-qris-scan-title');
    const subEl = document.getElementById('pg-qris-scan-sub');
    const statusEl = document.getElementById('modal-status');

    if (overlay) overlay.classList.remove('hidden');
    if (titleEl) titleEl.textContent = 'MEMINDAI BARCODE QRIS...';
    if (subEl) subEl.textContent = `Mendeteksi pembayaran ${activeOrderDraft.total} ke ${paymentConfig.holderName}...`;
    if (statusEl) {
        statusEl.textContent = 'MENDETEKSI PEMBAYARAN QRIS...';
        statusEl.className = 'px-2 py-0.5 bg-cyan-200 text-slate-900 rounded font-mono-tech font-bold animate-pulse';
    }

    setTimeout(() => {
        if (titleEl) {
            titleEl.textContent = '✓ PEMBAYARAN QRIS DITERIMA!';
            titleEl.className = 'font-mono-tech font-extrabold text-xs text-emerald-400 text-center';
        }
        if (subEl) {
            subEl.textContent = 'Otomatis menyelesaikan pesanan Anda...';
        }
        if (statusEl) {
            statusEl.textContent = 'PEMBAYARAN BERHASIL — PESANAN SELESAI';
            statusEl.className = 'px-2 py-0.5 bg-emerald-300 text-slate-950 rounded font-mono-tech font-bold';
        }

        setTimeout(() => {
            finishOrderAndReset('QRIS_AUTO_PAID');
        }, 650);
    }, 850);
}

function closeModal() {
    if (pgTimerInterval) clearInterval(pgTimerInterval);
    if (qrisAutoDetectTimeout) clearTimeout(qrisAutoDetectTimeout);
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function closeCompletedOrderModal() {
    closeModal();
    renderBuyerCompletedOrders();
    showToast('Pesanan selesai! Anda dapat melihat detailnya di Riwayat Pesanan Saya.');
}

function sendProofToWhatsApp() {
    if (!activeOrderDraft) return;
    const senderNote = (document.getElementById('pg-sender-name').value || '').trim();
    const targetWa = (paymentConfig.adminWa || '6283871535128').replace(/[^0-9]/g, '');
    const msg = [
        `Halo Admin *MOCHI.OLED* (${paymentConfig.holderName}), pembayaran pesanan saya telah *SELESAI / LUNAS*:`,
        ``,
        `*Status:* PESANAN SELESAI (LUNAS)`,
        `*ID Transaksi:* ${activeOrderDraft.orderId}`,
        `*Nama Pembeli:* ${activeOrderDraft.buyerName} (${activeOrderDraft.buyerWa})`,
        `*Produk:* ${activeOrderDraft.items}`,
        `*Total Dibayar:* ${activeOrderDraft.total}`,
        `*Metode & Rekening Tujuan:* ${activeOrderDraft.destinationAccount}`,
        `*Keterangan:* ${senderNote || 'QRIS Auto-Verified'}`,
        `*Alamat Kirim:* ${activeOrderDraft.address}`
    ].join('\n');

    window.open(`https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`, '_blank');
}

function finishOrderAndReset(triggerSource) {
    if (!activeOrderDraft) return;
    const btnText = document.getElementById('btn-finish-pg-text');
    const statusEl = document.getElementById('modal-status');
    if (btnText) btnText.textContent = 'Menyelesaikan Pesanan...';
    if (statusEl) {
        statusEl.textContent = 'MEMPROSES PESANAN SELESAI...';
        statusEl.className = 'px-2 py-0.5 bg-emerald-200 text-slate-900 rounded font-mono-tech font-bold';
    }

    setTimeout(() => {
        const purchasedNames = [];
        cart.forEach(item => {
            const prod = products.find(p => p.id === item.id);
            if (prod) {
                prod.stock = Math.max(0, prod.stock - item.qty);
                purchasedNames.push(`${item.qty}x ${prod.name}`);
            }
        });

        const completedTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const senderNote = (document.getElementById('pg-sender-name').value || '').trim();
        const finalStatus = currentPaymentCategory === 'cod'
            ? 'PESANAN SELESAI (COD SIAP KIRIM)'
            : 'PESANAN SELESAI (LUNAS)';

        const orderRecord = {
            ...(activeOrderDraft || {}),
            createdAt: completedTime,
            senderNote: senderNote || (triggerSource === 'QRIS_AUTO_PAID' ? 'QRIS Scanned & Auto-Verified' : 'Sudah Dibayar'),
            status: finalStatus
        };

        try {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));

            const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
            orders.unshift(orderRecord);
            localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));

            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
            const buyerLabel = currentBuyer ? currentBuyer.name : orderRecord.buyerName;
            logs.unshift({
                time: new Date().toTimeString().split(' ')[0],
                msg: `PESANAN SELESAI (${orderRecord.orderId}) oleh ${buyerLabel}: ${purchasedNames.join(', ')} -> ${orderRecord.destinationAccount} [${orderRecord.total}] (${finalStatus}).`,
                type: 'add'
            });
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
            if (window.MochiCloud) {
                window.MochiCloud.pushCollection(STORAGE_KEY_PRODUCTS, products);
                window.MochiCloud.pushCollection(STORAGE_KEY_ORDERS, orders);
                window.MochiCloud.pushCollection(STORAGE_KEY_LOGS, logs);
            }
            if (syncChannel) syncChannel.postMessage({ type: 'ORDER_COMPLETED', timestamp: Date.now() });
        } catch (e) {}

        // Kosongkan keranjang & perbarui katalog
        cart = [];
        updateCartBadge();
        renderProducts();
        renderCart();
        renderBuyerCompletedOrders();

        // Tampilkan Layar Struk "PESANAN SELESAI & LUNAS" di dalam Modal
        if (pgTimerInterval) clearInterval(pgTimerInterval);
        const payView = document.getElementById('pg-payment-view');
        const doneView = document.getElementById('pg-completed-view');
        if (payView) payView.classList.add('hidden');
        if (doneView) doneView.classList.remove('hidden');

        const headerDot = document.getElementById('pg-header-dot');
        const headerTitle = document.getElementById('pg-header-title');
        const countdownEl = document.getElementById('pg-countdown');
        if (headerDot) headerDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
        if (headerTitle) {
            headerTitle.textContent = 'MOCHI.PAY // PESANAN SELESAI (LUNAS)';
            headerTitle.className = 'font-mono-tech text-xs font-bold tracking-wider text-emerald-400';
        }
        if (countdownEl) countdownEl.classList.add('hidden');

        document.getElementById('done-order-status').textContent = finalStatus;
        document.getElementById('done-order-id').textContent = orderRecord.orderId;
        document.getElementById('done-order-time').textContent = completedTime + ' WIB';
        document.getElementById('done-order-dest').textContent = orderRecord.destinationAccount;
        document.getElementById('done-order-items').textContent = orderRecord.items;
        document.getElementById('done-order-buyer').textContent = `${orderRecord.buyerName} (${orderRecord.buyerWa}) — ${orderRecord.address}`;
        document.getElementById('done-order-total').textContent = orderRecord.total;

        lucide.createIcons();
        showToast(`Pembayaran berhasil! Status ${orderRecord.orderId}: PESANAN SELESAI.`);
    }, 350);
}

function renderBuyerCompletedOrders() {
    const container = document.getElementById('buyer-orders-container');
    const badge = document.getElementById('buyer-orders-badge');
    if (!container || !badge) return;

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
    } catch (e) {
        orders = [];
    }

    badge.textContent = `${orders.length} Selesai`;

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded-xl font-mono-tech">
                Belum ada pesanan selesai.
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(o => `
        <div class="p-3 rounded-xl border-2 border-slate-900 bg-emerald-50/60 space-y-1 text-xs">
            <div class="flex items-center justify-between">
                <span class="font-mono-tech font-extrabold text-slate-900">${o.orderId}</span>
                <span class="px-2 py-0.5 rounded bg-emerald-400 text-slate-900 border border-slate-900 font-mono-tech font-extrabold text-[10px]">
                    ✓ ${o.status || 'PESANAN SELESAI'}
                </span>
            </div>
            <div class="font-bold text-slate-800">${o.items}</div>
            <div class="flex items-center justify-between text-[11px] font-mono-tech text-slate-600 pt-1 border-t border-emerald-200">
                <span>${o.method}</span>
                <span class="font-extrabold text-emerald-800">${o.total}</span>
            </div>
        </div>
    `).join('');
}

// Dengarkan perubahan stok / produk baru / pengaturan rekening / status pesanan dari Admin Panel secara real-time
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_PRODUCTS) {
        loadProductsFromSharedDB();
        renderProducts();
        renderCart();
        showToast('Katalog & stok diperbarui otomatis oleh Admin!');
    }
    if (e.key === STORAGE_KEY_PAYMENT_CFG) {
        loadPaymentConfigFromDB();
        showToast('Data Rekening Tujuan diperbarui oleh Admin!');
    }
    if (e.key === STORAGE_KEY_ORDERS) {
        renderBuyerCompletedOrders();
    }
});

if (syncChannel) {
    syncChannel.onmessage = () => {
        loadProductsFromSharedDB();
        loadPaymentConfigFromDB();
        renderProducts();
        renderCart();
        renderBuyerCompletedOrders();
    };
}

// ==========================================
// 7. HELPER TOAST NOTIFICATION (PENGGANTI ALERT)
// ==========================================
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'wf-box-sm px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-mono-tech flex items-center gap-2.5 shadow-lg pointer-events-auto transition-all duration-300';
    toast.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// ==========================================
// 8. OTENTIKASI SESI PEMBELI (TERHUBUNG KE INDEX.HTML)
// ==========================================
const STORAGE_KEY_AUTH_USER = 'MOCHI_AUTH_USER_V1';
let currentBuyer = null;

function readSharedSession(key) {
    try {
        const localVal = localStorage.getItem(key);
        if (localVal) return JSON.parse(localVal);
    } catch (e) {}
    try {
        if (window.name && window.name.startsWith('__MOCHI_BAG__:')) {
            const winBag = JSON.parse(window.name.replace('__MOCHI_BAG__:', ''));
            if (winBag[key]) {
                try { localStorage.setItem(key, JSON.stringify(winBag[key])); } catch (e) {}
                return winBag[key];
            }
        }
    } catch (e) {}
    return null;
}

function removeSharedSession(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    try {
        if (window.name && window.name.startsWith('__MOCHI_BAG__:')) {
            const winBag = JSON.parse(window.name.replace('__MOCHI_BAG__:', ''));
            delete winBag[key];
            window.name = '__MOCHI_BAG__:' + JSON.stringify(winBag);
        }
    } catch (e) {}
}

function verifyBuyerAuth() {
    currentBuyer = readSharedSession(STORAGE_KEY_AUTH_USER);
    if (!currentBuyer || !currentBuyer.name) {
        window.location.replace('index.html');
        return false;
    }

    const badgeEl = document.getElementById('buyer-name-badge');
    if (badgeEl) badgeEl.textContent = currentBuyer.name;

    // Isi otomatis formulir pengiriman dari akun pembeli yang login
    if (!currentBuyer.isGuest) {
        const namaInput = document.getElementById('input-nama');
        const waInput = document.getElementById('input-wa');
        const alamatInput = document.getElementById('input-alamat');
        if (namaInput && currentBuyer.name) namaInput.value = currentBuyer.name;
        if (waInput && currentBuyer.wa) waInput.value = currentBuyer.wa;
        if (alamatInput && currentBuyer.address && currentBuyer.address !== 'Alamat belum diatur') {
            alamatInput.value = currentBuyer.address;
        }
    }
    return true;
}

function logoutBuyer() {
    const name = currentBuyer ? currentBuyer.name : 'Pembeli';
    removeSharedSession(STORAGE_KEY_AUTH_USER);
    try {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
        logs.unshift({
            time: new Date().toTimeString().split(' ')[0],
            msg: `Pembeli "${name}" keluar (logout) dari Storefront.`,
            type: 'info'
        });
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
        if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_LOGS, logs);
        if (syncChannel) syncChannel.postMessage({ type: 'BUYER_LOGOUT', timestamp: Date.now() });
    } catch (e) {}
    window.location.href = 'index.html';
}

// ==========================================
// INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
window.onload = function () {
    if (!verifyBuyerAuth()) return;
    loadPaymentConfigFromDB();
    setExpression('normal');
    renderProducts();
    updateCartBadge();
    renderBuyerCompletedOrders();

    if (window.MochiCloud) {
        window.MochiCloud.startAutoSync(() => {
            loadProductsFromSharedDB();
            loadPaymentConfigFromDB();
            renderProducts();
            renderCart();
            renderBuyerCompletedOrders();
        });
    }

    lucide.createIcons();
};
