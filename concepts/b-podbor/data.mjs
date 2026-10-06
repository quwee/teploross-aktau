// Данные и логика варианта B «Подбор». Базовые товары и форматирование берём из общего shop.mjs,
// дополнительные демо-позиции и поля для подборщика держим здесь, чтобы не менять shop.mjs.
import {products as base, categories, money} from '../../shop.mjs';
export {categories, money};

export const CART_KEY = 'teploross-b-podbor-cart';
export const PHONE = '77772504300';
export const kw = v => new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 1}).format(v);

const boiler = (id, name, power, circuits, mount, price, stock = 'in') => ({
  id, name, brand: 'Лемакс', category: 'boilers', power, circuits, mount, price, stock,
  kind: `${mount === 'wall' ? 'Настенный' : 'Напольный'} газовый котёл`,
  image: mount === 'wall' ? 'wall-boiler.webp' : 'lemaks.webp',
});

const extra = [
  boiler('lem-10', 'Лемакс Премиум-10', 10, 1, 'floor', 165000),
  boiler('lem-20', 'Лемакс Премиум-20', 20, 1, 'floor', 249000),
  boiler('lem-30', 'Лемакс Премиум-30', 30, 1, 'floor', 329000, 'order'),
  boiler('lem-40', 'Лемакс Премиум-40', 40, 1, 'floor', 419000, 'order'),
  boiler('lem-12b', 'Лемакс Премиум-12,5В', 12.5, 2, 'floor', 209000),
  boiler('lem-16b', 'Лемакс Премиум-16В', 16, 2, 'floor', 239000),
  boiler('lem-20b', 'Лемакс Премиум-20В', 20, 2, 'floor', 279000),
  boiler('lem-25b', 'Лемакс Премиум-25В', 25, 2, 'floor', 319000, 'order'),
  boiler('prime-16', 'Лемакс PRIME-V16', 16, 2, 'wall', 425000),
  boiler('prime-20', 'Лемакс PRIME-V20', 20, 2, 'wall', 449000),
  boiler('prime-24', 'Лемакс PRIME-V24', 24, 2, 'wall', 479000, 'order'),
  boiler('prime-32', 'Лемакс PRIME-V32', 32, 2, 'wall', 549000, 'order'),
  {id: 'rad-500-8', name: 'Royal Thermo Revolution 500 · 8 секций', brand: 'Royal Thermo', category: 'radiators', kind: 'Алюминиевый радиатор', power: 0, price: 84500, image: 'radiator.webp', stock: 'in',
    rows: [['Секции', '8'], ['Межосевое', '500 мм'], ['Материал', 'алюминий'], ['Подключение', 'боковое']]},
  {id: 'rad-500-12', name: 'Royal Thermo Revolution 500 · 12 секций', brand: 'Royal Thermo', category: 'radiators', kind: 'Алюминиевый радиатор', power: 0, price: 126000, image: 'radiator.webp', stock: 'order',
    rows: [['Секции', '12'], ['Межосевое', '500 мм'], ['Материал', 'алюминий'], ['Подключение', 'боковое']]},
  {id: 'pump-32', name: 'Grundfos UPS 32-60 180', brand: 'Grundfos', category: 'pumps', kind: 'Циркуляционный насос', power: 0, price: 41000, image: 'pump.webp', stock: 'in',
    rows: [['Напор', 'до 6 м'], ['Скорости', '3'], ['Монтажная длина', '180 мм'], ['Присоединение', '1¼″']]},
  {id: 'water-80v', name: 'Thermex ER 80 V', brand: 'Thermex', category: 'water', kind: 'Накопительный водонагреватель', power: 0, price: 79000, image: 'water-heater.webp', stock: 'in',
    rows: [['Объём', '80 л'], ['Монтаж', 'вертикальный'], ['Нагрев', 'ТЭН'], ['Питание', '220 В']]},
  {id: 'water-150v', name: 'Thermex ER 150 V', brand: 'Thermex', category: 'water', kind: 'Накопительный водонагреватель', power: 0, price: 109000, image: 'water-heater.webp', stock: 'order',
    rows: [['Объём', '150 л'], ['Монтаж', 'вертикальный'], ['Нагрев', 'ТЭН'], ['Питание', '220 В']]},
];

