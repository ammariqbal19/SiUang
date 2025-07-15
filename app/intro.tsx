// File: app/intro.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function IntroScreen() {
  const router = useRouter();

  useEffect(() => {
    // Log untuk memeriksa apakah komponen ini dimuat
    console.log('IntroScreen dimuat!');

    // Setelah 3 detik, navigasi ke halaman utama
    const timer = setTimeout(() => {
      // Menggunakan '/' untuk menavigasi ke halaman utama (app/index.tsx)
      router.replace('/');
    }, 3000); // Durasi 3 detik

    // Membersihkan timer jika komponen di-unmount sebelum waktu habis
    return () => {
      console.log('IntroScreen di-unmount!');
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Gambar Pembukaan (2).png */}
      <Text style={styles.logoText}>SiUang</Text>
      <Text style={styles.subText}>Sistem Informasi Keuangan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2c', // Warna latar belakang sesuai desain Pembukaan (1).png
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    fontStyle: 'italic', // Jika ingin tampilan italic seperti desain
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#ccc', // Warna abu-abu muda
    position: 'absolute', // Atur posisi ke bawah
    bottom: 50, // Jarak dari bawah
  },
});
