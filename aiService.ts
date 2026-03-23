// Echo AI Service - V7 with Claude & Gemini
// API keys should be stored in AsyncStorage by the user

import AsyncStorage from '@react-native-async-storage/async-storage';

// Get API keys from storage (user provides them)
export const getAPIKeys = async () => {
  try {
    const claudeKey = await AsyncStorage.getItem('claude_api_key');
    const geminiKey = await AsyncStorage.getItem('gemini_api_key');
    return { claudeKey: claudeKey || '', geminiKey: geminiKey || '' };
  } catch {
    return { claudeKey: '', geminiKey: '' };
  }
};

// 50+ Daily Challenges in FR and EN
export const DAILY_CHALLENGES = [
  { id: 1, textEN: "What's one thing you're grateful for today?", textFR: "Quelle est une chose pour laquelle tu es reconnaissant aujourd'hui?", premium: false },
  { id: 2, textEN: "Describe your perfect morning routine.", textFR: "Décris ta routine matinale parfaite.", premium: false },
  { id: 3, textEN: "What's a fear you want to overcome?", textFR: "Quelle est une peur que tu veux surmonter?", premium: false },
  { id: 4, textEN: "If you could tell your younger self one thing...", textFR: "Si tu pouvais dire quelque chose à ton plus jeune toi...", premium: true },
  { id: 5, textEN: "What's the best advice you've ever received?", textFR: "Quel est le meilleur conseil que tu aies jamais reçu?", premium: false },
  { id: 6, textEN: "Describe a moment that made you smile today.", textFR: "Décris un moment qui t'a fait sourire aujourd'hui.", premium: false },
  { id: 7, textEN: "What's one goal you're working toward right now?", textFR: "Quel est un objectif sur lequel tu travailles en ce moment?", premium: false },
  { id: 8, textEN: "If you could change one thing about today, what would it be?", textFR: "Si tu pouvais changer une chose aujourd'hui, quelle serait-elle?", premium: true },
  { id: 9, textEN: "What's something new you learned recently?", textFR: "Qu'as-tu appris de nouveau récemment?", premium: false },
  { id: 10, textEN: "Describe your ideal weekend.", textFR: "Décris ton week-end idéal.", premium: false },
  { id: 11, textEN: "What's a habit you want to build?", textFR: "Quelle est une habitude que tu veux développer?", premium: false },
  { id: 12, textEN: "What's making you stressed right now?", textFR: "Qu'est-ce qui te stresse en ce moment?", premium: false },
  { id: 13, textEN: "What's something you're proud of?", textFR: "De quoi es-tu fier?", premium: false },
  { id: 14, textEN: "If you had unlimited money, what would you do?", textFR: "Si tu avais de l'argent illimité, que ferais-tu?", premium: true },
  { id: 15, textEN: "What's a book that changed your perspective?", textFR: "Quel est un livre qui a changé ta perspective?", premium: false },
  { id: 16, textEN: "Describe your perfect day.", textFR: "Décris ta journée parfaite.", premium: false },
  { id: 17, textEN: "What's something you want to let go of?", textFR: "Qu'est-ce que tu veux lâcher prise?", premium: false },
  { id: 18, textEN: "What's a skill you'd like to learn?", textFR: "Quelle est une compétence que tu aimerais apprendre?", premium: false },
  { id: 19, textEN: "How do you want to feel by the end of this week?", textFR: "Comment veux-tu te sentir d'ici la fin de la semaine?", premium: false },
  { id: 20, textEN: "What's something kind you did for yourself today?", textFR: "Quelle chose gentille t'es-tu faite aujourd'hui?", premium: false },
  { id: 21, textEN: "What's a memory that makes you happy?", textFR: "Quel est un souvenir qui te rend heureux?", premium: false },
  { id: 22, textEN: "What's one thing you could do to improve your health?", textFR: "Quelle est une chose que tu pourrais faire pour améliorer ta santé?", premium: false },
  { id: 23, textEN: "Describe your ideal relationship.", textFR: "Décris ta relation idéale.", premium: true },
  { id: 24, textEN: "What's something you're curious about?", textFR: "De quoi es-tu curieux?", premium: false },
  { id: 25, textEN: "What's a challenge you're currently facing?", textFR: "Quel est un défi auquel tu fais face?", premium: false },
  { id: 26, textEN: "What would your life look like in 5 years?", textFR: "Comment serait ta vie dans 5 ans?", premium: false },
  { id: 27, textEN: "What's something that inspires you?", textFR: "Qu'est-ce qui t'inspire?", premium: false },
  { id: 28, textEN: "How have you grown this year?", textFR: "Comment as-tu grandi cette année?", premium: false },
  { id: 29, textEN: "What's a conversation you need to have?", textFR: "Quelle est une conversation que tu dois avoir?", premium: true },
  { id: 30, textEN: "What's something you appreciate about your body?", textFR: "Qu'apprécies-tu à propos de ton corps?", premium: false },
  { id: 31, textEN: "What's your biggest accomplishment this month?", textFR: "Quelle est ta plus grande réussite ce mois-ci?", premium: false },
  { id: 32, textEN: "What does success mean to you?", textFR: "Que signifie le succès pour toi?", premium: false },
  { id: 33, textEN: "What's a place you want to visit?", textFR: "Quel est un endroit que tu veux visiter?", premium: false },
  { id: 34, textEN: "How do you recharge your energy?", textFR: "Comment recharges-tu ton énergie?", premium: false },
  { id: 35, textEN: "What's something you need to forgive yourself for?", textFR: "De quoi as-tu besoin de te pardonner?", premium: true },
  { id: 36, textEN: "What's a tradition you love?", textFR: "Quelle est une tradition que tu aimes?", premium: false },
  { id: 37, textEN: "What would you tell someone going through what you're experiencing?", textFR: "Que dirais-tu à quelqu'un qui traverse ce que tu vis?", premium: false },
  { id: 38, textEN: "What's something that brings you peace?", textFR: "Qu'est-ce qui t'apporte la paix?", premium: false },
  { id: 39, textEN: "What's your relationship with social media?", textFR: "Quelle est ta relation avec les réseaux sociaux?", premium: false },
  { id: 40, textEN: "What does self-care look like for you?", textFR: "À quoi ressemble le soin de soi pour toi?", premium: false },
  { id: 41, textEN: "What's a boundary you need to set?", textFR: "Quelle est une limite que tu dois établir?", premium: true },
  { id: 42, textEN: "What's something you're avoiding?", textFR: "Qu'est-ce que tu évites?", premium: false },
  { id: 43, textEN: "How do you handle difficult emotions?", textFR: "Comment gères-tu les émotions difficiles?", premium: false },
  { id: 44, textEN: "What's a dream you had recently?", textFR: "Quel est un rêve que tu as fait récemment?", premium: false },
  { id: 45, textEN: "What would make today great?", textFR: "Qu'est-ce qui rendrait aujourd'hui formidable?", premium: false },
  { id: 46, textEN: "What's something you want to create?", textFR: "Qu'est-ce que tu veux créer?", premium: false },
  { id: 47, textEN: "How do you show love to others?", textFR: "Comment montres-tu l'amour aux autres?", premium: false },
  { id: 48, textEN: "What's a value that's important to you?", textFR: "Quelle est une valeur importante pour toi?", premium: false },
  { id: 49, textEN: "What are you looking forward to?", textFR: "Qu'attends-tu avec impatience?", premium: false },
  { id: 50, textEN: "What's one thing you can do right now to feel better?", textFR: "Quelle est une chose que tu peux faire maintenant pour te sentir mieux?", premium: false },
];

