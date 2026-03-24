import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Modal, StatusBar, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from "react-native-youtube-iframe";
import { WebView } from 'react-native-webview'; // Ensure this is installed
import api from '../config/api';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const BatchDetailsScreen = ({ route, navigation }) => {
  const { batchId } = route.params;
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Video Player State
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [playingVideoTitle, setPlayingVideoTitle] = useState('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  // Resource Viewer State
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [currentResourceUrl, setCurrentResourceUrl] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState(''); // 'image' or 'file'

  // Synced Tabs with Web
  const tabs = ['Overview', 'Videos', 'Live Classes', 'Assignments', 'Resources', 'Announcements'];

  useEffect(() => {
    fetchBatchDetails();
  }, []);

  const fetchBatchDetails = async () => {
    try {
      const response = await api.get(`/batches/${batchId}`);
      if (response.data.success) {
        setBatch(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching batch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      // creating a seamless flow, maybe auto play next? For now just stop.
       // setIsVideoVisible(false); 
    }
  }, []);

  const playVideo = (videoOrId) => {
      if (typeof videoOrId === 'string') {
          setPlayingVideoId(videoOrId);
          setPlayingVideoTitle("Now Playing");
      } else {
          setPlayingVideoId(videoOrId.youtubeId);
          setPlayingVideoTitle(videoOrId.title || videoOrId.topic || "Now Playing");
      }
      setIsVideoVisible(true);
  };
  
  const openResource = (url, title, type = 'file') => {
      if (!url) {
          Alert.alert("Error", "No URL found for this resource.");
          return;
      }
      const finalUrl = getAccessibleUrl(url);
      setCurrentResourceUrl(finalUrl);
      setResourceTitle(title || 'Resource');
      setResourceType(type);
      setResourceModalVisible(true);
  };

  const getYoutubeId = (url) => {
      if (!url) return null;
      // Handle youtube.com/live/VIDEO_ID format
      if (url.includes('/live/')) {
          const parts = url.split('/live/');
          if (parts.length > 1) {
              return parts[1].split('?')[0]; // simple extraction
          }
      }
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const getAccessibleUrl = (url) => {
      if (!url) return '';
      // If it's a localhost URL, replace it with the Ngrok URL for Android/Mobile
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
          // Replace with the same Ngrok URL used in api.js
          const NGROK_HOST = 'https://ivana-pseudolegislative-nguyet.ngrok-free.dev'; 
          return url.replace(/http:\/\/localhost:\d+/, NGROK_HOST).replace(/http:\/\/127\.0\.0\.1:\d+/, NGROK_HOST);
      }
      return url;
  };

  const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };


  const renderOverview = () => (
      <View style={styles.tabContent}>
          <View style={styles.card}>
              <View style={styles.cardHeader}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>About this Batch</Text>
              </View>
              <Text style={styles.description}>{batch.description || 'No description available for this batch.'}</Text>
          </View>

          <View style={styles.card}>
              <View style={styles.cardHeader}>
                  <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
                  <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
              {batch.classSchedule && batch.classSchedule.length > 0 ? (
                  batch.classSchedule.map((s, i) => (
                      <View key={i} style={styles.scheduleRow}>
                          <View style={styles.dayBadge}>
                              <Text style={styles.dayText}>{s.day}</Text>
                          </View>
                          <Text style={styles.timeText}>{s.startTime} - {s.endTime}</Text>
                      </View>
                  ))
              ) : (
                  <Text style={styles.emptyText}>No specific schedule.</Text>
              )}
          </View>

          <View style={styles.card}>
               <View style={styles.cardHeader}>
                  <Ionicons name="person-outline" size={20} color={COLORS.warning} />
                   <Text style={styles.sectionTitle}>Trainer</Text>
               </View>
               <View style={styles.trainerRow}>
                   <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.avatar}
                   >
                       <Text style={styles.avatarText}>{batch.trainer?.name?.[0] || 'T'}</Text>
                   </LinearGradient>
                   <View>
                       <Text style={styles.trainerName}>{batch.trainer?.name}</Text>
                       <Text style={styles.trainerEmail}>{batch.trainer?.email}</Text>
                   </View>
               </View>
          </View>
      </View>
  );

  const renderVideos = () => (
      <View style={styles.tabContent}>
          {batch.videos && batch.videos.length > 0 ? (
              batch.videos.map((video, i) => (
                  <TouchableOpacity key={i} style={styles.videoCard} onPress={() => playVideo(video)}>
                      <Image 
                        source={{ uri: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` }} 
                        style={styles.videoThumbnail} 
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.thumbnailOverlay}
                      >
                          <Ionicons name="play-circle" size={30} color={COLORS.white} />
                      </LinearGradient>
                      
                      <View style={styles.videoInfo}>
                           <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                           <View style={styles.videoMeta}>
                               <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                               <Text style={styles.videoDuration}>{video.duration || 'Video'}</Text>
                           </View>
                      </View>
                      {playingVideoId === video.youtubeId && 
                        <View style={styles.playingIndicator}>
                             <Ionicons name="musical-notes" size={16} color={COLORS.primary} />
                        </View>
                      }
                  </TouchableOpacity>
              ))
          ) : (
              <View style={styles.emptyState}>
                   <Ionicons name="videocam-off-outline" size={50} color={COLORS.textSecondary} />
                   <Text style={styles.emptyText}>No videos uploaded yet.</Text>
              </View>
          )}
      </View>
  );

  const renderClasses = () => (
      <View style={styles.tabContent}>
           {/* Active Live Class Check */}
           <View style={styles.liveCard}>
                <View style={styles.liveHeader}>
                    <View style={[styles.liveBadge, { backgroundColor: COLORS.secondary }]}>
                        <Ionicons name="calendar" size={12} color={COLORS.white} />
                        <Text style={styles.liveText}>SCHEDULE</Text>
                    </View>
                    <Text style={styles.liveDate}>Weekly Schedule</Text>
                </View>
                {/* Schedule Display */}
                {batch.classSchedule && batch.classSchedule.length > 0 ? (
                    <View>
                        <Text style={styles.liveTitle}>Upcoming Classes</Text>
                        <Text style={styles.liveDesc}>Join your scheduled classes on time.</Text>
                        {batch.classSchedule.map((s, i) => (
                             <View key={i} style={styles.scheduleRowSimple}>
                                 <Text style={styles.scheduleDay}>{s.day}</Text>
                                 <Text style={styles.scheduleTime}>{s.startTime} - {s.endTime}</Text>
                             </View>
                        ))}
                    </View>
                ) : (
                    <View>
                        <Text style={styles.liveTitle}>No Live Classes Scheduled</Text>
                        <Text style={styles.liveDesc}>There are no classes scheduled for this batch currently.</Text>
                    </View>
                )}
           </View>

           {/* Past Live Sessions (Recordings/History) */}
           <Text style={[styles.historyTitle, { marginTop: 15 }]}>Past Sessions & Recordings</Text>
           {batch.liveSessions && batch.liveSessions.length > 0 ? (
               batch.liveSessions.map((session, i) => (
                    <TouchableOpacity 
                        key={i} 
                        style={styles.pastClassCard}
                        onPress={() => {
                            let videoId = session.youtubeVideoId;
                            if (!videoId && session.recordingUrl) videoId = getYoutubeId(session.recordingUrl);
                            if (!videoId && session.youtubeLiveUrl) videoId = getYoutubeId(session.youtubeLiveUrl);

                            if (videoId) {
                                playVideo({ youtubeId: videoId, title: session.topic });
                            } else if (session.recordingUrl) {
                                openResource(session.recordingUrl, session.topic);
                            } else if (session.youtubeLiveUrl) {
                                // Fallback: If no ID could be extracted, open the Live URL in WebView
                                openResource(session.youtubeLiveUrl, session.topic);
                            } else {
                                Alert.alert("Not Available", "Recording is not available yet.");
                            }
                        }}
                    >
                       <View style={styles.pastClassIcon}>
                           <Ionicons name="play-circle" size={32} color={COLORS.primary} />
                       </View>
                       <View style={styles.pastClassInfo}>
                           <Text style={styles.pastClassTitle}>{session.topic || `Live Session ${i+1}`}</Text>
                           <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                               <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                               <Text style={[styles.pastClassDate, {marginLeft: 4}]}>{formatDate(session.createdAt || session.startTime)}</Text>
                           </View>
                       </View>
                       <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
               ))
           ) : (
                <View style={[styles.emptyState, { marginTop: 10 }]}>
                    <Ionicons name="videocam-off-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={[styles.emptyText, { fontSize: 13 }]}>No past sessions recorded yet.</Text>
                </View>
           )}
      </View>
  );

  const renderAssignments = () => (
      <View style={styles.tabContent}>
          {batch.assignments && batch.assignments.length > 0 ? (
              batch.assignments.map((item, i) => (
                  <View key={i} style={styles.card}>
                      <View style={styles.cardHeader}>
                          <View style={styles.iconBox}>
                              <Ionicons name="document-text" size={20} color={COLORS.white} />
                          </View>
                          <View style={{flex: 1, marginLeft: 10}}>
                              <Text style={styles.cardTitle}>{item.title}</Text>
                              <Text style={styles.cardDate}>Due: {formatDate(item.dueDate) || 'No Due Date'}</Text>
                          </View>
                          {/* Use In-App Viewer for Assignments too */}
                          {item.fileUrl && (
                                <TouchableOpacity onPress={() => openResource(item.fileUrl, item.title, 'file')}>
                                    <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                          )}
                      </View>
                      <Text style={styles.cardBody}>{item.description}</Text>
                  </View>
              ))
          ) : (
              <View style={styles.emptyState}>
                   <Ionicons name="book-outline" size={50} color={COLORS.textSecondary} />
                   <Text style={styles.emptyText}>No assignments assigned yet.</Text>
              </View>
          )}
      </View>
  );

  const renderResources = () => (
      <View style={styles.tabContent}>
          {batch.resources && batch.resources.length > 0 ? (
              batch.resources.map((item, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.resourceCard} 
                    onPress={() => openResource(item.url, item.title, item.type)}
                  >
                      <LinearGradient colors={[COLORS.surfaceLight, COLORS.surface]} style={styles.resourceIcon}>
                          <Ionicons 
                            name={item.type === 'image' ? "image-outline" : "folder-open"} 
                            size={24} 
                            color={COLORS.secondary} 
                          />
                      </LinearGradient>
                      <View style={styles.resourceInfo}>
                          <Text style={styles.resourceTitle}>{item.title}</Text>
                          <Text style={styles.resourceMeta}>Shared {formatDate(item.createdAt)}</Text>
                      </View>
                      <View style={{alignItems: 'center', justifyContent: 'center'}}>
                          <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                          <Text style={{fontSize: 10, color: COLORS.primary, marginTop: 2}}>View</Text>
                      </View>
                  </TouchableOpacity>
              ))
          ) : (
              <View style={styles.emptyState}>
                   <Ionicons name="folder-open-outline" size={50} color={COLORS.textSecondary} />
                   <Text style={styles.emptyText}>No resources shared yet.</Text>
              </View>
          )}
      </View>
  );
  
  const renderAnnouncements = () => (
      <View style={styles.tabContent}>
          {batch.announcements && batch.announcements.length > 0 ? (
              batch.announcements.map((item, i) => (
                  <View key={i} style={styles.announcementCard}>
                      <View style={styles.announcementHeader}>
                          <View style={styles.announcementAvatar}>
                               <Text style={styles.announcementAvatarText}>A</Text>
                          </View>
                          <View>
                              <Text style={styles.announcementSender}>Announcement</Text>
                              <Text style={styles.announcementDate}>{formatDate(item.createdAt)}</Text>
                          </View>
                      </View>
                      <Text style={styles.announcementText}>{item.message || item.content}</Text>
                  </View>
              ))
          ) : (
              <View style={styles.emptyState}>
                   <Ionicons name="megaphone-outline" size={50} color={COLORS.textSecondary} />
                   <Text style={styles.emptyText}>No announcements yet.</Text>
              </View>
          )}
      </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Classroom...</Text>
      </View>
    );
  }

  const renderVideoPlayerModal = () => (
      <Modal
        visible={isVideoVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsVideoVisible(false)}
      >
          <View style={styles.fullScreenContainer}>
              <StatusBar hidden={true} />
              
              {/* Header */}
              <View style={styles.fsHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                      <Ionicons name="play-circle" size={24} color={COLORS.primary} />
                      <Text style={styles.fsTitle} numberOfLines={1}>{playingVideoTitle}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsVideoVisible(false)} style={styles.fsCloseBtn}>
                      <Ionicons name="close" size={28} color={COLORS.white} />
                  </TouchableOpacity>
              </View>

              {/* Video Player */}
              <View style={styles.fsPlayerContainer}>
                  <YoutubePlayer
                    height={240}
                    play={true}
                    videoId={playingVideoId}
                    onChangeState={onStateChange}
                    initialPlayerParams={{
                        modestbranding: 0, // We are hiding it manually
                        rel: 0,
                        showinfo: 0,
                        controls: 1, // Keep standard controls for scrubbing, or 0 if building custom (using 1 for reliability)
                        iv_load_policy: 3,
                    }}
                    webViewProps={{
                        androidLayerType: 'hardware',
                        allowsFullscreenVideo: true,
                    }}
                  />
                  {/* HACK: Visual Mask to Hide YouTube Logo to look like "Built-in Player" */}
                  <View style={styles.logoBlocker} />
                  {/* Mask for Top Right "More Info" / Share icons if needed */}
                  {/* <View style={styles.topRightBlocker} /> */} 
              </View>

              {/* Up Next / Playlist */}
              <View style={styles.fsPlaylistContainer}>
                  <Text style={styles.fsSectionTitle}>UP NEXT</Text>
                  <ScrollView contentContainerStyle={{paddingBottom: 20}}>
                      {/* Batch Videos Playlist */}
                      {batch.videos && batch.videos.map((vid, i) => (
                          <TouchableOpacity 
                            key={i} 
                            style={[styles.fsPlaylistItem, vid.youtubeId === playingVideoId && styles.fsPlaylistItemActive]}
                            onPress={() => playVideo(vid)}
                          >
                              <Image 
                                source={{ uri: `https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg` }} 
                                style={styles.fsThumbnail} 
                              />
                              <View style={styles.fsItemInfo}>
                                  <Text style={[styles.fsItemTitle, vid.youtubeId === playingVideoId && {color: COLORS.primary}]} numberOfLines={2}>
                                      {vid.title}
                                  </Text>
                                  <Text style={styles.fsItemSubtitle}>{vid.duration || 'Video'}</Text>
                              </View>
                              {vid.youtubeId === playingVideoId && (
                                  <Ionicons name="stats-chart" size={16} color={COLORS.primary} />
                              )}
                          </TouchableOpacity>
                      ))}
                      
                      {/* Past Live Sessions Playlist */}
                      {batch.liveSessions && batch.liveSessions.length > 0 && (
                          <>
                            <View style={styles.fsDivider} />
                            <Text style={[styles.fsSectionTitle, {marginTop: 15}]}>PAST LIVE SESSIONS</Text>
                            {batch.liveSessions.map((session, i) => {
                                const yId = session.youtubeVideoId || getYoutubeId(session.recordingUrl) || getYoutubeId(session.youtubeLiveUrl);
                                if (!yId) return null;
                                return (
                                    <TouchableOpacity 
                                        key={`live-${i}`} 
                                        style={[styles.fsPlaylistItem, yId === playingVideoId && styles.fsPlaylistItemActive]}
                                        onPress={() => playVideo({ youtubeId: yId, title: session.topic })}
                                    >
                                        <View style={[styles.fsThumbnail, {backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center'}]}>
                                            <Ionicons name="videocam" size={24} color={COLORS.secondary} />
                                        </View>
                                        <View style={styles.fsItemInfo}>
                                            <Text style={[styles.fsItemTitle, yId === playingVideoId && {color: COLORS.primary}]} numberOfLines={2}>
                                                {session.topic || `Session ${i+1}`}
                                            </Text>
                                            <Text style={styles.fsItemSubtitle}>{formatDate(session.createdAt)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                          </>
                      )}
                  </ScrollView>
              </View>
          </View>
      </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Premium Header */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
            <Text style={styles.batchTitle}>{batch?.batchName || 'Batch Details'}</Text>
            <Text style={styles.subTitle}>{batch?.course?.title || 'Classroom'}</Text>
        </View>
        <View style={styles.headerRight}>
             <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
        </View>
      </LinearGradient>

      {/* GLOBAL VIDEO PLAYER UI REMOVED - Using Full Screen Modal Instead */}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {activeTab === tab && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Videos' && renderVideos()}
        {activeTab === 'Live Classes' && renderClasses()}
        {activeTab === 'Assignments' && renderAssignments()}
        {activeTab === 'Resources' && renderResources()}
        {activeTab === 'Announcements' && renderAnnouncements()}
      </ScrollView>

      {/* Full Screen Video Player Modal */}
      {renderVideoPlayerModal()}

      {/* Internal Resource Viewer Modal */}
      <Modal
        visible={resourceModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setResourceModalVisible(false)}
      >
          <View style={{flex: 1, backgroundColor: COLORS.background}}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{resourceTitle}</Text>
                  <TouchableOpacity onPress={() => setResourceModalVisible(false)} style={styles.closeButton}>
                      <Ionicons name="close" size={28} color={COLORS.white} />
                  </TouchableOpacity>
              </View>
              
              {/* Conditional Rendering: Image vs WebView */}
              {/* Check explicit type first, then fallback to regex */}
              {/* Conditional Rendering: Image vs WebView */}
              {/* Check explicit type first, then fallback to regex */}
              {/* Conditional Rendering: Image vs WebView */}
              {/* Check explicit type first, then fallback to regex */}
              {(resourceType === 'image' || (currentResourceUrl && currentResourceUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i))) ? (
                  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333'}}>
                      {/* DEBUG: Show URL to understand why it fails */}
                      <Text style={{color: 'white', marginBottom: 10, fontSize: 10, padding: 10, textAlign: 'center'}}>
                          Loading: {currentResourceUrl}
                      </Text>
                      <Image 
                        source={{ uri: currentResourceUrl }} 
                        style={{width: width, height: height * 0.7, backgroundColor: 'black'}} 
                        resizeMode="contain"
                        onError={(e) => Alert.alert("Image Load Error", e.nativeEvent.error)}
                      />
                  </View>
              ) : (
                  <WebView 
                    source={{ uri: currentResourceUrl }} 
                    startInLoadingState={true}
                    renderLoading={() => <ActivityIndicator size="large" color={COLORS.primary} style={{position: 'absolute', top: '50%', left: '50%'}} />}
                    style={{flex: 1}}
                  />
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  batchTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subTitle: {
      color: COLORS.primary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 2,
  },
  headerRight: {
      padding: 8,
  },
  tabsContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  tabsScroll: {
      paddingHorizontal: 15,
  },
  tab: {
    marginRight: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  activeTabIndicator: {
      height: 3,
      width: 20,
      backgroundColor: COLORS.primary,
      borderRadius: 2,
      marginTop: 4,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 5,
      elevation: 5,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Added bottom padding as requested
  },
  tabContent: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  dayBadge: {
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  dayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    color: COLORS.text,
    fontSize: 14,
  },
  emptyText: {
      color: COLORS.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 10,
  },
  trainerRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
  },
  avatarText: {
      color: COLORS.white,
      fontSize: 20,
      fontWeight: 'bold',
  },
  trainerName: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold',
  },
  trainerEmail: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  // Video Styles
  videoCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      marginBottom: 15,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
  },
  videoCardActive: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      marginBottom: 15,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: COLORS.primary,
  },
  videoThumbnail: {
      width: 120,
      height: 90,
  },
  thumbnailOverlay: {
      position: 'absolute',
      width: 120,
      height: 90,
      justifyContent: 'center',
      alignItems: 'center',
  },
  videoInfo: {
      flex: 1,
      padding: 10,
      justifyContent: 'center',
  },
  videoTitle: {
      color: COLORS.white,
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 5,
  },
  videoMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
  },
  videoDuration: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  playingIndicator: {
      position: 'absolute',
      right: 10,
      top: 10,
  },
  playerContainer: {
      backgroundColor: COLORS.black,
      borderRadius: 15,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
  },
  playerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: COLORS.surface,
  },
  playerHeaderText: {
      color: COLORS.primary,
      fontWeight: 'bold',
  },
  emptyState: {
      alignItems: 'center',
      marginTop: 50,
      padding: 20,
  },
  // Classes
  liveCard: {
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: COLORS.secondary,
      position: 'relative',
  },
  liveHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
  },
  liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.error,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
  },
  liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.white,
  },
  liveText: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: 'bold',
  },
  liveDate: {
      color: COLORS.textHighlight,
      fontSize: 12,
      fontWeight: 'bold',
  },
  liveTitle: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
  },
  liveDesc: {
      color: COLORS.textSecondary,
      fontSize: 14,
      marginBottom: 15,
  },
  joinButton: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
  },
  joinButtonText: {
      color: COLORS.black,
      fontWeight: 'bold',
      fontSize: 16,
  },
  historyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.white,
      marginBottom: 15,
  },
  pastClassCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
      marginBottom: 10,
  },
  pastClassIcon: {
      marginRight: 15,
  },
  pastClassInfo: {
      flex: 1,
  },
  pastClassTitle: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 14,
  },
  pastClassDate: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  // Assignments
  cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.white,
      marginBottom: 4,
  },
  cardDate: {
      fontSize: 12,
      color: COLORS.error,
      fontWeight: 'bold',
  },
  cardBody: {
      marginTop: 10,
      color: COLORS.textSecondary,
      fontSize: 14,
      lineHeight: 20,
  },
  iconBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
  },
  // Resources
  resourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      padding: 15,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.surfaceLight,
  },
  resourceIcon: {
      width: 45,
      height: 45,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
  },
  resourceInfo: {
      flex: 1,
  },
  resourceTitle: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  resourceMeta: {
      color: COLORS.textSecondary,
      fontSize: 12,
  },
  // Announcements
  announcementCard: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      borderLeftWidth: 4,
      borderLeftColor: COLORS.secondary,
  },
  announcementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
  },
  announcementAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      borderWidth: 1,
      borderColor: COLORS.secondary,
  },
  announcementAvatarText: {
      color: COLORS.secondary,
      fontWeight: 'bold',
  },
  announcementSender: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 14,
  },
  announcementDate: {
      color: COLORS.textSecondary,
      fontSize: 10,
  },
  announcementText: {
      color: COLORS.text,
      fontSize: 14,
      lineHeight: 22,
  },
  scheduleRowSimple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    marginTop: 5,
  },
  scheduleDay: {
      color: COLORS.primary,
      fontSize: 14,
      fontWeight: '600',
  },
  scheduleTime: {
      color: COLORS.textSecondary,
      fontSize: 14,
  },
  // REMOVED OLD PLAYER STYLES
  
  // Full Screen Player Styles
  fullScreenContainer: {
      flex: 1,
      backgroundColor: '#000000',
  },
  fsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      paddingTop: 40, // For notch
      backgroundColor: '#111',
      borderBottomWidth: 1,
      borderBottomColor: '#222',
  },
  fsTitle: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10,
      flex: 1,
  },
  fsCloseBtn: {
      padding: 5,
  },
  fsPlayerContainer: {
      width: '100%',
      backgroundColor: '#000',
      position: 'relative', // Needed for absolute children
  },
  logoBlocker: {
      position: 'absolute',
      bottom: 0, // Adjust based on logo position
      right: 0,
      width: 120, // Cover the logo click area
      height: 50,
      backgroundColor: '#000', // Matches player bg
      zIndex: 999,
  },
  fsPlaylistContainer: {
      flex: 1,
      backgroundColor: '#0f0f0f',
      padding: 15,
  },
  fsSectionTitle: {
      color: '#aaa',
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 10,
      letterSpacing: 1,
  },
  fsPlaylistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      padding: 10,
      borderRadius: 8,
  },
  fsPlaylistItemActive: {
      backgroundColor: '#222',
      borderLeftWidth: 3,
      borderLeftColor: COLORS.primary,
  },
  fsThumbnail: {
      width: 100,
      height: 56,
      borderRadius: 6,
      marginRight: 10,
      backgroundColor: '#333',
  },
  fsItemInfo: {
      flex: 1,
  },
  fsItemTitle: {
      color: COLORS.white,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
  },
  fsItemSubtitle: {
      color: '#666',
      fontSize: 12,
  },
  fsDivider: {
      height: 1,
      backgroundColor: '#333',
      marginVertical: 10,
  },

  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      paddingTop: 50,
      backgroundColor: COLORS.surface,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.surfaceLight,
  },
  modalTitle: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
  },
  closeButton: {
      padding: 5,
  },
});

export default BatchDetailsScreen;
