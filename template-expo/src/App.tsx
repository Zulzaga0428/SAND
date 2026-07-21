// Анхны демо — хэрэглэгчийн App.tsx үүнийг дарж бичнэ.
// ThemeProvider (base + accent) + theme toggle жишээ.
import {
  ThemeProvider,
  useThemeToggle,
  Screen,
  Header,
  Title,
  Body,
  Muted,
  Button,
  Card,
  Badge,
  Row,
  IconButton,
  Tabs,
  useTabs,
} from "./ui";

export default function App() {
  const { base, toggle } = useThemeToggle("dark");
  return (
    <ThemeProvider base={base} accent="#6d5efc">
      <Screen padded={false}>
        <Header
          title="Kodu App Kit 🐳"
          right={<IconButton icon={base === "dark" ? "🌙" : "☀️"} onPress={toggle} size={38} />}
        />
        <Screen scroll>
          <Title>Сайн уу!</Title>
          <Muted>ThemeProvider: base + accent. Дээд товчоор dark/light сэлгэнэ.</Muted>

          <Card style={{ marginTop: 16 }}>
            <Row justify="space-between">
              <Body>Бууз</Body>
              <Badge label="₮12,000" />
            </Row>
          </Card>

          <Button title="Захиалах" onPress={() => {}} style={{ marginTop: 16 }} />
          <Button title="Цэс үзэх" variant="secondary" onPress={() => {}} style={{ marginTop: 8 }} />
        </Screen>
        <Tabs
          active={useTabs("home").active}
          onChange={() => {}}
          tabs={[
            { key: "home", label: "Нүүр", icon: "🏠" },
            { key: "menu", label: "Цэс", icon: "🍽️" },
          ]}
        />
      </Screen>
    </ThemeProvider>
  );
}
