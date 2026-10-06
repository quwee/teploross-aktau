import {categories, money, kw, catalog, byId, brands, RESERVE, recommend, powerBuckets, filterCatalog,
  cleanCart, cartItems, cartTotal, cartCount, orderUrl, waUrl, CART_KEY} from './data.mjs';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const IMG = '../../assets/';
const icon = n => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const plural = (n, one, few, many) => n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;
const items = n => `${n} ${plural(n, 'товар', 'товара', 'товаров')}`;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим — работаем без сохранения */ } },
};
const catName = id => categories.find(c => c.id === id)?.name;
const tbd = '<mark class="tbd">уточнить</mark>';

let cart = cleanCart(store.get(CART_KEY, {}));
let view = store.get('teploross-b-podbor-view', 'grid');
let order = {pickup: true, install: false};
let picker = {area: 120, circuits: 1, mount: 'floor'};
let filters = {cat: 'all', q: '', brands: [], min: '', max: '', powers: [], stock: false, sort: 'popular'};

/* ---------- корзина ---------- */
function setQty(id, qty) {
  if (!byId(id)) return;
  qty = Math.max(0, Math.min(99, qty));
  if (qty) cart[id] = qty; else delete cart[id];
  store.set(CART_KEY, cart);
  syncCart();
}
function add(id, n = 1) {
  if ((cart[id] || 0) + n > 99) return toast('Не больше 99 шт. одной позиции');
  setQty(id, (cart[id] || 0) + n);
  toast(`${byId(id).name} — в корзине`);
}
function syncCart() {
  const n = cartCount(cart), sum = money(cartTotal(cart));
  $$('[data-count]').forEach(e => { e.textContent = n; e.hidden = !n; });
  $('#cart-btn').setAttribute('aria-label', `Корзина: ${items(n)}, ${sum}`);
  const sticky = $('.sticky-cart');
  sticky.hidden = !n || route().page === 'korzina';
  $('[data-count-label]', sticky).textContent = items(n);
  $('[data-sum]', sticky).textContent = sum;
  renderMinicart();
  $$('[data-incart]').forEach(e => { const q = cart[e.dataset.incart]; e.textContent = q ? `в корзине: ${q}` : ''; });
  if (route().page === 'korzina') renderCartPage();
}
function renderMinicart() {
  const list = cartItems(cart);
  $('#minicart').innerHTML = list.length ? `
    <p class="mc-head"><span>В корзине</span><span class="mono">${items(cartCount(cart))}</span></p>
    <ul class="mc-list">${list.map(({p, qty, sum}) => `<li>
      <img src="${IMG + p.image}" alt="" width="48" height="48">
      <span class="mc-name">${esc(p.name)}<small class="mono">${qty} × ${money(p.price)}</small></span>
      <b class="mono">${money(sum)}</b></li>`).join('')}</ul>
    <p class="mc-total"><span>Итого</span><b class="mono">${money(cartTotal(cart))}</b></p>
    <div class="mc-actions"><a class="btn btn-ghost" href="#/korzina">Открыть корзину</a>
    <a class="btn btn-red" href="${orderUrl(cart, order)}" target="_blank" rel="noopener">${icon('wa')}Заказать</a></div>`
    : `<p class="mc-empty">Корзина пуста. Подберите котёл по площади или загляните в каталог.</p>
    <div class="mc-actions"><a class="btn btn-ghost" href="#/podbor">Подбор котла</a><a class="btn btn-dark" href="#/katalog">Каталог</a></div>`;
}

/* ---------- общие блоки ---------- */
const stockBadge = p => p.stock === 'in'
  ? '<span class="stock stock-in">В наличии</span>'
  : '<span class="stock stock-order">Под заказ</span>';
