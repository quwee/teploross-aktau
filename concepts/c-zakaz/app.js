import {products, categories, brands, hits, byId, money, cleanCart, setQty, count, total, lines, orderText, orderUrl, waUrl, filterProducts, suggest, MAX_QTY, delivery} from './data.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const img = f => `../../assets/${f}`;
const KEY = 'teploross-c-zakaz-cart';

const paths = {
 flame:'<path d="M12 2c1.5 5-5 7-5 12a5 5 0 0 0 10 0c0-2.5-1.5-4-2.5-5 0 3-2.5 4-3.2 2.4C10.200 9 13.500 6.500 12 2Z"/>',
 cart:'<path d="M3 4h2.2l2.3 10.5a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 phone:'<path d="M5 3h3.5l1.5 4.5-2.2 1.4a12 12 0 0 0 7.3 7.3l1.4-2.2L21 15.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 chevron:'<path d="m7 10 5 5 5-5"/>',
 left:'<path d="m15 5-7 7 7 7"/>',
 right:'<path d="m9 5 7 7-7 7"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 minus:'<path d="M5 12h14"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 sliders:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
 wrench:'<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.5-6.5M14.5 6.5 13 5a4 4 0 0 1 5-2l-2.500 2.500 1 2.500 2.500 1L21.500 6.500A4 4 0 0 1 19.500 11.500"/><path d="m3 21 7-7"/>',
 shield:'<path d="m12 3 8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z"/><path d="m8.5 12 2.500 2.500 4.500-5"/>',
 pin:'<path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 award:'<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.500 7 5-3 5 3-1.500-7"/>',
 check:'<path d="m5 12 4.500 4.500L19 7"/>',
 wa:'<path d="M4 20l1.300-4A8 8 0 1 1 8 18.700Z"/><path d="M9 9.500c.500 2.500 2.500 4.500 5 5l1.200-1.200 1.800.800v1.400c-4 .500-8.500-4-8-8h1.400l.800 1.800Z"/>',
 boilers:'<rect x="5" y="2.500" width="14" height="19" rx="2.500"/><path d="M5 8h14"/><circle cx="9" cy="5.300" r="1"/><path d="M12.500 18c-1.700 0-2.500-1-2.500-2.200 0-1.600 2.500-2.300 2.500-4.300 1.200 1 2.500 2.200 2.500 4 0 1.500-1 2.500-2.500 2.500Z"/>',
 radiators:'<rect x="3" y="4" width="4" height="16" rx="2"/><rect x="10" y="4" width="4" height="16" rx="2"/><rect x="17" y="4" width="4" height="16" rx="2"/><path d="M7 7h3M14 7h3M7 17h3M14 17h3"/>',
 pumps:'<circle cx="12" cy="12" r="5.500"/><circle cx="12" cy="12" r="1.800"/><path d="M2 12h4.500M17.500 12H22M12 2v4.500"/>',
 water:'<rect x="6" y="2" width="12" height="17" rx="6"/><path d="M9 19v3M15 19v3M12 7v5"/>',
 plumbing:'<path d="M4 11h8a5 5 0 0 1 5 5v1"/><path d="M8 11V6h4M5.500 6h9"/><path d="M17 20.500c0 .800-.500 1.500-1 1.500s-1-.700-1-1.500.500-1.500 1-2c.500.500 1 1.200 1 2Z"/>'
};
const icon = (n, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[n] || ''}</svg>`;
$$('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
$$('[data-wa]').forEach(a => { a.href = waUrl(a.dataset.wa); });

const plural = (n, [one, few, many]) => n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;
const items = n => `${n} ${plural(n, ['товар', 'товара', 'товаров'])}`;
const catName = id => categories.find(c => c.id === id)?.name || '';

// ---------- state ----------
let cart = {};
try { cart = cleanCart(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const state = {category:'all', brands:[], max:Infinity, power:'all', query:'', sort:'popular'};
const order = {receive:'pickup', install:false};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- toast ----------
let toastT;
function toast(text) {
 const t = $('#toast');
 t.textContent = text; t.classList.add('show');
 clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- buy control: «В корзину» → stepper ----------
function buy(p) {
 const q = cart[p.id] || 0;
 if (!q) return `<button class="btn btn-red btn-add" type="button" data-act="add" data-id="${p.id}" aria-label="В корзину: ${esc(p.name)}">${icon('cart', 20)}<span>В корзину</span></button>`;
 return `<div class="stepper" role="group" aria-label="Количество: ${esc(p.name)}">
  <button type="button" data-act="dec" data-id="${p.id}" aria-label="${q === 1 ? 'Убрать из корзины' : 'Уменьшить на 1'}">${icon(q === 1 ? 'trash' : 'minus', 20)}</button>
  <span class="qty">${q}<span class="sr"> шт. в корзине</span></span>
  <button type="button" data-act="inc" data-id="${p.id}" aria-label="Увеличить на 1" ${q >= MAX_QTY ? 'disabled' : ''}>${icon('plus', 20)}</button>
 </div>`;
}
const buyBox = p => `<div class="buy" data-buy="${p.id}">${buy(p)}</div>`;

const card = p => `<article class="card">
 <button class="card-media" type="button" data-act="open" data-id="${p.id}" tabindex="-1" aria-hidden="true"><img src="${img(p.image)}" alt="" loading="lazy" width="300" height="300"></button>
 ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
 <p class="card-kind">${esc(p.kind)}</p>
 <h3 class="card-title"><button type="button" data-act="open" data-id="${p.id}">${esc(p.name)}</button></h3>
 <p class="card-specs">${esc(p.specs)}</p>
 <p class="price">${money(p.price)}</p>
 ${buyBox(p)}
