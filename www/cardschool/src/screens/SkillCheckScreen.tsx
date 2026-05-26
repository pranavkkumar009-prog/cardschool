import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SkillCheck'>;

export function SkillCheckScreen({ navigation }: Props) {
  const [answer, setAnswer] = useState<'new' | 'some' | null>(null);
  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Quick question 👋</Text>
        <Text style={styles.sub}>Have you played Texas Hold'em before?</Text>
        <View style={styles.options}>
          {([['new', "I'm completely new", '📖 Start from Lesson 1'], ['some', 'I know the basics', '⚡ Jump to Lesson 3']] as const).map(([id, label, action]) => (
            <TouchableOpacity key={id} style={[styles.option, answer === id && styles.optionActive]} onPress={() => setAnswer(id)}>
              <Text style={styles.optionLabel}>{label}</Text>
              <Text style={styles.optionAction}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.btn, !answer && styles.btnDisabled]} disabled={!answer} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.btnText}>Continue →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1, padding: Spacing.xl, justifyContent: 'center', gap: Spacing.xl },
  title: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.gold },
  sub: { fontSize: Typography.size.lg, color: Colors.textSecondary },
  options: { gap: Spacing.md },
  option: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border },
  optionActive: { borderColor: Colors.gold, backgroundColor: 'rgba(212,175,55,0.1)' },
  optionLabel: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.textPrimary },
  optionAction: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 4 },
  btn: { backgroundColor: Colors.gold, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#0a0a0a', fontWeight: '700', fontSize: Typography.size.lg },
});
