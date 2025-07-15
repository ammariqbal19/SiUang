// File: app/index.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";

// Interface untuk tipe data transaksi
interface Transaction {
  id: string;
  tanggal: string; // Format YYYY-MM-DD
  kategori: string;
  jumlah: number;
  keterangan: string;
  isIncome: boolean;
}

// Interface untuk data yang diagregasi per minggu
interface WeeklySummary {
  weekNumber: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
}

// Interface baru untuk data yang diagregasi per bulan
interface MonthlySummary {
  month: number; // 0-11
  year: number;
  totalIncome: number;
  totalExpense: number;
}

// Interface baru untuk data yang diagregasi per tahun
interface YearlySummary {
  year: number;
  totalIncome: number;
  totalExpense: number;
}

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isIncome, setIsIncome] = useState(true);
  const [tanggal, setTanggal] = useState("");
  const [kategori, setKategori] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [data, setData] = useState<Transaction[]>([]); // Menyimpan SEMUA transaksi (riwayat harian)
  const [activeTab, setActiveTab] = useState<"Harian" | "Mingguan" | "Bulanan" | "Tahunan">("Harian");

  // State untuk tanggal saat ini yang ditampilkan di header
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // --- State baru untuk modal ekspor ---
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportTitle, setExportTitle] = useState("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportCategory, setExportCategory] = useState("");
  const [exportFormat, setExportFormat] = useState(""); // Contoh: PDF, CSV, Excel
  // ------------------------------------

  // Fungsi untuk mendapatkan nama bulan
  const getMonthName = (monthIndex: number) => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[monthIndex];
  };

  // Fungsi untuk navigasi bulan di header
  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (direction === "prev") {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleSave = () => {
    // Validasi input
    if (!tanggal || !jumlah || isNaN(parseFloat(jumlah))) {
      Alert.alert("Error", "Tanggal dan jumlah harus diisi dengan benar.");
      return;
    }

    const newData: Transaction = {
      id: Date.now().toString(),
      tanggal,
      kategori,
      jumlah: parseFloat(jumlah),
      keterangan,
      isIncome,
    };
    setData(prevData => [newData, ...prevData]); // Tambahkan data baru ke awal array
    setModalVisible(false);
    // Reset form
    setTanggal("");
    setKategori("");
    setJumlah("");
    setKeterangan("");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Hapus Transaksi", "Yakin ingin menghapus transaksi ini?", [
      { text: "Batal" },
      {
        text: "Hapus",
        onPress: () => {
          setData(prev => prev.filter(item => item.id !== id));
        },
        style: "destructive",
      },
    ]);
  };

  // Fungsi untuk Menghitung Nomor Minggu
  const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    return weekNo;
  };

  // Fungsi untuk memfilter data berdasarkan tab aktif dan bulan/tahun di header
  const filterDataByTab = (dataToFilter: Transaction[]) => {
    const today = new Date();
    const currentRealDay = today.getDate();
    const currentRealMonth = today.getMonth();
    const currentRealYear = today.getFullYear();

    switch (activeTab) {
      case "Harian":
        // Filter untuk hari ini (real time)
        return dataToFilter.filter(item => {
          const itemDate = new Date(item.tanggal);
          return (
            itemDate.getDate() === currentRealDay &&
            itemDate.getMonth() === currentRealMonth &&
            itemDate.getFullYear() === currentRealYear
          );
        });
      case "Mingguan":
        // Untuk tab mingguan, kita perlu mengambil semua transaksi dalam TAHUN yang sedang dipilih di header
        // dan kemudian mengelompokkannya per minggu.
        return dataToFilter.filter(item => {
          const itemDate = new Date(item.tanggal);
          return itemDate.getFullYear() === currentYear; // Filter hanya transaksi di tahun yang aktif
        });
      case "Bulanan":
        // Untuk tab bulanan, kita perlu mengambil semua transaksi dalam TAHUN yang sedang dipilih di header
        // dan kemudian mengelompokkannya per bulan.
        return dataToFilter.filter(item => {
          const itemDate = new Date(item.tanggal);
          return itemDate.getFullYear() === currentYear; // Filter hanya transaksi di tahun yang aktif
        });
      case "Tahunan":
        // Untuk tab tahunan, kita perlu mengambil semua transaksi secara keseluruhan
        // dan kemudian mengelompokkannya per tahun.
        return dataToFilter; // Mengembalikan semua data untuk agregasi tahunan
      default:
        return dataToFilter; // Harusnya tidak pernah tercapai
    }
  };

  const allFilteredData = filterDataByTab(data); // Ini adalah semua data yang relevan dengan tab aktif

  // Logika Pengelompokan dan Agregasi untuk Mingguan
  const getWeeklySummaries = (transactions: Transaction[]): WeeklySummary[] => {
    const weeklyMap = new Map<string, WeeklySummary>();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.tanggal);
      const weekNumber = getWeekNumber(transactionDate);
      const year = transactionDate.getFullYear();
      const key = `${year}-${weekNumber}`; // Kunci unik untuk setiap minggu

      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, { weekNumber, year, totalIncome: 0, totalExpense: 0 });
      }

      const summary = weeklyMap.get(key)!;
      if (transaction.isIncome) {
        summary.totalIncome += transaction.jumlah;
      } else {
        summary.totalExpense += transaction.jumlah;
      }
    });

    // Konversi Map ke array dan urutkan berdasarkan nomor minggu terbaru
    return Array.from(weeklyMap.values()).sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year; // Urutkan dari tahun terbaru
        return b.weekNumber - a.weekNumber; // Kemudian dari minggu terbaru
    });
  };

  const weeklySummaries = activeTab === "Mingguan" ? getWeeklySummaries(allFilteredData) : [];

  // Logika Pengelompokan dan Agregasi untuk Bulanan
  const getMonthlySummaries = (transactions: Transaction[]): MonthlySummary[] => {
    const monthlyMap = new Map<string, MonthlySummary>();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.tanggal);
      const month = transactionDate.getMonth();
      const year = transactionDate.getFullYear();
      const key = `${year}-${month}`; // Kunci unik untuk setiap bulan

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { month, year, totalIncome: 0, totalExpense: 0 });
      }

      const summary = monthlyMap.get(key)!;
      if (transaction.isIncome) {
        summary.totalIncome += transaction.jumlah;
      } else {
        summary.totalExpense += transaction.jumlah;
      }
    });

    // Konversi Map ke array dan urutkan berdasarkan bulan terbaru
    return Array.from(monthlyMap.values()).sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year; // Urutkan dari tahun terbaru
        return b.month - a.month; // Kemudian dari bulan terbaru
    });
  };

  const monthlySummaries = activeTab === "Bulanan" ? getMonthlySummaries(allFilteredData) : [];

  // Logika Pengelompokan dan Agregasi untuk Tahunan
  const getYearlySummaries = (transactions: Transaction[]): YearlySummary[] => {
    const yearlyMap = new Map<string, YearlySummary>();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.tanggal);
      const year = transactionDate.getFullYear();
      const key = `${year}`; // Kunci unik untuk setiap tahun

      if (!yearlyMap.has(key)) {
        yearlyMap.set(key, { year, totalIncome: 0, totalExpense: 0 });
      }

      const summary = yearlyMap.get(key)!;
      if (transaction.isIncome) {
        summary.totalIncome += transaction.jumlah;
      } else {
        summary.totalExpense += transaction.jumlah;
      }
    });

    // Konversi Map ke array dan urutkan berdasarkan tahun terbaru
    return Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year);
  };

  const yearlySummaries = activeTab === "Tahunan" ? getYearlySummaries(allFilteredData) : [];


  // Perhitungan totalIncome, totalExpense, dan saldo akan tergantung pada `activeTab`
  let totalIncomeDisplay = 0;
  let totalExpenseDisplay = 0;

  if (activeTab === "Mingguan") {
    totalIncomeDisplay = weeklySummaries.reduce((acc, curr) => acc + curr.totalIncome, 0);
    totalExpenseDisplay = weeklySummaries.reduce((acc, curr) => acc + curr.totalExpense, 0);
  } else if (activeTab === "Bulanan") {
    totalIncomeDisplay = monthlySummaries.reduce((acc, curr) => acc + curr.totalIncome, 0);
    totalExpenseDisplay = monthlySummaries.reduce((acc, curr) => acc + curr.totalExpense, 0);
  } else if (activeTab === "Tahunan") {
    totalIncomeDisplay = yearlySummaries.reduce((acc, curr) => acc + curr.totalIncome, 0);
    totalExpenseDisplay = yearlySummaries.reduce((acc, curr) => acc + curr.totalExpense, 0);
  }
  else { // Harian
    totalIncomeDisplay = allFilteredData.filter(i => i.isIncome).reduce((a, b) => a + b.jumlah, 0);
    totalExpenseDisplay = allFilteredData.filter(i => !i.isIncome).reduce((a, b) => a + b.jumlah, 0);
  }

  const saldo = totalIncomeDisplay - totalExpenseDisplay;

  // --- Fungsi untuk menangani ekspor data ---
  const handleExport = () => {
    if (!exportStartDate || !exportEndDate) {
      Alert.alert("Error", "Rentang tanggal harus diisi.");
      return;
    }

    const startDate = new Date(exportStartDate);
    const endDate = new Date(exportEndDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      Alert.alert("Error", "Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
      return;
    }

    // Filter data berdasarkan rentang tanggal yang dipilih
    const dataToExport = data.filter(item => {
      const itemDate = new Date(item.tanggal);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Filter berdasarkan kategori jika diisi
    const finalExportData = exportCategory
      ? dataToExport.filter(item => item.kategori.toLowerCase().includes(exportCategory.toLowerCase()))
      : dataToExport;

    // Simulasikan proses ekspor
    if (finalExportData.length > 0) {
      Alert.alert(
        "Ekspor Berhasil",
        `Berhasil mengekspor ${finalExportData.length} transaksi.\n` +
        `Judul: ${exportTitle || 'Tidak ada'}\n` +
        `Rentang: ${exportStartDate} hingga ${exportEndDate}\n` +
        `Kategori: ${exportCategory || 'Semua'}\n` +
        `Format: ${exportFormat || 'Tidak ditentukan'}`
      );
      // Di sini Anda akan mengimplementasikan logika ekspor sebenarnya,
      // misalnya, membuat file CSV/PDF dan menyimpannya.
    } else {
      Alert.alert("Ekspor Gagal", "Tidak ada transaksi yang ditemukan untuk kriteria yang dipilih.");
    }

    // Reset form ekspor dan tutup modal
    setExportTitle("");
    setExportStartDate("");
    setExportEndDate("");
    setExportCategory("");
    setExportFormat("");
    setExportModalVisible(false);
  };
  // ------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>SiUang</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navigateMonth("prev")}>
            <Entypo name="chevron-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{`${getMonthName(currentMonth)} ${currentYear}`}</Text>
          <TouchableOpacity onPress={() => navigateMonth("next")}>
            <Entypo name="chevron-right" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.icons}>
          {/* Tombol ikon unduh untuk membuka modal ekspor */}
          <TouchableOpacity onPress={() => setExportModalVisible(true)}>
            <MaterialIcons name="file-download" size={20} color="white" style={styles.icon} />
          </TouchableOpacity>
          <MaterialIcons name="tune" size={20} color="white" style={styles.icon} />
          <FontAwesome name="user" size={20} color="white" style={styles.icon} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["Harian", "Mingguan", "Bulanan", "Tahunan"].map((tabName) => (
          <TouchableOpacity
            key={tabName}
            onPress={() => setActiveTab(tabName as "Harian" | "Mingguan" | "Bulanan" | "Tahunan")}
            style={[
              styles.tab,
              activeTab === tabName ? styles.activeTab : null,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tabName ? styles.activeTabText : null,
              ]}
            >
              {tabName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Pemasukan</Text>
          <Text style={styles.income}>{`Rp. ${totalIncomeDisplay.toLocaleString()}`}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Pengeluaran</Text>
          <Text style={styles.expense}>{`Rp. ${totalExpenseDisplay.toLocaleString()}`}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Saldo</Text>
          <Text style={styles.balance}>{`Rp. ${saldo.toLocaleString()}`}</Text>
        </View>
      </View>

      {/* Daftar Transaksi / Ringkasan */}
      {activeTab === "Harian" ? ( // Perbaiki urutan kondisi agar Harian selalu terakhir jika tidak ada tab lain yang cocok
        <FlatList
          data={allFilteredData} // Gunakan data yang sudah difilter
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => handleDelete(item.id)}
              style={styles.transactionBox}
            >
              <View style={styles.dateBox}>
                <Text style={styles.dateNumber}>{new Date(item.tanggal).getDate()}</Text>
                <View>
                  <Text style={styles.dateMonth}>{getMonthName(new Date(item.tanggal).getMonth())} {new Date(item.tanggal).getFullYear()}</Text>
                  <Text style={styles.dateDay}>{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })}</Text>
                </View>
              </View>
              <View style={styles.transactionDetails}>
                {item.isIncome ? (
                  <Text style={styles.income}>{`Rp. ${item.jumlah.toLocaleString()}`}</Text>
                ) : (
                  <Text style={styles.expense}>{`Rp. ${item.jumlah.toLocaleString()}`}</Text>
                )}
                <Text style={{ color: 'white' }}>Catatan : {item.keterangan}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 20 }}>
              Belum ada transaksi untuk periode ini.
            </Text>
          }
        />
      ) : activeTab === "Mingguan" ? (
        <FlatList
          data={weeklySummaries}
          keyExtractor={item => `${item.year}-${item.weekNumber}`}
          renderItem={({ item }) => (
            <View style={styles.summaryItemBox}>
              <Text style={styles.summaryItemText}>{`Minggu ${item.weekNumber}`}</Text>
              <View style={styles.summaryAmountsContainer}>
                <Text style={[styles.income, styles.summaryAmount]}>{`Rp. ${item.totalIncome.toLocaleString()}`}</Text>
                <Text style={[styles.expense, styles.summaryAmount]}>{`Rp. ${item.totalExpense.toLocaleString()}`}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 20 }}>
              Belum ada transaksi untuk minggu di tahun ini.
            </Text>
          }
        />
      ) : activeTab === "Bulanan" ? (
        <FlatList
          data={monthlySummaries}
          keyExtractor={item => `${item.year}-${item.month}`}
          renderItem={({ item }) => (
            <View style={styles.summaryItemBox}>
              <Text style={styles.summaryItemText}>{getMonthName(item.month)}</Text>
              <View style={styles.summaryAmountsContainer}>
                <Text style={[styles.income, styles.summaryAmount]}>{`Rp. ${item.totalIncome.toLocaleString()}`}</Text>
                <Text style={[styles.expense, styles.summaryAmount]}>{`Rp. ${item.totalExpense.toLocaleString()}`}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 20 }}>
              Belum ada transaksi untuk bulan di tahun ini.
            </Text>
          }
        />
      ) : activeTab === "Tahunan" ? (
        <FlatList
          data={yearlySummaries}
          keyExtractor={item => `${item.year}`}
          renderItem={({ item }) => (
            <View style={styles.summaryItemBox}>
              <Text style={styles.summaryItemText}>{`${item.year}`}</Text>
              <View style={styles.summaryAmountsContainer}>
                <Text style={[styles.income, styles.summaryAmount]}>{`Rp. ${item.totalIncome.toLocaleString()}`}</Text>
                <Text style={[styles.expense, styles.summaryAmount]}>{`Rp. ${item.totalExpense.toLocaleString()}`}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 20 }}>
              Belum ada transaksi untuk tahun ini.
            </Text>
          }
        />
      ) : null} {/* Tambahkan null jika tidak ada tab yang cocok */}


      {/* Tombol Tambah */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Form Input Modal Transaksi */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setIsIncome(false)}
                style={[styles.switchTab, { backgroundColor: !isIncome ? 'red' : '#555' }]}
              >
                <Text style={{ color: !isIncome ? 'white' : 'white' }}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsIncome(true)}
                style={[styles.switchTab, { backgroundColor: isIncome ? 'green' : '#555' }]}
              >
                <Text style={{ color: isIncome ? 'white' : 'white' }}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Tanggal (YYYY-MM-DD)"
              placeholderTextColor="#999"
              style={styles.input}
              value={tanggal}
              onChangeText={setTanggal}
            />
            <TextInput
              placeholder="Kategori"
              placeholderTextColor="#999"
              style={styles.input}
              value={kategori}
              onChangeText={setKategori}
            />
            <TextInput
              placeholder="Jumlah"
              placeholderTextColor="#999"
              style={styles.input}
              value={jumlah}
              onChangeText={setJumlah}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Keterangan"
              placeholderTextColor="#999"
              style={styles.input}
              value={keterangan}
              onChangeText={setKeterangan}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={{ color: 'white' }}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={{ color: 'white' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ekspor Data */}
      <Modal visible={exportModalVisible} transparent animationType="slide">
        <View style={styles.exportModalContainer}>
          <View style={styles.exportModalContent}>
            <View style={styles.exportModalHeader}>
              <Text style={styles.exportModalHeaderText}>EKSPOR</Text>
            </View>

            <TextInput
              placeholder="Judul"
              placeholderTextColor="#999"
              style={styles.exportInput}
              value={exportTitle}
              onChangeText={setExportTitle}
            />
            <TextInput
              placeholder="Rentang Tanggal Mulai (YYYY-MM-DD)"
              placeholderTextColor="#999"
              style={styles.exportInput}
              value={exportStartDate}
              onChangeText={setExportStartDate}
            />
            <TextInput
              placeholder="Rentang Tanggal Akhir (YYYY-MM-DD)"
              placeholderTextColor="#999"
              style={styles.exportInput}
              value={exportEndDate}
              onChangeText={setExportEndDate}
            />
            <TextInput
              placeholder="Kategori (Opsional)"
              placeholderTextColor="#999"
              style={styles.exportInput}
              value={exportCategory}
              onChangeText={setExportCategory}
            />
            <TextInput
              placeholder="Format (Contoh: PDF, CSV, Excel)"
              placeholderTextColor="#999"
              style={styles.exportInput}
              value={exportFormat}
              onChangeText={setExportFormat}
            />

            <View style={styles.exportButtonContainer}>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={styles.exportCancelButton}
              >
                <Text style={styles.exportButtonText}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                style={styles.exportButton}
              >
                <Text style={styles.exportButtonText}>EKSPOR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e1e1e", paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoText: { fontSize: 24, fontWeight: "bold", color: "#FFD700", fontStyle: "italic" },
  monthNav: { flexDirection: "row", alignItems: "center" },
  monthText: { color: "white", marginHorizontal: 8 },
  icons: { flexDirection: "row" },
  icon: { marginLeft: 12 },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    backgroundColor: "#333",
    padding: 5,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#007bff",
  },
  tabText: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  activeTabText: {
    color: "white",
  },
  summaryContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 30 },
  summaryBox: { alignItems: "center" },
  label: { color: "white", marginBottom: 4 },
  income: { color: "#00ff00", fontWeight: "bold" },
  expense: { color: "#ff0000", fontWeight: "bold" },
  balance: { color: "#00ff00", fontWeight: "bold" },
  transactionBox: { flexDirection: "row", backgroundColor: '#3a3a3a', borderRadius: 8, padding: 10, marginTop: 16, justifyContent: 'space-between', alignItems: 'center' },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 10,
  },
  dateNumber: { fontSize: 24, fontWeight: 'bold', color: 'white', marginRight: 12 },
  dateMonth: { color: 'white' },
  dateDay: { color: 'white', fontStyle: 'italic' },
  transactionDetails: { justifyContent: 'center', flex: 1 },
  fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: "#00aa00", width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#2c2c2c', padding: 20, borderRadius: 10, width: '85%' },
  input: { backgroundColor: '#444', borderRadius: 6, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 12, color: 'white' },
  saveButton: { backgroundColor: '#008800', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 8 },
  cancelButton: { backgroundColor: '#cc0000', padding: 10, borderRadius: 5, alignItems: 'center' },
  switchTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },

  // Gaya untuk item ringkasan (digunakan untuk Mingguan, Bulanan, Tahunan)
  summaryItemBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 15,
    marginTop: 16,
  },
  summaryItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1, // Memastikan teks nama periode mengambil ruang yang tersedia
  },
  summaryAmountsContainer: {
    flexDirection: 'row', // Agar pemasukan dan pengeluaran sejajar horizontal
    alignItems: 'center',
  },
  summaryAmount: {
    width: 90, // Lebar tetap untuk angka, sesuaikan jika perlu
    textAlign: 'right', // Rata kanan untuk angka
    fontSize: 14, // Ukuran font sedikit lebih kecil agar muat
  },

  // --- Gaya Baru untuk Modal Ekspor ---
  exportModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  exportModalContent: {
    backgroundColor: '#2c2c2c', // Warna latar belakang modal
    borderRadius: 10,
    width: '85%',
    overflow: 'hidden', // Penting untuk memastikan header bulat
  },
  exportModalHeader: {
    backgroundColor: '#00aa00', // Warna hijau untuk header
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  exportModalHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportInput: {
    backgroundColor: '#444', // Warna input yang lebih gelap dari latar belakang modal
    borderRadius: 6,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: 'white',
    marginHorizontal: 20, // Jarak dari sisi modal
  },
  exportButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exportButton: {
    backgroundColor: '#00aa00', // Warna hijau untuk tombol Ekspor
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  exportCancelButton: {
    backgroundColor: '#cc0000', // Warna merah untuk tombol Batal
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