</article>`;

// ---------- cart persistence & global UI ----------
function setCart(next, id) {
 const before = cart[id] || 0;
 cart = next;
 try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {}
 refreshBuy(id);
 renderTotals();
 if ($('#cart-dlg').open) renderCart(!cart[id]);
 const p = byId(id), q = cart[id] || 0;
 toast(q ? (before ? `${p.name}: ${q} шт.` : `Добавлено: ${p.name}`) : `Убрано: ${p.name}`);
}

function refreshBuy(id) {
 const p = byId(id), act = document.activeElement;
 const box = act?.closest?.('[data-buy]'), was = act?.dataset?.act;
 $$(`[data-buy="${id}"]`).forEach(b => { b.innerHTML = buy(p); });
 $$(`[data-solo="${id}"]`).forEach(a => { a.href = orderUrl({[id]: cart[id] || 1}, order); });
 if (box?.isConnected && box.dataset.buy === id) {
  const want = cart[id] ? (was === 'add' ? 'inc' : was) : 'add';
  ($(`[data-act="${want}"]:not(:disabled)`, box) || $('button:not(:disabled)', box))?.focus();
 }
}

function renderTotals() {
 const n = count(cart), sum = money(total(cart));
 const badge = $('#cart-badge');
 badge.hidden = !n; badge.textContent = n;
 $('.cart-btn').setAttribute('aria-label', n ? `Корзина: ${items(n)}, ${sum}` : 'Корзина пуста');
 $('#orderbar').hidden = !n;
 document.body.classList.toggle('has-bar', !!n);
 $('#bar-text').innerHTML = `<b>${items(n)}</b><span> · ${sum}</span>`;
 $('#bar-go').href = orderUrl(cart, order);
 $('#bar-go').setAttribute('aria-label', `Заказать в WhatsApp: ${items(n)} на ${sum}`);
}

// ---------- cart sheet ----------
function renderCart(rebuild = true) {
 const body = $('#cart-body'), foot = $('#cart-foot'), n = count(cart);
 $('#cart-title').textContent = n ? `Корзина · ${items(n)}` : 'Корзина';
 if (!n) {
  body.innerHTML = `<div class="empty">
   <div class="empty-icon">${icon('cart', 40)}</div>
   <p class="empty-title">Корзина пуста</p>
   <p>Добавьте товары кнопкой «В корзину» или спросите менеджера.</p>
   <div class="empty-actions"><button type="button" class="btn btn-red" data-act="to-catalog">Перейти в каталог</button>
   <a class="btn btn-line" href="${waUrl('Здравствуйте! Нужна консультация по оборудованию.')}" target="_blank" rel="noopener">${icon('wa', 20)}Спросить в WhatsApp</a></div></div>`;
  foot.innerHTML = '';
  $('#cart-title').focus();
  return;
 }
 if (rebuild) {
  const focusId = document.activeElement?.closest?.('#cart-body') ? document.activeElement.dataset.id : null;
  body.innerHTML = `<ol class="steps" aria-label="Шаги заказа"><li class="on">Товары</li><li class="on">Получение</li><li>WhatsApp</li></ol>
  <ul class="lines">${lines(cart).map(l => `<li class="line">
   <img src="${img(l.image)}" alt="" width="72" height="72">
   <div class="line-info"><p class="line-name">${esc(l.name)}</p><p class="line-price">${money(l.price)} / шт.</p>
    <button type="button" class="line-remove" data-act="remove" data-id="${l.id}">${icon('trash', 16)}Удалить<span class="sr"> ${esc(l.name)}</span></button></div>
   <div class="line-right"><p class="line-sum" data-sum="${l.id}">${money(l.sum)}</p>${buyBox(l)}</div>
  </li>`).join('')}</ul>
  <fieldset class="receive"><legend>Как получить</legend>
   <label class="opt"><input type="radio" name="receive" value="pickup" ${order.receive === 'pickup' ? 'checked' : ''}><span><b>Самовывоз</b><small>Актау, 29А мкр, 24</small></span></label>
   <label class="opt"><input type="radio" name="receive" value="city" ${order.receive === 'city' ? 'checked' : ''}><span><b>Доставка по Актау</b><small>Условия и стоимость <span class="tbc">[уточнить]</span></small></span></label>
   <label class="opt opt-check"><input type="checkbox" name="install" ${order.install ? 'checked' : ''}><span><b>Нужен монтаж</b><small>Менеджер рассчитает стоимость</small></span></label>
  </fieldset>
  <details class="preview" open><summary>Сообщение в WhatsApp</summary><pre id="preview-text"></pre></details>`;
  if (focusId) { ($(`[data-buy="${focusId}"] button`, body) || $('#cart-title')).focus(); }
  else if (document.activeElement === document.body) $('#cart-title').focus();
 }
 lines(cart).forEach(l => { const s = $(`[data-sum="${l.id}"]`, body); if (s) s.textContent = money(l.sum); });
 $('#preview-text').textContent = orderText(cart, order);
 foot.innerHTML = `<div class="foot-total"><span>Итого</span><b>${money(total(cart))}</b><small>цены для примера</small></div>
  <a class="btn btn-red btn-big" href="${orderUrl(cart, order)}" target="_blank" rel="noopener">${icon('wa', 22)}Отправить в WhatsApp</a>`;
}

$('#cart-dlg').addEventListener('change', e => {
 if (e.target.name === 'receive') order.receive = e.target.value;
 if (e.target.name === 'install') order.install = e.target.checked;
 renderCart(false); renderTotals();
});

// ---------- product dialog ----------
function openProduct(id) {
 const p = byId(id);
 $('#product-body').innerHTML = `<div class="pd">
  <div class="pd-media"><img src="${img(p.image)}" alt="${esc(p.name)}" width="480" height="480">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}</div>
  <div class="pd-info">
   <p class="pd-cat">${catName(p.category)} · ${esc(p.brand)}</p>
   <h2 id="product-title">${esc(p.name)}</h2>
   <ul class="pd-specs"><li>${esc(p.kind)}</li>${p.specs.split(' · ').map(s => `<li>${esc(s)}</li>`).join('')}</ul>
   <p class="price price-xl">${money(p.price)}</p>
   <p class="demo">Цена для примера, актуальную подтвердит менеджер</p>
   ${buyBox(p)}
   <a class="btn btn-line" data-solo="${p.id}" href="${orderUrl({[p.id]: cart[p.id] || 1}, order)}" target="_blank" rel="noopener">${icon('wa', 20)}Заказать только этот товар</a>
   <ul class="pd-perks">
    <li>${icon('wrench', 18)}Установка и запуск — рассчитаем по объекту</li>
    <li>${icon('shield', 18)}Гарантия производителя <span class="tbc">[уточнить срок]</span></li>
    <li>${icon('pin', 18)}Самовывоз: Актау, 29А мкр, 24</li>
   </ul>
  </div></div>`;
 $('#product-dlg').showModal();
}

// ---------- catalog ----------
const filterCount = () => state.brands.length + (state.max < Infinity) + (state.power !== 'all');

function renderCatalog() {
 const list = filterProducts(state);
 $$('[data-act="cat"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === state.category));
 $('#grid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty empty-grid">
  <p class="empty-title">Ничего не нашли</p><p>Измените запрос или фильтры. Если товара нет на сайте, он может быть в магазине.</p>
  <div class="empty-actions"><button type="button" class="btn btn-red" data-act="reset-all">Сбросить всё</button>
  <a class="btn btn-line" href="${waUrl(`Здравствуйте! Есть ли у вас ${state.query || 'нужный товар'}?`)}" target="_blank" rel="noopener">${icon('wa', 20)}Спросить наличие</a></div></div>`;
 $('#found').textContent = `Найдено: ${items(list.length)}`;
 const fc = filterCount(), badge = $('#filter-badge');
 badge.hidden = !fc; badge.textContent = fc;
 $('#filter-apply').textContent = `Показать ${items(list.length)}`;
 const pills = [
  state.query && `<button type="button" data-act="clear" data-what="query">Поиск: «${esc(state.query)}» ${icon('close', 14)}</button>`,
  ...state.brands.map(b => `<button type="button" data-act="clear" data-what="brand" data-v="${esc(b)}">${esc(b)} ${icon('close', 14)}</button>`),
  state.max < Infinity && `<button type="button" data-act="clear" data-what="max">до ${money(state.max)} ${icon('close', 14)}</button>`,
  state.power !== 'all' && `<button type="button" data-act="clear" data-what="power">${state.power === 'small' ? 'до 20 кВт' : 'больше 20 кВт'} ${icon('close', 14)}</button>`
 ].filter(Boolean);
 $('#active-filters').innerHTML = pills.length ? `<span class="sr">Активные фильтры, нажмите чтобы убрать:</span>${pills.join('')}` : '';
}