const specTable = (p, n = 4) => `<table class="spec"><caption class="sr-only">Характеристики ${esc(p.name)}</caption><tbody>${p.rows.slice(0, n).map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
function card(p) {
  return `<article class="card">
    <button class="card-img" type="button" data-open="${p.id}" aria-label="Подробнее: ${esc(p.name)}"><img src="${IMG + p.image}" alt="" loading="lazy" width="240" height="240"></button>
    <div class="card-body">
      <p class="card-meta">${stockBadge(p)}</p>
      <h3 class="card-title"><button type="button" data-open="${p.id}">${esc(p.name)}</button></h3>
      <p class="card-kind">${p.kind}</p>
      ${specTable(p)}
    </div>
    <div class="card-buy">
      <p class="price mono">${money(p.price)}</p>
      <button class="btn btn-red btn-sm" type="button" data-add="${p.id}">${icon('cart')}В корзину</button>
      <span class="incart mono" data-incart="${p.id}">${cart[p.id] ? `в корзине: ${cart[p.id]}` : ''}</span>
    </div>
  </article>`;
}
const sectionHead = (code, title, extra = '') => `<div class="sec-head"><p class="code mono">${code}</p><h2 class="h2">${title}</h2>${extra}</div>`;

/* ---------- главная ---------- */
function home() {
  const popular = ['lem-16', 'lem-20b', 'prime-20', 'pump-25'].map(byId);
  return `
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap hero-in">
      <div class="hero-copy">
        <p class="code mono code-dark">01 / ПОДБОР КОТЛА</p>
        <h1 class="h1" id="hero-title">Котёл по&nbsp;площади дома</h1>
        <p class="lead">Укажите площадь и тип — посчитаем мощность и покажем подходящие модели. Финальный расчёт проверит инженер магазина.</p>
        <form class="picker" id="picker" aria-describedby="picker-note">
          <div class="field">
            <label for="area" class="field-label">Отапливаемая площадь</label>
            <div class="area-row">
              <input id="area" type="range" min="40" max="400" step="5" value="${picker.area}" aria-describedby="area-hint">
              <span class="area-num"><input id="area-num" type="number" min="40" max="400" step="5" value="${picker.area}" aria-label="Площадь, м², числом" inputmode="numeric"><span class="mono">м²</span></span>
            </div>
            <p class="ticks mono" id="area-hint" aria-hidden="true"><span>40</span><span>130</span><span>220</span><span>310</span><span>400</span></p>
          </div>
          <fieldset class="field seg">
            <legend class="field-label">Назначение</legend>
            ${[[1, 'Одноконтурный', 'только отопление'], [2, 'Двухконтурный', 'отопление + горячая вода']].map(([v, t, s]) => `
            <label class="seg-opt"><input type="radio" name="circuits" value="${v}" ${picker.circuits === v ? 'checked' : ''}><span><b>${t}</b><small>${s}</small></span></label>`).join('')}
          </fieldset>
          <fieldset class="field seg">
            <legend class="field-label">Установка</legend>
            ${[['floor', 'Напольный', 'котельная, пристройка'], ['wall', 'Настенный', 'кухня, санузел']].map(([v, t, s]) => `
            <label class="seg-opt"><input type="radio" name="mount" value="${v}" ${picker.mount === v ? 'checked' : ''}><span><b>${t}</b><small>${s}</small></span></label>`).join('')}
          </fieldset>
        </form>
      </div>
      <div class="readout">
        <div class="plan" aria-hidden="true"><svg viewBox="0 0 360 230" id="plan-svg"></svg></div>
        <div class="readout-main" aria-live="polite">
          <p class="readout-label mono">РЕКОМЕНДУЕМАЯ МОЩНОСТЬ</p>
          <p class="readout-value"><span class="mono" id="need">—</span><span class="unit">кВт</span></p>
          <p class="formula mono" id="formula"></p>
        </div>
        <div class="matches" id="matches"></div>
        <p class="picker-note" id="picker-note">Расчёт ориентировочный: 1 кВт на 10 м² для утеплённого дома с потолками до 2,7 м плюс ${Math.round((RESERVE - 1) * 100)} % запаса. Для старых домов, высоких потолков и бассейнов — <a href="${waUrl('Здравствуйте! Нужен расчёт мощности котла для дома.')}" target="_blank" rel="noopener">инженерный расчёт в WhatsApp</a>.</p>
      </div>
    </div>
  </section>

  <section class="trust" aria-label="Почему Тепло РОСС">
    <ul class="wrap trust-in">
      <li><b class="mono">20+</b><span>лет продаём и обслуживаем отопление в Актау</span></li>
      <li><b class="mono">ЛЕМАКС</b><span>официальный дилер ${tbd}</span></li>
      <li><b class="mono">МОНТАЖ</b><span>установка котлов и систем отопления под ключ</span></li>
      <li><b class="mono">ГАРАНТИЯ</b><span>производителя на оборудование, на монтаж — от магазина ${tbd}</span></li>
      <li><b class="mono">САМОВЫВОЗ</b><span>29А мкр, 24 — проверим комплектность при вас</span></li>
    </ul>
  </section>

  <section class="sec wrap" aria-labelledby="cats-title">
    ${sectionHead('02 / КАТАЛОГ', '<span id="cats-title">Разделы</span>', '<a class="more" href="#/katalog">Весь каталог ' + icon('arrow') + '</a>')}
    <ul class="cats">${categories.map((c, i) => `<li><a class="cat" href="#/katalog/${c.id}">
      <span class="cat-n mono">${String(i + 1).padStart(2, '0')}</span>
      <img src="${IMG + c.image}" alt="" loading="lazy" width="160" height="160">
      <span class="cat-name">${c.name}</span>
      <span class="cat-count mono">${catalog.filter(p => p.category === c.id).length} поз.</span></a></li>`).join('')}</ul>
  </section>

  <section class="sec wrap" aria-labelledby="pop-title">
    ${sectionHead('03 / ЧАСТО БЕРУТ', '<span id="pop-title">Ходовые позиции</span>', '<a class="more" href="#/katalog/boilers">Все котлы ' + icon('arrow') + '</a>')}
    <div class="grid grid-home">${popular.map(card).join('')}</div>
  </section>

  <section class="sec sec-grey" id="uslugi" aria-labelledby="srv-title">
    <div class="wrap">
      ${sectionHead('04 / СЕРВИС', '<span id="srv-title">От расчёта до первого запуска</span>')}
      <ol class="services">
        <li><span class="mono">01</span><h3>Подбор</h3><p>Считаем мощность по площади, утеплению и числу точек горячей воды. Подбираем радиаторы, насос и обвязку под котёл.</p></li>
        <li><span class="mono">02</span><h3>Установка</h3><p>Монтаж котлов, радиаторов, насосов и водонагревателей. Пусконаладка и проверка системы после запуска.</p></li>
        <li><span class="mono">03</span><h3>Ремонт</h3><p>Диагностика и ремонт газовых котлов, замена узлов и комплектующих. Обслуживание перед отопительным сезоном.</p></li>
        <li><span class="mono">04</span><h3>Гарантия</h3><p>Гарантия производителя на оборудование. Условия и сроки гарантии на монтаж ${tbd}.</p></li>
      </ol>
      <a class="btn btn-dark" href="${waUrl('Здравствуйте! Нужна установка / ремонт котла. Подскажите стоимость и сроки.')}" target="_blank" rel="noopener">${icon('wa')}Вызвать мастера через WhatsApp</a>
    </div>
  </section>

  <section class="sec wrap" aria-labelledby="how-title">
    ${sectionHead('05 / ЗАКАЗ', '<span id="how-title">Заказ в три шага</span>')}
    <ol class="steps">
      <li><span class="mono">1</span><h3>Соберите корзину</h3><p>Через подбор котла или каталог. Корзина сохраняется в этом браузере, регистрация не нужна.</p></li>
      <li><span class="mono">2</span><h3>Отправьте в WhatsApp</h3><p>Кнопка «Заказать» откроет чат с готовым списком товаров, количеством и суммой.</p></li>
      <li><span class="mono">3</span><h3>Подтверждение</h3><p>Менеджер сверит цену и наличие, договорится о самовывозе, доставке или монтаже.</p></li>
    </ol>
  </section>

  <section class="sec sec-dark" id="kontakty" aria-labelledby="ct-title">
    <div class="wrap contacts">
      <div>
        <p class="code mono code-dark">06 / МАГАЗИН</p>
        <h2 class="h2" id="ct-title">Приезжайте посмотреть котёл вживую</h2>
        <dl class="ct-list">
          <div><dt>Адрес</dt><dd>Актау, 29А мкр, 24</dd></div>
          <div><dt>Телефон</dt><dd><a href="tel:+77772504300">+7 777 250 43 00</a></dd></div>
          <div><dt>WhatsApp</dt><dd><a href="https://wa.me/77772504300" target="_blank" rel="noopener">+7 777 250 43 00</a></dd></div>
          <div><dt>Часы</dt><dd>${tbd}</dd></div>
        </dl>
        <a class="btn btn-red" href="https://wa.me/77772504300" target="_blank" rel="noopener">${icon('wa')}Написать в WhatsApp</a>
      </div>
      <div class="photos">
        <img src="${IMG}store.webp" alt="Вход в магазин Тепло РОСС с вывеской" loading="lazy" width="640" height="360">
        <img src="${IMG}showroom.webp" alt="Торговый зал: водонагреватели и электрокотлы на стенде" loading="lazy" width="640" height="360">
      </div>
    </div>
  </section>`;
}

function drawPlan(area) {
  // условный план дома 4:3, масштаб 400 м² → 240 px по ширине
  const wM = Math.sqrt(area * 4 / 3), hM = area / wM, k = 240 / Math.sqrt(400 * 4 / 3);
  const w = wM * k, h = hM * k, x = (360 - w) / 2 + 10, y = (230 - h) / 2;
  const f = v => kw(Math.round(v * 10) / 10);
  $('#plan-svg').innerHTML = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" class="p-wall"/>
    <line x1="${x + w * .58}" y1="${y}" x2="${x + w * .58}" y2="${y + h * .62}" class="p-in"/>
    <line x1="${x}" y1="${y + h * .62}" x2="${x + w}" y2="${y + h * .62}" class="p-in"/>
    <rect x="${x + 4}" y="${y + h - 16}" width="12" height="12" class="p-boiler"/>
    <line x1="${x}" y1="${y - 10}" x2="${x + w}" y2="${y - 10}" class="p-dim"/>
    <line x1="${x}" y1="${y - 15}" x2="${x}" y2="${y - 5}" class="p-dim"/><line x1="${x + w}" y1="${y - 15}" x2="${x + w}" y2="${y - 5}" class="p-dim"/>
    <text x="${x + w / 2}" y="${y - 15}" text-anchor="middle" class="p-txt">${f(wM)} м</text>
    <line x1="${x - 10}" y1="${y}" x2="${x - 10}" y2="${y + h}" class="p-dim"/>
    <line x1="${x - 15}" y1="${y}" x2="${x - 5}" y2="${y}" class="p-dim"/><line x1="${x - 15}" y1="${y + h}" x2="${x - 5}" y2="${y + h}" class="p-dim"/>
    <text x="${x - 16}" y="${y + h / 2}" text-anchor="end" dominant-baseline="middle" class="p-txt">${f(hM)} м</text>
    <text x="${x + w * .29}" y="${y + h * .34}" text-anchor="middle" class="p-area">${area} м²</text>`;
}

