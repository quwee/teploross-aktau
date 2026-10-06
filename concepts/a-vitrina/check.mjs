import assert from 'node:assert/strict';
import {products, cleanCart, count, total, orderText, orderUrl} from './data.mjs';

assert.equal(new Set(products.map(p => p.id)).size, products.length, 'unique ids');
for (const p of products) assert.ok(p.price > 0 && p.image && p.specs.split(' · ').length === 2, p.id);

assert.deepEqual(cleanCart({'lem-16': 2, 'a-lem-30': 1, nope: 1, 'pump-25': 0, 'water-80': 100, 'rad-500': 1.5}), {'lem-16': 2, 'a-lem-30': 1});
assert.deepEqual(cleanCart('junk'), {});

const cart = {'lem-16': 2, 'pump-25': 1};
assert.equal(count(cart), 3);
assert.equal(total(cart), 466500);

const text = orderText(cart, {name: '  Арман ', method: 'delivery', install: true});
assert.match(text, /1\. Лемакс Премиум-16 — 2 шт\./);
assert.match(text, /2\. Grundfos UPS 25-40 — 1 шт\./);
assert.match(text, /Итого на сайте: 466\s500 ₸/);
assert.match(text, /Получение: Доставка по Актау/);
assert.match(text, /Нужна установка: да/);
assert.match(text, /Имя: Арман\n/);
assert.doesNotMatch(text, /Комментарий/);
assert.match(orderText(cart), /Самовывоз — Актау, 29А мкр, 24/);

const url = new URL(orderUrl(cart, {comment: 'после 18:00'}));
assert.equal(url.origin + url.pathname, 'https://wa.me/77772504300');
assert.match(url.searchParams.get('text'), /Комментарий: после 18:00/);

console.log('OK a-vitrina: cart cleaning, totals, WhatsApp text/url');
