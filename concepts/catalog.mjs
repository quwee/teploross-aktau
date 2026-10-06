// Общая логика каталога для трёх концепций: фильтры как на маркетплейсах (Kaspi):
// слева панель с ценой, брендами и характеристиками выбранной категории, у каждого
// варианта счётчик товаров с учётом остальных фильтров; сверху поиск, сортировка, выбранные фильтры.
// Разметку отдаём с классами fx-*, оформление — в styles.css каждой концепции.

const norm = s => String(s).toLowerCase().replace(/ё/g, 'е');
const text = p => norm(`${p.name} ${p.brand} ${p.kind} ${p.specs || ''} ${(p.rows || []).map(r => r.join(' ')).join(' ')}`);
const num = (t, re) => { const m = t.match(re); return m ? parseFloat(m[1].replace(',', '.')) : null; };

const cache = new WeakMap();
export function attrs(p) {
  if (cache.has(p)) return cache.get(p);
  const t = text(p);
  const a = {
    power: p.power || null,
    circuits: p.category !== 'boilers' ? null : p.circuits ?? (/двухконтур/.test(t) ? 2 : 1),
    mount: p.mount ?? (/настенн/.test(t) ? 'wall' : /напольн/.test(t) ? 'floor' : null),
    sections: num(t, /(\d+)\s*секц/) ?? num(t, /секци[ия]\s*(\d+)/),
    axis: num(t, /межосевое\s*(\d+)/),
    volume: p.category === 'water' ? num(t, /(\d+)\s*(?:л(?![а-я])|литр)/) : null,
    head: p.category === 'pumps' ? num(t, /ups\s*\d+-(\d+)/) / 10 : null,
    use: p.category !== 'plumbing' ? null : /ванн/.test(t) ? 'bath' : /кухн|мойк/.test(t) ? 'kitchen' : 'basin',
  };
  cache.set(p, a);
  return a;
}

const opt = (v, label, test) => ({v, label, test});
export const FACETS = {
  boilers: [
    {id: 'power', title: 'Мощность', hint: '≈1 кВт на 10 м² дома', opts: [
      opt('s', 'до 15 кВт · до 150 м²', a => a.power <= 15),
      opt('m', '16–25 кВт · до 250 м²', a => a.power > 15 && a.power <= 25),
      opt('l', 'свыше 25 кВт', a => a.power > 25)]},
    {id: 'circuits', title: 'Назначение', opts: [
      opt('1', 'Только отопление', a => a.circuits === 1),
      opt('2', 'Отопление и горячая вода', a => a.circuits === 2)]},
    {id: 'mount', title: 'Установка', opts: [
      opt('floor', 'Напольный', a => a.mount === 'floor'),
      opt('wall', 'Настенный', a => a.mount === 'wall')]},
  ],
  radiators: [
    {id: 'axis', title: 'Межосевое расстояние', opts: [
      opt('350', '350 мм', a => a.axis === 350),
      opt('500', '500 мм', a => a.axis === 500)]},
    {id: 'sections', title: 'Количество секций', opts: [
      opt('s', 'до 6', a => a.sections <= 6),
      opt('m', '7–10', a => a.sections > 6 && a.sections <= 10),
      opt('l', '11 и больше', a => a.sections > 10)]},
  ],
  pumps: [
    {id: 'head', title: 'Напор', opts: [
      opt('s', 'до 4 м', a => a.head <= 4),
      opt('l', '5 м и больше', a => a.head > 4)]},
  ],
  water: [
    {id: 'volume', title: 'Объём бака', hint: '50 л — 1–2 человека, 80–100 л — семья', opts: [
      opt('s', 'до 50 л', a => a.volume <= 50),
      opt('m', '51–100 л', a => a.volume > 50 && a.volume <= 100),
      opt('l', 'больше 100 л', a => a.volume > 100)]},
  ],
  plumbing: [
    {id: 'use', title: 'Назначение', opts: [
      opt('basin', 'Для умывальника', a => a.use === 'basin'),
      opt('bath', 'Для ванны', a => a.use === 'bath'),
      opt('kitchen', 'Для кухни', a => a.use === 'kitchen')]},
  ],
};

export const emptyState = () => ({cat: 'all', q: '', brands: [], min: '', max: '', stock: false, f: {}, sort: 'popular'});
export const resetFilters = s => Object.assign(s, {q: '', brands: [], min: '', max: '', stock: false, f: {}});
export function setCategory(s, cat) {
  if (s.cat !== cat) s.f = {}; // характеристики другой категории не имеют смысла
  s.cat = cat;
  if (s.sort === 'power' && cat !== 'boilers') s.sort = 'popular';
}

