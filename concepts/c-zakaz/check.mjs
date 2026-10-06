import assert from 'node:assert/strict';
import {products, cleanCart, setQty, count, total, orderText, orderUrl, filterProducts, suggest, MAX_QTY} from './data.mjs';

assert.equal(new Set(products.map(p => p.id)).size, products.length, 'unique ids');
assert.deepEqual(cleanCart({'c-lem-20':1, 'lem-16':2, nope:1, 'pump-25':0, 'water-80':1.5}), {'c-lem-20':1, 'lem-16':2});

// stepper: add, increment, clamp, remove
let cart = setQty({}, 'lem-16', 1);
cart = setQty(cart, 'lem-16', cart['lem-16'] + 1);
cart = setQty(cart, 'c-pump-32', 1);
assert.deepEqual(cart, {'lem-16':2, 'c-pump-32':1});
assert.equal(setQty(cart, 'lem-16', 500)['lem-16'], MAX_QTY);
assert.deepEqual(setQty(cart, 'c-pump-32', 0), {'lem-16':2});
assert.deepEqual(setQty(cart, 'ghost', 3), cart);
assert.equal(count(cart), 3);
assert.equal(total(cart), 219000 * 2 + 46000);

const text = orderText(cart, {install:true});
assert.match(text, /Лемакс Премиум-16 — 2 шт\. × 219\s000 ₸ = 438\s000 ₸/);
assert.match(text, /Grundfos UPS 32-60 — 1 шт\./);
assert.match(text, /Итого по сайту: 484\s000 ₸/);
assert.match(text, /Самовывоз: Актау, 29А мкр, 24/);
assert.match(text, /Нужен монтаж/);
assert.doesNotMatch(orderText(cart, {receive:'city'}), /Нужен монтаж|Самовывоз/);
const url = new URL(orderUrl(cart));
assert.equal(url.origin + url.pathname, 'https://wa.me/77772504300');
assert.equal(url.searchParams.get('text'), orderText(cart));

assert.ok(filterProducts({category:'radiators'}).every(p => p.category === 'radiators'));
const all = filterProducts();
assert.ok(all.findIndex(p => !p.tag) > all.findLastIndex(p => p.tag), 'hits first');
assert.ok(filterProducts({sort:'high', max:100000}).every((p, i, a) => p.price <= 100000 && (!i || p.price <= a[i - 1].price)));
assert.ok(filterProducts({brands:['Thermex', 'IDDIS']}).every(p => ['Thermex', 'IDDIS'].includes(p.brand)));
assert.equal(filterProducts({query:'  ЛЕМАКС '}).length, 5);
assert.deepEqual(suggest('к'), []);
assert.equal(suggest('котл')[0].type, 'category');
assert.ok(suggest('котел').some(s => s.type === 'product'), 'ё/е insensitive');
assert.ok(suggest('grundfos').every(s => s.type === 'product'));
console.log('OK c-zakaz: cart, stepper, totals, WhatsApp text, filters, suggestions');
