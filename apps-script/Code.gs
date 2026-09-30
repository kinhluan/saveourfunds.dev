// Receives cart requests from cart.html and writes one row per shirt into the "Mua áo" tab.
// Deploy: Extensions → Apps Script → paste this → Deploy → New deployment → Web app,
// Execute as: Me, Who has access: Anyone. Put the /exec URL in SHEET_ENDPOINT in cart.html.

const SHEET_NAME = 'Mua áo';
const FIRST_ROW = 3;   // row 2 holds the headers
const FIRST_COL = 2;   // column B = "No"; B..G = No, Tên, Loại áo, Màu, Sai, In tên lên áo
const MAX_QTY_PER_ITEM = 20;
const MAX_ROWS_PER_REQUEST = 40;

// Page values → the sheet's dropdown options, so the dropdown cells stay valid.
const CUTS = { thun: 'Áo Thun siêu đẹp', polo: 'Polo Vip Pro', hoodie: 'Hoodies ngầu đét' };
const COLORS = { Black: 'Đen huyền bí', White: 'Trắng tinh khôi', Navy: 'Nà vi đẳng cấp', Red: 'Đỏ phong cách', Gray: 'Xám đỉnh cao' };
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    // A retried request carries the same id; skip it so one order never lands twice.
    const cache = CacheService.getScriptCache();
    const requestId = /^[a-z0-9]{8,40}$/i.test(data.requestId || '') ? 'req:' + data.requestId : '';
    if (requestId && cache.get(requestId)) return json({ ok: true, duplicate: true });
    const name = clean(data.name, 60);
    const phone = String(data.phone == null ? '' : data.phone).trim();
    if (!name || !/^\+?\d{9,12}$/.test(phone)) return json({ ok: false, error: 'Missing name or phone' });

    const rows = [];
    (data.items || []).forEach(function (it) {
      if (!CUTS[it.key] || !COLORS[it.color] || SIZES.indexOf(it.size) < 0) throw new Error('Unknown item');
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 0), MAX_QTY_PER_ITEM);
      for (let i = 0; i < qty; i++) {
        rows.push([null, name + ' (' + phone + ')', CUTS[it.key], COLORS[it.color], it.size, clean(it.sleeve, 12)]);
      }
    });
    if (!rows.length || rows.length > MAX_ROWS_PER_REQUEST) return json({ ok: false, error: 'Bad item count' });

    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    // Find the last order by column C (Tên), not getLastRow(): column K has notes further down the sheet.
    const height = sheet.getMaxRows() - FIRST_ROW + 1;
    const names = sheet.getRange(FIRST_ROW, FIRST_COL + 1, height, 1).getValues();
    let used = names.length;
    while (used > 0 && names[used - 1][0] === '') used--;
    const numbers = used ? sheet.getRange(FIRST_ROW, FIRST_COL, used, 1).getValues() : [];
    let next = numbers.reduce(function (max, r) { return Math.max(max, Number(r[0]) || 0); }, 0) + 1;
    rows.forEach(function (row) { row[0] = next++; });

    if (FIRST_ROW + used + rows.length - 1 > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), rows.length);
    sheet.getRange(FIRST_ROW + used, FIRST_COL, rows.length, rows[0].length).setValues(rows);
    if (requestId) cache.put(requestId, '1', 21600);
    return json({ ok: true, rows: rows.length });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

// Trims, caps length, and stops text starting with = + - @ from being read as a formula.
function clean(value, max) {
  const text = String(value == null ? '' : value).trim().slice(0, max);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
