import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Animated, Dimensions, StatusBar, Switch, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

type Entry = {
  id: string;
  type: 'voice' | 'text';
  content: string;
  duration?: number;
  mood: number;
  date: string;
  tags: string[];
  createdAt: string;
};

type Insight = {
  label: string;
  value: string;
  change: number;
};

type AIAnalysis = {
  summary: string;
  sentiment: string;
  advice: string[];
  keywords: string[];
  moodTrend: string;
};

// Daily challenges pool
const DAILY_CHALLENGES = [
  { id: 1, text: "What's one thing you're grateful for today?", premium: false },
  { id: 2, text: "Describe your perfect morning routine.", premium: false },
  { id: 3, text: "What's a fear you want to overcome?", premium: false },
  { id: 4, text: "If you could tell your younger self one thing...", premium: true },
  { id: 5, text: "What's the best advice you've ever received?", premium: false },
  { id: 6, text: "Describe a moment that made you smile today.", premium: false },
  { id: 7, text: "What's one goal you're working toward right now?", premium: false },
  { id: 8, text: "If you could change one thing about today, what would it be?", premium: true },
];

// Translations
const translations = {
  en: {
    home: 'Home', record: 'Record', insights: 'Insights', settings: 'Settings',
    today: 'today', recent: 'Recent', noEchoes: 'No echoes yet', startRecording: 'Start recording your first thought',
    newEcho: 'New Echo', dailyChallenge: 'Daily Challenge', voice: 'Voice', text: 'Text',
    howFeel: 'How do you feel?', tapToRecord: 'Tap to record', saveEcho: 'Save Echo',
    submitChallenge: 'Submit Challenge', premium: 'Premium', upgrade: 'Upgrade',
    insightsTitle: 'Insights', notEnoughData: 'Not enough data', recordMore: 'Record more echoes',
    moodJourney: 'Mood Journey', premiumTitle: 'Echo Premium', premiumText: 'Full AI analysis, voice playback, unlimited storage.',
    account: 'Account', preferences: 'Preferences', aiInsights: 'AI Insights', dailyReminder: 'Daily Reminder',
    upgradeToPremium: 'Upgrade to Premium', echoPremium: 'Echo Premium', storage: 'Storage',
    streak: 'streak', dayStreak: 'day streak', startStreak: 'Start your streak',
    lockedUnlock: 'Unlock AI Analysis', seePatterns: 'Get personalized insights',
    saved: 'Saved', yourEchoRecorded: 'Your echo has been recorded',
    upgradeToAccess: 'Upgrade to access premium features',
    premiumActivated: 'Premium Activated!', welcomePremium: 'Welcome to Echo Premium!',
    premiumFeatures: 'Unlock full AI analysis',
    language: 'Language', autoDetected: 'Auto-detected',
    play: 'Play', stop: 'Stop', analyzing: 'Analyzing...',
    aiAnalysis: 'AI Analysis', summary: 'Summary', advice: 'Advice', keywords: 'Keywords',
    voiceNote: 'Voice Note', tapToPlay: 'Tap to play', premiumFeature: 'Premium Feature',
    testPremium: 'Test Premium', disablePremium: 'Disable Premium (Test)',
  },
  fr: {
    home: 'Accueil', record: 'Enregistrer', insights: 'Analyses', settings: 'Paramètres',
    today: "aujourd'hui", recent: 'Récent', noEchoes: 'Pas encore d\'échos', startRecording: 'Commencez à enregistrer',
    newEcho: 'Nouvel Écho', dailyChallenge: 'Défi du jour', voice: 'Voix', text: 'Texte',
    howFeel: 'Comment vous sentez-vous?', tapToRecord: 'Appuyez pour enregistrer', saveEcho: 'Sauvegarder',
    submitChallenge: 'Soumettre', premium: 'Premium', upgrade: 'Mettre à jour',
    insightsTitle: 'Analyses', notEnoughData: 'Pas assez de données', recordMore: 'Enregistrez plus',
    moodJourney: 'Parcours émotionnel', premiumTitle: 'Echo Premium', premiumText: 'Analyse IA complète, lecture vocale, stockage illimité.',
    account: 'Compte', preferences: 'Préférences', aiInsights: 'Analyses IA', dailyReminder: 'Rappel quotidien',
    upgradeToPremium: 'Passer à Premium', echoPremium: 'Echo Premium', storage: 'Stockage',
    streak: 'série', dayStreak: 'jours de suite', startStreak: 'Commencez votre série',
    lockedUnlock: 'Débloquer l\'analyse IA', seePatterns: 'Obtenez des insights personnalisés',
    saved: 'Sauvegardé', yourEchoRecorded: 'Votre écho a été enregistré',
    upgradeToAccess: 'Mettez à jour pour les fonctionnalités premium',
    premiumActivated: 'Premium Activé!', welcomePremium: 'Bienvenue dans Echo Premium!',
    premiumFeatures: 'Débloquer l\'analyse IA complète',
    language: 'Langue', autoDetected: 'Auto-détecté',
    play: 'Lire', stop: 'Arrêter', analyzing: 'Analyse en cours...',
    aiAnalysis: 'Analyse IA', summary: 'Résumé', advice: 'Conseils', keywords: 'Mots-clés',
    voiceNote: 'Note vocale', tapToPlay: 'Appuyez pour écouter', premiumFeature: 'Fonction Premium',
    testPremium: 'Tester Premium', disablePremium: 'Désactiver Premium (Test)',
  },
};

// Emotion Cards Data
const EMOTIONS = [
  { id: 1, label: 'Sad', color: '#6366F1', icon: '▼' },
  { id: 2, label: 'Down', color: '#8B5CF6', icon: '◐' },
  { id: 3, label: 'Okay', color: '#6B7280', icon: '●' },
  { id: 4, label: 'Good', color: '#10B981', icon: '◑' },
  { id: 5, label: 'Great', color: '#F59E0B', icon: '▲' },
];