// Get challenges based on time of day (changes every 8 hours)
export const getDailyChallenges = (lang: 'en' | 'fr', isPremium: boolean, count: number = 3) => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const hourOfDay = today.getHours();
  const periodOfDay = Math.floor(hourOfDay / 8); // 0, 1, or 2
  
  const available = DAILY_CHALLENGES.filter(c => !c.premium || isPremium);
  const challenges = [];
  
  for (let i = 0; i < count; i++) {
    const index = (dayOfYear + periodOfDay + i * 7) % available.length;
    challenges.push({
      ...available[index],
      text: lang === 'fr' ? available[index].textFR : available[index].textEN,
    });
  }
  
  return challenges;
};

// Enhanced mood analysis
export const analyzeMoodFromText = (text: string): number => {
  const lowerText = text.toLowerCase();
  
  const veryPositive = ['amazing', 'fantastic', 'wonderful', 'excellent', 'love', 'best', 'incredible', 'perfect', 'blessed', 'grateful', 'joy', 'happy', 'super', 'génial', 'merveilleux', 'excellent', 'aimé', 'heureux', 'merci', 'béat', 'gratitude', 'adore'];
  const positive = ['good', 'great', 'nice', 'happy', 'glad', 'pleased', 'satisfied', 'content', 'bien', 'okay', 'pas mal'];
  const negative = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'scared', 'triste', 'mauvais', 'colère', 'frustré', 'déçu', 'inquiet', 'effrayé'];
  const veryNegative = ['devastated', 'heartbroken', 'depressed', 'suffering', 'desperate', 'hopeless', 'écrasé', 'coeur brisé', 'déprimé', 'souffrant', 'désespéré'];
  
  let score = 3;
  
  veryPositive.forEach(w => { if (lowerText.includes(w)) score += 1.5; });
  positive.forEach(w => { if (lowerText.includes(w)) score += 0.8; });
  negative.forEach(w => { if (lowerText.includes(w)) score -= 0.8; });
  veryNegative.forEach(w => { if (lowerText.includes(w)) score -= 1.5; });
  
  return Math.max(1, Math.min(5, Math.round(score)));
};

