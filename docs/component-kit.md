# 🎨 Kodu App Component Kit — БҮРЭН лавлах (app.kodu.live AI-д зориулсан)

> Expo/react-native-web template-д **prebake** хийгдсэн. Апп-ууд install хийхгүйгээр
> `./ui`-аас import хийнэ. Цэвэр `react-native` StyleSheet тул **preview (Vite/RNW)
> болон export (Expo/Metro) хоёуланд ижил** ажиллана.
>
> ⚠️ **Зөвхөн доор жагссан props-ыг** ашигла. Байхгүй prop бичвэл (жишээ Button-д
> `loading`, Input-д `label`) — үл тоомсорлогдоно, гэхдээ битгий найд.

## Import

```tsx
import {
  ThemeProvider, useThemeToggle, useTheme,
  Screen, Header, Row, Divider,
  Title, Subtitle, Body, Muted,
  Button, IconButton, Card, Input,
  Badge, Chip, Avatar, ListItem,
  Tabs, useTabs, Switch, Progress, Spinner,
  Section, EmptyState, Modal,
} from "./ui";
```

---

## 🌙☀️ Theme

### `ThemeProvider`
Апп-аа үүгээр ор. Бүх компонент theme-ийг дагана.
```tsx
<ThemeProvider base="dark" accent="#ff5566"> ...app... </ThemeProvider>
```
| Prop | Утга | Default |
|------|------|---------|
| `base` | `"light"` \| `"dark"` | `"dark"` |
| `accent` | primary өнгө (hex), заавал биш | — |
| `children` | апп-ын агуулга | — |

### `useThemeToggle(initial?)`
Товчоор dark/light сэлгэх. `initial`: `"dark"`|`"light"` (default `"dark"`).
```tsx
const { base, setBase, toggle } = useThemeToggle("dark");
// <ThemeProvider base={base}> ... <IconButton icon="🌙" onPress={toggle} />
```

### `useTheme()`
Одоогийн theme объект буцаана: `{ mode, colors, space, radius, font }`.
```tsx
const t = useTheme();
// t.colors.primary, t.colors.text, t.space.lg, t.radius.md ...
```

---

## 📐 Layout

### `Screen`  — дэлгэцийн container (bg + padding)
```tsx
<Screen scroll padded>...</Screen>
```
| Prop | Утга | Default |
|------|------|---------|
| `scroll` | гүйдэг эсэх (ScrollView) | `false` |
| `padded` | дотор padding (16px) | `true` |
| `style` | нэмэлт style | — |
| `children` | агуулга | — |

> Ердийн бүтэц: гадна `<Screen padded={false}>` (Header/Tabs зорилгоор),
> дотор нь `<Screen scroll>` (агуулгын хэсэг).

### `Row` — хэвтээ байрлал
```tsx
<Row justify="space-between" gap={8}><Body>Зүүн</Body><Badge label="10" /></Row>
```
| Prop | Утга | Default |
|------|------|---------|
| `gap` | зай (px) | `12` |
| `align` | `"center"`\|`"flex-start"`\|`"flex-end"` | `"center"` |
| `justify` | `"space-between"`\|`"center"` г.м | — |
| `style`, `children` | | — |

### `Divider` — тусгаарлах шугам
```tsx
<Divider />
```
Props: `style?`

### `Section` — гарчигтай бүлэг
```tsx
<Section title="ТОХИРГОО"><Card>...</Card></Section>
```
Props: `title?` (жижиг том гарчиг), `children`, `style?`

---

## 🔤 Typography

`Title`, `Subtitle`, `Body`, `Muted` — бүгд ижил props: `children`, `style?`
```tsx
<Title>Том гарчиг</Title>
<Subtitle>Дэд гарчиг</Subtitle>
<Body>Ердийн текст</Body>
<Muted>Бүдэг туслах текст</Muted>
```

---

## 🔘 Үйлдэл

### `Button`
```tsx
<Button title="Захиалах" onPress={() => {}} variant="primary" size="md" />
```
| Prop | Утга | Default |
|------|------|---------|
| `title` | товчны текст (**string**) | — |
| `onPress` | дарахад | — |
| `variant` | `"primary"`\|`"secondary"`\|`"ghost"`\|`"danger"` | `"primary"` |
| `size` | `"sm"`\|`"md"` | `"md"` |
| `disabled` | идэвхгүй | `false` |
| `style` | нэмэлт | — |

> ❌ `loading` prop БАЙХГҮЙ. Ачаалал хэрэгтэй бол `disabled` + тусад нь `<Spinner />`.

### `IconButton` — дугуй товч (emoji/icon)
```tsx
<IconButton icon="⚙️" onPress={() => {}} size={44} />
```
Props: `icon` (emoji/текст **string**), `onPress`, `size?` (default 44), `style?`

---

## 🃏 Хэсгүүд

### `Card`
```tsx
<Card><Body>Агуулга</Body></Card>
<Card onPress={() => {}}>Дарж болно</Card>
```
Props: `children`, `onPress?` (өгвөл Pressable болно), `style?`

### `Input`
```tsx
<Input value={x} onChangeText={setX} placeholder="Хайх..." />
<Input value={pw} onChangeText={setPw} placeholder="Нууц үг" secureTextEntry />
```
| Prop | Утга |
|------|------|
| `value` | утга (**string**) |
| `onChangeText` | `(text) => void` |
| `placeholder` | сануулга текст |
| `style` | нэмэлт |
| `...rest` | **бүх TextInput prop** (secureTextEntry, keyboardType, multiline, autoCapitalize, maxLength...) |