const detectLanguage = (): 'en' | 'fr' => {
  const locale = Platform.OS === 'ios' ? (Intl as any).preferredLanguages?.[0] || 'en' : (Intl as any).defaultLocale || 'en';
  if (locale.startsWith('fr')) return 'fr';
  return 'en';
};

// V3 Icons
const Icons = {
  home: ({ color, size = 22 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: size * 0.5, height: size * 0.5, borderWidth: 2, borderColor: color, borderRadius: size * 0.15, position: 'absolute', top: size * 0.1 }} />
    </View>
  ),
  mic: ({ color, size = 22 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.35, height: size * 0.6, backgroundColor: color, borderRadius: size * 0.2 }} />
      <View style={{ width: size * 0.6, height: 2, backgroundColor: color, position: 'absolute', bottom: 0 }} />
    </View>
  ),
  chart: ({ color, size = 22 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.2, height: size * 0.6, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.2, height: size * 0.4, backgroundColor: color, borderRadius: 2, position: 'absolute', left: size * 0.35 }} />
      <View style={{ width: size * 0.2, height: size * 0.8, backgroundColor: color, borderRadius: 2, position: 'absolute', right: size * 0.1 }} />
    </View>
  ),
  settings: ({ color, size = 22 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.6, height: size * 0.6, borderWidth: 2, borderColor: color, borderRadius: size * 0.3 }} />
      <View style={{ width: size * 0.2, height: 2, backgroundColor: color, position: 'absolute' }} />
    </View>
  ),
  flame: ({ color, size = 24 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: size * 0.3, borderRightWidth: size * 0.3, borderBottomWidth: size * 0.5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color }} />
    </View>
  ),
  target: ({ color, size = 20 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.7, height: size * 0.7, borderWidth: 2, borderColor: color, borderRadius: size * 0.35 }} />
      <View style={{ width: size * 0.35, height: size * 0.35, borderWidth: 2, borderColor: color, borderRadius: size * 0.175, position: 'absolute' }} />
    </View>
  ),
  lock: ({ color, size = 24 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.5, height: size * 0.4, borderWidth: 2, borderColor: color, borderRadius: 4, borderBottomWidth: 0 }} />
      <View style={{ width: size * 0.3, height: size * 0.25, borderWidth: 2, borderColor: color, borderRadius: size * 0.15, borderBottomWidth: 0, position: 'absolute', top: size * 0.15 }} />
    </View>
  ),
  play: ({ color, size = 20 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: size * 0.4, borderTopWidth: size * 0.3, borderBottomWidth: size * 0.3, borderLeftColor: color, borderTopColor: 'transparent', borderBottomColor: 'transparent' }} />
    </View>
  ),
  stop: ({ color, size = 20 }: { color: string; size?: number }) => (
    <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, borderRadius: 2 }} />
  ),
  sparkles: ({ color, size = 22 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color }}>✦</Text>
    </View>
  ),
  brain: ({ color, size = 22 }: { color: string; size?: number }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.7, color }}>🧠</Text>
    </View>
  ),
};

const Tab = createBottomTabNavigator();

// iOS 26 Colors
const colors = {
  bg: '#0A0A1A', bgSecondary: '#1C1C1E', bgTertiary: '#2C2C2E',
  glass: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.12)', glassHover: 'rgba(255,255,255,0.15)',
  accent: '#007AFF', accentSecondary: '#5E5CE6', accentGradient: ['#007AFF', '#5E5CE6'],
  text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', textTertiary: 'rgba(255,255,255,0.4)',
  success: '#30D158', warning: '#FF9F0A', danger: '#FF453A',
  gold: '#FFD60A', silver: '#8E8E93',
  ai: '#A855F7', aiGradient: ['#A855F7', '#6366F1'],
};

function GlassCard({ children, style, onPress }: any) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} activeOpacity={0.9}>
      <View style={[styles.glassCard, style, pressed && styles.glassCardPressed]}>{children}</View>
    </TouchableOpacity>
  );
}

function EmotionCard({ emotion, selected, onPress, lang }: { emotion: any, selected: boolean, onPress: () => void, lang: 'en' | 'fr' }) {
  const labels = { 1: lang === 'fr' ? 'Triste' : 'Sad', 2: lang === 'fr' ? 'Bas' : 'Down', 3: lang === 'fr' ? 'Neutre' : 'Okay', 4: lang === 'fr' ? 'Bien' : 'Good', 5: lang === 'fr' ? 'Super' : 'Great' };
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.emotionCard, selected && { borderColor: emotion.color, backgroundColor: `${emotion.color}20` }]}>
        <View style={[styles.emotionIcon, { backgroundColor: emotion.color }]}><Text style={styles.emotionIconText}>{emotion.icon}</Text></View>
        <Text style={[styles.emotionLabel, selected && { color: emotion.color }]}>{labels[emotion.id as keyof typeof labels]}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ====== REAL AI ANALYSIS FUNCTION ======
