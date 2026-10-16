import React, { useState } from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface InputFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  secureToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export default function InputField({
  label, error, secureToggle = false, showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password", secureTextEntry, ...props
}: InputFieldProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.control, focused && styles.controlFocused]}>
        <TextInput
          {...props}
          secureTextEntry={secureToggle ? !visible : secureTextEntry}
          accessibilityLabel={label}
          accessibilityHint={props.accessibilityHint}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
          style={styles.input}
          placeholderTextColor={colors.secondaryText}
        />
        {secureToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? hidePasswordLabel : showPasswordLabel}
            accessibilityState={{ selected: visible }}
            onPress={() => setVisible((shown) => !shown)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{visible ? hidePasswordLabel : showPasswordLabel}</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  field: { gap: 6 },
  label: { color: colors.navy, fontSize: 15, fontWeight: "700" },
  control: { minHeight: 52, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.white },
  controlFocused: { borderColor: colors.blue, borderWidth: 2 },
  input: { flex: 1, minHeight: 50, paddingHorizontal: 13, paddingVertical: 10, color: colors.text, fontSize: 16 },
  toggle: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  toggleText: { color: colors.blue, fontSize: 12, fontWeight: "800" },
  error: { color: colors.red, fontSize: 13, lineHeight: 18 },
}); }
