// lib/fixtures.mjs - demo catalog, vendor settings, and linked-scan mappings.
//
// The sample workbook quantities are synthetic, but these catalog rows mirror the
// shape of the operational catalog: vendor, scan code, item code, description,
// department, case quantity, active flag, and orderability.
//
// Item shape:  { full_scan_code, vendor_name, sku, item_description, department,
//                case_qty, active, allow_order }
//   allow_order:false marks a LINKED SINGLE - you order its pack instead; its sales
//   (and, as a fallback, its inventory) roll into the pack via linked_scan_codes.

export const vendors = [
  // sales_window_days is the look-back window; target_days is how many days of stock to
  // carry (bigger -> bigger orders); inventory_credit discounts on-hand stock 0..1.
  { vendor_name: "The Columbus Dist. Co.", sales_window_days: 14, target_days: 10, inventory_credit: 0.80 },
  { vendor_name: "Coca Cola Consolidated", sales_window_days: 14, target_days: 21, inventory_credit: 0.80 },
  { vendor_name: "G & J Pepsi Co", sales_window_days: 14, target_days: 14, inventory_credit: 0.80 },
  { vendor_name: "Heidelberg Distributing Company", sales_window_days: 14, target_days: 14, inventory_credit: 0.80 },
  { vendor_name: "7 UP", sales_window_days: 14, target_days: 21, inventory_credit: 0.80 },
];