function toCatalog() {
 const c = $('#catalog');
 c.scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth'});
 c.focus({preventScroll:true});
}

function syncFilterForm() {
 const f = $('#filters');
 $$('input[name="brand"]', f).forEach(i => { i.checked = state.brands.includes(i.value); });
 f.max.value = state.max < Infinity ? String(state.max) : '';
 f.power.value = state.power;
}

function resetFilters() { Object.assign(state, {brands:[], max:Infinity, power:'all'}); syncFilterForm(); }

// static lists
const catBtn = (c, cls = '') => `<button type="button" class="${cls}" data-act="cat" data-cat="${c.id}" aria-pressed="false">`;
$('#hero-cats').innerHTML = categories.map(c => `<li>${catBtn(c, 'hero-cat')}<span class="hero-cat-ico">${icon(c.id, 30)}</span><span>${c.short}</span></button></li>`).join('');
$('#chips').innerHTML = [{id:'all', name:'Все товары'}, ...categories].map(c => `${catBtn(c, 'chip')}${c.name}</button>`).join('');
$('#cat-menu').innerHTML = categories.map(c => `<li>${catBtn(c, 'dd-item')}${icon(c.id, 20)}${c.name}</button></li>`).join('');
$('#mnav-cats').innerHTML = categories.map(c => `<li>${catBtn(c, 'mnav-cat')}${icon(c.id, 22)}${c.short}</button></li>`).join('');
$('#footer-cats').innerHTML = categories.map(c => `<li><button type="button" data-act="cat" data-cat="${c.id}">${c.name}</button></li>`).join('');
$('#brand-checks').innerHTML = brands.map(b => `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}"><span>${esc(b)}</span></label>`).join('');
$('#hits').innerHTML = hits.map(card).join('');

