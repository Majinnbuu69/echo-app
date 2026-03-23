import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

type Entry = {
  id: string;
  type: 'voice' | 'text';
  content: string; // text or base64 audio uri
  duration?: number;
  mood: number;
  date: string;
  tags: string[];
  createdAt: string;
};

type Insight = {
  label: string;
  value: string;
  change: number; // percentage
};

const Tab = createBottomTabNavigator();

// iOS 26 Colors
const colors = {
  bg: '#000000',
  card: 'rgba(255,255,255,0.08)',
  cardHover: 'rgba(255,255,255,0.12)',
  accent: '#0A84FF',
  accentSecondary: '#5E5CE6',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.4)',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  gradient: ['#1c1c1e', '#2c2c2e', '#1c1c1e'],
};

// ====== HOME SCREEN ======
function HomeScreen({ entries, todayEntries }: { entries: Entry[], todayEntries: Entry[] }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getMoodEmoji = (m: number) => ['😔', '😕', '😐', '🙂', '😊'][m-1] || '😐';
  const getMoodColor = (m: number) => [colors.danger, colors.warning, colors.textSecondary, colors.success, colors.accent][m-1] || colors.textSecondary;

  const avgMood = todayEntries.length > 0 
    ? Math.round(todayEntries.reduce((a, b) => a + b.mood, 0) / todayEntries.length)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Echo</Text>
          <Text style={styles.subtitle}>Your voice, your time</Text>
        </View>

        {/* Today's Circle */}
        <View style={styles.todayCard}>
          <Animated.View style={[styles.todayCircle, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient 
              colors={[colors.accent, colors.accentSecondary]} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.todayGradient}
            >
              <Text style={styles.todayEmoji}>{avgMood > 0 ? getMoodEmoji(avgMood) : '🎙️'}</Text>
              <Text style={styles.todayCount}>{todayEntries.length}</Text>
              <Text style={styles.todayLabel}>today</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={styles.todayTitle}>Today's Echo</Text>
        </View>

        {/* Weekly Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{entries.filter(e => e.type === 'voice').length}</Text>
            <Text style={styles.statLabel}>Voice</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{entries.filter(e => e.type === 'text').length}</Text>
            <Text style={styles.statLabel}>Text</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{Math.max(0, 14 - Math.floor((Date.now() - (entries[0]?.createdAt ? new Date(entries[0].createdAt).getTime() : Date.now())) / 86400000))}</Text>
            <Text style={styles.statLabel}>Days left</Text>
          </View>
        </View>

        {/* Recent Entries */}
        <Text style={styles.sectionTitle}>Recent Echoes</Text>
        {entries.slice(0, 5).map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={[styles.entryMoodDot, { backgroundColor: getMoodColor(entry.mood) }]} />
            <View style={styles.entryContent}>
              <Text style={styles.entryType}>{entry.type === 'voice' ? '🎙️ Voice' : '✍️ Text'}</Text>
              <Text style={styles.entryPreview} numberOfLines={1}>
                {entry.type === 'voice' ? `${Math.floor((entry.duration || 0) / 60)}:${String(Math.floor((entry.duration || 0) % 60)).padStart(2, '0')}` : entry.content}
              </Text>
              <Text style={styles.entryDate}>{entry.date}</Text>
            </View>
          </View>
        ))}

        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No echoes yet</Text>
            <Text style={styles.emptySubtext}>Start recording your first thought</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ====== RECORD SCREEN ======
