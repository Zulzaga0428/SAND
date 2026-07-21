// ui/index.tsx — Kodu App component kit (цэвэр StyleSheet, react + react-native).
// -----------------------------------------------------------------------------
// Preview (Vite/RNW) болон export (Expo/Metro) ХОЁУЛАНД ижил ажиллана —
// зөвхөн react-native ашигладаг, build-tool-оос хамааралгүй. Install хэрэггүй
// (template image-д prebake хийсэн). Хэрэглэгчийн App.tsx-ээс:
//   import { Screen, Title, Button, Card } from "./ui";
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
  Switch as RNSwitch,
  ActivityIndicator,
} from "react-native";

// ── Theme (design tokens) — апп өөрчилж болно ───────────────────────────────
export const theme = {
  colors: {
    bg: "#0b1020",
    surface: "#131a2e",
    surfaceAlt: "#1a2238",
    border: "#26304c",
    text: "#e6e9f2",
    muted: "#8b93a7",
    primary: "#6d5efc",
    onPrimary: "#ffffff",
    success: "#35d07f",
    danger: "#ff5566",
    warning: "#ffb020",
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  font: { sm: 13, md: 15, lg: 18, xl: 24, xxl: 30 },
};
const t = theme;

const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 4, // Android (export)
};

// ── Layout ──────────────────────────────────────────────────────────────────
export function Screen({ children, style, scroll = false, padded = true }) {
  const inner = (
    <View style={[padded && { padding: t.space.lg }, style]}>{children}</View>
  );
  return (
    <View style={s.screen}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false}>{inner}</ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

export function Row({ children, style, gap = t.space.md, align = "center", justify }) {
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: align, gap },
        justify && { justifyContent: justify },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[s.divider, style]} />;
}

// ── Typography ────────────────────────────────────────────────────────────
export function Title({ children, style }) {
  return <Text style={[s.title, style]}>{children}</Text>;
}
export function Subtitle({ children, style }) {
  return <Text style={[s.subtitle, style]}>{children}</Text>;
}
export function Body({ children, style }) {
  return <Text style={[s.body, style]}>{children}</Text>;
}
export function Muted({ children, style }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

// ── Button (variant: primary | secondary | ghost | danger) ──────────────────
export function Button({ title, onPress, variant = "primary", size = "md", style, disabled }) {
  const v = {
    primary: { bg: t.colors.primary, fg: t.colors.onPrimary, bd: "transparent" },
    secondary: { bg: t.colors.surfaceAlt, fg: t.colors.text, bd: t.colors.border },
    ghost: { bg: "transparent", fg: t.colors.primary, bd: "transparent" },
    danger: { bg: t.colors.danger, fg: "#fff", bd: "transparent" },
  }[variant] || {};
  const pad = size === "sm" ? { paddingVertical: 8, paddingHorizontal: 14 } : { paddingVertical: 12, paddingHorizontal: 18 };
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        s.btn,
        pad,
        { backgroundColor: v.bg, borderColor: v.bd },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[s.btnText, { color: v.fg, fontSize: size === "sm" ? t.font.sm : t.font.md }]}>
        {title}
      </Text>
    </Pressable>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={[s.card, style]}>
      {children}
    </Comp>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ value, onChangeText, placeholder, style, ...rest }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={t.colors.muted}
      style={[s.input, style]}
      {...rest}
    />
  );
}

// ── Badge (tone: primary | success | danger | warning | neutral) ────────────
export function Badge({ label, tone = "primary", style }) {
  const bg = {
    primary: t.colors.primary,
    success: t.colors.success,
    danger: t.colors.danger,
    warning: t.colors.warning,
    neutral: t.colors.surfaceAlt,
  }[tone] || t.colors.primary;
  return (
    <View style={[s.badge, { backgroundColor: bg }, style]}>
      <Text style={s.badgeText}>{label}</Text>
    </View>
  );
}

// ── Avatar (зураг эсвэл эхний үсэг) ──────────────────────────────────────────
export function Avatar({ uri, name, size = 44 }) {
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: t.colors.onPrimary, fontWeight: "700" }}>{initials}</Text>
    </View>
  );
}