function updatePicker() {
  const r = recommend(picker);
  drawPlan(picker.area);
  $('#need').textContent = kw(r.need);
  $('#formula').textContent = `${picker.area} м² ÷ 10 = ${kw(r.base)} кВт × ${kw(RESERVE)} запас`;
  const head = `<p class="matches-head mono"><span>ПОДХОДЯТ</span><span>${r.models.length} из ${catalog.filter(p => p.category === 'boilers').length}</span></p>`;
  $('#matches').innerHTML = r.over
    ? `${head}<p class="match-empty">Одного котла из каталога не хватит на ${picker.area} м². Нужен инженерный расчёт: каскад котлов или более мощная модель под заказ. <a href="${waUrl(`Здравствуйте! Нужен котёл на ${picker.area} м², расчёт мощности ≈ ${kw(r.need)} кВт.`)}" target="_blank" rel="noopener">Спросить в WhatsApp</a></p>`
    : `${head}${r.relaxed ? '<p class="match-warn">Настенных одноконтурных в каталоге нет. Двухконтурный можно подключить только на отопление.</p>' : ''}
      <ul class="match-list">${r.models.map((p, i) => `<li class="match${i === 0 ? ' match-best' : ''}">
        <img src="${IMG + p.image}" alt="" width="56" height="56">
        <div class="match-info">
          <p class="match-name"><button type="button" data-open="${p.id}">${esc(p.name)}</button>${i === 0 ? '<span class="tag-best mono">ОПТИМУМ</span>' : ''}</p>
          <p class="match-specs mono"><span>${kw(p.power)} кВт</span><span>+${Math.round((p.power / r.need - 1) * 100)} %</span><span>${p.stock === 'in' ? 'в наличии' : 'под заказ'}</span></p>
        </div>
        <p class="match-price mono">${money(p.price)}</p>
        <button class="btn btn-red btn-sm" type="button" data-add="${p.id}" aria-label="В корзину: ${esc(p.name)}">${icon('cart')}<span>В корзину</span></button>
      </li>`).join('')}</ul>`;
}

