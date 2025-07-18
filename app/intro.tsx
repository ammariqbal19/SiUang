import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function IntroScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/"); // 🔥 penting: jangan pakai "/index"
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Pembukaan (2).png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.logo}>SiUang</Text>
      <Text style={styles.desc}>Sistem Informasi Keuangan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2e2f2f",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    fontStyle: "italic",
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: "#fff",
    position: "absolute",
    bottom: 20,
  },
});