// ── Header (дээд самбар) ─────────────────────────────────────────────────────
export function Header({ title, right }) {
  return (
    <View style={s.header}>
      <Text style={s.headerTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ── ListItem ────────────────────────────────────────────────────────────────
export function ListItem({ title, subtitle, right, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.listItem, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>{title}</Text>
        {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

// ── Tabs (доод navigation) ──────────────────────────────────────────────────
// tabs = [{ key, label, icon? }], active, onChange
export function Tabs({ tabs, active, onChange }) {
  return (
    <View style={s.tabs}>
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={s.tab}>
            {tab.icon ? <Text style={{ fontSize: 18 }}>{tab.icon}</Text> : null}
            <Text style={[s.tabLabel, on && { color: t.colors.primary, fontWeight: "700" }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// useTabs — жижиг туслах (navigation library шаардлагагүй)
export function useTabs(initial) {
  const [active, setActive] = useState(initial);
  return { active, setActive };
}

// ── Chip (сонгож болох таг) ─────────────────────────────────────────────────
export function Chip({ label, selected, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        selected && { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Text style={[s.chipText, selected && { color: t.colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

// ── Switch (асаах/унтраах) ──────────────────────────────────────────────────
export function Switch({ value, onValueChange }) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: t.colors.border, true: t.colors.primary }}
      thumbColor="#fff"
    />
  );
}

// ── Progress (явцын мөр 0..1) ───────────────────────────────────────────────
export function Progress({ value = 0, tone = "primary", style }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color = t.colors[tone] || t.colors.primary;
  return (
    <View style={[s.progressTrack, style]}>
      <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

// ── Spinner (ачаалж байна) ──────────────────────────────────────────────────
export function Spinner({ size = "large", color = t.colors.primary, style }) {
  return <ActivityIndicator size={size} color={color} style={style} />;
}

// ── Section (гарчигтай бүлэг) ───────────────────────────────────────────────
export function Section({ title, children, style }) {
  return (
    <View style={[{ marginTop: t.space.xl }, style]}>
      {title ? <Text style={s.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

// ── IconButton (дугуй товч, emoji/icon) ─────────────────────────────────────
export function IconButton({ icon, onPress, size = 44, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.iconBtn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.42 }}>{icon}</Text>
    </Pressable>
  );
}

// ── EmptyState (хоосон төлөв) ───────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle, action }) {
  return (
    <View style={s.empty}>
      <Text style={{ fontSize: 44 }}>{icon}</Text>
      {title ? <Text style={[s.subtitle, { marginTop: t.space.md }]}>{title}</Text> : null}
      {subtitle ? <Text style={[s.muted, { marginTop: 4, textAlign: "center" }]}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: t.space.lg }}>{action}</View> : null}
    </View>
  );
}

// ── Modal (гарч ирэх цонх) ──────────────────────────────────────────────────
export function Modal({ visible, onClose, title, children }) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.modal} onPress={() => {}}>
          {title ? <Text style={[s.subtitle, { marginBottom: t.space.md }]}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.space.md },
  title: { color: t.colors.text, fontSize: t.font.xxl, fontWeight: "800" },
  subtitle: { color: t.colors.text, fontSize: t.font.lg, fontWeight: "700" },
  body: { color: t.colors.text, fontSize: t.font.md },
  muted: { color: t.colors.muted, fontSize: t.font.sm },
  btn: { borderRadius: t.radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnText: { fontWeight: "600" },
  card: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
    borderWidth: 1,
    borderRadius: t.radius.lg,
    padding: t.space.lg,
    ...shadow,
  },
  input: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
    borderWidth: 1,
    borderRadius: t.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: t.colors.text,
    fontSize: t.font.md,
  },
  badge: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: t.radius.pill },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  avatar: { backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
    backgroundColor: t.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  headerTitle: { color: t.colors.text, fontSize: t.font.lg, fontWeight: "700" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: t.space.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: t.colors.surface,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: t.space.md, gap: 2 },
  tabLabel: { color: t.colors.muted, fontSize: 12 },
  chip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: { color: t.colors.text, fontSize: t.font.sm, fontWeight: "600" },
  progressTrack: {
    height: 8,
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: t.radius.pill,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: t.radius.pill },
  sectionTitle: {
    color: t.colors.muted,
    fontSize: t.font.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: t.space.sm,
  },
  iconBtn: {
    backgroundColor: t.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", justifyContent: "center", padding: t.space.xxl },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: t.space.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
    borderWidth: 1,
    borderRadius: t.radius.lg,
    padding: t.space.xl,
    ...shadow,
  },
});
