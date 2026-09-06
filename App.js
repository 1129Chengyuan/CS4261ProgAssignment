import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';

// Config is read from Expo public env vars (see .env). Values prefixed with
// EXPO_PUBLIC_ are inlined at build time and are safe for client use.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const MOCK_TELEMETRY = [
  { id: '1', text: 'Node 01: Initial calibration complete', userId: 'node-a8f1' },
  { id: '2', text: 'Node 02: Ambient temp 21.4°C, humidity 47%', userId: 'node-b3c9' },
  { id: '3', text: 'Node 03: Heartbeat OK, signal strength -58 dBm', userId: 'node-c7d2' },
];

export default function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (session) => {
      if (session) {
        setUser(session);
        setLoading(false);
      }
    });

    signInAnonymously(auth).catch((error) => {
      console.warn('Anonymous sign-in failed:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nodeDot} />
        <Text style={styles.cardUser}>{item.userId}</Text>
      </View>
      <Text style={styles.cardText}>{item.text}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#090d16" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Establishing secure node session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nodeId = user ? user.uid.substring(0, 5) : '—————';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>IoT Live Node Stream</Text>
            <Text style={styles.subtitle}>Node ID: {nodeId}</Text>
          </View>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Live Sync</Text>
          </View>
        </View>

        {/* Input card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Publish Telemetry</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter node message..."
            placeholderTextColor="#4b5563"
          />
          <TouchableOpacity style={styles.button} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Publish</Text>
          </TouchableOpacity>
        </View>

        {/* Stream */}
        <Text style={styles.streamLabel}>Incoming Stream</Text>
        <FlatList
          data={MOCK_TELEMETRY}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 14,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginRight: 6,
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#0f1626',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e2e8f0',
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  streamLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0f1626',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginRight: 8,
  },
  cardUser: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 21,
  },
});
