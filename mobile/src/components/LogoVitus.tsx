import React from "react";
import { Image, StyleSheet } from "react-native";

export default function LogoVitus({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/icon.png")}
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: size * 0.24 },
      ]}
      resizeMode="contain"
      accessibilityLabel="Vitus"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: "center",
    backgroundColor: "#fefeff",
    marginBottom: 12,
  },
});