// Таблицы характеристик для позиций из shop.mjs (там они только строкой).
const baseRows = {
  'rad-500': [['Секции', '4'], ['Межосевое', '500 мм'], ['Материал', 'алюминий'], ['Подключение', 'боковое']],
  'pump-25': [['Напор', 'до 4 м'], ['Скорости', '3'], ['Монтажная длина', '180 мм'], ['Присоединение', '1½″']],
  'water-80': [['Объём', '100 л'], ['Монтаж', 'вертикальный'], ['Нагрев', 'ТЭН'], ['Питание', '220 В']],
  'tap-kitchen': [['Тип', 'для умывальника'], ['Управление', 'однорычажное'], ['Покрытие', 'хром'], ['Монтаж', 'на раковину']],
};

const boilerRows = p => [
  ['Мощность', `${kw(p.power)} кВт`],
  ['Контуры', p.circuits === 2 ? '2 · отопление + ГВС' : '1 · отопление'],
  ['Установка', p.mount === 'wall' ? 'настенный' : 'напольный'],
  ['Площадь', `до ${Math.round(p.power * 10)} м²`],
];

export const catalog = [
  ...base.map(p => {
    const b = {...p, stock: 'in'};
    if (p.category === 'boilers') Object.assign(b, {circuits: /двухконтур/.test(p.specs) ? 2 : 1, mount: /Настенн/.test(p.kind) ? 'wall' : 'floor'});
    return b;
  }),
  ...extra,
].map(p => ({...p, rows: p.rows || baseRows[p.id] || (p.category === 'boilers' ? boilerRows(p) : [['Описание', p.specs]])}));

export const byId = id => catalog.find(p => p.id === id);

// Подбор котла: ≈1 кВт на 10 м² (дом с утеплением, потолки до ~2,7 м) плюс 20 % запаса.
export const RESERVE = 1.2;
export function needPower(area) { return Math.ceil(area / 10 * RESERVE * 10) / 10; }
export function recommend({area, circuits, mount}) {
  const need = needPower(area);
  const sameMount = catalog.filter(p => p.category === 'boilers' && p.mount === mount);
  let pool = sameMount.filter(p => p.circuits === circuits), relaxed = false;
  if (!pool.length) { pool = sameMount; relaxed = true; } // двухконтурный можно использовать только на отопление
  const models = pool.filter(p => p.power >= need).sort((a, b) => a.power - b.power || a.price - b.price).slice(0, 3);
  return {base: area / 10, need, models, relaxed, over: !models.length};
}

// Корзина: {id: qty}, 1–99 шт., только известные товары.
export function cleanCart(value) {
  return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
    .filter(([id, q]) => byId(id) && Number.isInteger(q) && q > 0 && q <= 99));
}
export const cartItems = cart => catalog.filter(p => cart[p.id]).map(p => ({p, qty: cart[p.id], sum: p.price * cart[p.id]}));
export const cartTotal = cart => cartItems(cart).reduce((s, i) => s + i.sum, 0);
export const cartCount = cart => Object.values(cart).reduce((s, q) => s + q, 0);

export const waUrl = text => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
export function orderUrl(cart, {pickup = true, install = false} = {}) {
  const rows = cartItems(cart).map(({p, qty, sum}) => `• ${p.name} — ${qty} шт. × ${money(p.price)} = ${money(sum)}`);
  return waUrl(`Здравствуйте, Тепло РОСС Актау! Хочу оформить заказ:\n\n${rows.join('\n')}\n\nИтого по сайту: ${money(cartTotal(cart))}.\n` +
    `Получение: ${pickup ? 'самовывоз, 29А мкр, 24' : 'доставка по Актау'}.\n` +
    (install ? 'Нужен монтаж — подскажите стоимость.\n' : '') +
    'Цены на сайте для примера. Подтвердите, пожалуйста, актуальные цены и наличие.');
}