$('#filters').addEventListener('change', e => {
 const f = e.currentTarget;
 state.brands = $$('input[name="brand"]:checked', f).map(i => i.value);
 state.max = f.max.value ? Number(f.max.value) : Infinity;
 state.power = f.power.value;
 renderCatalog();
});
$$('input[name="sort"]').forEach(r => r.addEventListener('change', () => { state.sort = r.value; renderCatalog(); }));

// ---------- menus ----------
const catMenu = $('#cat-menu'), catToggle = $('#cat-btn'), burger = $('.burger'), mnav = $('#mnav');
const setMenu = open => { catMenu.hidden = !open; catToggle.setAttribute('aria-expanded', open); };
const setMnav = open => { mnav.hidden = !open; burger.setAttribute('aria-expanded', open); burger.innerHTML = icon(open ? 'close' : 'menu'); };
catToggle.addEventListener('click', () => { setMenu(catMenu.hidden); if (!catMenu.hidden) $('button', catMenu).focus(); });
burger.addEventListener('click', () => setMnav(mnav.hidden));
mnav.addEventListener('click', e => { if (e.target.closest('a')) setMnav(false); });
document.addEventListener('keydown', e => {
 if (e.key !== 'Escape') return;
 if (!catMenu.hidden) { setMenu(false); catToggle.focus(); }
 if (!mnav.hidden) { setMnav(false); burger.focus(); }
});
document.addEventListener('click', e => { if (!e.target.closest('.dd')) setMenu(false); });
catMenu.addEventListener('focusout', e => { if (!e.relatedTarget?.closest?.('.dd')) setMenu(false); });