function bindPicker() {
  const form = $('#picker');
  form.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'area' || t.id === 'area-num') {
      const v = Math.round(+t.value);
      if (t.id === 'area-num' && (v < 40 || v > 400)) return; // ждём, пока пользователь допечатает
      picker.area = v;
      (t.id === 'area' ? $('#area-num') : $('#area')).value = v;
      $('#area').setAttribute('aria-valuetext', `${v} квадратных метров`);
    } else picker[t.name] = t.name === 'circuits' ? +t.value : t.value;
    updatePicker();
  });
  $('#area-num').addEventListener('change', e => {
    const v = Math.min(400, Math.max(40, Math.round(+e.target.value / 5) * 5 || 120));
    e.target.value = $('#area').value = picker.area = v;
    updatePicker();
  });
  form.addEventListener('submit', e => e.preventDefault());
  updatePicker();
}

/* ---------- каталог ---------- */
function catalogPage() {
  const title = filters.cat === 'all' ? 'Каталог' : catName(filters.cat);
  return `<div class="wrap page">
    <nav class="crumbs" aria-label="Навигационная цепочка"><a href="#/">Главная</a><span aria-hidden="true">/</span>${filters.cat === 'all' ? '<span aria-current="page">Каталог</span>' : `<a href="#/katalog">Каталог</a><span aria-hidden="true">/</span><span aria-current="page">${title}</span>`}</nav>
    <div class="page-head"><h1 class="h1-page">${title}</h1><p class="demo-note">Цены для примера</p></div>
    <ul class="chips" aria-label="Разделы каталога">
      <li><a class="chip" href="#/katalog" ${filters.cat === 'all' ? 'aria-current="page"' : ''}>Все</a></li>
      ${categories.map(c => `<li><a class="chip" href="#/katalog/${c.id}" ${filters.cat === c.id ? 'aria-current="page"' : ''}>${c.name}</a></li>`).join('')}
    </ul>
    <div class="cat-layout">
      <div class="sheet-backdrop" hidden></div>
      <aside class="filters" id="filters" aria-labelledby="f-title">
        <div class="sheet-head"><h2 id="f-title" class="f-title">Фильтры</h2>
          <button class="icon-btn sheet-close" type="button" aria-label="Закрыть фильтры">${icon('close')}</button></div>
        <form id="filter-form">
          <fieldset class="f-group"><legend>Бренд</legend>
            ${brands.map(b => {
              const n = filterCatalog({...filters, brands: [b]}).length;
              return `<label class="check"><input type="checkbox" name="brand" value="${esc(b)}" ${filters.brands.includes(b) ? 'checked' : ''} ${!n && !filters.brands.includes(b) ? 'disabled' : ''}><span>${esc(b)}</span><small class="mono">${n}</small></label>`;
            }).join('')}
          </fieldset>
          <fieldset class="f-group"><legend>Цена, ₸</legend>
            <div class="range2">
              <label><span class="sr-only">Цена от</span><input type="number" name="min" min="0" step="1000" placeholder="от 18 500" value="${filters.min}" inputmode="numeric"></label>
              <span aria-hidden="true">—</span>
              <label><span class="sr-only">Цена до</span><input type="number" name="max" min="0" step="1000" placeholder="до 549 000" value="${filters.max}" inputmode="numeric"></label>
            </div>
          </fieldset>
          <fieldset class="f-group"><legend>Мощность котла</legend>
            ${Object.entries(powerBuckets).map(([k, [label]]) => `<label class="check"><input type="checkbox" name="power" value="${k}" ${filters.powers.includes(k) ? 'checked' : ''}><span>${label}</span></label>`).join('')}
          </fieldset>
          <fieldset class="f-group"><legend>Наличие</legend>
            <label class="check"><input type="checkbox" name="stock" ${filters.stock ? 'checked' : ''}><span>Только в наличии</span></label>
          </fieldset>
          <div class="f-actions">
            <button class="btn btn-ghost" type="button" id="f-reset">Сбросить</button>
            <button class="btn btn-dark sheet-apply" type="button">Показать</button>
          </div>
        </form>
      </aside>
      <section class="results" aria-label="Товары">
        <div class="toolbar">
          <button class="btn btn-ghost f-open" type="button" aria-controls="filters" aria-expanded="false">${icon('filter')}Фильтры <b class="badge" id="f-count" hidden></b></button>
          <label class="tb-search"><span class="sr-only">Поиск в каталоге</span>${icon('search')}<input type="search" id="q" value="${esc(filters.q)}" placeholder="Поиск: модель, бренд, кВт"></label>
          <p class="count mono" id="count" aria-live="polite"></p>
          <label class="select"><span class="sr-only">Сортировка</span>
            <select id="sort">
              ${[['popular', 'Популярные'], ['low', 'Дешевле'], ['high', 'Дороже'], ['power', 'Мощнее'], ['name', 'По названию']].map(([v, t]) => `<option value="${v}" ${filters.sort === v ? 'selected' : ''}>${t}</option>`).join('')}
            </select>${icon('down')}</label>
          <div class="view-toggle" role="group" aria-label="Вид списка">
            <button class="icon-btn" type="button" data-view="grid" aria-pressed="${view === 'grid'}" aria-label="Сетка">${icon('grid')}</button>
            <button class="icon-btn" type="button" data-view="list" aria-pressed="${view === 'list'}" aria-label="Список">${icon('list')}</button>
          </div>
        </div>
        <div class="grid" id="results" data-view="${view}"></div>
      </section>
    </div>
  </div>`;
}
const activeFilters = () => filters.brands.length + filters.powers.length + (filters.min !== '') + (filters.max !== '') + filters.stock;
function updateResults() {
  const list = filterCatalog(filters);
  $('#results').innerHTML = list.length ? list.map(card).join('')
    : `<div class="empty"><p class="code mono">0 / НЕТ СОВПАДЕНИЙ</p><h2 class="h2">Ничего не нашли</h2><p>Измените запрос или сбросьте фильтры. Нужной модели может не быть в макете — спросите в WhatsApp.</p>
       <div class="empty-actions"><button class="btn btn-dark" type="button" id="empty-reset">Сбросить фильтры</button><a class="btn btn-ghost" href="${waUrl(`Здравствуйте! Ищу: ${filters.q || 'оборудование'}. Есть в наличии?`)}" target="_blank" rel="noopener">${icon('wa')}Спросить в WhatsApp</a></div></div>`;
  $('#count').textContent = `Найдено: ${items(list.length)}`;
  $('.sheet-apply').textContent = `Показать ${list.length}`;
  const n = activeFilters();
  $('#f-reset').disabled = !n;
  $('#f-count').hidden = !n; $('#f-count').textContent = n;
  // бренды: число позиций и disabled для пустых
  $$('input[name="brand"]').forEach(i => {
    const c = filterCatalog({...filters, brands: [i.value]}).length;
    i.disabled = !c && !i.checked;
    i.closest('label').querySelector('small').textContent = c;
  });
}
function bindCatalog() {
  const form = $('#filter-form');
  form.addEventListener('input', () => {
    const fd = new FormData(form);
    Object.assign(filters, {brands: fd.getAll('brand'), powers: fd.getAll('power'), min: fd.get('min'), max: fd.get('max'), stock: fd.has('stock')});
    updateResults();
  });
  $('#q').addEventListener('input', e => { filters.q = e.target.value; updateResults(); });
  $('#sort').addEventListener('change', e => { filters.sort = e.target.value; updateResults(); });
  const reset = () => { Object.assign(filters, {q: '', brands: [], min: '', max: '', powers: [], stock: false}); render(); };
  $('#f-reset').addEventListener('click', reset);
  $('#results').addEventListener('click', e => { if (e.target.closest('#empty-reset')) reset(); });
  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    view = b.dataset.view; store.set('teploross-b-podbor-view', view);
    $('#results').dataset.view = view;
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  // bottom sheet фильтров на мобильном
  const sheet = $('#filters'), opener = $('.f-open'), backdrop = $('.sheet-backdrop');
  const toggle = open => {
    sheet.classList.toggle('open', open); backdrop.hidden = !open;
    opener.setAttribute('aria-expanded', open); document.body.classList.toggle('lock', open);
    if (open) $('.sheet-close').focus(); else opener.focus();
  };
  opener.addEventListener('click', () => toggle(true));
  $('.sheet-close').addEventListener('click', () => toggle(false));
  $('.sheet-apply').addEventListener('click', () => toggle(false));
  backdrop.addEventListener('click', () => toggle(false));
  sheet.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) toggle(false); });
  updateResults();
}