// 50 realistic convenience-store rows: 10 items per requested vendor.
export const catalog = [
  // --- The Columbus Dist. Co. ---
  { full_scan_code: "018200250026", vendor_name: "The Columbus Dist. Co.", sku: "008458", item_description: "Natural Light 25oz can", department: "BEER & WINE", case_qty: 15, active: true, allow_order: true },
  { full_scan_code: "018200250118", vendor_name: "The Columbus Dist. Co.", sku: "009858", item_description: "King cobra 24oz Can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "018200250149", vendor_name: "The Columbus Dist. Co.", sku: "000682", item_description: "Ritas Lime 25oz can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "018200229831", vendor_name: "The Columbus Dist. Co.", sku: "002359", item_description: "Bud Ice 3pk 25oz cans", department: "BEER & WINE", case_qty: 5, active: true, allow_order: true },
  { full_scan_code: "018200200977", vendor_name: "The Columbus Dist. Co.", sku: "008659", item_description: "Natty Daddy 3pk 25oz cans", department: "BEER & WINE", case_qty: 5, active: true, allow_order: true },
  { full_scan_code: "018200250040", vendor_name: "The Columbus Dist. Co.", sku: "007858", item_description: "Busch Light 25oz can", department: "BEER & WINE", case_qty: 15, active: true, allow_order: true },
  { full_scan_code: "018200000430", vendor_name: "The Columbus Dist. Co.", sku: "008454", item_description: "Natural Light 6pk 16oz cans", department: "BEER & WINE", case_qty: 4, active: true, allow_order: true },
  { full_scan_code: "816751022105", vendor_name: "The Columbus Dist. Co.", sku: "000789", item_description: "Cutwater Mango Margarita 4pk cans", department: "BEER & WINE", case_qty: 6, active: true, allow_order: true },
  { full_scan_code: "018200201288", vendor_name: "The Columbus Dist. Co.", sku: "000557", item_description: "Budweiser 12pk 16oz cans", department: "BEER & WINE", case_qty: 2, active: true, allow_order: true },
  { full_scan_code: "018200000188", vendor_name: "The Columbus Dist. Co.", sku: "000557", item_description: "Budweiser 16oz can", department: "BEER & WINE", case_qty: null, active: true, allow_order: false },

  // --- Coca Cola Consolidated ---
  { full_scan_code: "070847811169", vendor_name: "Coca Cola Consolidated", sku: "133129", item_description: "Monster energy Original 16oz", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "049000050103", vendor_name: "Coca Cola Consolidated", sku: "132530", item_description: "Coca Cola 2ltr btl", department: "SOFT DRINKS", case_qty: 8, active: true, allow_order: true },
  { full_scan_code: "049000007640", vendor_name: "Coca Cola Consolidated", sku: "103029", item_description: "SPRITE 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "049000000443", vendor_name: "Coca Cola Consolidated", sku: "119826", item_description: "Coca Cola 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "049000013856", vendor_name: "Coca Cola Consolidated", sku: "133115", item_description: "Coca Cola 15pk 12oz cans", department: "SOFT DRINKS", case_qty: 2, active: true, allow_order: true },
  { full_scan_code: "025000058011", vendor_name: "Coca Cola Consolidated", sku: "115304", item_description: "Minute Maid Lemonade 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "786162338006", vendor_name: "Coca Cola Consolidated", sku: "129252", item_description: "Smart Water 1ltr btl", department: "SOFT DRINKS", case_qty: 15, active: true, allow_order: true },
  { full_scan_code: "025000058868", vendor_name: "Coca Cola Consolidated", sku: "116533", item_description: "Minute Maid Pink Lemonade 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "049000019162", vendor_name: "Coca Cola Consolidated", sku: "114756", item_description: "Fanta Orange 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "049000006346", vendor_name: "Coca Cola Consolidated", sku: null, item_description: "Coca Cola 12oz can", department: "SOFT DRINKS", case_qty: null, active: true, allow_order: false },

  // --- G & J Pepsi Co ---
  { full_scan_code: "012000001314", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Mountain Dew 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "012000001291", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Pepsi Regular 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "078000082401", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Dr.Pepper 20oz btl", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "012000286193", vendor_name: "G & J Pepsi Co", sku: null, item_description: "PureLeaf Sweet Tea 18.5oz btl", department: "SOFT DRINKS", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "052000135176", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Gatorade Cool Blue 28oz btl", department: "SOFT DRINKS", case_qty: 15, active: true, allow_order: true },
  { full_scan_code: "012000001574", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Aquafina 1ltr btl", department: "SOFT DRINKS", case_qty: 15, active: true, allow_order: true },
  { full_scan_code: "889392000917", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Celsius Grape Rush 12oz can", department: "SOFT DRINKS", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "012000002335", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Mountain Dew 2ltr btl", department: "SOFT DRINKS", case_qty: 8, active: true, allow_order: true },
  { full_scan_code: "012000029202", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Mountain Dew 18pk 12oz cans", department: "SOFT DRINKS", case_qty: 2, active: true, allow_order: true },
  { full_scan_code: "012000000850", vendor_name: "G & J Pepsi Co", sku: null, item_description: "Mountain Dew 12oz can", department: "SOFT DRINKS", case_qty: null, active: true, allow_order: false },

  // --- Heidelberg Distributing Company ---
  { full_scan_code: "080660957210", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "Modelo Especial 24oz Can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "080660956831", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "Corona Familiar 32oz btl", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "635985010371", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "Mike's Harder Cranberry 16oz Can", department: "BEER & WINE", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "635985260707", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "MXD Margarita 16oz Can", department: "BEER & WINE", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "635985802136", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "White Claw Mango 19.2oz Can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "635985802143", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "White Claw Ruby Grapefruit 19.2oz Can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "080660957159", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "Modelo Especial 12oz 12pk Cans", department: "BEER & WINE", case_qty: 2, active: true, allow_order: true },
  { full_scan_code: "635985801986", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "White Claw Black Cherry 19.2oz Can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "635985000433", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "MXD Blue Hawaiian 16oz Can", department: "BEER & WINE", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "080660957968", vendor_name: "Heidelberg Distributing Company", sku: null, item_description: "Modelo Chelada Especial 24oz Can", department: "BEER & WINE", case_qty: 12, active: true, allow_order: true },

  // --- 7 UP ---
  { full_scan_code: "078000023756", vendor_name: "7 UP", sku: null, item_description: "Venom Fruit Punch 16oz can", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "078000039580", vendor_name: "7 UP", sku: null, item_description: "Tahitian Treat $1.49 2ltr btl", department: "SOFT DRINKS", case_qty: 8, active: true, allow_order: true },
  { full_scan_code: "078000039573", vendor_name: "7 UP", sku: null, item_description: "Sunkist orange PP $1.49 2ltr btl", department: "SOFT DRINKS", case_qty: 8, active: true, allow_order: true },
  { full_scan_code: "078000039481", vendor_name: "7 UP", sku: null, item_description: "RC cola $1.49 2ltr btl", department: "SOFT DRINKS", case_qty: 8, active: true, allow_order: true },
  { full_scan_code: "072350000078", vendor_name: "7 UP", sku: null, item_description: "Yohoo Chocolate Drink 11oz can", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "842595121766", vendor_name: "7 UP", sku: null, item_description: "C4 Cosmic Rainbow 16oz can", department: "SOFT DRINKS", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "078000028683", vendor_name: "7 UP", sku: null, item_description: "Venom Black Cherry Kiwi 16oz can", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "842595106596", vendor_name: "7 UP", sku: null, item_description: "C4 Frozen Bombsicle 16oz can", department: "SOFT DRINKS", case_qty: 12, active: true, allow_order: true },
  { full_scan_code: "078000023763", vendor_name: "7 UP", sku: null, item_description: "Venom Mango 16oz can", department: "SOFT DRINKS", case_qty: 24, active: true, allow_order: true },
  { full_scan_code: "078000039498", vendor_name: "7 UP", sku: null, item_description: "RC Cherry $1.49 2ltr btl", department: "SOFT DRINKS", case_qty: 8, active: true, allow_order: true },
];

// Linked singles roll into their orderable pack. conversion_ratio = how many linked
// units equal one orderable unit.
export const linked_scan_codes = [
  { vendor_name: "The Columbus Dist. Co.", orderable_scan_code: "018200201288", linked_scan_code: "018200000188", conversion_ratio: 12 },
  { vendor_name: "Coca Cola Consolidated", orderable_scan_code: "049000013856", linked_scan_code: "049000006346", conversion_ratio: 15 },
  { vendor_name: "G & J Pepsi Co", orderable_scan_code: "012000029202", linked_scan_code: "012000000850", conversion_ratio: 18 },
];

export const fixtures = { catalog, vendors, links: linked_scan_codes };
export default fixtures;
