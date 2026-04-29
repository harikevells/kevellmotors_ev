import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/colors';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Zap } from 'lucide-react-native';
import EnergyBackground from '../components/EnergyBackground';

type Nav = StackNavigationProp<AuthStackParamList, 'Register'>;

const Field = ({
  label,
  fieldKey,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secure = false,
  showPass = false,
}: {
  label: string;
  fieldKey: string;
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  keyboardType?: any;
  secure?: boolean;
  showPass?: boolean;
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      keyboardType={keyboardType}
      autoCapitalize={fieldKey === 'email' ? 'none' : 'words'}
      secureTextEntry={secure && !showPass}
      autoComplete={fieldKey === 'email' ? 'email' : 'off'}
    />
  </View>
);

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing fields', 'Name, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: 'user',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnergyBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>KEVELL MOTORS</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Get Started</Text>
          <Text style={styles.sub}>Join the EV service platform</Text>

          <Field label="Full Name" fieldKey="name" placeholder="John Doe" value={form.name} onChangeText={update('name')} />
          <Field label="Email Address" fieldKey="email" placeholder="you@example.com" keyboardType="email-address" value={form.email} onChangeText={update('email')} />
          <Field label="Phone Number" fieldKey="phone" placeholder="+91 98765 43210" keyboardType="phone-pad" value={form.phone} onChangeText={update('phone')} />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text style={styles.toggleText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={update('password')}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
            />
          </View>

          <Field label="Confirm Password" fieldKey="confirm" placeholder="Repeat password" secure showPass={showPass} value={form.confirm} onChangeText={update('confirm')} />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </EnergyBackground>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  brand: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
  },
  heading: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  field: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  toggleText: { fontSize: 11, color: Colors.primaryLight, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  footerLink: { color: Colors.primaryLight, fontWeight: '700', fontSize: 14 },
});

export default RegisterScreen;
