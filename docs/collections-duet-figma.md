# Collections Duet: Figma handoff

## Что это за сцена

Новый блок на главной не заменяет hero и не ломает каталог. Это отдельный storytelling-блок под первым экраном, где `Lifestyle` и `Luxury` показываются как два разных сценария гостиничной подачи.

## Что собрать в Figma

1. Создай фрейм `Home / Collections Duet / Desktop` шириной `1440` и высотой `1120`.
2. Внутри сделай три колонки:
   - `Lifestyle Panel` шириной `~470`
   - `Blend Control` шириной `320`
   - `Luxury Panel` шириной `~470`
3. Для обеих панелей используй большие card-shell контейнеры с `radius 30-34`.
4. Внутрь каждой панели положи:
   - `Featured Card`
   - `Orbit Card / Top`
   - `Orbit Card / Bottom`
   - `Dots`
   - `CTA`

## Содержимое по товарам

### Lifestyle

- `RRR / Bath & Shower Gel / 35 ml`
- `Naturals / Orange Bliss Shampoo / 30 ml`
- `Hydro Touch / Hair & Body Shampoo / 300 ml`

### Luxury

- `Lalique / Collection Lalique Shampoo / 50 ml`
- `The White Company / Lime & Bay Lotion / 300 ml`
- `Amouage / Anchorage Shampoo / 40 ml`

## Прототипирование

Сделай интерактивный компонент `Blend Control` с тремя вариантами:

1. `Room Flow`
2. `Balanced Edit`
3. `Signature Suite`

Для каждого варианта меняй:

- положение thumb на слайдере
- масштаб `Lifestyle Panel`
- масштаб `Luxury Panel`
- featured product в каждой панели
- длину активного dot

## Smart Animate

Используй переходы:

- `Smart Animate`
- `Ease Out`
- `500 ms` между preset-состояниями
- `300 ms` для hover на orbit cards и CTA

## Что должно двигаться

- `Featured Card` по оси `Y` на `12-18 px`
- orbit cards по `X` на `10-14 px`
- opacity orbit cards в диапазоне `72% -> 92%`
- panels scale в диапазоне `0.96 -> 1.02`

## Важная логика

- Hero выше остается прежним.
- Блок должен читаться как отдельная gallery-scene, а не новый layout всей страницы.
- На mobile колонки складываются в порядок:
  1. `Blend Control`
  2. `Lifestyle Panel`
  3. `Luxury Panel`
