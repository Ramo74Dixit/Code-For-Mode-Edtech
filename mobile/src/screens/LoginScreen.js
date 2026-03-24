import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue learning</Text>
        </View>

        <View style={styles.form}>
            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textLight} style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity 
                style={styles.loginButton} 
                onPress={() => login(email, password)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.loginButtonText}>Log In</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
      marginBottom: 40,
      alignItems: 'center',
  },
  title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: COLORS.white,
      marginBottom: 10,
  },
  subtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
  },
  form: {
      backgroundColor: COLORS.white,
      borderRadius: 20,
      padding: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      marginBottom: 20,
  },
  icon: {
      marginRight: 10,
  },
  input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: COLORS.text,
  },
  loginButton: {
      backgroundColor: COLORS.secondary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
      shadowColor: COLORS.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
  },
  loginButtonText: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: 'bold',
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
  },
  footerText: {
      color: COLORS.textLight,
  },
  link: {
      color: COLORS.primary,
      fontWeight: 'bold',
  },
});

export default LoginScreen;