/* ---------- корзина ---------- */
function renderCartPage() {
  const list = cartItems(cart), a = document.activeElement;
  const refocus = a?.dataset.qty ? `[data-qty="${a.dataset.qty}"][data-d="${a.dataset.d}"]` : a?.dataset.qtyInput ? `[data-qty-input="${a.dataset.qtyInput}"]` : a?.dataset.del ? '#main h1' : null;
  const steps = `<ol class="stepper" aria-label="Шаги заказа">
    <li aria-current="step"><span class="mono">1</span>Корзина</li><li><span class="mono">2</span>WhatsApp</li><li><span class="mono">3</span>Подтверждение</li></ol>`;
  $('#main').innerHTML = `<div class="wrap page">
    <nav class="crumbs" aria-label="Навигационная цепочка"><a href="#/">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Корзина</span></nav>
    <div class="page-head"><h1 class="h1-page" tabindex="-1">Корзина ${list.length ? `<span class="mono h1-count">${items(cartCount(cart))}</span>` : ''}</h1>${steps}</div>
    ${list.length ? `<div class="cart-layout">
      <section aria-label="Товары в корзине">
        <ul class="cart-list">${list.map(({p, qty, sum}) => `<li class="ci">
          <img src="${IMG + p.image}" alt="" width="88" height="88">
          <div class="ci-info">
            <p class="ci-name"><button type="button" data-open="${p.id}">${esc(p.name)}</button></p>
            <p class="ci-specs mono">${p.rows.slice(0, 2).map(r => r[1]).join(' · ')}</p>
            ${stockBadge(p)}
          </div>
          <div class="qty" role="group" aria-label="Количество: ${esc(p.name)}">
            <button class="icon-btn" type="button" data-qty="${p.id}" data-d="-1" ${qty <= 1 ? 'disabled' : ''} aria-label="Уменьшить">−</button>
            <input type="number" min="1" max="99" value="${qty}" data-qty-input="${p.id}" aria-label="Количество" inputmode="numeric">
            <button class="icon-btn" type="button" data-qty="${p.id}" data-d="1" ${qty >= 99 ? 'disabled' : ''} aria-label="Увеличить">+</button>
          </div>
          <div class="ci-sum"><b class="mono">${money(sum)}</b><small class="mono">${money(p.price)} / шт.</small></div>
          <button class="icon-btn ci-del" type="button" data-del="${p.id}" aria-label="Удалить: ${esc(p.name)}">${icon('trash')}</button>
        </li>`).join('')}</ul>
        <a class="more" href="#/katalog">← Продолжить покупки</a>
      </section>
      <aside class="summary" aria-labelledby="sum-title">
        <h2 class="f-title" id="sum-title">Итог заказа</h2>
        <table class="spec spec-sum"><tbody>
          <tr><th scope="row">Позиций</th><td>${list.length}</td></tr>
          <tr><th scope="row">Товаров</th><td>${cartCount(cart)} шт.</td></tr>
          <tr class="sum-total"><th scope="row">Итого</th><td>${money(cartTotal(cart))}</td></tr>
        </tbody></table>
        <label class="field-label" for="pickup">Получение</label>
        <label class="select select-light">
          <select id="pickup">
            <option value="1" ${order.pickup ? 'selected' : ''}>Самовывоз — 29А мкр, 24</option>
            <option value="0" ${order.pickup ? '' : 'selected'}>Доставка по Актау (условия уточнит менеджер)</option>
          </select>${icon('down')}</label>
        <label class="check"><input type="checkbox" id="install" ${order.install ? 'checked' : ''}><span>Нужен монтаж — рассчитать стоимость</span></label>
        <a class="btn btn-red btn-block" id="order" href="${orderUrl(cart, order)}" target="_blank" rel="noopener">${icon('wa')}Заказать в WhatsApp</a>
        <p class="sum-note">Откроется WhatsApp с готовым сообщением: состав, количество, сумма. Оплата и цены — после подтверждения менеджером. Цены на сайте для примера.</p>
      </aside>
    </div>` : `<div class="empty"><p class="code mono">0 / ПУСТО</p><h2 class="h2">В корзине пока ничего</h2>
      <p>Начните с подбора котла по площади дома или откройте каталог.</p>
      <div class="empty-actions"><a class="btn btn-red" href="#/podbor">Подобрать котёл</a><a class="btn btn-ghost" href="#/katalog">Каталог</a></div></div>`}
  </div>`;
  if (refocus) { const el = $(refocus); el && !el.disabled ? el.focus() : $('#main h1').focus(); }
  const sync = () => { $('#order').href = orderUrl(cart, order); renderMinicart(); };
  $('#pickup')?.addEventListener('change', e => { order.pickup = e.target.value === '1'; sync(); });
  $('#install')?.addEventListener('change', e => { order.install = e.target.checked; sync(); });
}

