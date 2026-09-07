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
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

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
const db = getFirestore(app);

export default function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const canPost = message.trim().length > 0;

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

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'telemetry'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, []);

  const handlePost = async () => {
    if (!message.trim() || !user) return;

    const text = message.trim();
    setMessage('');

    try {
      await addDoc(collection(db, 'telemetry'), {
        text,
        userId: user.uid.substring(0, 5),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Post failed:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardUser}>{item.userId}</Text>
      <Text style={styles.cardText}>{item.text}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#090d16" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      </SafeAreaView>
    );
  }

  const nodeId = user ? user.uid.substring(0, 5) : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Message Board</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{messages.length} messages</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Posting as {nodeId}</Text>
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Write a message"
            placeholderTextColor="#4b5563"
          />
          <TouchableOpacity
            style={[styles.button, !canPost && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handlePost}
            disabled={!canPost}
          >
            <Text style={styles.buttonText}>Post</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet.</Text>
          }
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
  },
  countPill: {
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countPillText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: '#0f1626',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#090d16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 15,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1e3a8a',
    opacity: 0.45,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
  card: {
    backgroundColor: '#0f1626',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  cardUser: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 21,
  },
});
