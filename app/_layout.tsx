import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // Untuk mengatur status bar

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" /> {/* Atur warna status bar, sesuaikan jika perlu */}
      <Stack
        // Menentukan 'intro' sebagai rute awal yang akan dimuat
        initialRouteName="intro"
      >
        {/* Halaman intro akan ditampilkan pertama kali */}
        <Stack.Screen
          name="intro" // Nama file 'intro.tsx'
          options={{
            headerShown: false, // Sembunyikan header untuk halaman intro
            animation: 'fade', // Opsi animasi transisi
          }}
        />
        {/* Halaman utama aplikasi Anda (index.tsx) */}
        <Stack.Screen
          name="index" // Nama file 'index.tsx'
          options={{
            headerShown: false, // Sembunyikan header jika Anda mengelola header sendiri di index.tsx
          }}
        />
        {/* Tambahkan rute lain di sini jika ada */}
      </Stack>
    </>
  );
}