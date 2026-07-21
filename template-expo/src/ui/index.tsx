// ui/index.tsx — Kodu App component kit (цэвэр StyleSheet, react + react-native).
// -----------------------------------------------------------------------------
// Preview (Vite/RNW) болон export (Expo/Metro) ХОЁУЛАНД ижил ажиллана.
// Install хэрэггүй (template image-д prebake). Хэрэглэгчийн App.tsx-ээс:
//   import { ThemeProvider, Screen, Button, Card } from "./ui";
//
// 🌙☀️ Theme: апп-аа ThemeProvider дотор ор:
//   <ThemeProvider base="dark" accent="#ff5566"> ...app... </ThemeProvider>
//   base:   "light" | "dark"   (default "dark")
//   accent: primary өнгө (заавал биш; өгвөл бүх компонент дагана)
//   Provider-гүй бол default dark. Товчоор сэлгэхэд useThemeToggle.
// -----------------------------------------------------------------------------
import { createContext, useContext, useMemo, useState } from "react";
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

// ── Palettes ────────────────────────────────────────────────────────────────
const darkColors = {
  bg: "#0b1020", surface: "#131a2e", surfaceAlt: "#1a2238", border: "#26304c",
  text: "#e6e9f2", muted: "#8b93a7", primary: "#6d5efc", onPrimary: "#ffffff",
  success: "#35d07f", danger: "#ff5566", warning: "#ffb020",
};
const lightColors = {
  bg: "#f6f7fb", surface: "#ffffff", surfaceAlt: "#eef1f7", border: "#e2e6ef",
  text: "#1a2238", muted: "#6b7280", primary: "#6d5efc", onPrimary: "#ffffff",
  success: "#1a9e63", danger: "#e0384f", warning: "#b8791a",
};
const tokens = {
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  font: { sm: 13, md: 15, lg: 18, xl: 24, xxl: 30 },
};

// base ("light"|"dark") + accent (заавал биш primary өнгө) → бүрэн theme
function makeTheme(base, accent) {
  const colors = { ...(base === "light" ? lightColors : darkColors) };
  if (accent) colors.primary = accent;
  colors.accent = colors.primary;
  return { mode: base === "light" ? "light" : "dark", colors, ...tokens };
}
export const darkTheme = makeTheme("dark");
export const lightTheme = makeTheme("light");
export const theme = darkTheme; // default (backward compat)

// ── Theme context ─────────────────────────────────────────────────────────
const ThemeContext = createContext(darkTheme);
export function ThemeProvider({ base = "dark", accent, children }) {
  const value = useMemo(() => makeTheme(base, accent), [base, accent]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);

// Товчоор dark/light сэлгэх туслах ({ base, setBase, toggle })
export function useThemeToggle(initial = "dark") {
  const [base, setBase] = useState(initial);
  return { base, setBase, toggle: () => setBase((b) => (b === "light" ? "dark" : "light")) };
}

// ── Styles (theme-ээс хамаарна) ─────────────────────────────────────────────
const shadow = {
  shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
};
function makeStyles(t) {
  const c = t.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    divider: { height: 1, backgroundColor: c.border, marginVertical: t.space.md },
    title: { color: c.text, fontSize: t.font.xxl, fontWeight: "800" },
    subtitle: { color: c.text, fontSize: t.font.lg, fontWeight: "700" },
    body: { color: c.text, fontSize: t.font.md },
    muted: { color: c.muted, fontSize: t.font.sm },
    btn: { borderRadius: t.radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    btnText: { fontWeight: "600" },
    card: {
      backgroundColor: c.surface, borderColor: c.border, borderWidth: 1,
      borderRadius: t.radius.lg, padding: t.space.lg, ...shadow,
    },
    input: {
      backgroundColor: c.surface, borderColor: c.border, borderWidth: 1,
      borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 14,
      color: c.text, fontSize: t.font.md,
    },
    badge: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: t.radius.pill },
    badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
    avatar: { backgroundColor: c.primary, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: t.space.lg, paddingVertical: t.space.md,
      backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    headerTitle: { color: c.text, fontSize: t.font.lg, fontWeight: "700" },
    listItem: {
      flexDirection: "row", alignItems: "center", paddingVertical: t.space.md,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    tabs: { flexDirection: "row", backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
    tab: { flex: 1, alignItems: "center", paddingVertical: t.space.md, gap: 2 },
    tabLabel: { color: c.muted, fontSize: 12 },
    chip: {
      alignSelf: "flex-start", borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, borderRadius: t.radius.pill, paddingVertical: 6, paddingHorizontal: 14,
    },
    chipText: { color: c.text, fontSize: t.font.sm, fontWeight: "600" },
    progressTrack: { height: 8, backgroundColor: c.surfaceAlt, borderRadius: t.radius.pill, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: t.radius.pill },
    sectionTitle: {
      color: c.muted, fontSize: t.font.sm, fontWeight: "700",
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: t.space.sm,
    },
    iconBtn: { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
    empty: { alignItems: "center", justifyContent: "center", padding: t.space.xxl },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: t.space.xl },
    modal: {
      width: "100%", maxWidth: 420, backgroundColor: c.surface,
      borderColor: c.border, borderWidth: 1, borderRadius: t.radius.lg, padding: t.space.xl, ...shadow,
    },
  });
}
// Компонентууд эндээс theme + styles-ээ авна
function useStyles() {
  const t = useTheme();
  return useMemo(() => makeStyles(t), [t]);
}

// ── Layout ──────────────────────────────────────────────────────────────────
export function Screen({ children, style, scroll = false, padded = true }) {
  const t = useTheme();
  const s = useStyles();
  const inner = <View style={[padded && { padding: t.space.lg }, style]}>{children}</View>;
  return (
    <View style={s.screen}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{inner}</ScrollView> : inner}
    </View>
  );
}

export function Row({ children, style, gap, align = "center", justify }) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: "row", alignItems: align, gap: gap ?? t.space.md }, justify && { justifyContent: justify }, style]}>
      {children}
    </View>
  );
}