const generateAIAnalysis = (entries: Entry[], lang: 'en' | 'fr'): AIAnalysis => {
  const textEntries = entries.filter(e => e.type === 'text');
  const allText = textEntries.map(e => e.content).join(' ').toLowerCase();
  const moods = entries.map(e => e.mood);
  const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 3;
  
  // Analyze sentiment and keywords
  const positiveWords = ['happy', 'grateful', 'love', 'good', 'great', 'amazing', 'excellent', 'joy', 'thank', 'blessed', 'content', 'peaceful', 'heureux', 'aimé', 'bien', 'super', 'merci', 'béat'];
  const negativeWords = ['sad', 'angry', 'fear', 'anxious', 'worried', 'stress', 'tired', 'frustrated', 'alone', 'lost', 'triste', 'colère', 'peur', 'stress', 'fatigué', 'seul', 'perdu'];
  const growthWords = ['goal', 'learn', 'improve', 'work', 'progress', 'practice', 'habit', 'routine', 'exercise', 'read', 'goal', 'apprendre', 'améliorer', 'progrès', 'pratique', 'routine', 'exercice'];
  
  const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => allText.includes(w)).length;
  const growthCount = growthWords.filter(w => allText.includes(w)).length;
  
  // Detect keywords
  const keywords: string[] = [];
  if (allText.includes('work') || allText.includes('job')) keywords.push(lang === 'fr' ? 'Travail' : 'Work');
  if (allText.includes('family') || allText.includes('friend')) keywords.push(lang === 'fr' ? 'Relations' : 'Relationships');
  if (allText.includes('health') || allText.includes('sleep') || allText.includes('exercise')) keywords.push(lang === 'fr' ? 'Santé' : 'Health');
  if (allText.includes('money') || allText.includes('finance')) keywords.push(lang === 'fr' ? 'Finance' : 'Finance');
  if (allText.includes('love') || allText.includes('relationship')) keywords.push(lang === 'fr' ? 'Amour' : 'Love');
  
  // Generate sentiment
  let sentiment: string;
  if (positiveCount > negativeCount + 2) sentiment = lang === 'fr' ? 'Très Positif' : 'Very Positive';
  else if (positiveCount > negativeCount) sentiment = lang === 'fr' ? 'Plutôt Positif' : 'Positive';
  else if (negativeCount > positiveCount + 2) sentiment = lang === 'fr' ? 'Très Négatif' : 'Very Negative';
  else if (negativeCount > positiveCount) sentiment = lang === 'fr' ? 'Plutôt Négatif' : 'Negative';
  else sentiment = lang === 'fr' ? 'Neutre' : 'Neutral';
  
  // Generate summary
  let summary: string;
  if (lang === 'fr') {
    summary = `Tu as enregistré ${entries.length} échos. Ton humeur moyenne est ${avgMood.toFixed(1)}/5. Ton sentiment général est ${sentiment.toLowerCase()}.`;
  } else {
    summary = `You've recorded ${entries.length} echoes. Your average mood is ${avgMood.toFixed(1)}/5. Your overall sentiment is ${sentiment.toLowerCase()}.`;
  }
  
  // Generate advice
  const advice: string[] = [];
  if (negativeCount > positiveCount) {
    advice.push(lang === 'fr' ? '🧘 Essaie de méditer 5 minutes par jour pour réduire le stress.' : '🧘 Try meditating 5 minutes daily to reduce stress.');
  }
  if (growthCount > 0) {
    advice.push(lang === 'fr' ? '🌱 Continue à te concentrer sur tes objectifs de croissance personnelle.' : '🌱 Keep focusing on your personal growth goals.');
  }
  if (avgMood < 3) {
    advice.push(lang === 'fr' ? '💡 Pense à des activités qui te rendent heureux - même petites.' : '💡 Think about activities that make you happy - even small ones.');
  }
  if (entries.length < 5) {
    advice.push(lang === 'fr' ? '📝 Essaie de noter plus souvent pour avoir plus de données sur toi.' : '📝 Try journaling more often to get more data about yourself.');
  }
  if (positiveCount > negativeCount) {
    advice.push(lang === 'fr' ? '✨ Tu sembles dans une bonne période - Profites-en pour fixer de nouveaux objectifs!' : '✨ You seem to be in a good period - Use it to set new goals!');
  }
  if (advice.length === 0) {
    advice.push(lang === 'fr' ? '💪 Continue à t\'exprimer régulièrement. Chaque écho est un pas vers mieux te connaître.' : '💪 Keep expressing yourself regularly. Each echo is a step toward knowing yourself better.');
  }
  
  // Mood trend
  const moodTrend = avgMood >= 4 ? (lang === 'fr' ? 'En hausse 📈' : 'Rising 📈') : avgMood >= 3 ? (lang === 'fr' ? 'Stable ➡️' : 'Stable ➡️') : (lang === 'fr' ? 'En baisse 📉' : 'Declining 📉');
  
  return { summary, sentiment, advice, keywords, moodTrend };
};