export function sorts(s) {
  return [['popular', 'Популярные'], ['low', 'Сначала дешевле'], ['high', 'Сначала дороже'],
    ...(s.cat === 'boilers' ? [['power', 'По мощности']] : []), ['name', 'По названию']];
}

// skip — группа, которую не применяем: так считаются варианты внутри самой группы.
function matches(p, s, skip) {
  const q = norm(s.q).trim();
  if (s.cat !== 'all' && p.category !== s.cat) return false;
  if (q && !q.split(/\s+/).every(w => text(p).includes(w))) return false;
  if (skip !== 'brand' && s.brands.length && !s.brands.includes(p.brand)) return false;
  if (skip !== 'price' && ((s.min !== '' && p.price < +s.min) || (s.max !== '' && p.price > +s.max))) return false;
  if (s.stock && p.stock && p.stock !== 'in') return false;
  for (const g of FACETS[s.cat] || []) {
    const sel = s.f[g.id] || [];
    if (skip !== g.id && sel.length && !g.opts.some(o => sel.includes(o.v) && o.test(attrs(p)))) return false;
  }
  return true;
}

export function filterCatalog(products, s) {
  const list = products.filter(p => matches(p, s));
  const by = {
    popular: (a, b) => !!b.tag - !!a.tag,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    power: (a, b) => (b.power || 0) - (a.power || 0) || a.price - b.price,
    name: (a, b) => a.name.localeCompare(b.name, 'ru'),
  }[s.sort];
  return by ? list.sort(by) : list;
}

export function sidebar(products, s) {
  const inCat = products.filter(p => s.cat === 'all' || p.category === s.cat);
  const count = (skip, test) => products.filter(p => matches(p, s, skip) && test(p)).length;
  const prices = inCat.map(p => p.price);
  return {
    price: {min: Math.min(...prices), max: Math.max(...prices)},
    brands: [...new Set(inCat.map(p => p.brand))].map(b => ({v: b, label: b, checked: s.brands.includes(b), count: count('brand', p => p.brand === b)})),
    facets: (FACETS[s.cat] || []).map(g => ({...g, opts: g.opts
      .filter(o => inCat.some(p => o.test(attrs(p)))) // вариант без единого товара в категории не показываем
      .map(o => ({...o, checked: (s.f[g.id] || []).includes(o.v), count: count(g.id, p => o.test(attrs(p)))}))}))
      .filter(g => g.opts.length > 1),
    hasStock: inCat.some(p => p.stock && p.stock !== 'in'),
    stockCount: products.filter(p => matches(p, {...s, stock: true})).length,
  };
}

// Выбранные фильтры для полосы над результатами: [{key, label}].
export function applied(s, money) {
  const out = s.brands.map(b => ({key: `brand:${b}`, label: b}));
  if (s.min !== '' || s.max !== '') out.push({key: 'price', label: `Цена ${s.min !== '' ? 'от ' + money(+s.min) : ''} ${s.max !== '' ? 'до ' + money(+s.max) : ''}`.replace(/\s+/g, ' ').trim()});
  for (const g of FACETS[s.cat] || []) for (const v of s.f[g.id] || []) out.push({key: `f:${g.id}:${v}`, label: g.opts.find(o => o.v === v)?.label.split(' · ')[0] ?? v});
  if (s.stock) out.push({key: 'stock', label: 'В наличии'});
  return out;
}
export const activeCount = s => applied(s, String).length;

export function removeApplied(s, key) {
  const [type, a, b] = key.split(':');
  if (type === 'brand') s.brands = s.brands.filter(x => x !== key.slice(6));
  else if (type === 'price') { s.min = ''; s.max = ''; }
  else if (type === 'stock') s.stock = false;
  else if (type === 'f') s.f[a] = (s.f[a] || []).filter(x => x !== b);
}

// ---------- разметка ----------
const esc = v => String(v).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const fmt = n => new Intl.NumberFormat('ru-RU').format(n);

const check = (name, o) => `<label class="fx-check${!o.count && !o.checked ? ' is-off' : ''}">
  <input type="checkbox" name="${name}" value="${esc(o.v)}" ${o.checked ? 'checked' : ''} ${!o.count && !o.checked ? 'disabled' : ''}>
  <span class="fx-label">${esc(o.label)}</span><span class="fx-count">${o.count}</span></label>`;