/* ---------- товар ---------- */
function openProduct(id) {
  const p = byId(id), d = $('#product-dialog');
  if (!p) return;
  d.innerHTML = `<div class="pd">
    <button class="icon-btn pd-close" type="button" aria-label="Закрыть">${icon('close')}</button>
    <div class="pd-img"><img src="${IMG + p.image}" alt="${esc(p.name)}" width="420" height="420"></div>
    <div class="pd-body">
      <p class="card-meta">${stockBadge(p)}</p>
      <h2 class="h2" id="pd-title">${esc(p.name)}</h2>
      <p class="card-kind">${p.kind} · ${esc(p.brand)} · ${catName(p.category)}</p>
      <table class="spec spec-lg"><caption class="sr-only">Характеристики</caption><tbody>
        ${p.rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}
        <tr><th scope="row">Бренд</th><td>${esc(p.brand)}</td></tr>
      </tbody></table>
      <p class="price price-lg mono">${money(p.price)} <small>цена для примера</small></p>
      <div class="pd-buy">
        <button class="btn btn-red" type="button" data-add="${p.id}">${icon('cart')}В корзину</button>
        <a class="btn btn-ghost" href="${waUrl(`Здравствуйте! Интересует ${p.name}. Есть в наличии? Какая цена?`)}" target="_blank" rel="noopener">${icon('wa')}Уточнить</a>
      </div>
      <p class="incart mono" data-incart="${p.id}">${cart[p.id] ? `в корзине: ${cart[p.id]}` : ''}</p>
      ${p.category === 'boilers' ? `<p class="pd-note">Подходит для дома до ${Math.round(p.power * 10 / RESERVE)} м² с запасом ${Math.round((RESERVE - 1) * 100)} %. Монтаж и пусконаладку можно заказать вместе с котлом.</p>` : ''}
    </div></div>`;
  d.showModal();
}

