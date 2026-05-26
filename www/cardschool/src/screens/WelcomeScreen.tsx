import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useUserStore } from '@/store/userStore';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const initGuest = useUserStore((s) => s.initGuest);

  const handleGuest = () => {
    initGuest();
    // AppNavigator will detect user != null and render MainTabs
  };

  const handleSignUp = () => {
    // TODO V1.5: implement email/social auth via Supabase
    // For now, treat as guest with a prompt
    initGuest();
  };

  return (
    <LinearGradient
      colors={['#0F2318', '#1A3C2E', '#0F2318']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.suits}>♠ ♥ ♦ ♣</Text>
          <Text style={styles.title}>CardSchool</Text>
          <Text style={styles.tagline}>Learn card games step by step.{'\n'}Feel confident at any table.</Text>
        </View>

        {/* Feature pills */}
        <View style={styles.features}>
          {['🎓 Interactive lessons', '💡 Live coach hints', '🤖 AI practice opponents'].map((f) => (
            <View key={f} style={styles.featurePill}>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleGuest} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>Play as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleSignUp} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            For entertainment & learning only — no real money involved.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'space-between', paddingVertical: Spacing.xl },

  hero: { alignItems: 'center', marginTop: Spacing.xxl },
  suits: { fontSize: 32, letterSpacing: 10, marginBottom: Spacing.sm, color: Colors.gold },
  title: {
    fontSize: Typography.size.hero,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.size.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },

  features: { gap: Spacing.sm },
  featurePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureText: { color: Colors.textPrimary, fontSize: Typography.size.md, textAlign: 'center' },

  ctas: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#0a0a0a', fontSize: Typography.size.lg, fontWeight: '700' },

  btnSecondary: {
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: { color: Colors.gold, fontSize: Typography.size.lg, fontWeight: '600' },

  disclaimer: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
