import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const CourseDetailsScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  
  // Enrollment State
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledBatchId, setEnrolledBatchId] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, []);

  useFocusEffect(
      useCallback(() => {
          checkEnrollmentStatus();
      }, [])
  );

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      if (response.data.success) {
        setCourse(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
        const response = await api.get('/enrollments');
        if (response.data.success) {
            const enrollments = response.data.data;
            // Check if any enrollment matches current courseId
            // Note: enrollment.course can be an ID or an object depending on population
            const found = enrollments.find(e => {
                const cId = e.course._id || e.course;
                return cId === courseId;
            });

            if (found) {
                setIsEnrolled(true);
                setEnrolledBatchId(found.batch?._id || found.batch);
                console.log("User is already enrolled in this course. Batch ID:", found.batch);
            } else {
                setIsEnrolled(false);
                setEnrolledBatchId(null);
            }
        }
    } catch (error) {
        console.log("Error checking enrollment:", error);
    }
  };

  const handleEnroll = async () => {
    if (isEnrolled) {
        handleGoToClassroom();
        return;
    }

    try {
      setEnrolling(true);
      const response = await api.post(`/enrollments/${courseId}`);
      if (response.data.success) {
        Alert.alert('Success', 'Enrolled successfully!');
        setIsEnrolled(true);
        // Refresh status to get batch ID if possible, or assume success
        checkEnrollmentStatus();
        navigation.navigate('Profile');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleGoToClassroom = () => {
      if (enrolledBatchId) {
          navigation.navigate('BatchDetails', { batchId: enrolledBatchId });
      } else {
          Alert.alert("Error", "Batch information not found. Please refresh.");
          checkEnrollmentStatus();
      }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Course not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Image */}
          <View style={styles.imageContainer}>
              <Image source={{ uri: course.thumbnail || 'https://via.placeholder.com/400' }} style={styles.image} />
              <LinearGradient
                  colors={['transparent', COLORS.background]}
                  style={styles.gradientOverlay}
              />
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                  <Text style={styles.title}>{course.title}</Text>
              </View>
              
              <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                      <Ionicons name="star" size={16} color={COLORS.warning} />
                      <Text style={styles.metaText}>4.8 Rating</Text>
                  </View>
                  <View style={styles.metaItem}>
                      <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>250+ Students</Text>
                  </View>
                  <View style={styles.metaItem}>
                      <Ionicons name="time" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>12 Weeks</Text>
                  </View>
              </View>

              <Text style={styles.price}>₹{course.price || 'Free'}</Text>

              <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{course.description}</Text>
              </View>

              <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What you'll learn</Text>
                  <View style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <Text style={styles.featureText}>Master Full Stack Development</Text>
                  </View>
                  <View style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <Text style={styles.featureText}>Build Real-world Projects</Text>
                  </View>
                  <View style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <Text style={styles.featureText}>Get Industry Ready</Text>
                  </View>
              </View>

               {/* Instructor */}
               <View style={styles.instructorCard}>
                  <View style={styles.instructorAvatar}>
                      <Text style={styles.instructorInitials}>{course.instructor?.name?.[0] || 'I'}</Text>
                  </View>
                  <View>
                      <Text style={styles.instructorLabel}>Instructor</Text>
                      <Text style={styles.instructorName}>{course.instructor?.name || 'CodeForMode Instructor'}</Text>
                  </View>
              </View>
          </View>
          <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Stickey Footer */}
      <View style={styles.footer}>
          <View>
              <Text style={styles.footerPriceLabel}>Total Price</Text>
              <Text style={styles.footerPrice}>₹{course.price || 'Free'}</Text>
          </View>
          
          {isEnrolled ? (
              <TouchableOpacity style={styles.classroomButton} onPress={handleGoToClassroom}>
                  <Text style={styles.enrollButtonText}>Go to Classroom</Text>
                  <Ionicons name="school" size={20} color={COLORS.white} style={{marginLeft: 8}} />
              </TouchableOpacity>
          ) : (
              <TouchableOpacity 
                style={styles.enrollButton} 
                onPress={handleEnroll}
                disabled={enrolling}
            >
                {enrolling ? (
                    <ActivityIndicator color={COLORS.black} />
                ) : (
                    <>
                        <Text style={styles.enrollButtonText}>Enroll Now</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.black} style={{marginLeft: 8}} />
                    </>
                )}
            </TouchableOpacity>
          )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  imageContainer: {
      height: 350,
      width: '100%',
      position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '100%',
  },
  backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 12,
  },
  contentContainer: {
    padding: 24,
    marginTop: -80, // Pull up over image
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      marginBottom: 20,
  },
  metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
  },
  metaText: {
      color: COLORS.white,
      fontSize: 12,
      fontWeight: '600',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 10,
  },
  featureText: {
      color: COLORS.text,
      fontSize: 15,
  },
  instructorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      padding: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
      marginTop: 10,
  },
  instructorAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: COLORS.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
      borderWidth: 1,
      borderColor: COLORS.primary,
  },
  instructorInitials: {
      color: COLORS.primary,
      fontWeight: 'bold',
      fontSize: 20,
  },
  instructorLabel: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  instructorName: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 16,
  },
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: COLORS.surface,
      padding: 20,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: COLORS.surfaceLight,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  footerPriceLabel: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  footerPrice: {
      color: COLORS.white,
      fontSize: 24,
      fontWeight: 'bold',
  },
  enrollButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  enrollButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  classroomButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 18,
  },
});

export default CourseDetailsScreen;