/* ---------- роутинг ---------- */
function route() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const [page = '', sub] = path.split('/');
  return {page, sub, q: new URLSearchParams(qs).get('q')};
}
function render() {
  const {page, sub, q} = route();
  closeMenus();
  if ($('#product-dialog').open) $('#product-dialog').close();
  document.body.classList.remove('lock');
  $$('.nav-link[href]').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === `#/${page}` && !!page));
  if (page === 'katalog') {
    filters.cat = categories.some(c => c.id === sub) ? sub : 'all';
    if (q !== null) filters.q = q;
    $('#main').innerHTML = catalogPage(); bindCatalog();
    document.title = `${filters.cat === 'all' ? 'Каталог' : catName(filters.cat)} — Тепло РОСС Актау`;
  } else if (page === 'korzina') {
    document.title = 'Корзина — Тепло РОСС Актау';
  } else {
    $('#main').innerHTML = home(); bindPicker();
    document.title = 'Тепло РОСС Актау — подбор котла и отопление';
    const target = {podbor: '.hero', uslugi: '#uslugi', kontakty: '#kontakty'}[page];
    if (target) requestAnimationFrame(() => $(target).scrollIntoView());
  }
  syncCart();
}

/* ---------- меню, dropdown, глобальные клики ---------- */
function closeMenus(except) {
  $$('[aria-expanded="true"]').forEach(b => {
    if (b === except || b.classList.contains('f-open')) return;
    b.setAttribute('aria-expanded', 'false');
    const el = document.getElementById(b.getAttribute('aria-controls'));
    if (el && el.id !== 'nav') el.hidden = true;
    if (el?.id === 'nav') { el.classList.remove('open'); b.setAttribute('aria-label', 'Открыть меню'); }
  });
}
function toggleMenu(btn) {
  const open = btn.getAttribute('aria-expanded') !== 'true';
  closeMenus(btn.classList.contains('dd-btn') ? $('.burger') : null);
  btn.setAttribute('aria-expanded', open);
  const el = document.getElementById(btn.getAttribute('aria-controls'));
  if (el.id === 'nav') { el.classList.toggle('open', open); btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); }
  else el.hidden = !open;
  if (open && el.id !== 'nav') el.querySelector('a,button')?.focus();
}

