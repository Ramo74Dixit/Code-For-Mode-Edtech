import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, Modal, TextInput, Alert, StatusBar, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Full Profile State (matching Web UI)
  const [formData, setFormData] = useState({
      name: '',
      headline: '',
      location: '',
      phoneNumber: '',
      bio: '',
      github: '',
      linkedin: '',
      website: '',
      skills: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
      try {
          setLoading(true);
          // Parallel fetch for enrollments and latest user details
          const [enrollRes, userRes] = await Promise.all([
              api.get('/enrollments'),
              api.get('/auth/me') // Assuming this endpoint exists based on frontend code
          ]);

          if (enrollRes.data.success) {
               setEnrollments(enrollRes.data.data);
          }

          if (userRes.data.success) {
              const u = userRes.data.data;
              console.log("MOBILE PROFILE DATA RECEIVED:", JSON.stringify(u, null, 2)); // DEBUG LOG
              // DEBUG: Show alert with image URL to verify it exists
              Alert.alert("Debug Image", `URL: ${u.profileImage || 'No Image'}`); 
              
              setFormData({
                  name: u.name || '',
                  headline: u.headline || '',
                  location: u.location || '',
                  phoneNumber: u.phoneNumber || '',
                  bio: u.bio || '',
                  profileImage: u.profileImage || '', 
                  github: u.socialLinks?.github || '',
                  linkedin: u.socialLinks?.linkedin || '',
                  website: u.socialLinks?.website || '',
                  skills: u.skills ? u.skills.join(', ') : ''
              });
          }
      } catch (error) {
          console.log("Error fetching profile data", error);
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  };

  const handleUpdateProfile = async () => {
      try {
          // Verify endpoint from frontend analysis: /auth/updatedetails
          const payload = {
              ...formData,
              socialLinks: {
                  github: formData.github,
                  linkedin: formData.linkedin,
                  website: formData.website
              },
              skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
          };

          const res = await api.put('/auth/updatedetails', payload);
          if (res.data.success) {
               setEditing(false);
               Alert.alert("Success", "Profile updated successfully!");
               fetchProfileData(); // Refresh data
          }
      } catch (e) {
          console.log("Update Error", e);
          Alert.alert("Error", "Failed to update profile. Please try again.");
      }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, []);

  const renderHeader = () => (
      <View style={styles.headerContainer}>
          <LinearGradient
            colors={[COLORS.background, COLORS.surface]}
            style={styles.headerBg}
          />
          
          {/* Branding Header */}
          <View style={styles.topBar}>
              <View style={styles.brandContainer}>
                  <Ionicons name="code-slash" size={24} color={COLORS.primary} />
                  <Text style={styles.brandText}>CodeFor<Text style={styles.brandTextHighlight}>Mode</Text></Text>
              </View>
              <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                  <Ionicons name="power" size={20} color={COLORS.error} />
              </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
              <View style={styles.profileHeaderRow}>
                    <View style={styles.avatarWrapper}>
                        {formData.profileImage || userInfo?.profileImage ? (
                            <Image 
                                source={{ uri: formData.profileImage || userInfo?.profileImage }} 
                                style={styles.avatar} 
                                onError={(e) => console.log("Image Load Error:", e.nativeEvent.error)}
                            />
                        ) : (
                            <Text style={styles.avatarPlaceholder}>{(formData.name || userInfo?.name || 'U').charAt(0).toUpperCase()}</Text>
                        )}
                        <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditing(true)}>
                            <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.editGradient}>
                                <Ionicons name="settings-sharp" size={14} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{formData.name || userInfo?.name}</Text>
                        <Text style={styles.userHeadline}>{formData.headline || 'Student at CodeForMode'}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.userLocation}>{formData.location || 'Location not set'}</Text>
                        </View>
                    </View>
              </View>

              {/* Quick Stats Grid */}
              <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                      <Text style={styles.statNum}>{enrollments.length}</Text>
                      <Text style={styles.statLabel}>Courses</Text>
                  </View>
                  <View style={styles.statBoxBorder}>
                      <Text style={styles.statNum}>{formData.skills.split(',').filter(s=>s).length}</Text>
                      <Text style={styles.statLabel}>Skills</Text>
                  </View>
                  <View style={styles.statBox}>
                      <Text style={styles.statNum}>0</Text>
                      <Text style={styles.statLabel}>Certs</Text>
                  </View>
              </View>
          </View>
      </View>
  );

  const renderCourseItem = ({ item }) => {
      const course = item.course;
      if (!course) return null;

      return (
        <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.courseCard}
            onPress={() => navigation.navigate('Home', { 
                screen: 'BatchDetails', 
                params: { batchId: item.batch?._id || item.batch } 
            })}
        >
            <Image 
                source={{ uri: course.thumbnail || 'https://via.placeholder.com/150' }} 
                style={styles.courseThumb} 
            />
            <LinearGradient
                colors={['transparent', COLORS.surface]}
                locations={[0.3, 1]}
                style={styles.courseGradient}
            />
            <View style={styles.courseDetails}>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{item.progress || 0}% Complete</Text>
                </View>
                <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                <View style={styles.progressBarBg}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${item.progress || 0}%` }]}
                    />
                </View>
            </View>
        </TouchableOpacity>
      );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item._id}
        renderItem={renderCourseItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
            <View style={styles.emptyView}>
                <Ionicons name="rocket-outline" size={60} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No courses yet. Start learning!</Text>
            </View>
        }
      />

      {/* Full Screen Edit Modal */}
      <Modal visible={editing} animationType="slide" transparent={false} presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setEditing(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.formScroll}>
                  <View style={styles.inputSection}>
                      <Text style={styles.sectionHeader}>Basic Info</Text>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Full Name</Text>
                          <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({...formData, name: t})} placeholderTextColor={COLORS.textSecondary} />
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Professional Headline</Text>
                          <TextInput style={styles.input} value={formData.headline} onChangeText={t => setFormData({...formData, headline: t})} placeholder="e.g. Flutter Developer" placeholderTextColor={COLORS.textSecondary} />
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Bio</Text>
                          <TextInput style={[styles.input, styles.textArea]} value={formData.bio} onChangeText={t => setFormData({...formData, bio: t})} multiline placeholder="Tell us about yourself..." placeholderTextColor={COLORS.textSecondary} />
                      </View>
                  </View>

                  <View style={styles.inputSection}>
                      <Text style={styles.sectionHeader}>Contact</Text>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Location</Text>
                          <TextInput style={styles.input} value={formData.location} onChangeText={t => setFormData({...formData, location: t})} placeholder="City, Country" placeholderTextColor={COLORS.textSecondary} />
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Phone</Text>
                          <TextInput style={styles.input} value={formData.phoneNumber} onChangeText={t => setFormData({...formData, phoneNumber: t})} keyboardType="phone-pad" placeholderTextColor={COLORS.textSecondary} />
                      </View>
                  </View>

                  <View style={styles.inputSection}>
                      <Text style={styles.sectionHeader}>Social Links</Text>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>GitHub</Text>
                          <TextInput style={styles.input} value={formData.github} onChangeText={t => setFormData({...formData, github: t})} placeholder="github.com/..." placeholderTextColor={COLORS.textSecondary} />
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>LinkedIn</Text>
                          <TextInput style={styles.input} value={formData.linkedin} onChangeText={t => setFormData({...formData, linkedin: t})} placeholder="linkedin.com/..." placeholderTextColor={COLORS.textSecondary} />
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Website</Text>
                          <TextInput style={styles.input} value={formData.website} onChangeText={t => setFormData({...formData, website: t})} placeholder="yourportfolio.com" placeholderTextColor={COLORS.textSecondary} />
                      </View>
                  </View>

                  <View style={styles.inputSection}>
                      <Text style={styles.sectionHeader}>Skills</Text>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Skills (Comma Separated)</Text>
                          <TextInput style={styles.input} value={formData.skills} onChangeText={t => setFormData({...formData, skills: t})} placeholder="React, Node.js, Design..." placeholderTextColor={COLORS.textSecondary} />
                      </View>
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.saveGradient}>
                         <Text style={styles.saveBtnText}>Save Changes</Text>
                      </LinearGradient>
                  </TouchableOpacity>
                  <View style={{height: 50}} />
              </ScrollView>
          </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
      paddingBottom: 20,
  },
  topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
  },
  brandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  brandText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: COLORS.white,
      letterSpacing: 0.5,
  },
  brandTextHighlight: {
      color: COLORS.primary,
  },
  logoutButton: {
      padding: 10,
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 12,
  },
  profileCard: {
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
  },
  profileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
  },
  avatarWrapper: {
      position: 'relative',
  },
  avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.surfaceLight,
      color: COLORS.primary,
      fontSize: 32,
      textAlign: 'center',
      lineHeight: 80,
      borderWidth: 2,
      borderColor: COLORS.cardBorder,
  },
  editIconBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      borderRadius: 15,
      overflow: 'hidden',
  },
  editGradient: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
  },
  profileInfo: {
      flex: 1,
      marginLeft: 20,
  },
  userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.white,
      marginBottom: 4,
  },
  userHeadline: {
      fontSize: 14,
      color: COLORS.primary,
      marginBottom: 8,
  },
  locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  userLocation: {
      fontSize: 12,
      color: COLORS.textSecondary,
  },
  statsGrid: {
      flexDirection: 'row',
      backgroundColor: COLORS.background,
      borderRadius: 16,
      paddingVertical: 15,
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
  },
  statBox: {
      flex: 1,
      alignItems: 'center',
  },
  statBoxBorder: {
      flex: 1,
      alignItems: 'center',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: COLORS.surfaceLight,
  },
  statNum: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.white,
  },
  statLabel: {
      fontSize: 10,
      color: COLORS.textSecondary,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  listContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
  },
  courseCard: {
      height: 200,
      borderRadius: 20,
      marginBottom: 20,
      overflow: 'hidden',
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
  },
  courseThumb: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
  },
  courseGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '100%',
  },
  courseDetails: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 15,
  },
  progressBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0, 212, 255, 0.2)', // Primary transparent
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: COLORS.primary,
  },
  progressText: {
      color: COLORS.primary,
      fontSize: 10,
      fontWeight: 'bold',
  },
  courseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.white,
      marginBottom: 10,
  },
  progressBarBg: {
      height: 4,
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 2,
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 2,
  },
  emptyView: {
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      marginTop: 10,
      color: COLORS.textSecondary,
  },
  // Modal Styles
  modalContainer: {
      flex: 1,
      backgroundColor: COLORS.background,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.surfaceLight,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.white,
  },
  closeBtn: {
      padding: 5,
  },
  formScroll: {
      padding: 20,
  },
  inputSection: {
      marginBottom: 25,
  },
  sectionHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 15,
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  inputGroup: {
      marginBottom: 15,
  },
  label: {
      color: COLORS.textSecondary,
      marginBottom: 8,
      fontSize: 12,
  },
  input: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
      borderRadius: 12,
      padding: 15,
      color: COLORS.white,
      fontSize: 14,
  },
  textArea: {
      height: 100,
      textAlignVertical: 'top',
  },
  saveButton: {
      marginTop: 10,
      borderRadius: 15,
      overflow: 'hidden',
  },
  saveGradient: {
      padding: 18,
      alignItems: 'center',
  },
  saveBtnText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
  }
});

export default ProfileScreen;
