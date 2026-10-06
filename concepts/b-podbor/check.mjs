import assert from 'node:assert/strict';
import {catalog, needPower, recommend, cleanCart, cartTotal, cartCount, orderUrl} from './data.mjs';

// Подборщик: 1 кВт на 10 м² + 20 % запаса
assert.equal(needPower(100), 12);
assert.equal(needPower(125), 15);
assert.equal(needPower(160), 19.2);
const r = recommend({area: 150, circuits: 1, mount: 'floor'});
assert.equal(r.need, 18);
assert.deepEqual(r.models.map(p => p.id), ['lem-20', 'lem-25', 'lem-30']);
assert.ok(r.models.every(p => p.circuits === 1 && p.mount === 'floor' && p.power >= r.need));
const w = recommend({area: 120, circuits: 2, mount: 'wall'});
assert.ok(w.models.length && w.models.every(p => p.mount === 'wall' && p.circuits === 2) && !w.relaxed);
// Настенных одноконтурных нет — показываем двухконтурные настенные с пометкой
const relaxed = recommend({area: 80, circuits: 1, mount: 'wall'});
assert.ok(relaxed.relaxed && relaxed.models.length && relaxed.models.every(p => p.mount === 'wall'));
// Больше максимальной модели — честно говорим, что нужен инженерный расчёт
const big = recommend({area: 500, circuits: 2, mount: 'wall'});
assert.ok(big.over && big.models.length === 0);

// Каталог
assert.equal(new Set(catalog.map(p => p.id)).size, catalog.length, 'уникальные id');
for (const p of catalog) assert.ok(p.price > 0 && p.image && p.rows.length >= 3, p.id);

// Корзина и WhatsApp
assert.deepEqual(cleanCart({'lem-16': 2, 'prime-20': 1, unknown: 1, 'pump-25': -1, 'water-80': 100, 'rad-500': 1.5}), {'lem-16': 2, 'prime-20': 1});
assert.deepEqual(cleanCart(null), {});
const cart = {'lem-16': 2, 'pump-32': 1};
assert.equal(cartTotal(cart), 219000 * 2 + 41000);
assert.equal(cartCount(cart), 3);
const url = new URL(orderUrl(cart, {pickup: false, install: true}));
assert.equal(url.origin + url.pathname, 'https://wa.me/77772504300');
const text = url.searchParams.get('text');
assert.match(text, /Лемакс Премиум-16 — 2 шт\./);
assert.match(text, /Grundfos UPS 32-60 180 — 1 шт\./);
assert.match(text, /479\s000 ₸/);
assert.match(text, /доставка по Актау/);
assert.match(text, /Нужен монтаж/);
assert.match(new URL(orderUrl(cart)).searchParams.get('text'), /самовывоз/);
console.log('OK b-podbor: power picker, cart, WhatsApp message');
