import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[COLORS.background, '#0f172a', '#1e1b4b']} 
        style={styles.background}
      />

      {/* Shapes for Decoration */}
      <View style={[styles.shape, styles.shapeTop]} />
      <View style={[styles.shape, styles.shapeBottom]} />

      <View style={styles.content}>
        {/* Brand Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
            <View style={styles.iconContainer}>
                <Ionicons name="code-slash" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.brandName}>CodeForMode</Text>
            <Text style={styles.tagline}>Master the Future of Coding</Text>
        </Animated.View>

        {/* Hero Features / Image Placeholder */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 50, alignItems: 'center' }}>
             <View style={styles.featureCard}>
                 <Ionicons name="rocket-outline" size={32} color={COLORS.secondary} />
                 <Text style={styles.featureText}>Live Interactive Classes</Text>
             </View>
             <View style={[styles.featureCard, { marginLeft: 40 }]}>
                 <Ionicons name="play-circle-outline" size={32} color={COLORS.primary} />
                 <Text style={styles.featureText}>Premium Video Library</Text>
             </View>
             <View style={styles.featureCard}>
                 <Ionicons name="trophy-outline" size={32} color={COLORS.warning} />
                 <Text style={styles.featureText}>Industry Certification</Text>
             </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.bottomSection}>
            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Login')}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                >
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Register')}
            >
                <Text style={styles.secondaryButtonText}>Create an Account</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  shape: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(56, 189, 248, 0.05)', // Very subtle primary color blobb
  },
  shapeTop: {
    top: -width * 0.4,
    left: -width * 0.2,
  },
  shapeBottom: {
    bottom: -width * 0.4,
    right: -width * 0.2,
    backgroundColor: 'rgba(99, 102, 241, 0.05)', // Subtle secondary
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    padding: 30,
    paddingTop: 80,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.03)',
      padding: 15,
      borderRadius: 15,
      marginBottom: 15,
      width: '90%',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
  },
  featureText: {
      color: COLORS.white,
      marginLeft: 15,
      fontSize: 16,
      fontWeight: '500',
  },
  bottomSection: {
      marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  gradientButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LandingScreen;
