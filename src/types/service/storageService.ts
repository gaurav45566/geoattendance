import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendanceRecord } from '..';

const STORAGE_KEY = '@attendance_records';

export async function saveAttendance(
  record: AttendanceRecord
): Promise<void> {
  try {
    const existing = await getAttendanceHistory();
    const updated = [record, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save attendance:', error);
    throw error;
  }
}

export async function getAttendanceHistory(): Promise<AttendanceRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load attendance history:', error);
    return [];
  }
}

export async function clearAttendanceHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}