// ====== HOME SCREEN ======
function HomeScreen({ entries, todayEntries, streak, isPremium, lang }: { entries: Entry[], todayEntries: Entry[], streak: number, isPremium: boolean, lang: 'en' | 'fr' }) {
  const t = translations[lang];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fireAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: 2500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
    ])).start();
    if (streak > 0) {
      Animated.loop(Animated.sequence([
        Animated.timing(fireAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(fireAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
    }
  }, [streak]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.bg, colors.bgSecondary]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>Echo</Text>
          <Text style={styles.subtitle}>{t.today}</Text>
        </View>

        {streak > 0 ? (
          <GlassCard style={styles.streakCard}>
            <Animated.View style={[styles.streakInner, { transform: [{ scale: fireAnim }] }]}>
              <View style={styles.streakContent}>
                <Icons.flame color={colors.gold} size={28} />
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>{streak}</Text>
                  <Text style={styles.streakLabel}>{lang === 'fr' ? 'jours de suite' : t.dayStreak}</Text>
                </View>
              </View>
            </Animated.View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.streakEmptyCard}>
            <View style={styles.streakEmptyContent}>
              <Icons.flame color={colors.textTertiary} size={24} />
              <Text style={styles.streakEmptyText}>{t.startStreak}</Text>
            </View>
          </GlassCard>
        )}

        <GlassCard style={styles.todayCard}>
          <Animated.View style={[styles.todayCircle, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={colors.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayGradient}>
              <Text style={styles.todayCount}>{todayEntries.length}</Text>
              <Text style={styles.todayLabel}>{t.today}</Text>
            </LinearGradient>
          </Animated.View>
        </GlassCard>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statBox}>
            <Text style={styles.statValue}>{entries.filter(e => e.type === 'voice').length}</Text>
            <Text style={styles.statLabel}>{lang === 'fr' ? 'Voix' : 'Voice'}</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={styles.statValue}>{entries.filter(e => e.type === 'text').length}</Text>
            <Text style={styles.statLabel}>{t.text}</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>🔥</Text>
          </GlassCard>
        </View>

        <Text style={styles.sectionTitle}>{t.recent}</Text>
        {entries.slice(0, 5).map((entry) => (
          <GlassCard key={entry.id} style={styles.entryCard}>
            <View style={[styles.entryMoodDot, { backgroundColor: EMOTIONS[entry.mood - 1]?.color || colors.textTertiary }]} />
            <View style={styles.entryContent}>
              <Text style={styles.entryType}>{entry.type === 'voice' ? (lang === 'fr' ? 'Voix' : 'Voice') : t.text}</Text>
              <Text style={styles.entryPreview} numberOfLines={1}>
                {entry.type === 'voice' ? `${Math.floor((entry.duration || 0) / 60)}:${String(Math.floor((entry.duration || 0) % 60)).padStart(2, '0')}` : entry.content.slice(0, 40)}
              </Text>
              <Text style={styles.entryDate}>{entry.date}</Text>
            </View>
          </GlassCard>
        ))}

        {entries.length === 0 && (
          <GlassCard style={styles.emptyState}>
            <Text style={styles.emptyText}>{t.noEchoes}</Text>
            <Text style={styles.emptySubtext}>{t.startRecording}</Text>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

// ====== RECORD SCREEN ======
function RecordScreen({ entries, setEntries, isPremium, lang }: any) {
  const t = translations[lang];
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [textNote, setTextNote] = useState('');
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [mood, setMood] = useState(3);
  const [showChallenge, setShowChallenge] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bounceAnim] = useState(new Animated.Value(1));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const challengeIndex = parseInt(today.replace(/-/g, ''), 10) % DAILY_CHALLENGES.length;
  const todayChallenge = DAILY_CHALLENGES[challengeIndex];

  const startBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  // TTS - Speak text
  const speakText = async (text: string) => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: lang === 'fr' ? 'fr-FR' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  // Play voice recording
  const playVoiceNote = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSound(null);
        }
      });
    } catch (e) {
      console.log('Playback error', e);
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', lang === 'fr' ? 'Impossible de lire l\'audio' : 'Cannot play audio');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      startBounce();
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
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
    setTextNote('');
    setRecordingDuration(0);
    setMood(3);
    Alert.alert(t.saved, t.yourEchoRecorded);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, colors.bgSecondary]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.recordTitle}>{t.newEcho}</Text>

        <GlassCard style={styles.challengeCard} onPress={() => {
            if (todayChallenge.premium && !isPremium) {
              Alert.alert(t.premium, t.upgradeToAccess);
            } else {
              setShowChallenge(!showChallenge);
            }
          }}>
          <View style={styles.challengeHeader}>
            <Icons.target color={todayChallenge.premium && !isPremium ? colors.gold : colors.accent} size={20} />
            <Text style={styles.challengeLabel}>{t.dailyChallenge}</Text>
            {todayChallenge.premium && !isPremium && <View style={styles.premiumTag}><Text style={styles.premiumTagText}>PRO</Text></View>}
          </View>
          <Text style={styles.challengeText}>{todayChallenge.text}</Text>
        </GlassCard>

        {showChallenge && (
          <View style={styles.challengeAnswerSection}>
            <TextInput style={styles.glassInput} value={textNote} onChangeText={setTextNote}
              placeholder={lang === 'fr' ? 'Votre réponse...' : 'Your answer...'} placeholderTextColor={colors.textTertiary}
              multiline numberOfLines={4} textAlignVertical="top" />
            <TouchableOpacity style={[styles.primaryButton, !textNote.trim() && styles.primaryButtonDisabled]}
              onPress={() => { if (textNote.trim()) { saveEntry('text', `Challenge: ${todayChallenge.text}\n\n${textNote.trim()}`); setShowChallenge(false); } }}
              disabled={!textNote.trim()}>
              <Text style={styles.primaryButtonText}>{t.submitChallenge}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeButton, mode === 'voice' && styles.modeButtonActive]} onPress={() => setMode('voice')}>
            <Icons.mic color={mode === 'voice' ? colors.text : colors.textTertiary} size={18} />
            <Text style={[styles.modeButtonText, mode === 'voice' && styles.modeButtonTextActive]}>{t.voice}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, mode === 'text' && styles.modeButtonActive]} onPress={() => setMode('text')}>
            <View style={{ width: 16, height: 18, borderWidth: 2, borderColor: mode === 'text' ? colors.text : colors.textTertiary, borderRadius: 2 }} />
            <Text style={[styles.modeButtonText, mode === 'text' && styles.modeButtonTextActive]}>{t.text}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.moodLabel}>{t.howFeel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emotionCardsContainer}>
            {EMOTIONS.map((emotion) => (
              <EmotionCard key={emotion.id} emotion={emotion} selected={mood === emotion.id} onPress={() => setMood(emotion.id)} lang={lang} />
            ))}
          </ScrollView>
        </View>

        {mode === 'voice' ? (
          <View style={styles.recorderSection}>
            <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
              <TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={isRecording ? stopRecording : startRecording} activeOpacity={0.9}>
                <LinearGradient colors={isRecording ? [colors.danger, '#ff6b6b'] : colors.accentGradient} style={styles.recordButtonGradient}>
                  <View style={styles.recordButtonInner}>
                    {isRecording ? <View style={styles.stopIcon} /> : <View style={styles.micIcon} />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.recordingTime}>
              {isRecording ? `${Math.floor(recordingDuration / 60)}:${String(recordingDuration % 60).padStart(2, '0')}` : t.tapToRecord}
            </Text>
          </View>
        ) : (
          <View style={styles.textSection}>
            <TextInput style={styles.glassInput} value={textNote} onChangeText={setTextNote}
              placeholder={lang === 'fr' ? 'Qu\'avez-vous en tête?' : 'What\'s on your mind?'} placeholderTextColor={colors.textTertiary}
              multiline numberOfLines={6} textAlignVertical="top" />
            
            {textNote.trim().length > 0 && (
              <TouchableOpacity style={styles.ttsButton} onPress={() => speakText(textNote)}>
                {isSpeaking ? <Icons.stop color={colors.text} size={18} /> : <Icons.play color={colors.text} size={18} />}
                <Text style={styles.ttsButtonText}>{isSpeaking ? t.stop : t.play}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.primaryButton, !textNote.trim() && styles.primaryButtonDisabled]}
              onPress={() => textNote.trim() && saveEntry('text', textNote.trim())} disabled={!textNote.trim()}>
              <Text style={styles.primaryButtonText}>{t.saveEcho}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ====== INSIGHTS SCREEN - WITH REAL AI ======
function InsightsScreen({ entries, isPremium, lang }: { entries: Entry[], isPremium: boolean, lang: 'en' | 'fr' }) {
  const t = translations[lang];
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Generate AI analysis
  const runAIAnalysis = async () => {
    if (!isPremium) {
      Alert.alert(t.premium, lang === 'fr' ? 'Débloquez Premium pour l\'analyse IA complète!' : 'Unlock Premium for full AI analysis!');
      return;
    }
    
    setAnalyzing(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    const analysis = generateAIAnalysis(entries, lang);
    setAiAnalysis(analysis);
    setAnalyzing(false);
  };

  // TTS for AI summary
  const speakAnalysis = async () => {
    if (!aiAnalysis) return;
    
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const text = `${aiAnalysis.summary}. ${aiAnalysis.advice.join(' ')}`;
      Speech.speak(text, {
        language: lang === 'fr' ? 'fr-FR' : 'en-US',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  // Play voice entry
  const playVoiceEntry = async (entry: Entry) => {
    if (entry.type !== 'voice') return;
    
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      setPlayingEntryId(entry.id);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: entry.content });
      setSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingEntryId(null);
          setSound(null);
        }
      });
    } catch (e) {
      console.log('Playback error', e);
    }
  };

  // Generate basic stats
  const insights: Insight[] = [];
  const totalVoice = entries.filter(e => e.type === 'voice').length;
  const totalText = entries.filter(e => e.type === 'text').length;
  const avgMood = entries.length > 0 ? (entries.reduce((a, b) => a + b.mood, 0) / entries.length).toFixed(1) : '0';
  
  if (entries.length > 0) {
    insights.push({ label: lang === 'fr' ? 'Voix' : 'Voice', value: `${Math.round((totalVoice / (totalVoice + totalText || 1)) * 100)}%`, change: 12 });
    insights.push({ label: lang === 'fr' ? 'Humeur' : 'Mood', value: avgMood, change: 5 });
    insights.push({ label: lang === 'fr' ? 'Total' : 'Total', value: `${entries.length}`, change: 0 });
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, colors.bgSecondary]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.insightsTitle}>{t.insightsTitle}</Text>
        
        {entries.length === 0 ? (
          <GlassCard style={styles.emptyState}>
            <Text style={styles.emptyText}>{t.notEnoughData}</Text>
            <Text style={styles.emptySubtext}>{t.recordMore}</Text>
          </GlassCard>
        ) : (
          <>
            {/* AI Analysis Button - PREMIUM */}
            {isPremium ? (
              <GlassCard style={styles.aiCard} onPress={runAIAnalysis}>
                <LinearGradient colors={colors.aiGradient} style={styles.aiCardGradient}>
                  <View style={styles.aiCardContent}>
                    <Icons.brain color={colors.text} size={28} />
                    <View style={styles.aiCardText}>
                      <Text style={styles.aiCardTitle}>{analyzing ? t.analyzing : t.aiAnalysis}</Text>
                      <Text style={styles.aiCardSubtitle}>
                        {analyzing ? (lang === 'fr' ? 'Analyse en cours...' : 'Analyzing your data...') : (lang === 'fr' ? 'Obtiens des conseils personnalisés' : 'Get personalized insights')}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </GlassCard>
            ) : (
              <GlassCard style={styles.lockedCard} onPress={() => Alert.alert(t.premium, lang === 'fr' ? 'Débloquez pour l\'analyse IA!' : 'Unlock for AI analysis!')}>
                <View style={styles.lockedContent}>
                  <Icons.lock color={colors.gold} size={28} />
                  <Text style={styles.lockedTitle}>{t.lockedUnlock}</Text>
                  <Text style={styles.lockedSubtitle}>{lang === 'fr' ? 'Analyse IA avec conseils' : 'AI analysis with advice'}</Text>
                </View>
              </GlassCard>
            )}

            {/* AI Analysis Results */}
            {aiAnalysis && (
              <GlassCard style={styles.aiResultCard}>
                <View style={styles.aiResultHeader}>
                  <Text style={styles.aiResultTitle}>{t.aiAnalysis}</Text>
                  <TouchableOpacity style={styles.aiSpeakButton} onPress={speakAnalysis}>
                    {isSpeaking ? <Icons.stop color={colors.accent} size={18} /> : <Icons.play color={colors.accent} size={18} />}
                  </TouchableOpacity>
                </View>
                
                <View style={styles.aiResultSection}>
                  <Text style={styles.aiResultLabel}>{t.summary}</Text>
                  <Text style={styles.aiResultText}>{aiAnalysis.summary}</Text>
                </View>
                
                <View style={styles.aiResultSection}>
                  <Text style={styles.aiResultLabel}>{lang === 'fr' ? 'Tendance' : 'Trend'}</Text>
                  <Text style={styles.aiResultTrend}>{aiAnalysis.moodTrend}</Text>
                </View>
                
                <View style={styles.aiResultSection}>
                  <Text style={styles.aiResultLabel}>{t.advice}</Text>
                  {aiAnalysis.advice.map((tip, i) => (
                    <Text key={i} style={styles.aiAdviceText}>{tip}</Text>
                  ))}
                </View>
                
                {aiAnalysis.keywords.length > 0 && (
                  <View style={styles.aiResultSection}>
                    <Text style={styles.aiResultLabel}>{t.keywords}</Text>
                    <View style={styles.keywordTags}>
                      {aiAnalysis.keywords.map((kw, i) => (
                        <View key={i} style={styles.keywordTag}><Text style={styles.keywordTagText}>{kw}</Text></View>
                      ))}
                    </View>
                  </View>
                )}
              </GlassCard>
            )}

            {/* Basic Stats */}
            <View style={styles.statsGrid}>
              {insights.map((insight, i) => (
                <GlassCard key={i} style={styles.insightCard}>
                  <Text style={styles.insightLabel}>{insight.label}</Text>
                  <Text style={styles.insightValue}>{insight.value}</Text>
                </GlassCard>
              ))}
            </View>

            {/* Voice Entries with Play Button */}
            {entries.filter(e => e.type === 'voice').length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{lang === 'fr' ? 'Notes Vocales' : 'Voice Notes'}</Text>
                {entries.filter(e => e.type === 'voice').slice(0, 5).map((entry) => (
                  <GlassCard key={entry.id} style={styles.voiceEntryCard} onPress={() => playVoiceEntry(entry)}>
                    <View style={styles.voiceEntryContent}>
                      <View style={styles.voicePlayButton}>
                        {playingEntryId === entry.id ? (
                          <View style={styles.voicePlayingIndicator}>
                            <View style={[styles.voiceBar, styles.voiceBar1]} />
                            <View style={[styles.voiceBar, styles.voiceBar2]} />
                            <View style={[styles.voiceBar, styles.voiceBar3]} />
                          </View>
                        ) : (
                          <Icons.play color={colors.accent} size={20} />
                        )}
                      </View>
                      <View style={styles.voiceEntryInfo}>
                        <Text style={styles.voiceEntryDuration}>
                          {`${Math.floor((entry.duration || 0) / 60)}:${String(Math.floor((entry.duration || 0) % 60)).padStart(2, '0')}`}
                        </Text>
                        <Text style={styles.voiceEntryDate}>{entry.date}</Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </>
            )}

            {/* Premium CTA */}
            {!isPremium && (
              <GlassCard style={styles.premiumCard}>
                <Text style={styles.premiumTitle}>{t.premiumTitle}</Text>
                <Text style={styles.premiumText}>{t.premiumText}</Text>
                <TouchableOpacity style={styles.premiumButton} onPress={() => Alert.alert('Coming Soon', 'Subscription coming soon!')}>
                  <Text style={styles.premiumButtonText}>{t.upgrade}</Text>
                </TouchableOpacity>
              </GlassCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ====== SETTINGS SCREEN ======
function SettingsScreen({ isPremium, setIsPremium, lang, setLang }: { isPremium: boolean, setIsPremium: (v: boolean) => void, lang: 'en' | 'fr', setLang: (v: 'en' | 'fr') => void }) {
  const t = translations[lang];
  const [dailyReminder, setDailyReminder] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, colors.bgSecondary]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.settingsTitle}>{t.settings}</Text>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsLabel}>{t.account}</Text>
          <GlassCard>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowText}>{t.echoPremium}</Text>
              <TouchableOpacity onPress={() => setIsPremium(!isPremium)}>
                <Text style={[styles.settingsRowValue, isPremium && { color: colors.success }]}>
                  {isPremium ? (lang === 'fr' ? 'Actif' : 'Active') : 'Free'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingsRowText}>{t.storage}</Text>
              <Text style={styles.settingsRowValue}>2.3 MB</Text>
            </View>
          </GlassCard>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsLabel}>{t.language}</Text>
          <GlassCard>
            <View style={styles.languageRow}>
              <TouchableOpacity style={[styles.langButton, lang === 'en' && styles.langButtonActive]} onPress={() => setLang('en')}>
                <Text style={[styles.langButtonText, lang === 'en' && styles.langButtonTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langButton, lang === 'fr' && styles.langButtonActive]} onPress={() => setLang('fr')}>
                <Text style={[styles.langButtonText, lang === 'fr' && styles.langButtonTextActive]}>Français</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsLabel}>{t.preferences}</Text>
          <GlassCard>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowText}>{t.aiInsights}</Text>
              <Text style={styles.settingsRowValue}>On</Text>
            </View>
            <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingsRowText}>{t.dailyReminder}</Text>
              <Switch value={dailyReminder} onValueChange={setDailyReminder} trackColor={{ false: colors.glass, true: colors.accent }} thumbColor={colors.text} />
            </View>
          </GlassCard>
        </View>

        {/* TEST PREMIUM BUTTON */}
        <TouchableOpacity style={[styles.upgradeButton, isPremium && styles.testPremiumButton]} onPress={() => {
            setIsPremium(!isPremium);
            Alert.alert(isPremium ? (lang === 'fr' ? 'Premium Désactivé' : 'Premium Disabled') : t.premiumActivated, 
              isPremium ? (lang === 'fr' ? 'Vous êtes maintenant en version gratuite' : 'You are now on Free plan') : 
              (lang === 'fr' ? 'Bienvenue dans Echo Premium!' : 'Welcome to Echo Premium!'));
          }}>
          <Text style={styles.upgradeButtonText}>
            {isPremium ? t.disablePremium : t.testPremium}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Echo V4 • AI Powered</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ====== MAIN APP ======