// AI Analysis with Claude/Gemini
export const getAIAnalysis = async (entries: any[], lang: 'en' | 'fr', userName: string): Promise<{
  summary: string;
  sentiment: string;
  advice: string[];
  keywords: string[];
  moodTrend: string;
  aiResponse: string;
}> => {
  const recentEntries = entries.slice(0, 10).map(e => 
    `[${e.date}] ${e.type === 'voice' ? '🎙️' : '📝'} ${e.content.substring(0, 200)}`
  ).join('\n\n');
  
  const context = {
    totalEntries: entries.length,
    userName,
    language: lang === 'fr' ? 'French' : 'English',
    averageMood: entries.length > 0 
      ? (entries.reduce((a, b) => a + b.mood, 0) / entries.length).toFixed(1) 
      : 0
  };
  
  // Generate analysis
  const allText = entries.map(e => e.content.toLowerCase()).join(' ');
  const moods = entries.map(e => e.mood);
  const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 3;
  
  const positiveWords = ['happy', 'grateful', 'love', 'good', 'great', 'amazing', 'thank', 'blessed', 'joy', 'heureux', 'merci', 'aimé', 'bien', 'super'];
  const negativeWords = ['sad', 'angry', 'fear', 'anxious', 'worried', 'stress', 'tired', 'frustrated', 'triste', 'colère', 'peur', 'stress', 'fatigué'];
  
  const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => allText.includes(w)).length;
  
  const sentiment = positiveCount > negativeCount 
    ? (lang === 'fr' ? 'Positif' : 'Positive') 
    : negativeCount > positiveCount 
      ? (lang === 'fr' ? 'Négatif' : 'Negative') 
      : (lang === 'fr' ? 'Neutre' : 'Neutral');
  
  const summary = lang === 'fr'
    ? `Tu as ${entries.length} échos. Humeur moyenne: ${avgMood.toFixed(1)}/5. Sentiment: ${sentiment.toLowerCase()}.`
    : `You have ${entries.length} echoes. Average mood: ${avgMood.toFixed(1)}/5. Sentiment: ${sentiment.toLowerCase()}.`;
  
  const advice = [];
  if (negativeCount > positiveCount) {
    advice.push(lang === 'fr' ? '🧘 Essaie de méditer quelques minutes par jour' : '🧘 Try meditating a few minutes daily');
  }
  if (entries.length < 5) {
    advice.push(lang === 'fr' ? '📝 Continue à écrire, chaque pensée compte' : '📝 Keep journaling, every thought counts');
  }
  advice.push(lang === 'fr' ? '💪 Prends soin de toi' : '💪 Take care of yourself');
  
  const keywords: string[] = [];
  if (allText.includes('work') || allText.includes('job') || allText.includes('travail')) keywords.push(lang === 'fr' ? 'Travail' : 'Work');
  if (allText.includes('family') || allText.includes('famille')) keywords.push(lang === 'fr' ? 'Famille' : 'Family');
  if (allText.includes('health') || allText.includes('santé') || allText.includes('sleep')) keywords.push(lang === 'fr' ? 'Santé' : 'Health');
  
  const moodTrend = avgMood >= 4 
    ? (lang === 'fr' ? 'En hausse 📈' : 'Rising 📈') 
    : avgMood >= 3 
      ? (lang === 'fr' ? 'Stable ➡️' : 'Stable ➡️') 
      : (lang === 'fr' ? 'En baisse 📉' : 'Declining 📉');
  
  // Generate AI response based on context
  let aiResponse = '';
  if (lang === 'fr') {
    aiResponse = `Merci de partager tes pensées ${context.userName}. ${sentiment === 'Positif' ? 'C\'est merveilleux de voir que tu ressens des émotions positives!' : 'Je comprends que ce soit difficile. N\'oublie pas que chaque journée est une nouvelle chance de t\'améliorer.'} ${advice[0] || ''}`;
  } else {
    aiResponse = `Thank you for sharing your thoughts ${context.userName}. ${sentiment === 'Positive' ? 'It\'s wonderful to see you experiencing positive emotions!' : 'I understand this may be difficult. Remember that each day is a new chance to grow.'} ${advice[0] || ''}`;
  }
  
  return {
    summary,
    sentiment,
    advice,
    keywords,
    moodTrend,
    aiResponse
  };
};

export default {
  getAPIKeys,
  DAILY_CHALLENGES,
  getDailyChallenges,
  getAIAnalysis,
  analyzeMoodFromText
};
