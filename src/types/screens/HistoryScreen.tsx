import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AttendanceRecord } from '..';
import { clearAttendanceHistory, getAttendanceHistory } from '../service/storageService';


export default function HistoryScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await getAttendanceHistory();
    setRecords(data);
  };

  const handleClear = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all attendance records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAttendanceHistory();
            setRecords([]);
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.status}>✓ Checked In</Text>
        <Text style={styles.time}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.coords}>
        Lat: {item.latitude.toFixed(6)}  |  Lng: {item.longitude.toFixed(6)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        {records.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No attendance records yet.</Text>
          <Text style={styles.emptySub}>
            Check in when you are inside the office geofence.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  clearText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  time: {
    fontSize: 13,
    color: '#64748b',
  },
  coords: {
    fontSize: 12,
    color: '#94a3b8',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});