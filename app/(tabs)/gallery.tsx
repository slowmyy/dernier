import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Download, Share, X, Info, ChevronDown, ChevronUp, Play, Settings, Award, ChevronRight, Edit } from 'lucide-react-native';
import { storageService, StoredImage } from '@/services/storage';
import { Video } from 'expo-av';
import { useMediaCache } from '@/contexts/MediaCacheContext';
import { COLORS } from '@/constants/Colors';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GAP = 2;
const imageWidth = (screenWidth - (GAP * (NUM_COLUMNS + 1))) / NUM_COLUMNS;
const imageHeight = imageWidth * 1.15;

type MediaType = 'photos' | 'videos';

const VideoThumbnail = ({ item, onPress }: { item: StoredImage; onPress: (item: StoredImage) => void }) => {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [actualUrl, setActualUrl] = useState<string>(item.url);

  useEffect(() => {
    const loadUrl = async () => {
      if (item.isLocalRef) {
        try {
          const url = await storageService.getImageUrl(item);
          setActualUrl(url);
        } catch (error) {
          console.error('Error loading video URL:', error);
        }
      }
    };
    loadUrl();
  }, [item]);

  const handlePress = useCallback(() => {
    const resolvedUrl = actualUrl && actualUrl.trim() !== '' ? actualUrl : item.url;
    onPress({ ...item, resolvedUrl });
  }, [actualUrl, item, onPress]);

  return (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.videoOverlay}>
        <View style={styles.playIconContainer}>
          <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        {item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {Math.floor(item.duration)}s
            </Text>
          </View>
        )}
      </View>

      <Video
        source={{ uri: actualUrl }}
        style={styles.thumbnailImage}
        resizeMode="cover"
        shouldPlay={false}
        isLooping={false}
        isMuted
        onLoad={() => setThumbnailLoaded(true)}
      />

      {!thumbnailLoaded && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const ImageThumbnail = ({ item, onPress }: { item: StoredImage; onPress: (item: StoredImage) => void }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [actualImageUrl, setActualImageUrl] = useState<string>(item.url);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, Math.random() * 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadActualUrl = async () => {
      if (item.isLocalRef) {
        try {
          const url = await storageService.getImageUrl(item);
          setActualImageUrl(url);
        } catch (error) {
          console.error('Error loading image URL:', error);
          setImageError(true);
        }
      }
    };
    loadActualUrl();
  }, [item]);

  const handlePress = useCallback(() => {
    const resolvedUrl = !imageError && imageLoaded && actualImageUrl
      ? actualImageUrl
      : item.url;
    onPress({ ...item, resolvedUrl });
  }, [actualImageUrl, imageError, imageLoaded, item, onPress]);

  return (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {!imageLoaded && !imageError && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {imageError ? (
        <View style={styles.imageError}>
          <Text style={styles.imageErrorText}>❌</Text>
        </View>
      ) : (
        shouldLoad && (
          <Image
            source={{ uri: actualImageUrl }}
            style={[styles.thumbnailImage, { opacity: imageLoaded ? 1 : 0 }]}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            resizeMode="cover"
            fadeDuration={300}
            cache="force-cache"
            priority="normal"
          />
        )
      )}
    </TouchableOpacity>
  );
};

const GalleryItem = ({ item, onPress }: { item: StoredImage; onPress: (item: StoredImage) => void }) => {
  if (item.isVideo) {
    return <VideoThumbnail item={item} onPress={onPress} />;
  }
  return <ImageThumbnail item={item} onPress={onPress} />;
};

