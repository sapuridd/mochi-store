/**
 * MOCHI.OLED // Google Sheets Cloud Database Backend (Apps Script Web App)
 *
 * CARA PASANG (GRATIS, TANPA SERVER):
 * 1. Buka Google Sheets baru (sheets.google.com) -> beri nama misal "DB_MOCHI_OLED".
 * 2. Klik menu: Extensions (Ekstensi) -> Apps Script.
 * 3. Hapus semua kode bawaan, lalu copy-paste seluruh isi file ini.
 * 4. Klik Save -> Deploy -> New deployment -> pilih Type: Web app.
 * 5. Execute as: "Me" | Who has access: "Anyone" (Siapa saja).
 * 6. Klik Deploy -> Authorize access -> salin URL "Web app" (.../exec).
 * 7. Tempelkan URL tersebut di Admin Dashboard -> Tab "Cloud & Keamanan".
 */

var SHEET_SCHEMAS = {
  Produk: [
    'id', 'name', 'category', 'price', 'oldPrice', 'badge', 'badgeColor',
    'casingColor', 'borderColor', 'oledAccent', 'defaultExp', 'specs', 'stock'
  ],
  Pesanan: [
    'orderId', 'createdAt', 'buyerName', 'buyerWa', 'address',
    'items', 'method', 'destinationAccount', 'total', 'senderNote', 'status'
  ],
  Pembeli: [
    'id', 'name', 'email', 'wa', 'address', 'password', 'createdAt', 'lastLogin'
  ],
  Pengaturan: ['key', 'jsonValue', 'updatedAt']
};

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'pullAll';
  if (action === 'ping') {
    return jsonResponse({ ok: true, service: 'MOCHI.OLED Google Sheets DB', time: new Date().toISOString() });
  }
  if (action === 'pullAll') {
    var payload = {
      products: readSheetObjects('Produk'),
      orders: readSheetObjects('Pesanan'),
      users: readSheetObjects('Pembeli')
    };
    var settings = readSettingsMap();
    if (settings.paymentConfig) payload.paymentConfig = settings.paymentConfig;
    if (settings.logs) payload.logs = settings.logs;
    return jsonResponse({ ok: true, data: payload, timestamp: new Date().toISOString() });
  }
  return jsonResponse({ ok: false, error: 'Unknown GET action: ' + action });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = JSON.parse(raw);
    var action = body.action || '';

    if (action === 'syncCollection') {
      applyCollectionSync(body.collection, body.data);
      return jsonResponse({ ok: true, synced: body.collection });
    }

    if (action === 'pushAll' && body.data) {
      var d = body.data;
      if (d.products) applyCollectionSync('products', d.products);
      if (d.orders) applyCollectionSync('orders', d.orders);
      if (d.users) applyCollectionSync('users', d.users);
      if (d.paymentConfig) applyCollectionSync('paymentConfig', d.paymentConfig);
      if (d.logs) applyCollectionSync('logs', d.logs);
      return jsonResponse({ ok: true, pushedAll: true });
    }

    return jsonResponse({ ok: false, error: 'Unknown POST action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function applyCollectionSync(collectionName, data) {
  if (collectionName === 'products' && Array.isArray(data)) {
    writeSheetObjects('Produk', data);
  } else if (collectionName === 'orders' && Array.isArray(data)) {
    writeSheetObjects('Pesanan', data);
  } else if (collectionName === 'users' && Array.isArray(data)) {
    writeSheetObjects('Pembeli', data);
  } else if (collectionName === 'paymentConfig' || collectionName === 'logs') {
    upsertSettingKey(collectionName, data);
  }
}

function getOrCreateSheet(tabName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  var headers = SHEET_SCHEMAS[tabName] || [];
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    if (headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#22d3ee');
      sheet.setFrozenRows(1);
    }
  } else if (sheet.getLastRow() === 0 && headers.length > 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function writeSheetObjects(tabName, rowsArray) {
  var sheet = getOrCreateSheet(tabName);
  var headers = SHEET_SCHEMAS[tabName];
  sheet.clearContents();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#22d3ee');

  if (!rowsArray || rowsArray.length === 0) return;

  var matrix = rowsArray.map(function (obj) {
    return headers.map(function (h) {
      var v = (obj && obj[h] !== undefined && obj[h] !== null) ? obj[h] : '';
      if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v);
      return v;
    });
  });
  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

function readSheetObjects(tabName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet || sheet.getLastRow() < 2) return null;

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var out = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.join('') === '') continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c]);
      var val = row[c];
      if (key === 'specs' && typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) { val = val ? val.split(',').map(function (s) { return s.trim(); }) : []; }
      } else if (key === 'price' || key === 'oldPrice' || key === 'stock') {
        val = Number(val) || 0;
      } else if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      } else {
        val = String(val);
      }
      obj[key] = val;
    }
    out.push(obj);
  }
  return out;
}

function upsertSettingKey(settingKey, valObj) {
  var sheet = getOrCreateSheet('Pengaturan');
  var values = sheet.getDataRange().getValues();
  var nowStr = new Date().toISOString();
  var jsonStr = JSON.stringify(valObj);

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) === settingKey) {
      sheet.getRange(r + 1, 2).setValue(jsonStr);
      sheet.getRange(r + 1, 3).setValue(nowStr);
      return;
    }
  }
  sheet.appendRow([settingKey, jsonStr, nowStr]);
}

function readSettingsMap() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Pengaturan');
  var map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    var k = String(values[r][0]);
    try { map[k] = JSON.parse(values[r][1]); } catch (e) {}
  }
  return map;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

