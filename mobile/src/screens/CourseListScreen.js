import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, StatusBar, RefreshControl, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { COLORS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

const { width } = Dimensions.get('window');

const CourseListScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext); // Get User Info
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchEnrollments()]);
      setLoading(false);
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async () => {
      try {
          const response = await api.get('/enrollments');
          if (response.data.success) {
              setEnrollments(response.data.data);
          }
      } catch (error) {
          console.log('Error fetching enrollments:', error);
      }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCourses(), fetchEnrollments()]);
    setRefreshing(false);
  }, []);

  // Filter courses based on search
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // DASHBOARD COMPONENTS

  const StatsCard = ({ icon, title, value, color }) => (
      <View style={[styles.statsCard, { borderColor: color }]}>
          <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon} size={24} color={color} />
          </View>
          <View>
              <Text style={styles.statsValue}>{value}</Text>
              <Text style={styles.statsTitle}>{title}</Text>
          </View>
      </View>
  );

  const SectionHeader = ({ title, showAll }) => (
      <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {showAll && (
              <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
          )}
      </View>
  );

  const renderHeader = () => (
      <View style={styles.headerContainer}>
           {/* Welcome Section */}
           <View style={styles.topRow}>
               <View>
                   <Text style={styles.greeting}>Good Afternoon,</Text>
                   <Text style={styles.userName}>{userInfo?.name?.split(' ')[0] || 'Student'} 👋</Text>
               </View>
               <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                    <Image 
                        source={{ uri: 'https://ui-avatars.com/api/?name=' + (userInfo?.name || 'User') + '&background=0D8ABC&color=fff' }} 
                        style={styles.profileImg} 
                    />
               </TouchableOpacity>
           </View>

           {/* Search Bar */}
           <View style={styles.searchContainer}>
               <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
               <TextInput 
                   style={styles.searchInput}
                   placeholder="What do you want to learn today?"
                   placeholderTextColor={COLORS.textSecondary}
                   value={searchQuery}
                   onChangeText={setSearchQuery}
               />
           </View>

           {/* Quick Stats (Real Data) */}
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={{paddingRight: 20}}>
               <StatsCard icon="book" title="Enrolled" value={enrollments.length} color={COLORS.primary} />
               <StatsCard icon="time" title="In Progress" value={enrollments.filter(e => e.progress < 100).length} color={COLORS.warning} />
               <StatsCard icon="checkmark-circle" title="Completed" value={enrollments.filter(e => e.progress === 100).length} color={COLORS.success} />
               <StatsCard icon="trophy" title="Certificates" value="0" color={COLORS.secondary} />
           </ScrollView>
           
           {/* My Courses / Continue Learning (Real Data) */}
           {enrollments.length > 0 && (
               <>
                   <SectionHeader title="Continue Learning" />
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.continueScroll} contentContainerStyle={{paddingRight: 20}}>
                       {enrollments.map((enrollment, index) => (
                           <TouchableOpacity 
                                key={index}
                                style={styles.continueCard}
                                onPress={() => navigation.navigate('BatchDetails', { batchId: enrollment.batch?._id || enrollment.batch })} // Assuming enrollment has batch populated or ID
                           >
                               <Image source={{ uri: enrollment.course?.thumbnail || 'https://via.placeholder.com/150' }} style={styles.continueImg} />
                               <View style={styles.continueInfo}>
                                   <Text style={styles.continueTitle} numberOfLines={1}>{enrollment.course?.title || 'Course'}</Text>
                                   <View style={styles.progressBar}>
                                       <View style={[styles.progressFill, { width: `${enrollment.progress || 0}%` }]} />
                                   </View>
                                   <Text style={styles.progressText}>{enrollment.progress || 0}% Completed</Text>
                               </View>
                           </TouchableOpacity>
                       ))}
                   </ScrollView>
               </>
           )}

           <SectionHeader title="Explore Courses" showAll={true} />
      </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('CourseDetails', { courseId: item._id })}
    >
      <View style={styles.cardImageContainer}>
          <Image 
            source={{ uri: item.thumbnail || 'https://via.placeholder.com/300' }} 
            style={styles.thumbnail} 
            resizeMode="cover"
          />
          <View style={styles.priceBadge}>
               <Text style={styles.priceText}>₹{item.price || 'Free'}</Text>
          </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || 'Development'}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.cardFooter}>
            <View style={styles.instructorRow}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.textSecondary} />
                 <Text style={styles.instructorName}>{item.instructor?.name || 'Instructor'}</Text>
            </View>
            <View style={styles.ratingRow}>
                 <Ionicons name="star" size={14} color="#FFD700" />
                 <Text style={styles.ratingText}>4.8</Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.bgGradient}
      />
      
      <FlatList
        data={filteredCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={50} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No courses found matching "{searchQuery}"</Text>
            </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgGradient: {
      position: 'absolute',
      width: '100%',
      height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  list: {
    paddingBottom: 100, // Space for bottom tabs
    paddingTop: 50,
  },
  headerContainer: {
     paddingBottom: 10,
  },
  topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  greeting: {
      color: COLORS.textSecondary,
      fontSize: 14,
  },
  userName: {
      color: COLORS.white,
      fontSize: 24,
      fontWeight: 'bold',
  },
  profileBtn: {
      width: 45,
      height: 45,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: COLORS.primary,
      overflow: 'hidden',
  },
  profileImg: {
      width: '100%',
      height: '100%',
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 15,
      paddingHorizontal: 15,
      height: 50,
      marginHorizontal: 20,
      marginBottom: 25,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
      marginRight: 10,
  },
  searchInput: {
      flex: 1,
      color: COLORS.white,
      fontSize: 16,
  },
  // Stats
  statsScroll: {
      marginBottom: 30,
      paddingLeft: 20,
  },
  statsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      padding: 15,
      borderRadius: 15,
      marginRight: 15,
      width: 150,
      borderWidth: 1,
  },
  statsIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  statsValue: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: 'bold',
  },
  statsTitle: {
      color: COLORS.textSecondary,
      fontSize: 10,
      textTransform: 'uppercase',
  },
  // Section Headers
  sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 15,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.white,
  },
  seeAllText: {
      color: COLORS.primary,
      fontSize: 14,
  },
  // Continue Learning
  continueScroll: {
      marginBottom: 30,
      paddingLeft: 20,
  },
  continueCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: 15,
      padding: 10,
      marginRight: 15,
      width: width * 0.75,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
  },
  continueImg: {
      width: 60,
      height: 60,
      borderRadius: 10,
      marginRight: 15,
  },
  continueInfo: {
      flex: 1,
  },
  continueTitle: {
      color: COLORS.white,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
  },
  progressBar: {
      height: 4,
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 2,
      marginBottom: 5,
  },
  progressFill: {
      height: '100%',
      backgroundColor: COLORS.primary,
      borderRadius: 2,
  },
  progressText: {
      color: COLORS.textSecondary,
      fontSize: 10,
  },
  // Course Cards (Updated)
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardImageContainer: {
      height: 160,
      position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
      position: 'absolute',
      right: 15,
      top: 15,
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  priceText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 12,
  },
  cardContent: {
    padding: 15,
  },
  categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.surfaceLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 10,
  },
  categoryText: {
      color: COLORS.primary,
      fontWeight: '600',
      fontSize: 10,
      textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorName: {
      color: COLORS.textSecondary,
      fontSize: 12,
      marginLeft: 6,
  },
  ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  ratingText: {
      color: COLORS.textSecondary,
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 4,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      color: COLORS.textSecondary,
      marginTop: 10,
  }
});

export default CourseListScreen;