export default function Gallery() {
  const { allMedia, isLoading, refreshMedia } = useMediaCache();
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MediaType>('photos');
  const [username] = useState('username_9221...');

  const scrollY = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedImage(null);
    setShowDetails(false);
  }, []);

  const filteredMedia = useMemo(() => {
    if (activeFilter === 'photos') {
      return allMedia.filter(item => !item.isVideo);
    } else {
      return allMedia.filter(item => item.isVideo);
    }
  }, [allMedia, activeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMedia();
    setRefreshing(false);
  }, [refreshMedia]);

  const handleImagePress = useCallback(async (image: StoredImage) => {
    try {
      const resolvedUrl = await storageService.getImageUrl(image);
      setSelectedImage({
        ...image,
        resolvedUrl: resolvedUrl || image.url
      });
      setIsModalVisible(true);
      setShowDetails(false);
    } catch (error) {
      console.error('Erreur résolution URL:', error);
      setSelectedImage({ ...image, resolvedUrl: image.url });
      setIsModalVisible(true);
      setShowDetails(false);
    }
  }, []);

  const handleDeleteImage = useCallback((image: StoredImage) => {
    Alert.alert(
      `Supprimer ${image.isVideo ? 'la vidéo' : 'l\'image'}`,
      `Êtes-vous sûr de vouloir supprimer ${image.isVideo ? 'cette vidéo' : 'cette image'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (image.isVideo) {
              storageService.deleteVideo(image.id);
            } else {
              storageService.deleteImage(image.id);
            }
            await refreshMedia();
            if (selectedImage?.id === image.id) {
              handleCloseModal();
            }
          },
        },
      ]
    );
  }, [selectedImage, refreshMedia, handleCloseModal]);

  const handleDownloadImage = useCallback(async (image: StoredImage) => {
    setIsDownloading(true);
    try {
      const extension = image.isVideo ? 'mp4' : 'png';
      const filename = `genly-${image.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}-${image.timestamp}.${extension}`;
      await storageService.downloadImage(image.url, filename, image);

      const mediaType = image.isVideo ? 'Vidéo' : 'Image';
      const successMessage = Platform.OS === 'web'
        ? `${mediaType} téléchargée avec succès!`
        : `${mediaType} sauvegardée dans votre galerie!`;

      Alert.alert('Succès', successMessage);
    } catch (error) {
      const mediaType = image.isVideo ? 'la vidéo' : 'l\'image';
      Alert.alert('Erreur', error instanceof Error ? error.message : `Impossible de télécharger ${mediaType}`);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleShareImage = useCallback(async (image: StoredImage) => {
    setIsSharing(true);
    try {
      await storageService.shareImage(image.url, image.prompt, image);
      
      if (Platform.OS === 'web') {
        Alert.alert('Succès', 'Image partagée avec succès!');
      }
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de partager l\'image');
    } finally {
      setIsSharing(false);
    }
  }, []);

  const getCfgDescription = useCallback((value?: number) => {
    if (!value) return '';
    if (value <= 1.5) return 'Très créatif';
    if (value <= 2.5) return 'Créatif';
    if (value <= 4) return 'Équilibré';
    if (value <= 6) return 'Fidèle';
    return 'Très fidèle';
  }, []);

  const renderImageItem = useCallback(({ item }: { item: StoredImage }) => {
    return <GalleryItem item={item} onPress={handleImagePress} />;
  }, [handleImagePress]);

  const keyExtractor = useCallback((item: StoredImage) => item.id, []);

  const renderEmptyState = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Aucune image générée</Text>
      <Text style={styles.emptySubtitle}>
        Vos images générées apparaîtront ici
      </Text>
    </View>
  ), []);

  const renderLoadingState = useMemo(() => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  ), []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {renderLoadingState}
        </SafeAreaView>
      </View>
    );
  }

  const photosCount = allMedia.filter(m => !m.isVideo).length;
  const videosCount = allMedia.filter(m => m.isVideo).length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header avec PRO badge */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <View style={styles.headerRight}>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/profile')}
            >
              <Settings size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Rewards Card */}
        <Animated.View
          style={[
            styles.rewardsCard,
            {
              shadowOpacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.6],
              }),
              shadowRadius: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 16],
              }),
            },
          ]}
        >
          <View style={styles.rewardsIcon}>
            <Award size={32} color="#FFFFFF" />
          </View>
          <View style={styles.rewardsContent}>
            <Text style={styles.rewardsTitle}>Daily Rewards</Text>
            <Text style={styles.rewardsSubtitle}>Visit the app daily to get free coins</Text>
          </View>
          <ChevronRight size={24} color="#FFFFFF" />
        </Animated.View>

        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>
          <Text style={styles.username}>{username}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Edit size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Onglets Image/Video avec animation sticky */}
        <Animated.View
          style={[
            styles.tabsContainer,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 50],
                outputRange: [1, 0.95],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0.98],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeFilter === 'photos' && styles.tabActive,
            ]}
            onPress={() => setActiveFilter('photos')}
          >
            <Text
              style={[
                styles.tabText,
                activeFilter === 'photos' && styles.tabTextActive,
              ]}
            >
              Image
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeFilter === 'videos' && styles.tabActive,
            ]}
            onPress={() => setActiveFilter('videos')}
          >
            <Text
              style={[
                styles.tabText,
                activeFilter === 'videos' && styles.tabTextActive,
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Grille d\'images */}
        <FlatList
          data={filteredMedia}
          renderItem={renderImageItem}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                Aucun{activeFilter === 'videos' ? 'e vidéo' : 'e image'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Vos {activeFilter === 'videos' ? 'vidéos' : 'images'} apparaîtront ici
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={100}
          initialNumToRender={6}
          windowSize={10}
        />

        {/* Modal d\'affichage */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <ModalImageView
            selectedImage={selectedImage}
            onClose={handleCloseModal}
            onDownload={handleDownloadImage}
            onShare={handleShareImage}
            onDelete={handleDeleteImage}
            isDownloading={isDownloading}
            isSharing={isSharing}
            showDetails={showDetails}
            setShowDetails={setShowDetails}
            getCfgDescription={getCfgDescription}
          />
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const ModalImageView = ({ 
  selectedImage, 
  onClose, 
  onDownload, 
  onShare, 
  onDelete,
  isDownloading,
  isSharing,
  showDetails,
  setShowDetails,
  getCfgDescription
}: {
  selectedImage: StoredImage | null;
  onClose: () => void;
  onDownload: (image: StoredImage) => void;
  onShare: (image: StoredImage) => void;
  onDelete: (image: StoredImage) => void;
  isDownloading: boolean;
  isSharing: boolean;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  getCfgDescription: (value?: number) => string;
}) => {
  const [actualImageUrl, setActualImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!selectedImage) {
      setActualImageUrl('');
      setImageLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const hasResolvedUrl = Boolean(selectedImage.resolvedUrl && selectedImage.resolvedUrl.trim() !== '');
    const fallbackUrl = hasResolvedUrl ? selectedImage.resolvedUrl! : selectedImage.url;

    if (hasResolvedUrl) {
      setActualImageUrl(fallbackUrl);
      setImageLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setActualImageUrl(fallbackUrl);
    setImageLoading(true);

    const loadActualUrl = async () => {
      try {
        const url = await storageService.getImageUrl(selectedImage);
        if (!isMounted) return;

        if (url && url.trim() !== '') {
          setActualImageUrl(url);
        } else {
          setActualImageUrl(fallbackUrl);
        }
      } catch (error) {
        if (isMounted) {
          setActualImageUrl(fallbackUrl);
        }
      } finally {
        if (isMounted) {
          setImageLoading(false);
        }
      }
    };

    loadActualUrl();

    return () => {
      isMounted = false;
    };
  }, [selectedImage]);

  if (!selectedImage) return null;

  const imageAspectRatio = useMemo(() => {
    if (selectedImage.dimensions) {
      const dimensionParts = selectedImage.dimensions
        .toLowerCase()
        .split(/[x×]/)
        .map(part => Number(part.trim()));

      if (dimensionParts.length === 2) {
        const [width, height] = dimensionParts;
        if (width > 0 && height > 0) {
          return width / height;
        }
      }
    }

    return 3 / 4;
  }, [selectedImage]);

  const getMediaAspectRatio = () => {
    if (selectedImage.isVideo && selectedImage.videoWidth && selectedImage.videoHeight) {
      return selectedImage.videoWidth / selectedImage.videoHeight;
    }

    if (selectedImage.dimensions) {
      return imageAspectRatio;
    }

    return 3 / 4;
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.mediaViewContainer}>
          {imageLoading || !actualImageUrl ? (
            <View style={styles.modalImageLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : selectedImage.isVideo ? (
            <View style={[styles.videoModalContainer, { aspectRatio: getMediaAspectRatio() }]}>
              <Video
                source={{ uri: actualImageUrl }}
                style={styles.mediaFill}
                resizeMode="contain"
                shouldPlay
                isLooping
                useNativeControls
              />
            </View>
          ) : (
            <Image
              source={{ uri: actualImageUrl }}
              style={[styles.fullImage, { aspectRatio: imageAspectRatio }]}
              resizeMode="contain"
              cache="force-cache"
              priority="high"
            />
          )}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalActionButton, isDownloading && styles.modalActionButtonDisabled]}
            onPress={() => onDownload(selectedImage)}
            disabled={isDownloading}
          >
            <Download size={20} color="#007AFF" />
            <Text style={styles.modalActionText}>
              {isDownloading ? 'Téléchargement...' : 'Télécharger'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalActionButton, isSharing && styles.modalActionButtonDisabled]}
            onPress={() => onShare(selectedImage)}
            disabled={isSharing}
          >
            <Share size={20} color="#007AFF" />
            <Text style={styles.modalActionText}>
              {isSharing ? 'Partage...' : 'Partager'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalActionButton}
            onPress={() => onDelete(selectedImage)}
          >
            <Trash2 size={20} color="#FF3B30" />
            <Text style={[styles.modalActionText, styles.deleteText]}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.detailsToggleButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Info size={20} color="#007AFF" />
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Masquer les détails' : 'Voir les détails'}
          </Text>
          {showDetails ? (
            <ChevronUp size={20} color="#007AFF" />
          ) : (
            <ChevronDown size={20} color="#007AFF" />
          )}
        </TouchableOpacity>

        {showDetails && (
          <View style={styles.imageDetails}>
            <Text style={styles.detailTitle}>
              Détails {selectedImage.isVideo ? 'de la vidéo' : 'de l\'image'}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Prompt: </Text>
              "{selectedImage.prompt}"
            </Text>
            {selectedImage.isVideo && selectedImage.duration && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Durée: </Text>
                {Math.floor(selectedImage.duration)} secondes
              </Text>
            )}
            {selectedImage.style && selectedImage.style !== 'No Style' && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Style: </Text>
                {selectedImage.style}
              </Text>
            )}
            {selectedImage.model && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Modèle: </Text>
                {selectedImage.model}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  proText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B7BA8',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#8B7BA8',
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  rewardsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsContent: {
    flex: 1,
  },
  rewardsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rewardsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C6C70',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  username: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  gridContainer: {
    paddingHorizontal: GAP,
    paddingTop: 0,
    paddingBottom: 48,
  },
  row: {
    justifyContent: 'flex-start',
    gap: GAP,
  },
  imageItem: {
    width: imageWidth,
    height: imageHeight,
    marginBottom: GAP,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageLoader: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
  },
  imageErrorText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  playIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  modalHeader: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
  },
  mediaViewContainer: {
    width: '100%',
    maxHeight: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalImageLoading: {
    width: '100%',
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    maxHeight: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoModalContainer: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  mediaFill: {
    width: '100%',
    height: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  modalActionButtonDisabled: {
    opacity: 0.5,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  detailsToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  imageDetails: {
    backgroundColor: '#1C1C1E',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
