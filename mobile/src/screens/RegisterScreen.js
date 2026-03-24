import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import api from '../config/api';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
      try {
          setLoading(true);
          const response = await api.post('/auth/register', {
              name, email, password
          });
          if(response.data.success) {
              alert('Registration Successful! Please login.');
              navigation.navigate('Login');
          }
      } catch (error) {
          console.log(error);
          alert('Registration Failed. Try again.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join us and start learning today!</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

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
                    style={styles.registerButton} 
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text style={styles.registerButtonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.link}>Log In</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
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
  },
  scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 30,
  },
  header: {
      marginBottom: 40,
      alignItems: 'center',
  },
  backButton: {
      position: 'absolute',
      left: 0,
      top: 0,
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
      textAlign: 'center',
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
  registerButton: {
      backgroundColor: COLORS.primary, // Different color for register
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
  },
  registerButtonText: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: 'bold',
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 30,
  },
  footerText: {
      color: 'rgba(255,255,255,0.9)',
  },
  link: {
      color: COLORS.accent,
      fontWeight: 'bold',
  },
});

export default RegisterScreen;