// ---------- delegated actions ----------
document.addEventListener('click', e => {
 const el = e.target.closest('[data-act]');
 if (!el) return;
 const id = el.dataset.id;
 switch (el.dataset.act) {
  case 'add': setCart(setQty(cart, id, 1), id); break;
  case 'inc': setCart(setQty(cart, id, (cart[id] || 0) + 1), id); break;
  case 'dec': setCart(setQty(cart, id, (cart[id] || 0) - 1), id); break;
  case 'remove': setCart(setQty(cart, id, 0), id); break;
  case 'open': openProduct(id); break;
  case 'cart': renderCart(); $('#cart-dlg').showModal(); $('#cart-title').focus(); break;
  case 'filters': syncFilterForm(); $('#filter-dlg').showModal(); break;
  case 'close': el.closest('dialog').close(); break;
  case 'reset': resetFilters(); renderCatalog(); break;
  case 'reset-all': resetFilters(); state.query = ''; $('#q').value = ''; state.category = 'all'; renderCatalog(); break;
  case 'to-catalog': $('#cart-dlg').close(); toCatalog(); break;
  case 'cat': {
   const fromCatalog = !!el.closest('#chips');
   state.category = el.dataset.cat;
   setMenu(false); setMnav(false);
   renderCatalog();
   if (!fromCatalog) toCatalog();
   break;
  }
  case 'q': $('#q').value = el.dataset.q; runSearch(); break;
  case 'clear': {
   const w = el.dataset.what;
   if (w === 'query') { state.query = ''; $('#q').value = ''; }
   if (w === 'brand') state.brands = state.brands.filter(b => b !== el.dataset.v);
   if (w === 'max') state.max = Infinity;
   if (w === 'power') state.power = 'all';
   renderCatalog(); $('#chips button[aria-pressed="true"]')?.focus();
   break;
  }
 }
});

