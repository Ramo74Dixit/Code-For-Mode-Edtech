import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { COLORS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';

const MyBatchesScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
      try {
          const response = await api.get('/enrollments');
          if (response.data.success) {
              setEnrollments(response.data.data);
          }
      } catch (error) {
          console.log('Error fetching enrollments:', error);
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchEnrollments();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('BatchDetails', { batchId: item.batch?._id || item.batch })}
    >
      <Image 
        source={{ uri: item.course?.thumbnail || 'https://via.placeholder.com/300' }} 
        style={styles.thumbnail} 
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.gradientOverlay}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.badgeContainer}>
             <View style={styles.liveBadge}>
                 <View style={styles.dot} />
                 <Text style={styles.liveText}>LIVE BATCH</Text>
             </View>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{item.course?.title || 'Course Title'}</Text>
        
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPercent}>{item.progress || 0}%</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${item.progress || 0}%` }]} />
            </View>
        </View>

        <TouchableOpacity style={styles.resumeBtn}>
            <Text style={styles.resumeBtnText}>Resume Study</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
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

      <View style={styles.header}>
          <Text style={styles.headerTitle}>My Types</Text>
          <Text style={styles.headerSubtitle}>Your Enrolled Courses</Text>
      </View>
      
      <FlatList
        data={enrollments}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={60} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>You haven't enrolled in any courses yet.</Text>
                <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
                     <Text style={styles.exploreBtnText}>Explore Courses</Text>
                </TouchableOpacity>
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
  header: {
      padding: 20,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.white,
  },
  headerSubtitle: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginTop: 2,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    height: 220,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
  },
  cardContent: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 15,
  },
  badgeContainer: {
      position: 'absolute',
      top: 15,
      left: 15,
      flexDirection: 'row',
  },
  liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
  },
  dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.white,
      marginRight: 6,
  },
  liveText: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: 'bold',
  },
  title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.white,
      marginBottom: 10,
  },
  progressContainer: {
      marginBottom: 15,
  },
  progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
  },
  progressLabel: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  progressPercent: {
      color: COLORS.white,
      fontSize: 12,
      fontWeight: 'bold',
  },
  progressBarBg: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: COLORS.success,
      borderRadius: 2,
  },
  resumeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primary,
      paddingVertical: 10,
      borderRadius: 8,
  },
  resumeBtnText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 14,
      marginRight: 6,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      color: COLORS.textSecondary,
      fontSize: 16,
      marginTop: 20,
      textAlign: 'center',
  },
  exploreBtn: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: COLORS.surfaceLight,
      borderRadius: 8,
  },
  exploreBtnText: {
      color: COLORS.primary,
      fontWeight: 'bold',
  }

});

export default MyBatchesScreen;
