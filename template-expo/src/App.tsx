// Анхны демо — хэрэглэгчийн App.tsx үүнийг дарж бичнэ.
// Component kit-ийн жишээ (./ui-аас import).
import {
  Screen,
  Header,
  Title,
  Body,
  Muted,
  Button,
  Card,
  Badge,
  Row,
  Tabs,
  useTabs,
} from "./ui";

export default function App() {
  const { active, setActive } = useTabs("home");
  return (
    <Screen padded={false}>
      <Header title="Kodu App Kit 🐳" right={<Badge label="demo" tone="success" />} />
      <Screen scroll>
        <Title>Сайн уу!</Title>
        <Muted>Component kit prebake хийгдсэн — import хийгээд шууд ашиглана.</Muted>

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
        active={active}
        onChange={setActive}
        tabs={[
          { key: "home", label: "Нүүр", icon: "🏠" },
          { key: "menu", label: "Цэс", icon: "🍽️" },
          { key: "cart", label: "Сагс", icon: "🛒" },
        ]}
      />
    </Screen>
  );
}
