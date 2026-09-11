import AsyncStorage from '@react-native-async-storage/async-storage';

// Native storage lives in the app's own container, which iOS does not evict.
export const getItem = (key: string) => AsyncStorage.getItem(key);
export const setItem = (key: string, value: string) => AsyncStorage.setItem(key, value);
export const removeItem = (key: string) => AsyncStorage.removeItem(key);
export const requestPersistence = async (): Promise<boolean> => true;