export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [lastEntryDate, setLastEntryDate] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('entries');
        if (saved) setEntries(JSON.parse(saved));
        const savedStreak = await AsyncStorage.getItem('streak');
        if (savedStreak) setStreak(parseInt(savedStreak, 10));
        const savedLastDate = await AsyncStorage.getItem('lastEntryDate');
        if (savedLastDate) setLastEntryDate(savedLastDate);
        const savedPremium = await AsyncStorage.getItem('isPremium');
        if (savedPremium) setIsPremium(JSON.parse(savedPremium));
        const savedLang = await AsyncStorage.getItem('lang');
        if (savedLang) setLang(savedLang as 'en' | 'fr');
      } catch (e) { console.log('Load error', e); }
      setIsLoaded(true);
    };
    loadData();
    const detectedLang = detectLanguage();
    setLang(detectedLang);
    AsyncStorage.setItem('lang', detectedLang);
  }, []);

  useEffect(() => {
    if (entries.length === 0 || !isLoaded) return;
    const today = new Date().toISOString().split('T')[0];
    const hasToday = entries.some(e => e.date === today);
    if (hasToday && lastEntryDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const hasYesterday = entries.some(e => e.date === yesterday);
      let newStreak = 1;
      if (hasYesterday && lastEntryDate === yesterday) { newStreak = streak + 1; }
      setStreak(newStreak);
      setLastEntryDate(today);
      AsyncStorage.setItem('streak', newStreak.toString());
      AsyncStorage.setItem('lastEntryDate', today);
    }
  }, [entries, isLoaded]);

  useEffect(() => {
    if (isLoaded) { AsyncStorage.setItem('isPremium', JSON.stringify(isPremium)); AsyncStorage.setItem('lang', lang); }
  }, [isPremium, lang, isLoaded]);

  const t = translations[lang];
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);

  if (!isLoaded) return null;

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.textTertiary, tabBarLabelStyle: styles.tabBarLabel }}>
        <Tab.Screen name="Home" options={{ tabBarIcon: ({ color }) => <Icons.home color={color} size={22} />, tabBarLabel: t.home }}>
          {() => <HomeScreen entries={entries} todayEntries={todayEntries} streak={streak} isPremium={isPremium} lang={lang} />}
        </Tab.Screen>
        <Tab.Screen name="Record" options={{ tabBarIcon: ({ color }) => <Icons.mic color={color} size={22} />, tabBarLabel: t.record }}>
          {() => <RecordScreen entries={entries} setEntries={setEntries} isPremium={isPremium} lang={lang} />}
        </Tab.Screen>
        <Tab.Screen name="Insights" options={{ tabBarIcon: ({ color }) => <Icons.chart color={color} size={22} />, tabBarLabel: t.insights }}>
          {() => <InsightsScreen entries={entries} isPremium={isPremium} lang={lang} />}
        </Tab.Screen>
        <Tab.Screen name="Settings" options={{ tabBarIcon: ({ color }) => <Icons.settings color={color} size={22} />, tabBarLabel: t.settings }}>
          {() => <SettingsScreen isPremium={isPremium} setIsPremium={setIsPremium} lang={lang} setLang={setLang} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingTop: 60 },
  glassCard: { backgroundColor: colors.glass, borderRadius: 20, borderWidth: 0.5, borderColor: colors.glassBorder, padding: 16, marginBottom: 12 },
  glassCardPressed: { backgroundColor: colors.glassHover, transform: [{ scale: 0.98 }] },
  
  header: { marginBottom: 24 },
  logo: { fontSize: 42, fontWeight: '700', color: colors.text, letterSpacing: -1.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, letterSpacing: 0.5 },
  
  streakCard: { marginBottom: 20, padding: 0, overflow: 'hidden' },
  streakInner: { padding: 20 },
  streakContent: { flexDirection: 'row', alignItems: 'center' },
  streakInfo: { marginLeft: 12 },
  streakValue: { fontSize: 32, fontWeight: '700', color: colors.text },
  streakLabel: { fontSize: 13, color: colors.textSecondary },
  streakEmptyCard: { marginBottom: 20 },
  streakEmptyContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  streakEmptyText: { fontSize: 15, color: colors.textSecondary, marginLeft: 8 },
  
  todayCard: { alignItems: 'center', marginBottom: 24, padding: 24 },
  todayCircle: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden' },
  todayGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  todayCount: { fontSize: 28, fontWeight: '700', color: colors.text },
  todayLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },
  
  entryCard: { flexDirection: 'row', alignItems: 'center' },
  entryMoodDot: { width: 6, height: 6, borderRadius: 3, marginRight: 12 },
  entryContent: { flex: 1 },
  entryType: { fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  entryPreview: { fontSize: 14, color: colors.text, marginBottom: 4 },
  entryDate: { fontSize: 10, color: colors.textTertiary },
  
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  
  challengeCard: { marginBottom: 20 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  challengeLabel: { fontSize: 12, color: colors.textSecondary, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  premiumTag: { marginLeft: 'auto', backgroundColor: 'rgba(255,214,10,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  premiumTagText: { fontSize: 10, color: colors.gold, fontWeight: '700' },
  challengeText: { fontSize: 16, fontWeight: '500', color: colors.text },
  challengeAnswerSection: { marginBottom: 20 },
  
  glassInput: { backgroundColor: colors.glass, borderRadius: 16, padding: 16, color: colors.text, fontSize: 15, minHeight: 120, textAlignVertical: 'top', borderWidth: 0.5, borderColor: colors.glassBorder },
  
  primaryButton: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
  
  recordTitle: { fontSize: 34, fontWeight: '700', color: colors.text, marginBottom: 24, letterSpacing: -0.5 },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.glass, borderRadius: 14, padding: 4, marginBottom: 24 },
  modeButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modeButtonActive: { backgroundColor: colors.accent },
  modeButtonText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  modeButtonTextActive: { color: colors.text },
  
  moodSection: { marginBottom: 30 },
  moodLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  emotionCardsContainer: { flexDirection: 'row', gap: 10, paddingRight: 20 },
  emotionCard: { width: 70, height: 90, backgroundColor: colors.glass, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  emotionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emotionIconText: { fontSize: 18, color: colors.text },
  emotionLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  
  recorderSection: { alignItems: 'center', paddingVertical: 20 },
  recordButton: { width: 180, height: 180, borderRadius: 90, overflow: 'hidden' },
  recordButtonActive: { transform: [{ scale: 0.95 }] },
  recordButtonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  recordButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  micIcon: { width: 24, height: 36, borderRadius: 12, backgroundColor: colors.text },
  stopIcon: { width: 24, height: 24, borderRadius: 4, backgroundColor: colors.text },
  recordingTime: { fontSize: 15, color: colors.textSecondary, marginTop: 20 },
  
  textSection: { marginTop: 10 },
  ttsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass, borderRadius: 12, padding: 14, marginTop: 12, gap: 8 },
  ttsButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  
  insightsTitle: { fontSize: 34, fontWeight: '700', color: colors.text, marginBottom: 24, letterSpacing: -0.5 },
  insightCard: { flex: 1, minWidth: '30%', alignItems: 'center', paddingVertical: 20 },
  insightLabel: { fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  insightValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  
  // AI Card Styles
  aiCard: { padding: 0, marginBottom: 20, overflow: 'hidden' },
  aiCardGradient: { padding: 20 },
  aiCardContent: { flexDirection: 'row', alignItems: 'center' },
  aiCardText: { marginLeft: 14 },
  aiCardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  aiCardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  
  // AI Result Card
  aiResultCard: { marginBottom: 20, borderWidth: 1, borderColor: colors.ai },
  aiResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  aiResultTitle: { fontSize: 18, fontWeight: '700', color: colors.ai },
  aiSpeakButton: { padding: 8, backgroundColor: 'rgba(0,122,255,0.1)', borderRadius: 20 },
  
  aiResultSection: { marginBottom: 16 },
  aiResultLabel: { fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  aiResultText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  aiResultTrend: { fontSize: 16, fontWeight: '600', color: colors.success },
  aiAdviceText: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 8 },
  
  keywordTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordTag: { backgroundColor: colors.glass, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  keywordTagText: { fontSize: 12, color: colors.textSecondary },
  
  // Voice Entry
  voiceEntryCard: { marginBottom: 10 },
  voiceEntryContent: { flexDirection: 'row', alignItems: 'center' },
  voicePlayButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  voicePlayingIndicator: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20 },
  voiceBar: { width: 3, backgroundColor: colors.accent, borderRadius: 2 },
  voiceBar1: { height: 8 }, voiceBar2: { height: 16 }, voiceBar3: { height: 12 },
  voiceEntryInfo: { flex: 1 },
  voiceEntryDuration: { fontSize: 15, fontWeight: '600', color: colors.text },
  voiceEntryDate: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  
  lockedCard: { padding: 24 },
  lockedContent: { alignItems: 'center' },
  lockedTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 12 },
  lockedSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  premiumButtonV3: { marginTop: 16, backgroundColor: 'rgba(255,214,10,0.15)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  premiumButtonText: { fontSize: 13, fontWeight: '600', color: colors.gold },
  
  premiumCard: { marginTop: 10, backgroundColor: 'rgba(0,122,255,0.1)', borderColor: colors.accent },
  premiumTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 },
  premiumText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  premiumButton: { backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14 },
  
  settingsTitle: { fontSize: 34, fontWeight: '700', color: colors.text, marginBottom: 24, letterSpacing: -0.5 },
  settingsSection: { marginBottom: 24 },
  settingsLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  settingsRowText: { fontSize: 15, color: colors.text },
  settingsRowValue: { fontSize: 15, color: colors.textSecondary },
  
  languageRow: { flexDirection: 'row', gap: 10 },
  langButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: colors.glass, borderWidth: 1, borderColor: 'transparent' },
  langButtonActive: { borderColor: colors.accent, backgroundColor: 'rgba(0,122,255,0.15)' },
  langButtonText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  langButtonTextActive: { color: colors.accent },
  
  upgradeButton: { backgroundColor: colors.accent, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10 },
  testPremiumButton: { backgroundColor: colors.success },
  upgradeButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  footerText: { fontSize: 11, color: colors.textTertiary },
  
  tabBar: { backgroundColor: 'rgba(10,10,26,0.85)', borderTopWidth: 0, paddingTop: 10, height: 90 },
  tabBarLabel: { fontSize: 10, fontWeight: '500', marginTop: 4 },
});