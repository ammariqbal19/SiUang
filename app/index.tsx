// File: app/index.tsx

import React, { useState } from "react";
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

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isIncome, setIsIncome] = useState(true);
  const [tanggal, setTanggal] = useState("");
  const [kategori, setKategori] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [data, setData] = useState([]);

  const handleSave = () => {
    if (!tanggal || !jumlah) return;
    const newData = {
      id: Date.now().toString(),
      tanggal,
      kategori,
      jumlah: parseFloat(jumlah),
      keterangan,
      isIncome,
    };
    setData([newData, ...data]);
    setModalVisible(false);
    setTanggal("");
    setKategori("");
    setJumlah("");
    setKeterangan("");
  };

  const handleDelete = (id) => {
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

  const totalIncome = data.filter(i => i.isIncome).reduce((a, b) => a + b.jumlah, 0);
  const totalExpense = data.filter(i => !i.isIncome).reduce((a, b) => a + b.jumlah, 0);
  const saldo = totalIncome - totalExpense;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>SiUang</Text>
        <View style={styles.monthNav}>
          <Entypo name="chevron-left" size={20} color="white" />
          <Text style={styles.monthText}>Juli 2025</Text>
          <Entypo name="chevron-right" size={20} color="white" />
        </View>
        <View style={styles.icons}>
          <MaterialIcons name="file-download" size={20} color="white" style={styles.icon} />
          <MaterialIcons name="tune" size={20} color="white" style={styles.icon} />
          <FontAwesome name="user" size={20} color="white" style={styles.icon} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={styles.tab}>Harian</Text>
        <Text style={styles.tab}>Mingguan</Text>
        <Text style={styles.tab}>Bulanan</Text>
        <Text style={styles.tab}>Tahunan</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Pemasukan</Text>
          <Text style={styles.income}>{`Rp. ${totalIncome.toLocaleString()}`}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Pengeluaran</Text>
          <Text style={styles.expense}>{`Rp. ${totalExpense.toLocaleString()}`}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Saldo</Text>
          <Text style={styles.balance}>{`Rp. ${saldo.toLocaleString()}`}</Text>
        </View>
      </View>

      {/* Daftar Transaksi */}
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleDelete(item.id)}
            style={styles.transactionBox}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateNumber}>{item.tanggal.split("-")[2]}</Text>
              <View>
                <Text style={styles.dateMonth}>Juli 2025</Text>
                <Text style={styles.dateDay}>Hari</Text>
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
            Belum ada transaksi
          </Text>
        }
      />

      {/* Tombol Tambah */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Form Input Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setIsIncome(false)}
                style={[styles.switchTab, { backgroundColor: !isIncome ? 'red' : 'white' }]}
              >
                <Text style={{ color: !isIncome ? 'white' : 'black' }}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsIncome(true)}
                style={[styles.switchTab, { backgroundColor: isIncome ? 'green' : 'white' }]}
              >
                <Text style={{ color: isIncome ? 'white' : 'black' }}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <TextInput placeholder="Tanggal (YYYY-MM-DD)" style={styles.input} value={tanggal} onChangeText={setTanggal} />
            <TextInput placeholder="Kategori" style={styles.input} value={kategori} onChangeText={setKategori} />
            <TextInput placeholder="Jumlah" style={styles.input} value={jumlah} onChangeText={setJumlah} keyboardType="numeric" />
            <TextInput placeholder="Keterangan" style={styles.input} value={keterangan} onChangeText={setKeterangan} />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={{ color: 'white' }}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={{ color: 'white' }}>Batal</Text>
            </TouchableOpacity>
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
  tabs: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, backgroundColor: "#333", padding: 10, borderRadius: 8 },
  tab: { color: "#FFD700", fontWeight: "bold" },
  summaryContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 30 },
  summaryBox: { alignItems: "center" },
  label: { color: "white", marginBottom: 4 },
  income: { color: "#00ff00", fontWeight: "bold" },
  expense: { color: "#ff0000", fontWeight: "bold" },
  balance: { color: "#00ff00", fontWeight: "bold" },
  transactionBox: { flexDirection: "row", backgroundColor: '#3a3a3a', borderRadius: 8, padding: 10, marginTop: 16, justifyContent: 'space-between' },
  dateBox: { flexDirection: 'row', alignItems: 'center' },
  dateNumber: { fontSize: 24, fontWeight: 'bold', color: 'white', marginRight: 12 },
  dateMonth: { color: 'white' },
  dateDay: { color: 'white', fontStyle: 'italic' },
  transactionDetails: { justifyContent: 'center' },
  fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: "#00aa00", width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#2c2c2c', padding: 20, borderRadius: 10, width: '85%' },
  input: { backgroundColor: '#fff', borderRadius: 6, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 6 },
  saveButton: { backgroundColor: '#008800', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 8 },
  cancelButton: { backgroundColor: '#cc0000', padding: 10, borderRadius: 5, alignItems: 'center' },
  switchTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
});