export function Divider({ style }) {
  const s = useStyles();
  return <View style={[s.divider, style]} />;
}

// ── Typography ────────────────────────────────────────────────────────────
export function Title({ children, style }) {
  const s = useStyles();
  return <Text style={[s.title, style]}>{children}</Text>;
}
export function Subtitle({ children, style }) {
  const s = useStyles();
  return <Text style={[s.subtitle, style]}>{children}</Text>;
}
export function Body({ children, style }) {
  const s = useStyles();
  return <Text style={[s.body, style]}>{children}</Text>;
}
export function Muted({ children, style }) {
  const s = useStyles();
  return <Text style={[s.muted, style]}>{children}</Text>;
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ title, onPress, variant = "primary", size = "md", style, disabled }) {
  const t = useTheme();
  const s = useStyles();
  const c = t.colors;
  const v = {
    primary: { bg: c.primary, fg: c.onPrimary, bd: "transparent" },
    secondary: { bg: c.surfaceAlt, fg: c.text, bd: c.border },
    ghost: { bg: "transparent", fg: c.primary, bd: "transparent" },
    danger: { bg: c.danger, fg: "#fff", bd: "transparent" },
  }[variant] || {};
  const pad = size === "sm" ? { paddingVertical: 8, paddingHorizontal: 14 } : { paddingVertical: 12, paddingHorizontal: 18 };
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [s.btn, pad, { backgroundColor: v.bg, borderColor: v.bd }, pressed && { opacity: 0.85 }, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={[s.btnText, { color: v.fg, fontSize: size === "sm" ? t.font.sm : t.font.md }]}>{title}</Text>
    </Pressable>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const s = useStyles();
  const Comp = onPress ? Pressable : View;
  return <Comp onPress={onPress} style={[s.card, style]}>{children}</Comp>;
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ value, onChangeText, placeholder, style, ...rest }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={t.colors.muted} style={[s.input, style]} {...rest}
    />
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ label, tone = "primary", style }) {
  const t = useTheme();
  const s = useStyles();
  const c = t.colors;
  const bg = { primary: c.primary, success: c.success, danger: c.danger, warning: c.warning, neutral: c.surfaceAlt }[tone] || c.primary;
  return <View style={[s.badge, { backgroundColor: bg }, style]}><Text style={s.badgeText}>{label}</Text></View>;
}

// ── Avatar ────────────────────────────────────────────────────────────────
export function Avatar({ uri, name, size = 44 }) {
  const t = useTheme();
  const s = useStyles();
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: t.colors.onPrimary, fontWeight: "700" }}>{initials}</Text>
    </View>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
export function Header({ title, right }) {
  const s = useStyles();
  return <View style={s.header}><Text style={s.headerTitle}>{title}</Text>{right}</View>;
}

// ── ListItem ──────────────────────────────────────────────────────────────
export function ListItem({ title, subtitle, right, onPress }) {
  const s = useStyles();
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

// ── Tabs ──────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={s.tabs}>
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={s.tab}>
            {tab.icon ? <Text style={{ fontSize: 18 }}>{tab.icon}</Text> : null}
            <Text style={[s.tabLabel, on && { color: t.colors.primary, fontWeight: "700" }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export function useTabs(initial) {
  const [active, setActive] = useState(initial);
  return { active, setActive };
}

// ── Chip ──────────────────────────────────────────────────────────────────
export function Chip({ label, selected, onPress, style }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.chip, selected && { backgroundColor: t.colors.primary, borderColor: t.colors.primary }, pressed && { opacity: 0.8 }, style]}
    >
      <Text style={[s.chipText, selected && { color: t.colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

// ── Switch ──────────────────────────────────────────────────────────────────
export function Switch({ value, onValueChange }) {
  const t = useTheme();
  return <RNSwitch value={value} onValueChange={onValueChange} trackColor={{ false: t.colors.border, true: t.colors.primary }} thumbColor="#fff" />;
}

// ── Progress ────────────────────────────────────────────────────────────────
export function Progress({ value = 0, tone = "primary", style }) {
  const t = useTheme();
  const s = useStyles();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return <View style={[s.progressTrack, style]}><View style={[s.progressFill, { width: `${pct}%`, backgroundColor: t.colors[tone] || t.colors.primary }]} /></View>;
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = "large", color, style }) {
  const t = useTheme();
  return <ActivityIndicator size={size} color={color || t.colors.primary} style={style} />;
}

// ── Section ─────────────────────────────────────────────────────────────────
export function Section({ title, children, style }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={[{ marginTop: t.space.xl }, style]}>
      {title ? <Text style={s.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

// ── IconButton ──────────────────────────────────────────────────────────────
export function IconButton({ icon, onPress, size = 44, style }) {
  const s = useStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.iconBtn, { width: size, height: size, borderRadius: size / 2 }, pressed && { opacity: 0.7 }, style]}>
      <Text style={{ fontSize: size * 0.42 }}>{icon}</Text>
    </Pressable>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle, action }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={s.empty}>
      <Text style={{ fontSize: 44 }}>{icon}</Text>
      {title ? <Text style={[s.subtitle, { marginTop: t.space.md }]}>{title}</Text> : null}
      {subtitle ? <Text style={[s.muted, { marginTop: 4, textAlign: "center" }]}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: t.space.lg }}>{action}</View> : null}
    </View>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ visible, onClose, title, children }) {
  const t = useTheme();
  const s = useStyles();
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
