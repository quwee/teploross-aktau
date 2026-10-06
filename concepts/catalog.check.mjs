import assert from 'node:assert/strict';
import {attrs, emptyState, setCategory, filterCatalog, sidebar, applied, removeApplied, sorts} from './catalog.mjs';
import {products as A, money} from './a-vitrina/data.mjs';
import {catalog as B} from './b-podbor/data.mjs';
import {products as C} from './c-zakaz/data.mjs';

// характеристики разбираются из данных всех трёх концепций
const by = (list, id) => list.find(p => p.id === id);
assert.deepEqual([attrs(by(A, 'lem-16')).power, attrs(by(A, 'lem-16')).circuits, attrs(by(A, 'lem-16')).mount], [16, 1, 'floor']);
assert.deepEqual([attrs(by(A, 'baxi-24')).circuits, attrs(by(A, 'baxi-24')).mount], [2, 'wall']);
assert.equal(attrs(by(A, 'a-rad-10')).sections, 10);
assert.equal(attrs(by(B, 'rad-500-12')).sections, 12);
assert.equal(attrs(by(C, 'c-rad-350')).axis, 350);
assert.equal(attrs(by(A, 'water-80')).volume, 100);
assert.equal(attrs(by(B, 'water-150v')).volume, 150);
assert.equal(attrs(by(A, 'pump-25')).head, 4);
assert.equal(attrs(by(C, 'c-tap-bath')).use, 'bath');
for (const list of [A, B, C]) for (const p of list.filter(p => p.category === 'boilers')) assert.ok(attrs(p).power && attrs(p).mount, p.id);

// фильтры внутри группы — ИЛИ, между группами — И
const s = emptyState();
setCategory(s, 'boilers');
s.f = {mount: ['wall']};
assert.ok(filterCatalog(B, s).every(p => attrs(p).mount === 'wall'));
s.f = {mount: ['wall'], power: ['s', 'l']};
assert.ok(filterCatalog(B, s).every(p => attrs(p).mount === 'wall' && (p.power <= 15 || p.power > 25)));

// счётчик варианта считается без фильтра своей группы, но с остальными
const sb = sidebar(B, s);
const floor = sb.facets.find(g => g.id === 'mount').opts.find(o => o.v === 'floor');
assert.equal(floor.count, B.filter(p => p.category === 'boilers' && p.mount === 'floor' && (p.power <= 15 || p.power > 25)).length);

// смена категории сбрасывает её характеристики и сортировку по мощности
s.sort = 'power';
setCategory(s, 'water');
assert.deepEqual([s.f, s.sort], [{}, 'popular']);
assert.ok(!sorts(s).some(([v]) => v === 'power'));

// цена, поиск по нескольким словам, ё = е, сортировка
const t = {...emptyState(), min: '50000', max: '100000', sort: 'low'};
const priced = filterCatalog(C, t);
assert.ok(priced.length && priced.every((p, i, a) => p.price >= 50000 && p.price <= 100000 && (!i || p.price >= a[i - 1].price)));
assert.equal(filterCatalog(A, {...emptyState(), q: 'котел лемакс 25'}).length, 1);
assert.equal(filterCatalog(A, {...emptyState(), q: 'нет такого'}).length, 0);

// «Популярные»: товары с меткой первыми
const pop = filterCatalog(C, emptyState());
assert.ok(pop.findIndex(p => !p.tag) > pop.findLastIndex(p => p.tag), 'hits first');

// выбранные фильтры снимаются по одному
const u = {...emptyState(), cat: 'boilers', brands: ['Лемакс'], max: '300000', f: {mount: ['floor']}};
assert.deepEqual(applied(u, money).map(c => c.key), ['brand:Лемакс', 'price', 'f:mount:floor']);
removeApplied(u, 'f:mount:floor'); removeApplied(u, 'brand:Лемакс'); removeApplied(u, 'price');
assert.deepEqual(applied(u, money), []);

// у пустой категории без вариантов фасет не показывается
assert.ok(sidebar(A, {...emptyState(), cat: 'radiators'}).facets.every(g => g.opts.length > 1));
console.log('OK catalog: attributes, facets AND/OR, facet counts, price, search, sort, applied filters');
