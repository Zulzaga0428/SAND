# 🎨 Kodu App Component Kit — лавлах (app.kodu.live AI-д зориулсан)

> Expo/react-native-web template-д **prebake** хийгдсэн component kit. Апп-ууд
> install хийхгүйгээр `./ui`-аас import хийж ашиглана. Цэвэр `react-native`
> StyleSheet тул **preview (Vite/RNW) болон export (Expo/Metro) хоёуланд ижил** ажиллана.

## Хэрэглээ

```tsx
import { Screen, Header, Title, Body, Button, Card, Badge, Tabs, useTabs } from "./ui";

export default function App() {
  const { active, setActive } = useTabs("home");
  return (
    <Screen padded={false}>
      <Header title="Миний апп" right={<Badge label="pro" tone="success" />} />
      <Screen scroll>
        <Title>Сайн уу</Title>
        <Card><Body>Агуулга</Body></Card>
        <Button title="Дарах" onPress={() => {}} />
      </Screen>
      <Tabs active={active} onChange={setActive}
        tabs={[{ key:"home", label:"Нүүр", icon:"🏠" }, { key:"cart", label:"Сагс", icon:"🛒" }]} />
    </Screen>
  );
}
```

## Компонентууд

| Компонент | Props | Тайлбар |
|-----------|-------|---------|
| `Screen` | `scroll?`, `padded?`, `style` | Дэлгэцийн container (bg + padding). `scroll` — гүйдэг |
| `Header` | `title`, `right?` | Дээд самбар |
| `Title` / `Subtitle` / `Body` / `Muted` | `style` | Текстийн хэв маягууд |
| `Button` | `title`, `onPress`, `variant?`, `size?`, `disabled?` | variant: primary\|secondary\|ghost\|danger; size: sm\|md |
| `Card` | `onPress?`, `style` | Гадаргуу + хүрээ + сүүдэр |
| `Input` | `value`, `onChangeText`, `placeholder`, `...TextInput` | Хэлбэржүүлсэн оролт |
| `Badge` | `label`, `tone?` | tone: primary\|success\|danger\|warning\|neutral |
| `Avatar` | `uri?`, `name?`, `size?` | Зураг эсвэл эхний үсэг |
| `Row` | `gap?`, `align?`, `justify?` | Хэвтээ layout |
| `Divider` | `style` | Тусгаарлах шугам |
| `ListItem` | `title`, `subtitle?`, `right?`, `onPress?` | Жагсаалтын мөр |
| `Tabs` | `tabs`, `active`, `onChange` | Доод navigation. tabs=[{key,label,icon?}] |
| `useTabs(initial)` | — | `{ active, setActive }` (navigation library хэрэггүй) |
| `Chip` | `label`, `selected?`, `onPress?` | Сонгож болох таг (filter) |
| `Switch` | `value`, `onValueChange` | Асаах/унтраах |
| `Progress` | `value` (0..1), `tone?` | Явцын мөр |
| `Spinner` | `size?`, `color?` | Ачаалж байна (ActivityIndicator) |
| `Section` | `title?` | Гарчигтай бүлэг wrapper |
| `IconButton` | `icon`, `onPress`, `size?` | Дугуй товч (emoji/icon) |
| `EmptyState` | `icon?`, `title?`, `subtitle?`, `action?` | Хоосон төлөв |
| `Modal` | `visible`, `onClose`, `title?` | Гарч ирэх цонх (backdrop дарахад хаагдана) |
| `theme` | — | Өнгө/зай/radius токенууд (апп өөрчилж болно) |

## Theme токенууд

```ts
theme.colors: bg, surface, surfaceAlt, border, text, muted,
              primary, onPrimary, success, danger, warning
theme.space:  xs(4) sm(8) md(12) lg(16) xl(24) xxl(32)
theme.radius: sm(8) md(12) lg(16) pill(999)
theme.font:   sm(13) md(15) lg(18) xl(24) xxl(30)
```

Апп өөрийн загвартай хослуулж болно (StyleSheet-ээр override).

## AI prompt-д өгөх зөвлөмж (app.kodu.live)

- "Компонентуудыг `./ui`-аас import хий: Screen, Header, Title, Button, Card,
  Badge, Input, ListItem, Tabs, useTabs..."
- "Навигацийг `useTabs` + `Tabs`-ээр хий (navigation library битгий ашигла)"
- "Өнгө/зайг `theme` токеноор ав"
- "Зөвхөн `react`, `react-native`, `./ui`-аас import хий"

## ⚠️ Export-д (татаж авах Expo project)

Component kit нь цэвэр `react-native` тул export-д мөн ажиллана — гэхдээ
**`src/ui/` фолдерыг export-д хамт оруулах ёстой** (эс бол import алдаа өгнө).
Апп-ын код `./ui`-аас import хийдэг тул тэр файл дагалдах ёстой.

## Дараагийн боломж

- Илүү олон компонент (Modal, Switch, Progress, Chip, EmptyState)
- Гэрэл/бараан theme сонголт
- Tamagui / NativeWind spike (илүү баялаг DX хүсвэл — preview=export эхлээд батлана)