function RecordScreen({ entries, setEntries, navigation }: any) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [textNote, setTextNote] = useState('');
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [mood, setMood] = useState(3);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (e) {
      console.log('Recording error', e);
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      
      if (uri) {
        await saveEntry('voice', uri, recordingDuration);
      }
      setRecording(null);
    }
  };

  const saveEntry = async (type: 'voice' | 'text', content: string, duration?: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: Entry = {
      id: Date.now().toString(),
      type,
      content,
      duration,
      mood,
      date: today,
      tags: [],
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newEntry, ...entries];
    setEntries(updated);
    await AsyncStorage.setItem('entries', JSON.stringify(updated));
    
    // Reset
    setTextNote('');
    setRecordingDuration(0);
    setMood(3);
    Alert.alert('Saved', 'Your echo has been recorded');
  };

  const getMoodEmoji = (m: number) => ['😔', '😕', '😐', '🙂', '😊'][m-1];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.recordTitle}>New Echo</Text>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'voice' && styles.modeButtonActive]}
            onPress={() => setMode('voice')}
          >
            <Text style={[styles.modeButtonText, mode === 'voice' && styles.modeButtonTextActive]}>Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'text' && styles.modeButtonActive]}
            onPress={() => setMode('text')}
          >
            <Text style={[styles.modeButtonText, mode === 'text' && styles.modeButtonTextActive]}>Text</Text>
          </TouchableOpacity>
        </View>

        {/* Mood Selector */}
        <View style={styles.moodSection}>
          <Text style={styles.moodLabel}>How do you feel?</Text>
          <View style={styles.moodRow}>
            {[1, 2, 3, 4, 5].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.moodButton, mood === m && styles.moodButtonActive]}
                onPress={() => setMood(m)}
              >
                <Text style={styles.moodEmoji}>{getMoodEmoji(m)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recording / Text Input */}
        {mode === 'voice' ? (
          <View style={styles.recorderSection}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={isRecording ? [colors.danger, '#ff6b6b'] : [colors.accent, colors.accentSecondary]}
                style={styles.recordButtonGradient}
              >
                <Text style={styles.recordButtonEmoji}>{isRecording ? '⏹️' : '🎙️'}</Text>
                <Text style={styles.recordButtonText}>
                  {isRecording ? `${Math.floor(recordingDuration / 60)}:${String(recordingDuration % 60).padStart(2, '0')}` : 'Tap to Record'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {isRecording && <Text style={styles.recordingHint}>Tap to stop</Text>}
          </View>
        ) : (
          <View style={styles.textSection}>
            <TextInput
              style={styles.textInput}
              value={textNote}
              onChangeText={setTextNote}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={[styles.saveButton, !textNote.trim() && styles.saveButtonDisabled]}
              onPress={() => textNote.trim() && saveEntry('text', textNote.trim())}
              disabled={!textNote.trim()}
            >
              <Text style={styles.saveButtonText}>Save Echo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ====== INSIGHTS SCREEN ======
function InsightsScreen({ entries }: { entries: Entry[] }) {
  const insights: Insight[] = [];
  
  const totalVoice = entries.filter(e => e.type === 'voice').length;
  const totalText = entries.filter(e => e.type === 'text').length;
  const avgMood = entries.length > 0 
    ? (entries.reduce((a, b) => a + b.mood, 0) / entries.length).toFixed(1)
    : '0';
  
  // Mock insights for demo
  if (entries.length > 0) {
    insights.push({ label: 'Voice vs Text', value: `${Math.round((totalVoice / (totalVoice + totalText || 1)) * 100)}% voice`, change: 12 });
    insights.push({ label: 'Avg Mood', value: avgMood, change: 5 });
    insights.push({ label: 'This Week', value: `${entries.filter(e => {
      const d = new Date(e.createdAt);
      const now = new Date();
      return d > new Date(now.getTime() - 7 * 86400000);
    }).length} entries`, change: -2 });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.insightsTitle}>Insights</Text>
        
        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Not enough data</Text>
            <Text style={styles.emptySubtext}>Record more echoes to see insights</Text>
          </View>
        ) : (
          <>
            <View style={styles.insightsGrid}>
              {insights.map((insight, i) => (
                <View key={i} style={styles.insightCard}>
                  <Text style={styles.insightLabel}>{insight.label}</Text>
                  <Text style={styles.insightValue}>{insight.value}</Text>
                  <Text style={[styles.insightChange, insight.change >= 0 ? styles.positive : styles.negative]}>
                    {insight.change >= 0 ? '↑' : '↓'} {Math.abs(insight.change)}%
                  </Text>
                </View>
              ))}
            </View>

            {/* Premium Card */}
            <View style={styles.premiumCard}>
              <Text style={styles.premiumTitle}>🔓 Full Insights</Text>
              <Text style={styles.premiumText}>Get detailed weekly reports, mood trends, and AI-generated summaries.</Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Upgrade - $4.99/mo</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ====== SETTINGS SCREEN ======
function SettingsScreen() {
  const [isPremium, setIsPremium] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.settingsTitle}>Settings</Text>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsLabel}>Account</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowText}>Echo Premium</Text>
              <Text style={styles.settingsRowValue}>{isPremium ? '✓ Active' : 'Free'}</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowText}>Storage Used</Text>
              <Text style={styles.settingsRowValue}>2.3 MB</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsLabel}>Preferences</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowText}>AI Insights</Text>
              <Text style={styles.settingsRowValue}>On</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowText}>Daily Reminder</Text>
              <Text style={styles.settingsRowValue}>Off</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => Alert.alert('Coming Soon', 'Subscription will be available soon!')}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ====== MAIN APP ======