const group = (title, body, hint = '') => `<fieldset class="fx-group"><legend class="fx-title">${title}</legend>${hint ? `<p class="fx-hint">${esc(hint)}</p>` : ''}${body}</fieldset>`;

export function filtersHTML(products, s, {catName = () => ''} = {}) {
  const sb = sidebar(products, s);
  const price = group('Цена, ₸', `<div class="fx-range">
    <label class="fx-field"><span>от</span><input type="number" name="min" inputmode="numeric" min="0" step="1000" placeholder="${fmt(sb.price.min)}" value="${esc(s.min)}" aria-label="Цена от"></label>
    <label class="fx-field"><span>до</span><input type="number" name="max" inputmode="numeric" min="0" step="1000" placeholder="${fmt(sb.price.max)}" value="${esc(s.max)}" aria-label="Цена до"></label></div>`);
  const brands = sb.brands.length > 1 ? group('Бренд', sb.brands.map(o => check('brand', o)).join('')) : '';
  const facets = sb.facets.map(g => group(g.title, g.opts.map(o => check(`f:${g.id}`, o)).join(''), g.hint)).join('');
  const stock = sb.hasStock ? group('Наличие', check('stock', {v: '1', label: 'Только в наличии', checked: s.stock, count: sb.stockCount})) : '';
  const more = s.cat === 'all' ? `<p class="fx-note">Выберите категорию — появятся фильтры по мощности, объёму, размерам.</p>` : '';
  return `<form class="fx" data-fx novalidate aria-label="Фильтры${s.cat !== 'all' ? ': ' + esc(catName(s.cat)) : ''}">
    ${price}${facets}${brands}${stock}${more}
    <button class="fx-reset" type="button" data-fx-reset ${activeCount(s) || s.q ? '' : 'disabled'}>Сбросить фильтры</button></form>`;
}

export function appliedHTML(s, money) {
  const list = applied(s, money);
  return list.length ? `<ul class="fx-applied" aria-label="Выбранные фильтры">${list.map(c =>
    `<li><button type="button" class="fx-pill" data-fx-remove="${esc(c.key)}" aria-label="Убрать фильтр: ${esc(c.label)}">${esc(c.label)}<span aria-hidden="true">×</span></button></li>`).join('')}
    <li><button type="button" class="fx-clear" data-fx-reset>Сбросить все</button></li></ul>` : '';
}

export const sortHTML = (s, id = 'fx-sort') => `<label class="fx-sort"><span>Сортировка</span><select id="${id}" data-fx-sort>${sorts(s).map(([v, t]) =>
  `<option value="${v}" ${s.sort === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;

// Делегированные события на контейнер каталога. onChange вызывается после изменения state,
// фокус возвращаем на тот же элемент после перерисовки.
export function bindFilters(root, s, onChange) {
  const refresh = () => {
    const el = document.activeElement;
    const key = el?.name ? `[name="${CSS.escape(el.name)}"]${el.type === 'checkbox' ? `[value="${CSS.escape(el.value)}"]` : ''}` : el?.id ? `#${CSS.escape(el.id)}` : null;
    onChange();
    if (key && !el.isConnected) root.querySelector(key)?.focus();
  };
  const read = form => {
    const fd = new FormData(form);
    s.brands = fd.getAll('brand');
    s.stock = fd.has('stock');
    s.f = Object.fromEntries((FACETS[s.cat] || []).map(g => [g.id, fd.getAll(`f:${g.id}`)]));
  };
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-fx-sort]')) { s.sort = t.value; refresh(); }
    else if (t.form?.matches('[data-fx]') && t.type === 'checkbox') { read(t.form); refresh(); }
    else if (t.name === 'min' || t.name === 'max') { s[t.name] = t.value === '' ? '' : String(Math.max(0, +t.value)); refresh(); }
  });
  let timer;
  root.addEventListener('input', e => {
    const t = e.target;
    if (t.name !== 'min' && t.name !== 'max') return;
    clearTimeout(timer);
    timer = setTimeout(() => { s[t.name] = t.value === '' ? '' : String(Math.max(0, +t.value)); refresh(); }, 500);
  });
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-fx-remove], [data-fx-reset]');
    if (!t) return;
    if (t.dataset.fxRemove) removeApplied(s, t.dataset.fxRemove); else resetFilters(s);
    onChange();
  });
}