// close dialogs on backdrop click
$$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

// ---------- search with suggestions (combobox) ----------
const q = $('#q'), list = $('#q-list');
let opts = [], active = -1;
function drawSuggest() {
 list.innerHTML = opts.map((o, i) => `<li role="option" id="sug-${i}" data-i="${i}" aria-selected="${i === active}">
  <span class="sug-ico">${icon(o.type === 'category' ? (o.id) : 'search', 18)}</span><span class="sug-label">${esc(o.label)}</span><small>${o.type === 'category' ? 'Категория' : o.hint}</small></li>`).join('');
 const open = opts.length > 0;
 list.hidden = !open;
 q.setAttribute('aria-expanded', open);
 if (active >= 0) q.setAttribute('aria-activedescendant', `sug-${active}`); else q.removeAttribute('aria-activedescendant');
}
const closeSuggest = () => { opts = []; active = -1; drawSuggest(); };
function choose(o) {
 closeSuggest();
 if (o.type === 'category') { state.category = o.id; state.query = ''; q.value = ''; renderCatalog(); toCatalog(); }
 else openProduct(o.id);
}
function runSearch() { closeSuggest(); state.query = q.value.trim(); state.category = 'all'; renderCatalog(); toCatalog(); }
q.addEventListener('input', () => { opts = suggest(q.value); active = -1; drawSuggest(); });
q.addEventListener('keydown', e => {
 if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
  if (!opts.length) return;
  e.preventDefault();
  const n = opts.length; // -1 = back to the input
  active = e.key === 'ArrowDown' ? (active + 1 >= n ? -1 : active + 1) : (active <= -1 ? n - 1 : active - 1);
  drawSuggest();
 } else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(opts[active]); }
 else if (e.key === 'Escape' && opts.length) { e.stopPropagation(); closeSuggest(); }
});
q.addEventListener('blur', () => setTimeout(closeSuggest, 150));
list.addEventListener('mousedown', e => { const li = e.target.closest('[data-i]'); if (li) { e.preventDefault(); choose(opts[li.dataset.i]); } });
$('#search').addEventListener('submit', e => { e.preventDefault(); runSearch(); });

// ---------- promo carousel (scroll-snap, manual only) ----------
const track = $('#promo-track'), slides = $$('.slide', track), dots = $('#promo-dots');
dots.innerHTML = slides.map((s, i) => `<button type="button" aria-label="Слайд ${i + 1}: ${esc($('h2', s).textContent)}"></button>`).join('');
const idx = () => Math.round(track.scrollLeft / track.clientWidth);
const go = i => track.scrollTo({left: i * track.clientWidth, behavior: reduced.matches ? 'auto' : 'smooth'});
function syncPromo() {
 const i = idx();
 $$('button', dots).forEach((d, j) => d.setAttribute('aria-current', i === j));
 $('#promo-prev').disabled = i === 0;
 $('#promo-next').disabled = i === slides.length - 1;
 slides.forEach((s, j) => { s.inert = i !== j; });
}
track.addEventListener('scroll', () => requestAnimationFrame(syncPromo), {passive:true});
$('#promo-prev').addEventListener('click', () => go(idx() - 1));
$('#promo-next').addEventListener('click', () => go(idx() + 1));
$$('button', dots).forEach((d, i) => d.addEventListener('click', () => go(i)));

renderCatalog();
renderTotals();
syncPromo();