let toastT;
function toast(text) {
  const t = $('#toast');
  t.textContent = text; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

$('#dd-cat').innerHTML = `<li><a href="#/katalog">Весь каталог</a></li>` + categories.map(c => `<li><a href="#/katalog/${c.id}"><span>${c.name}</span><small class="mono">${catalog.filter(p => p.category === c.id).length}</small></a></li>`).join('');
$('#footer-cats').innerHTML = categories.map(c => `<li><a href="#/katalog/${c.id}">${c.name}</a></li>`).join('');

document.addEventListener('click', e => {
  const t = e.target.closest('button, a');
  if (!t) { if (!e.target.closest('.minicart, .dd-menu, .nav')) closeMenus(); return; }
  if (t.classList.contains('skip')) { e.preventDefault(); $('#main').focus(); return; }
  if (t.matches('.dd-btn, .burger, #cart-btn')) return toggleMenu(t);
  if (t.dataset.add) return add(t.dataset.add);
  if (t.dataset.open) return openProduct(t.dataset.open);
  if (t.dataset.qty) return setQty(t.dataset.qty, (cart[t.dataset.qty] || 0) + +t.dataset.d);
  if (t.dataset.del) { const n = byId(t.dataset.del).name; setQty(t.dataset.del, 0); return toast(`${n} — удалён из корзины`); }
  if (t.classList.contains('pd-close')) return t.closest('dialog').close();
  if (t.closest('#product-dialog') && t.matches('a[href^="#"]')) $('#product-dialog').close();
  if (t.matches('a[href^="#"]')) closeMenus();
});
document.addEventListener('change', e => {
  const id = e.target.dataset.qtyInput;
  if (id) setQty(id, Math.round(+e.target.value) || 1);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = $('[aria-expanded="true"]:not(.f-open)');
  if (open) { closeMenus(); open.focus(); }
});
$('#product-dialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$('#search-form').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#search').value.trim();
  location.hash = `#/katalog${q ? '?q=' + encodeURIComponent(q) : ''}`;
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#main') return;
  render();
  if (!['podbor', 'uslugi', 'kontakty'].includes(route().page)) window.scrollTo(0, 0);
  $('#main').focus({preventScroll: true});
});
window.addEventListener('storage', e => { if (e.key === CART_KEY) { cart = cleanCart(store.get(CART_KEY, {})); syncCart(); } });
render();
