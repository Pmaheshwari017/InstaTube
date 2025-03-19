import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const ThemeToggleButton = ({ theme, toggleTheme }) => {
  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleButton}>
      <Text style={styles.themeToggleText}>
        Switch to {theme === "light" ? "Dark" : "Light"} Mode
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  themeToggleButton: {
    marginRight: 16,
    padding: 8,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  themeToggleText: {
    color: "#fff",
    fontSize: 14,
  },
});

export default ThemeToggleButton;
