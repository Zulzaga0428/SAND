// main.jsx — entry. Хэрэглэгчийн App.tsx-ийг ачаалж, root дээр байрлуулна.
import { AppRegistry, Alert } from "react-native";
import App from "./App";

// ⚠️ react-native-web дээр Alert.alert ажилладаггүй (no-op). Апп-ууд түгээмэл
// ашигладаг тул browser-ийн alert/confirm-оор polyfill хийнэ — жинхэнэ dialog гарна.
Alert.alert = (title, message, buttons) => {
  const text = [title, message].filter(Boolean).join("\n\n");
  if (Array.isArray(buttons) && buttons.length > 1) {
    const confirmed = window.confirm(text);
    const btn = confirmed
      ? buttons.find((b) => b.style !== "cancel") || buttons[buttons.length - 1]
      : buttons.find((b) => b.style === "cancel") || buttons[0];
    if (btn && typeof btn.onPress === "function") btn.onPress();
  } else {
    window.alert(text);
    const btn = Array.isArray(buttons) && buttons[0];
    if (btn && typeof btn.onPress === "function") btn.onPress();
  }
};

AppRegistry.registerComponent("KoduApp", () => App);
AppRegistry.runApplication("KoduApp", {
  rootTag: document.getElementById("root"),
});