> ❌ `label` prop БАЙХГҮЙ. Шошго хэрэгтэй бол дээр нь `<Muted>Нэр</Muted>` тавь.

### `Badge` — жижиг таг
```tsx
<Badge label="Шинэ" tone="success" />
```
Props: `label` (**string**), `tone?` (`"primary"`|`"success"`|`"danger"`|`"warning"`|`"neutral"`, default primary), `style?`

### `Chip` — сонгож болох таг (filter)
```tsx
<Chip label="Бүгд" selected={sel==="all"} onPress={() => setSel("all")} />
```
Props: `label`, `selected?` (bool), `onPress?`, `style?`

### `Avatar`
```tsx
<Avatar name="Бат" size={44} />
<Avatar uri="https://..." size={60} />
```
Props: `uri?` (зургийн URL), `name?` (эхний 2 үсэг харагдана), `size?` (default 44)

### `ListItem` — жагсаалтын мөр
```tsx
<ListItem title="Захиалга #1" subtitle="Хүлээгдэж буй" right={<Badge label="new" />} onPress={() => {}} />
```
Props: `title` (**string**), `subtitle?`, `right?` (баруун талын элемент), `onPress?`

---

## 🧭 Навигаци

### `Tabs` + `useTabs` — доод navigation (library ХЭРЭГГҮЙ)
```tsx
const { active, setActive } = useTabs("home");
// ...
<Tabs
  active={active}
  onChange={setActive}
  tabs={[
    { key: "home", label: "Нүүр", icon: "🏠" },
    { key: "cart", label: "Сагс", icon: "🛒" },
  ]}
/>
// Идэвхтэй tab-аар агуулга солих:
{active === "home" ? <HomeContent/> : <CartContent/>}
```
- **`useTabs(initial)`** → `{ active, setActive }` (initial = эхний tab key)
- **`Tabs`** props: `tabs` (`[{ key, label, icon? }]`), `active` (одоогийн key), `onChange` (`(key) => void`)
- `icon` — emoji string (заавал биш)

---

## 🎛️ Хяналт

### `Switch` — асаах/унтраах
```tsx
<Switch value={on} onValueChange={setOn} />
```
Props: `value` (bool), `onValueChange` (`(bool) => void`)

### `Progress` — явцын мөр
```tsx
<Progress value={0.65} tone="primary" />
```
Props: `value` (0..1), `tone?` (primary/success/danger/warning, default primary), `style?`

### `Spinner` — ачаалж байна
```tsx
<Spinner />
<Spinner size="small" />
```
Props: `size?` (`"small"`|`"large"`, default `"large"`), `color?`, `style?`

---

## 🪟 Feedback

### `EmptyState` — хоосон төлөв
```tsx
<EmptyState icon="🛒" title="Сагс хоосон" subtitle="Бараа нэмнэ үү"
  action={<Button title="Дэлгүүр" onPress={() => {}} />} />
```
Props: `icon?` (emoji, default "📭"), `title?`, `subtitle?`, `action?` (элемент)

### `Modal` — гарч ирэх цонх
```tsx
const [open, setOpen] = useState(false);
// ...
<Modal visible={open} onClose={() => setOpen(false)} title="Баталгаажуулах">
  <Body>Итгэлтэй байна уу?</Body>
  <Button title="Тийм" onPress={() => setOpen(false)} style={{ marginTop: 12 }} />
</Modal>
```
Props: `visible` (bool), `onClose` (`() => void`, backdrop дарахад ч дуудагдана), `title?`, `children`

---

## 🎨 Theme токенууд (`useTheme()`-ээр)

```ts
colors: bg, surface, surfaceAlt, border, text, muted,
        primary, accent, onPrimary, success, danger, warning
space:  xs(4) sm(8) md(12) lg(16) xl(24) xxl(32)
radius: sm(8) md(12) lg(16) pill(999)
font:   sm(13) md(15) lg(18) xl(24) xxl(30)
```
Апп өөрийн StyleSheet-тэй хослуулж болно.

---

## 🤖 AI prompt-д өгөх дүрэм (app.kodu.live)

1. Апп-аа `<ThemeProvider base="..." accent="...">` дотор ор.
2. Компонентуудыг **зөвхөн `./ui`-аас** import хий (дээрх жагсаалт).
3. **Зөвхөн дээр жагссан props-ыг** ашигла (Button-д `loading` алга, Input-д `label` алга).
4. Навигацийг `useTabs` + `Tabs`-ээр (navigation library битгий).
5. Import зөвхөн `react`, `react-native`, `./ui`-аас.
6. Өнгө/зайг `useTheme()` токеноор ав (гараар hex бичихийн оронд).

---

## ⚠️ Export-д (татаж авах Expo project)

`src/ui/` фолдерыг export-д **хамт оруул** (апп `./ui`-аас import хийдэг). Kit нь
цэвэр react-native тул Expo-д өөрчлөлтгүй ажиллана.

## Дараагийн боломж (хэрэгцээгээр)

Checkbox, Radio, SearchBar, FAB, Skeleton, Rating, Accordion, Toast, SegmentedControl —
App agent тестээд юу дутуу гэдгийг хэлбэл нэмнэ. (Tamagui/NativeWind spike — хүсвэл.)
