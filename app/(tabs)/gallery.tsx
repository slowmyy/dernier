import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trash2,
  Download,
  Share,
  Play,
  Settings,
  Award,
  ChevronRight,
  Edit,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import { storageService, StoredImage } from '@/services/storage';
import { galleryEvents } from '@/services/galleryEvents'; // 🆕 Import pour notifier les mises à jour de galerie
import { Video } from 'expo-av';
import { useMediaCache } from '@/contexts/MediaCacheContext';
import { COLORS } from '@/constants/Colors';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // 🆕 Détermination robuste du ratio vidéo (dimensions natives > métadonnées > fallback)
  const getVideoAspectRatio = () => {
    if (item.videoWidth && item.videoHeight) {
      return item.videoWidth / item.videoHeight;
    }

    if (item.dimensions) {
      const [rawWidth, rawHeight] = item.dimensions
        .toLowerCase()
        .split(/[x×]/)
        .map(part => Number(part.trim()));

      if (rawWidth > 0 && rawHeight > 0) {
        return rawWidth / rawHeight;
      }
    }

    return 9 / 16;
  };

  const videoAspectRatio = getVideoAspectRatio();
  const itemAspectRatio = imageWidth / imageHeight;
  const thumbnailResizeMode = videoAspectRatio > itemAspectRatio ? 'contain' : 'cover';
  const videoSourceUri = actualUrl && actualUrl.trim() !== '' ? actualUrl : item.url;

  return (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Video
        // 🆕 Utilisation de l'URL résolue la plus fiable
        source={{ uri: videoSourceUri }}
        style={styles.thumbnailImage}
        resizeMode={thumbnailResizeMode} // 🆕 Respect dynamique du ratio vidéo
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

      {/* 🆕 Overlay discret pour afficher le prompt */}
      {item.prompt ? (
        <View style={styles.promptOverlay} pointerEvents="none">
          <Text style={styles.promptText} numberOfLines={2}>
            {item.prompt}
          </Text>
        </View>
      ) : null}
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

      {/* 🆕 Overlay discret pour afficher le prompt de l'image */}
      {item.prompt ? (
        <View style={styles.promptOverlay} pointerEvents="none">
          <Text style={styles.promptText} numberOfLines={2}>
            {item.prompt}
          </Text>
        </View>
      ) : null}
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
  const [activeFilter, setActiveFilter] = useState<MediaType>('photos');
  const [username] = useState('username_9221...');

  const scrollY = useSharedValue(0);
  const glowAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        RNAnimated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 80, 120],
      [0, -68, -120],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.96],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedImage(null);
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
    } catch (error) {
      console.error('Erreur résolution URL:', error);
      setSelectedImage({ ...image, resolvedUrl: image.url });
      setIsModalVisible(true);
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
              await storageService.deleteVideo(image.id); // 🆕 Attente de la suppression vidéo
            } else {
              await storageService.deleteImage(image.id); // 🆕 Attente de la suppression image
            }
            await refreshMedia();
            galleryEvents.notifyNewMedia(); // 🆕 Notification globale après suppression
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

  const handleAnimateImage = useCallback(async (image: StoredImage) => {
    if (image.isVideo) {
      Alert.alert('Info', 'Cette fonctionnalité est disponible uniquement pour les images');
      return;
    }

    try {
      console.log('🎬 [ANIMATE] Début du processus d\'animation');
      
      const uniqueTimestamp = Date.now();
      console.log('🎬 [ANIMATE] Timestamp unique:', uniqueTimestamp);
      
      const imageData = {
        url: image.url,
        prompt: image.prompt,
        timestamp: uniqueTimestamp,
        fromImageGenerator: true,
        originalTimestamp: image.timestamp
      };
      
      await AsyncStorage.setItem('pendingVideoReferenceImage', JSON.stringify(imageData));
      
      console.log('✅ [ANIMATE] Image sauvegardée dans AsyncStorage');
      console.log('🎬 [ANIMATE] Données sauvées:', imageData);
      
      // Fermer le modal et naviguer
      handleCloseModal();
      router.push('/(tabs)/video');
      
      console.log('✅ [ANIMATE] Navigation vers l\'onglet vidéo');
      
    } catch (error) {
      console.error('❌ [ANIMATE] Erreur lors de la préparation:', error);
      try {
        await AsyncStorage.removeItem('pendingVideoReferenceImage');
      } catch (cleanupError) {
        console.error('❌ [ANIMATE] Erreur nettoyage:', cleanupError);
      }
      Alert.alert('Erreur', 'Impossible de transférer l\'image vers le générateur vidéo');
    }
  }, [handleCloseModal]);

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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.FlatList
          data={filteredMedia}
          renderItem={renderImageItem}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <Animated.View style={headerAnimatedStyle}>
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
              <RNAnimated.View
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
              </RNAnimated.View>

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

              {/* Onglets Image/Video */}
              <View style={styles.tabsContainer}>
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
              </View>
            </Animated.View>
          }
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
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />

        {/* Modal d'affichage PLEIN ÉCRAN */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <ModalFullscreenView
            selectedImage={selectedImage}
            onClose={handleCloseModal}
            onDownload={handleDownloadImage}
            onShare={handleShareImage}
            onDelete={handleDeleteImage}
            onAnimate={handleAnimateImage}
            isDownloading={isDownloading}
            isSharing={isSharing}
          />
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const ModalFullscreenView = ({
  selectedImage,
  onClose,
  onDownload,
  onShare,
  onDelete,
  onAnimate,
  isDownloading,
  isSharing
}: {
  selectedImage: StoredImage | null;
  onClose: () => void;
  onDownload: (image: StoredImage) => void;
  onShare: (image: StoredImage) => void;
  onDelete: (image: StoredImage) => void;
  onAnimate: (image: StoredImage) => void;
  isDownloading: boolean;
  isSharing: boolean;
}) => {
  const [actualImageUrl, setActualImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const imageAspectRatio = useMemo(() => {
    if (selectedImage?.dimensions) {
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

  useEffect(() => {
    setIsPromptExpanded(false);
  }, [selectedImage?.id]);

  const handleTogglePrompt = useCallback(() => {
    setIsPromptExpanded(prev => !prev);
  }, []);

  if (!selectedImage) return null;

  const getMediaAspectRatio = () => {
    if (selectedImage.isVideo && selectedImage.videoWidth && selectedImage.videoHeight) {
      return selectedImage.videoWidth / selectedImage.videoHeight;
    }

    if (selectedImage.dimensions) {
      const [rawWidth, rawHeight] = selectedImage.dimensions
        .toLowerCase()
        .split(/[x×]/)
        .map(part => Number(part.trim()));

      if (rawWidth > 0 && rawHeight > 0) {
        return rawWidth / rawHeight;
      }
    }

    if (selectedImage.isVideo) {
      return 9 / 16;
    }

    return imageAspectRatio;
  };

  const mediaAspectRatio = getMediaAspectRatio();
  const { width: fullscreenWidth, height: fullscreenHeight } = Dimensions.get('window');
  const screenAspectRatio = fullscreenWidth / fullscreenHeight;

  const mediaDimensions = useMemo(() => {
    const isWiderThanScreen = mediaAspectRatio > screenAspectRatio;

    if (isWiderThanScreen) {
      const constrainedWidth = fullscreenWidth * 0.95;
      return {
        width: constrainedWidth,
        height: constrainedWidth / mediaAspectRatio,
      };
    }

    const maxHeight = fullscreenHeight * 0.8;
    const constrainedHeight = Math.min(maxHeight, fullscreenWidth / mediaAspectRatio);
    return {
      width: constrainedHeight * mediaAspectRatio,
      height: constrainedHeight,
    };
  }, [fullscreenHeight, fullscreenWidth, mediaAspectRatio, screenAspectRatio]); // 🆕 Calcul adaptatif plein écran

  const fullscreenVideoResizeMode = mediaAspectRatio >= screenAspectRatio ? 'contain' : 'contain'; // 🆕 Pas de recadrage en plein écran

  return (
    <View style={styles.modalContainer}>
      {/* Bouton de fermeture en haut à gauche */}
      <TouchableOpacity
        style={styles.closeButtonTopLeft}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Bouton de suppression en haut à droite */}
      <TouchableOpacity
        style={styles.deleteButtonTopRight}
        onPress={() => onDelete(selectedImage)}
      >
        <Trash2 size={24} color="#FF3B30" />
      </TouchableOpacity>

      {/* Média en plein écran */}
      <View style={styles.fullscreenMediaContainer}>
        {imageLoading || !actualImageUrl ? (
          <View style={styles.modalImageLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : selectedImage.isVideo ? (
          <Video
            source={{ uri: actualImageUrl }}
            style={[styles.fullscreenMedia, mediaDimensions]}
            resizeMode={fullscreenVideoResizeMode}
            shouldPlay
            isLooping
            useNativeControls
          />
        ) : (
          <Image
            source={{ uri: actualImageUrl }}
            style={[styles.fullscreenMedia, mediaDimensions]}
            resizeMode="contain"
            cache="force-cache"
            priority="high"
          />
        )}
      </View>

      {/* 🆕 Affichage discret du prompt en plein écran */}
      {selectedImage.prompt ? (
        <View style={styles.fullscreenPromptContainer}>
          <TouchableOpacity
            activeOpacity={0.92}
            style={[
              styles.promptCard,
              isPromptExpanded ? styles.promptCardExpanded : styles.promptCardCollapsed,
            ]}
            onPress={handleTogglePrompt}
          >
            <View style={styles.promptCardHandle} />
            {isPromptExpanded ? (
              <>
                <View style={styles.promptCardHeader}>
                  <Text style={styles.promptCardTitle}>Détails de Création</Text>
                  <ChevronDown size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.promptCardPrompt}>{selectedImage.prompt}</Text>
              </>
            ) : (
              <View style={styles.promptCollapsedContent}>
                <Text style={styles.promptCollapsedText} numberOfLines={2}>
                  {selectedImage.prompt}
                </Text>
                <ChevronUp size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Boutons en bas */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.downloadButton, isDownloading && styles.bottomButtonDisabled]}
          onPress={() => onDownload(selectedImage)}
          disabled={isDownloading}
        >
          <Download size={22} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.bottomButtonText}>
            {isDownloading ? 'Téléchargement...' : 'Télécharger'}
          </Text>
        </TouchableOpacity>

        {!selectedImage.isVideo && (
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => onAnimate(selectedImage)}
          >
            <Play size={24} color="#FFFFFF" />
            <Text style={styles.bottomButtonText}>Animer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.bottomShareButton, isSharing && styles.bottomButtonDisabled]}
          onPress={() => onShare(selectedImage)}
          disabled={isSharing}
        >
          <Share size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  promptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    paddingHorizontal: 6,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.9,
    fontWeight: '400',
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
  // ✅ NOUVEAUX STYLES POUR LE MODAL PLEIN ÉCRAN
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonTopLeft: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  deleteButtonTopRight: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenMediaContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  fullscreenMedia: {
  },
  modalImageLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fullscreenPromptContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 120,
  },
  promptCard: {
    backgroundColor: 'rgba(18, 18, 18, 0.88)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  promptCardCollapsed: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  promptCardExpanded: {
    paddingTop: 20,
    paddingBottom: 22,
  },
  promptCardHandle: {
    alignSelf: 'center',
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    marginBottom: 14,
  },
  promptCollapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  promptCollapsedText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.95,
  },
  promptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  promptCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  promptCardPrompt: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  bottomButtonDisabled: {
    opacity: 0.5,
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomShareButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

