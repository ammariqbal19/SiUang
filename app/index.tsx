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
  // ActivityIndicator // Dihapus karena tidak ada proses loading ekspor nyata
} from "react-native";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";
// import Print from 'react-native-print'; // Dihapus: library untuk print (termasuk PDF)

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

  // State untuk transaksi yang sedang diedit
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // State untuk tanggal saat ini yang ditampilkan di header
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // --- State baru untuk modal ekspor ---
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportTitle, setExportTitle] = useState("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportCategory, setExportCategory] = useState("");
  const [exportFormat, setExportFormat] = useState(""); // Default kosong, bisa diisi manual
  const [isExporting, setIsExporting] = useState(false); // State untuk indikator loading ekspor (tetap ada untuk simulasi)
  // ------------------------------------

  // --- State baru untuk modal filter/sortir ---
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest'); // Default: terbaru
  // ---------------------------------------------

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

  // Fungsi untuk mengatur nilai input modal saat edit
  const setModalInputValues = (transaction: Transaction | null) => {
    if (transaction) {
      setTanggal(transaction.tanggal);
      setKategori(transaction.kategori);
      setJumlah(transaction.jumlah.toString());
      setKeterangan(transaction.keterangan);
      setIsIncome(transaction.isIncome);
    } else {
      // Reset input jika tidak ada transaksi yang diedit
      setTanggal("");
      setKategori("");
      setJumlah("");
      setKeterangan("");
      setIsIncome(true);
    }
  };

  // Fungsi untuk membuka modal dalam mode tambah atau edit
  const openTransactionModal = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction); // Set transaksi yang diedit (null untuk tambah baru)
    setModalInputValues(transaction); // Isi input modal
    setModalVisible(true); // Buka modal
  };

  // Fungsi untuk menutup modal dan mereset state
  const closeTransactionModal = () => {
    setModalVisible(false);
    setEditingTransaction(null); // Reset transaksi yang diedit
    setModalInputValues(null); // Reset input modal
  };

  // Fungsi untuk menyimpan atau memperbarui transaksi
  const handleSaveOrUpdate = () => {
    if (!tanggal || !jumlah || isNaN(parseFloat(jumlah))) {
      Alert.alert("Error", "Tanggal dan jumlah harus diisi dengan benar.");
      return;
    }

    const transactionData: Transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now().toString(), // Gunakan ID yang ada jika edit, atau buat baru
      tanggal,
      kategori,
      jumlah: parseFloat(jumlah),
      keterangan,
      isIncome,
    };

    if (editingTransaction) {
      // Perbarui transaksi yang ada
      setData(prevData =>
        prevData.map(item => (item.id === transactionData.id ? transactionData : item))
      );
      Alert.alert("Berhasil", "Transaksi berhasil diperbarui!");
    } else {
      // Tambahkan transaksi baru
      setData(prevData => [transactionData, ...prevData]);
      Alert.alert("Berhasil", "Transaksi berhasil ditambahkan!");
    }

    closeTransactionModal(); // Tutup modal dan reset
  };

  const handleDelete = (id: string) => {
    Alert.alert("Hapus Transaksi", "Yakin ingin menghapus transaksi ini?", [
      { text: "Batal" },
      {
        text: "Hapus",
        onPress: () => {
          setData(prev => prev.filter(item => item.id !== id));
          Alert.alert("Berhasil", "Transaksi berhasil dihapus!");
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
    const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) + 1) / 86400000) / 7);
    return weekNo;
  };

  // Fungsi untuk mendapatkan data harian yang sudah diurutkan
  const getSortedDailyTransactions = (dataToFilter: Transaction[]) => {
    return [...dataToFilter].sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
  };

  // Data yang akan ditampilkan di tab "Harian" setelah diurutkan
  const sortedDailyTransactions = getSortedDailyTransactions(data);

  // Logika Pengelompokan dan Agregasi untuk Mingguan (memproses SEMUA data dan diurutkan)
  const getWeeklySummaries = (transactions: Transaction[], currentSortOrder: 'latest' | 'oldest'): WeeklySummary[] => {
    const weeklyMap = new Map<string, WeeklySummary>();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.tanggal);
      const weekNumber = getWeekNumber(transactionDate);
      const year = transactionDate.getFullYear();
      const key = `${year}-${weekNumber}`;

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

    return Array.from(weeklyMap.values()).sort((a, b) => {
        if (currentSortOrder === 'latest') {
            if (b.year !== a.year) return b.year - a.year; // Urutkan dari tahun terbaru
            return b.weekNumber - a.weekNumber; // Kemudian dari minggu terbaru
        } else { // oldest
            if (a.year !== b.year) return a.year - b.year; // Urutkan dari tahun terlama
            return a.weekNumber - b.weekNumber; // Kemudian dari minggu terlama
        }
    });
  };

  // Panggil getWeeklySummaries dengan semua data dan sortOrder
  const weeklySummaries = getWeeklySummaries(data, sortOrder);

  // Logika Pengelompokan dan Agregasi untuk Bulanan (memproses SEMUA data dan diurutkan)
  const getMonthlySummaries = (transactions: Transaction[], currentSortOrder: 'latest' | 'oldest'): MonthlySummary[] => {
    const monthlyMap = new Map<string, MonthlySummary>();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.tanggal);
      const month = transactionDate.getMonth();
      const year = transactionDate.getFullYear();
      const key = `${year}-${month}`;

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

    return Array.from(monthlyMap.values()).sort((a, b) => {
        if (currentSortOrder === 'latest') {
            if (b.year !== a.year) return b.year - a.year; // Urutkan dari tahun terbaru
            return b.month - a.month; // Kemudian dari bulan terbaru
        } else { // oldest
            if (a.year !== b.year) return a.year - b.year; // Urutkan dari tahun terlama
            return a.month - b.month; // Kemudian dari bulan terlama
        }
    });
  };

  // Panggil getMonthlySummaries dengan semua data dan sortOrder
  const monthlySummaries = getMonthlySummaries(data, sortOrder);

  // Logika Pengelompokan dan Agregasi untuk Tahunan (memproses SEMUA data dan diurutkan)
  const getYearlySummaries = (transactions: Transaction[], currentSortOrder: 'latest' | 'oldest'): YearlySummary[] => {
    const yearlyMap = new Map<string, YearlySummary>();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.tanggal);
      const year = transactionDate.getFullYear();
      const key = `${year}`;

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

    return Array.from(yearlyMap.values()).sort((a, b) => {
        return currentSortOrder === 'latest' ? b.year - a.year : a.year - b.year; // Urutkan dari tahun terbaru atau terlama
    });
  };

  // Panggil getYearlySummaries dengan semua data dan sortOrder
  const yearlySummaries = getYearlySummaries(data, sortOrder);


  // Perhitungan totalIncome, totalExpense, dan saldo akan tergantung pada `activeTab`
  // dan juga pada tahun/bulan yang dipilih di header untuk tab ringkasan.
  let totalIncomeDisplay = 0;
  let totalExpenseDisplay = 0;

  // Filter ringkasan berdasarkan tahun/bulan yang aktif untuk tampilan di Summary Box
  // Perhatikan bahwa `weeklySummaries`, `monthlySummaries`, `yearlySummaries` sudah diurutkan berdasarkan `sortOrder`
  const filteredWeeklySummariesForDisplay = weeklySummaries.filter(summary => summary.year === currentYear);
  const filteredMonthlySummariesForDisplay = monthlySummaries.filter(summary => summary.year === currentYear && summary.month === currentMonth);
  const filteredYearlySummariesForDisplay = yearlySummaries; // Tahunan selalu menampilkan semua tahun

  if (activeTab === "Mingguan") {
    totalIncomeDisplay = filteredWeeklySummariesForDisplay.reduce((acc, curr) => acc + curr.totalIncome, 0);
    totalExpenseDisplay = filteredWeeklySummariesForDisplay.reduce((acc, curr) => acc + curr.totalExpense, 0);
  } else if (activeTab === "Bulanan") {
    totalIncomeDisplay = filteredMonthlySummariesForDisplay.reduce((acc, curr) => acc + curr.totalIncome, 0);
    totalExpenseDisplay = filteredMonthlySummariesForDisplay.reduce((acc, curr) => acc + curr.totalExpense, 0);
  } else if (activeTab === "Tahunan") {
    totalIncomeDisplay = filteredYearlySummariesForDisplay.reduce((acc, curr) => acc + curr.totalIncome, 0);
    totalExpenseDisplay = filteredYearlySummariesForDisplay.reduce((acc, curr) => acc + curr.totalExpense, 0);
  }
  else { // Harian
    // Untuk harian, kita menghitung total berdasarkan semua transaksi yang ada
    totalIncomeDisplay = data.filter(i => i.isIncome).reduce((a, b) => a + b.jumlah, 0);
    totalExpenseDisplay = data.filter(i => !i.isIncome).reduce((a, b) => a + b.jumlah, 0);
  }

  const saldo = totalIncomeDisplay - totalExpenseDisplay;

  // --- Fungsi untuk menangani ekspor data ---
  const handleExport = () => { // Menghilangkan 'async'
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

    setIsExporting(true); // Mulai loading (untuk simulasi)

    // Filter data berdasarkan rentang tanggal yang dipilih
    const dataToExport = data.filter(item => {
      const itemDate = new Date(item.tanggal);
      // Atur waktu ke awal hari untuk perbandingan yang akurat
      itemDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999); // Akhir hari untuk endDate
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Filter berdasarkan kategori jika diisi
    const finalExportData = exportCategory
      ? dataToExport.filter(item => item.kategori.toLowerCase().includes(exportCategory.toLowerCase()))
      : dataToExport;

    // Simulasikan proses ekspor
    if (finalExportData.length > 0) {
      Alert.alert(
        "Ekspor Berhasil (Simulasi)",
        `Berhasil mengekspor ${finalExportData.length} transaksi.\n` +
        `Judul: ${exportTitle || 'Tidak ada'}\n` +
        `Rentang: ${exportStartDate} hingga ${exportEndDate}\n` +
        `Kategori: ${exportCategory || 'Semua'}\n` +
        `Format: ${exportFormat || 'Tidak ditentukan'}\n\n` +
        `Catatan: Fungsi ekspor PDF yang sebenarnya memerlukan pembangunan aplikasi native.`
      );
    } else {
      Alert.alert("Ekspor Gagal (Simulasi)", "Tidak ada transaksi yang ditemukan untuk kriteria yang dipilih.");
    }

    // Menggunakan setTimeout untuk simulasi loading
    setTimeout(() => {
      setIsExporting(false); // Selesai loading
      // Reset form ekspor dan tutup modal
      setExportTitle("");
      setExportStartDate("");
      setExportEndDate("");
      setExportCategory("");
      setExportFormat(""); // Reset format
      setExportModalVisible(false);
    }, 1500); // Simulasi loading 1.5 detik
  };
  // ------------------------------------------

  // Gunakan useEffect untuk logging debugging
  useEffect(() => {
    // console.log("Current Sort Order:", sortOrder);
    // console.log("Sorted Daily Transactions (Harian):", sortedDailyTransactions.map(t => t.tanggal));
    // console.log("Weekly Summaries (Mingguan, sorted):", weeklySummaries.map(s => `${s.year}-W${s.weekNumber}`));
    // console.log("Monthly Summaries (Bulanan, sorted):", monthlySummaries.map(s => `${s.year}-M${s.month}`));
    // console.log("Yearly Summaries (Tahunan, sorted):", yearlySummaries.map(s => s.year));
  }, [sortOrder, data, currentYear, currentMonth]); // Tambahkan dependensi agar log diperbarui

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
          <TouchableOpacity onPress={() => setExportModalVisible(true)} disabled={isExporting}>
            {isExporting ? (
              <Text style={{ color: 'white', fontSize: 12 }}>Mengekspor...</Text> // Menggunakan teks sederhana sebagai indikator loading
            ) : (
              <MaterialIcons name="file-download" size={20} color="white" style={styles.icon} />
            )}
          </TouchableOpacity>
          {/* Tombol ikon tune untuk membuka modal filter/sortir */}
          <TouchableOpacity onPress={() => setSortModalVisible(true)}>
            <MaterialIcons name="tune" size={20} color="white" style={styles.icon} />
          </TouchableOpacity>
          {/* <FontAwesome name="user" size={20} color="white" style={styles.icon} /> */}
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
          <Text style={styles.income}>{`Rp. ${totalIncomeDisplay.toLocaleString('id-ID')}`}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Pengeluaran</Text>
          <Text style={styles.expense}>{`Rp. ${totalExpenseDisplay.toLocaleString('id-ID')}`}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Saldo</Text>
          <Text style={styles.balance}>{`Rp. ${saldo.toLocaleString('id-ID')}`}</Text>
        </View>
      </View>

      {/* Daftar Transaksi / Riwayat */}
      {activeTab === "Harian" ? (
        <FlatList
          data={sortedDailyTransactions} // Menggunakan data harian yang sudah diurutkan
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openTransactionModal(item)} // Tekan untuk Edit
              onLongPress={() => handleDelete(item.id)} // Tekan Lama untuk Hapus
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
                  <Text style={styles.income}>{`Rp. ${item.jumlah.toLocaleString('id-ID')}`}</Text>
                ) : (
                  <Text style={styles.expense}>{`Rp. ${item.jumlah.toLocaleString('id-ID')}`}</Text>
                )}
                <Text style={{ color: 'white' }}>Catatan : {item.keterangan}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 20 }}>
              Belum ada transaksi.
            </Text>
          }
        />
      ) : activeTab === "Mingguan" ? (
        <FlatList
          data={weeklySummaries} // Menampilkan semua ringkasan mingguan yang sudah diurutkan
          keyExtractor={item => `${item.year}-${item.weekNumber}`}
          renderItem={({ item }) => (
            <View style={styles.summaryItemBox}>
              <Text style={styles.summaryItemText}>{`Minggu ${item.weekNumber}, ${item.year}`}</Text> {/* Tambah tahun */}
              <View style={styles.summaryAmountsContainer}>
                <Text style={[styles.income, styles.summaryAmount]}>{`Rp. ${item.totalIncome.toLocaleString('id-ID')}`}</Text>
                <Text style={[styles.expense, styles.summaryAmount]}>{`Rp. ${item.totalExpense.toLocaleString('id-ID')}`}</Text>
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
          data={monthlySummaries} // Menampilkan semua ringkasan bulanan yang sudah diurutkan
          keyExtractor={item => `${item.year}-${item.month}`}
          renderItem={({ item }) => (
            <View style={styles.summaryItemBox}>
              <Text style={styles.summaryItemText}>{`${getMonthName(item.month)} ${item.year}`}</Text> {/* Tambah tahun */}
              <View style={styles.summaryAmountsContainer}>
                <Text style={[styles.income, styles.summaryAmount]}>{`Rp. ${item.totalIncome.toLocaleString('id-ID')}`}</Text>
                <Text style={[styles.expense, styles.summaryAmount]}>{`Rp. ${item.totalExpense.toLocaleString('id-ID')}`}</Text>
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
          data={yearlySummaries} // Menampilkan semua ringkasan tahunan yang sudah diurutkan
          keyExtractor={item => `${item.year}`}
          renderItem={({ item }) => (
            <View style={styles.summaryItemBox}>
              <Text style={styles.summaryItemText}>{`${item.year}`}</Text>
              <View style={styles.summaryAmountsContainer}>
                <Text style={[styles.income, styles.summaryAmount]}>{`Rp. ${item.totalIncome.toLocaleString('id-ID')}`}</Text>
                <Text style={[styles.expense, styles.summaryAmount]}>{`Rp. ${item.totalExpense.toLocaleString('id-ID')}`}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 20 }}>
              Belum ada transaksi untuk tahun ini.
            </Text>
          }
        />
      ) : null}


      {/* Tombol Tambah */}
      <TouchableOpacity style={styles.fab} onPress={() => openTransactionModal()}>
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Form Input Modal Transaksi (Tambah/Edit) */}
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

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrUpdate}>
              <Text style={{ color: 'white' }}>{editingTransaction ? 'Perbarui' : 'Simpan'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeTransactionModal} style={styles.cancelButton}>
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
              // editable={false} // Dihapus: agar format bisa diisi manual untuk simulasi
            />

            <View style={styles.exportButtonContainer}>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={styles.exportCancelButton}
                disabled={isExporting} // Nonaktifkan saat exporting
              >
                <Text style={styles.exportButtonText}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                style={styles.exportButton}
                disabled={isExporting} // Nonaktifkan saat exporting
              >
                <Text style={styles.exportButtonText}>
                  {isExporting ? 'Mengekspor...' : 'EKSPOR'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Filter/Sortir */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.sortModalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)} // Tutup modal saat overlay ditekan
        >
          <View style={styles.sortModalContent}>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortOrder('latest');
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.sortOptionText}>TERBARU</Text>
              {sortOrder === 'latest' && (
                <MaterialIcons name="check" size={24} color="#FFD700" style={styles.sortCheckIcon} />
              )}
            </TouchableOpacity>
            <View style={styles.sortDivider} />
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortOrder('oldest');
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.sortOptionText}>TERLAMA</Text>
              {sortOrder === 'oldest' && (
                <MaterialIcons name="check" size={24} color="#FFD700" style={styles.sortCheckIcon} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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

  // --- Gaya Baru untuk Modal Filter/Sortir ---
  sortModalOverlay: {
    flex: 1,
    justifyContent: 'flex-start', // Posisikan di atas
    alignItems: 'flex-end', // Posisikan di kanan
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 50, // Sesuaikan dengan paddingTop header Anda
    paddingRight: 16, // Sesuaikan dengan paddingHorizontal header Anda
  },
  sortModalContent: {
    backgroundColor: '#FFD700', // Warna kuning keemasan seperti desain
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: 150, // Lebar modal filter
    // Posisi relatif terhadap ikon tune
    marginTop: 40, // Sesuaikan ini agar muncul di bawah ikon tune
    marginRight: 0, // Sesuaikan ini agar sejajar dengan ikon tune
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sortOptionText: {
    color: '#333', // Warna teks gelap
    fontSize: 16,
    fontWeight: 'bold',
  },
  sortDivider: {
    height: 1,
    backgroundColor: '#ccc', // Garis pemisah
    marginVertical: 5,
  },
  sortCheckIcon: {
    marginLeft: 10,
  },
});