export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('entries');
        if (saved) setEntries(JSON.parse(saved));
      } catch (e) {
        console.log('Load error', e);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);

  if (!isLoaded) return null;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen name="Home" options={{ tabBarIcon: ({ color }) => <Text style={styles.tabIcon}>🏠</Text> }}>
          {() => <HomeScreen entries={entries} todayEntries={todayEntries} />}
        </Tab.Screen>
        <Tab.Screen name="Record" options={{ tabBarIcon: ({ color }) => <Text style={styles.tabIcon}>🎙️</Text> }}>
          {() => <RecordScreen entries={entries} setEntries={setEntries} />}
        </Tab.Screen>
        <Tab.Screen name="Insights" options={{ tabBarIcon: ({ color }) => <Text style={styles.tabIcon}>📊</Text> }}>
          {() => <InsightsScreen entries={entries} />}
        </Tab.Screen>
        <Tab.Screen name="Settings" options={{ tabBarIcon: ({ color }) => <Text style={styles.tabIcon}>⚙️</Text> }}>
          {() => <SettingsScreen />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingTop: 60 },
  
  // Header
  header: { marginBottom: 30 },
  logo: { fontSize: 40, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  
  // Today Card
  todayCard: { alignItems: 'center', marginBottom: 30 },
  todayCircle: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', marginBottom: 15 },
  todayGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  todayEmoji: { fontSize: 48, marginBottom: 5 },
  todayCount: { fontSize: 32, fontWeight: '700', color: colors.text },
  todayLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  todayTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  
  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  
  // Section
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 15 },
  
  // Entries
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  entryMoodDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  entryContent: { flex: 1 },
  entryType: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  entryPreview: { fontSize: 15, color: colors.text, marginBottom: 4 },
  entryDate: { fontSize: 11, color: colors.textTertiary },
  
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  
  // Record Screen
  recordTitle: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 30 },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, marginBottom: 25 },
  modeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  modeButtonActive: { backgroundColor: colors.accent },
  modeButtonText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  modeButtonTextActive: { color: colors.text },
  
  moodSection: { marginBottom: 30 },
  moodLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  moodButtonActive: { backgroundColor: colors.accent },
  moodEmoji: { fontSize: 28 },
  
  recorderSection: { alignItems: 'center' },
  recordButton: { width: 200, height: 200, borderRadius: 100, overflow: 'hidden' },
  recordButtonActive: { transform: [{ scale: 0.95 }] },
  recordButtonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  recordButtonEmoji: { fontSize: 60, marginBottom: 10 },
  recordButtonText: { fontSize: 18, fontWeight: '600', color: colors.text },
  recordingHint: { fontSize: 14, color: colors.textSecondary, marginTop: 15 },
  
  textSection: { marginTop: 20 },
  textInput: { backgroundColor: colors.card, borderRadius: 16, padding: 20, color: colors.text, fontSize: 16, minHeight: 150, textAlignVertical: 'top' },
  saveButton: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 15 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  
  // Insights
  insightsTitle: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 30 },
  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  insightCard: { width: '48%', backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 15 },
  insightLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  insightValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  insightChange: { fontSize: 13, marginTop: 8 },
  positive: { color: colors.success },
  negative: { color: colors.danger },
  
  premiumCard: { backgroundColor: 'rgba(10, 132, 255, 0.15)', borderRadius: 16, padding: 20, marginTop: 10, borderWidth: 1, borderColor: colors.accent },
  premiumTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 10 },
  premiumText: { fontSize: 14, color: colors.textSecondary, marginBottom: 15, lineHeight: 20 },
  premiumButton: { backgroundColor: colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  premiumButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
  
  // Settings
  settingsTitle: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 30 },
  settingsSection: { marginBottom: 25 },
  settingsLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  settingsCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  settingsRowText: { fontSize: 16, color: colors.text },
  settingsRowValue: { fontSize: 16, color: colors.textSecondary },
  
  upgradeButton: { backgroundColor: colors.accent, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 20 },
  upgradeButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  
  // Tab Bar
  tabBar: { backgroundColor: colors.bg, borderTopWidth: 0, paddingTop: 10, height: 90 },
  tabBarLabel: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  tabIcon: { fontSize: 24 },
});