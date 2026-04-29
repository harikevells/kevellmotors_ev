import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { referralAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Referral } from '../types';
import { Share as ShareIcon, Users, Gift } from 'lucide-react-native';

const ReferralsScreen: React.FC = () => {
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await referralAPI.getMyReferral();
      setReferral(res.data.referral || res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!referral) return;
    try {
      await Share.share({
        message: `Join EVserv — India's best EV service platform! Use my referral code ${referral.referralCode} to get started. Download the app now.`,
      });
    } catch {}
  };

  const handleCopy = () => {
    if (!referral) return;
    // Clipboard.setString(referral.referralCode);  // needs @react-native-clipboard/clipboard
    Alert.alert('Copied!', `Referral code: ${referral.referralCode}`);
  };

  if (loading) return <Spinner fullScreen text="Loading referrals…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Referrals" subtitle="Earn rewards by referring friends" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {/* Referral Code Card */}
        {referral && (
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.codeBox}>
              <Text style={styles.code}>{referral.referralCode}</Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <ShareIcon size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share with Friends</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Stats */}
        {referral && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}><Users size={24} color={Colors.primary} /></View>
              <Text style={styles.statValue}>{referral.referralCount ?? 0}</Text>
              <Text style={styles.statLabel}>Referred</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}><Gift size={24} color={Colors.primary} /></View>
              <Text style={styles.statValue}>₹{(referral.rewards ?? 0).toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Rewards Earned</Text>
            </View>
          </View>
        )}

        {/* How it works */}
        <Card style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            { text: 'Share your unique referral code with friends' },
            { text: 'They sign up and book their first service' },
            { text: 'You earn rewards credited to your account' },
          ].map((step, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{i + 1}</Text>
              </View>
              <Text style={styles.howText}>{step.text}</Text>
            </View>
          ))}
        </Card>

        {/* Referred users */}
        {referral?.referredUsers && referral.referredUsers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>People You Referred</Text>
            {referral.referredUsers.map((u, i) => (
              <Card key={i} style={styles.userCard}>
                <View style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{u.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  <Text style={styles.joinedDate}>{new Date(u.joinedAt).toLocaleDateString('en-IN')}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  codeCard: { alignItems: 'center', paddingVertical: 24, borderColor: Colors.primary },
  codeLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  codeBox: { backgroundColor: Colors.bgCardAlt, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: 4 },
  code: { fontSize: 28, fontWeight: '900', color: Colors.primaryLight, letterSpacing: 4 },
  copyHint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  statIconContainer: { marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  howCard: { marginBottom: 16 },
  howTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  numberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: Colors.primaryLight, fontSize: 12, fontWeight: '700' },
  howText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  userCard: { padding: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  userEmail: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  joinedDate: { fontSize: 11, color: Colors.textMuted },
});

export default ReferralsScreen;
