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
  FlatList,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { storageService, StoredImage } from '@/services/storage';
import { galleryEvents } from '@/services/galleryEvents'; // 🆕 Import pour notifier les mises à jour de galerie
import { Video, ResizeMode } from 'expo-av';
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
  const thumbnailResizeMode = ResizeMode.COVER;
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
  const [activeFilter, setActiveFilter] = useState<MediaType>('photos');
  const [username, setUsername] = useState('username_9221...');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoredImage | null>(null);
  const [isProfileEditModalVisible, setIsProfileEditModalVisible] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

  const handleDeleteRequest = useCallback((image: StoredImage) => {
    setItemToDelete(image);
    setDeleteConfirmVisible(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      console.log('🗑️ Suppression du média:', itemToDelete.id);
      setDeleteConfirmVisible(false);

      // Suppression du média
      if (itemToDelete.isVideo) {
        await storageService.deleteVideo(itemToDelete.id);
      } else {
        await storageService.deleteImage(itemToDelete.id);
      }

      // Rafraîchissement de la galerie
      await refreshMedia();

      // Fermeture du modal APRÈS la suppression
      if (selectedImage?.id === itemToDelete.id) {
        handleCloseModal();
      }

      setItemToDelete(null);
      console.log('✅ Média supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le média');
    }
  }, [itemToDelete, selectedImage, refreshMedia, handleCloseModal]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  }, []);

  const handleOpenProfileEdit = useCallback(() => {
    setEditedUsername(username);
    setIsProfileEditModalVisible(true);
  }, [username]);

  const handleCloseProfileEdit = useCallback(() => {
    setIsProfileEditModalVisible(false);
  }, []);

  const handleSaveProfile = useCallback(() => {
    setUsername(editedUsername);
    setIsProfileEditModalVisible(false);
    Alert.alert('Succès', 'Profil mis à jour avec succès!');
  }, [editedUsername]);

  const handleChangeProfileImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire pour changer la photo de profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error changing profile image:', error);
      Alert.alert('Erreur', 'Impossible de changer la photo de profil. Veuillez réessayer.');
    }
  }, []);

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
                    <Ionicons name="settings" size={24} color="#FFFFFF" />
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
                  <Ionicons name="trophy" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.rewardsContent}>
                  <Text style={styles.rewardsTitle}>Daily Rewards</Text>
                  <Text style={styles.rewardsSubtitle}>Visit the app daily to get free coins</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </RNAnimated.View>

              {/* User Profile Section */}
              <View style={styles.userSection}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>U</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.username}>{username}</Text>
                <TouchableOpacity style={styles.editButton} onPress={handleOpenProfileEdit}>
                  <Ionicons name="create" size={20} color="#FFFFFF" />
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
            allMedia={filteredMedia}
            onClose={handleCloseModal}
            onDownload={handleDownloadImage}
            onShare={handleShareImage}
            onDelete={handleDeleteRequest}
            onAnimate={handleAnimateImage}
            isDownloading={isDownloading}
            isSharing={isSharing}
          />
        </Modal>

        {/* Modal de confirmation de suppression personnalisé */}
        <Modal
          visible={deleteConfirmVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDeleteCancel}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContainer}>
              <Text style={styles.deleteModalTitle}>
                Êtes-vous sûr de vouloir supprimer ce fichier ?
              </Text>
              <Text style={styles.deleteModalMessage}>
                Cette action ne peut pas être annulée et les crédits ne seront pas remboursés.
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.deleteModalButtonDelete]}
                  onPress={handleDeleteConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteModalButtonTextDelete}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                  onPress={handleDeleteCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteModalButtonTextCancel}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal d'édition de profil */}
        <Modal
          visible={isProfileEditModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseProfileEdit}
        >
          <View style={styles.profileEditModalOverlay}>
            <View style={styles.profileEditModalContainer}>
              <View style={styles.profileEditHeader}>
                <Text style={styles.profileEditTitle}>Edit Profile</Text>
                <TouchableOpacity
                  style={styles.profileEditCloseButton}
                  onPress={handleCloseProfileEdit}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileEditContent}>
                <View style={styles.profileEditAvatarSection}>
                  <View style={styles.profileEditAvatar}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileEditAvatarImage} />
                    ) : (
                      <Text style={styles.profileEditAvatarText}>U</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={handleChangeProfileImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera" size={18} color="#007AFF" />
                    <Text style={styles.changePhotoButtonText}>Changer la photo</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profileEditInputSection}>
                  <Text style={styles.profileEditLabel}>Username</Text>
                  <TextInput
                    style={styles.profileEditInput}
                    value={editedUsername}
                    onChangeText={setEditedUsername}
                    placeholder="Entrez votre nom d'utilisateur"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={styles.profileEditSaveButton}
                  onPress={handleSaveProfile}
                  activeOpacity={0.8}
                >
                  <Text style={styles.profileEditSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const MediaItem = ({
  item,
  onDownload,
  onShare,
  onAnimate,
  isDownloading,
  isSharing
}: {
  item: StoredImage;
  onDownload: (image: StoredImage) => void;
  onShare: (image: StoredImage) => void;
  onAnimate: (image: StoredImage) => void;
  isDownloading: boolean;
  isSharing: boolean;
}) => {
  const [actualImageUrl, setActualImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // 🆕 Stocker les dimensions natives de la vidéo pour un affichage correct dès le 1er clic
  const [nativeVideoDimensions, setNativeVideoDimensions] = useState<{width: number, height: number} | null>(null);
  // 🆕 Fallback : forcer l'affichage après timeout même sans dimensions natives
  const [forceDisplay, setForceDisplay] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('🔄 [MediaItem] Render - Item ID:', item?.id, 'isVideo:', item?.isVideo, 'videoReady:', videoReady, 'nativeVideoDimensions:', nativeVideoDimensions, 'forceDisplay:', forceDisplay);

  const imageAspectRatio = useMemo(() => {
    if (item?.dimensions) {
      const dimensionParts = item.dimensions
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
  }, [item]);

  useEffect(() => {
    let isMounted = true;

    if (!item) {
      console.log('⚠️ [MediaItem] useEffect - Pas d\'item');
      setActualImageUrl('');
      setImageLoading(false);
      setVideoReady(false);
      setNativeVideoDimensions(null);
      setForceDisplay(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return () => {
        isMounted = false;
      };
    }

    console.log('🔄 [MediaItem] useEffect - Item changé:', item.id, 'isVideo:', item.isVideo);

    // Réinitialiser l'état de la vidéo quand l'item change
    setVideoReady(false);
    setNativeVideoDimensions(null);
    setForceDisplay(false);

    // Nettoyer le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const hasResolvedUrl = Boolean(item.resolvedUrl && item.resolvedUrl.trim() !== '');
    const fallbackUrl = hasResolvedUrl ? item.resolvedUrl! : item.url;

    console.log('📍 [MediaItem] URL - hasResolvedUrl:', hasResolvedUrl, 'URL:', fallbackUrl);

    if (hasResolvedUrl) {
      setActualImageUrl(fallbackUrl);
      setImageLoading(false);

      // 🆕 Pour les vidéos : timeout de sécurité (3s) pour afficher même sans dimensions natives
      if (item.isVideo) {
        console.log('⏱️ [MediaItem] Démarrage timeout de sécurité (3s) pour vidéo');
        timeoutRef.current = setTimeout(() => {
          if (isMounted && !nativeVideoDimensions) {
            console.warn('⚠️ [MediaItem] TIMEOUT : Affichage forcé de la vidéo sans dimensions natives');
            setForceDisplay(true);
            setVideoReady(true);
          }
        }, 3000);
      }

      return () => {
        isMounted = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    setActualImageUrl(fallbackUrl);
    setImageLoading(true);

    const loadActualUrl = async () => {
      try {
        console.log('🔄 [MediaItem] Chargement URL pour item:', item.id);
        const url = await storageService.getImageUrl(item);
        if (!isMounted) return;

        if (url && url.trim() !== '') {
          console.log('✅ [MediaItem] URL chargée:', url);
          setActualImageUrl(url);
        } else {
          console.log('⚠️ [MediaItem] URL vide, utilisation fallback:', fallbackUrl);
          setActualImageUrl(fallbackUrl);
        }

        // 🆕 Pour les vidéos : timeout de sécurité (3s) pour afficher même sans dimensions natives
        if (item.isVideo) {
          console.log('⏱️ [MediaItem] Démarrage timeout de sécurité (3s) pour vidéo');
          timeoutRef.current = setTimeout(() => {
            if (isMounted && !nativeVideoDimensions) {
              console.warn('⚠️ [MediaItem] TIMEOUT : Affichage forcé de la vidéo sans dimensions natives');
              setForceDisplay(true);
              setVideoReady(true);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('❌ [MediaItem] Erreur chargement URL:', error);
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [item]);

  const getMediaAspectRatio = () => {
    // 🆕 PRIORITÉ 1: Utiliser les dimensions natives capturées (garantit le bon ratio au 1er clic)
    if (item.isVideo && nativeVideoDimensions) {
      return nativeVideoDimensions.width / nativeVideoDimensions.height;
    }

    // PRIORITÉ 2: Utiliser les métadonnées stockées de l'item
    if (item.isVideo && item.videoWidth && item.videoHeight) {
      return item.videoWidth / item.videoHeight;
    }

    // PRIORITÉ 3: Parser les dimensions du champ "dimensions"
    if (item.dimensions) {
      const [rawWidth, rawHeight] = item.dimensions
        .toLowerCase()
        .split(/[x×]/)
        .map(part => Number(part.trim()));

      if (rawWidth > 0 && rawHeight > 0) {
        return rawWidth / rawHeight;
      }
    }

    // PRIORITÉ 4: Fallback (sera remplacé dès que onReadyForDisplay se déclenche)
    if (item.isVideo) {
      return 9 / 16;
    }

    return imageAspectRatio;
  };

  const mediaAspectRatio = getMediaAspectRatio();
  const { width: fullscreenWidth, height: fullscreenHeight } = Dimensions.get('window');

  const mediaDimensions = useMemo(() => {
    const safeAreaTop = 60;
    const safeAreaBottom = 140;
    const availableHeight = fullscreenHeight - safeAreaTop - safeAreaBottom;
    const availableWidth = fullscreenWidth * 0.98;

    const containerAspectRatio = availableWidth / availableHeight;

    if (mediaAspectRatio > containerAspectRatio) {
      return {
        width: availableWidth,
        height: availableWidth / mediaAspectRatio,
      };
    } else {
      return {
        width: availableHeight * mediaAspectRatio,
        height: availableHeight,
      };
    }
  }, [fullscreenHeight, fullscreenWidth, mediaAspectRatio, nativeVideoDimensions]);

  const fullscreenVideoResizeMode = ResizeMode.CONTAIN;

  return (
    <View style={styles.mediaItemContainer}>
      {/* Média en plein écran */}
      <View style={styles.fullscreenMediaContainer}>
        {imageLoading || !actualImageUrl ? (
          <View style={styles.modalImageLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : item.isVideo ? (
          <>
            {/* 🆕 Afficher le loader jusqu'à ce que la vidéo soit prête (avec ou sans dimensions natives) */}
            {!videoReady && !forceDisplay && (
              <View style={styles.modalImageLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ color: '#FFFFFF', marginTop: 12, fontSize: 14 }}>
                  Chargement de la vidéo...
                </Text>
              </View>
            )}
            <Video
              source={{ uri: actualImageUrl }}
              style={[
                styles.fullscreenMedia,
                mediaDimensions,
                // 🆕 Afficher la vidéo si dimensions natives OU forceDisplay après timeout
                { opacity: (nativeVideoDimensions || forceDisplay) ? 1 : 0 }
              ]}
              resizeMode={fullscreenVideoResizeMode}
              shouldPlay={videoReady || forceDisplay}
              isLooping
              useNativeControls
              onLoadStart={() => {
                console.log('🎬 [VIDEO] onLoadStart - Début du chargement - URI:', actualImageUrl);
              }}
              onLoad={(status) => {
                console.log('🎬 [VIDEO] onLoad - Vidéo chargée - Status:', status);
                // Fallback : si onReadyForDisplay ne se déclenche pas, forcer après 500ms
                setTimeout(() => {
                  console.log('🎬 [VIDEO] onLoad timeout - Force videoReady si pas encore fait');
                  setVideoReady(true);
                }, 500);
              }}
              onReadyForDisplay={(event) => {
                console.log('🎬 [VIDEO] onReadyForDisplay - Event:', event);
                // 🆕 Capturer les dimensions natives RÉELLES de la vidéo pour un affichage correct
                if (event?.naturalSize?.width && event?.naturalSize?.height) {
                  console.log('✅ [VIDEO] Dimensions natives capturées:', event.naturalSize.width, 'x', event.naturalSize.height);
                  setNativeVideoDimensions({
                    width: event.naturalSize.width,
                    height: event.naturalSize.height
                  });
                  // Annuler le timeout de sécurité car on a les dimensions
                  if (timeoutRef.current) {
                    console.log('✅ [VIDEO] Annulation du timeout (dimensions reçues)');
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                  }
                } else {
                  console.warn('⚠️ [VIDEO] onReadyForDisplay appelé mais pas de naturalSize dans event');
                }
                setVideoReady(true);
              }}
              onError={(error) => {
                console.error('❌ [VIDEO] Erreur de chargement:', error);
              }}
            />
          </>
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

      {/* Affichage expandable du prompt en plein écran */}
      {item.prompt ? (
        <TouchableOpacity
          style={styles.fullscreenPromptContainer}
          onPress={() => setIsPromptExpanded(!isPromptExpanded)}
          activeOpacity={0.9}
        >
          <View style={styles.promptHeader}>
            <Text style={styles.promptTitle}>Détails de Création</Text>
            {isPromptExpanded ? (
              <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            )}
          </View>
          <Text
            style={styles.fullscreenPromptText}
            numberOfLines={isPromptExpanded ? undefined : 1}
          >
            {item.prompt}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Boutons en bas */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.downloadButton, isDownloading && styles.bottomButtonDisabled]}
          onPress={() => onDownload(item)}
          disabled={isDownloading}
        >
          <Ionicons name="download" size={22} color="#FFFFFF" />
          <Text style={styles.bottomButtonText}>
            {isDownloading ? 'Téléchargement...' : 'Télécharger'}
          </Text>
        </TouchableOpacity>

        {!item.isVideo && (
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => onAnimate(item)}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <Text style={styles.bottomButtonText}>Animer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.bottomShareButton, isSharing && styles.bottomButtonDisabled]}
          onPress={() => onShare(item)}
          disabled={isSharing}
        >
          <Ionicons name="share-social" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ModalFullscreenView = ({
  selectedImage,
  allMedia,
  onClose,
  onDownload,
  onShare,
  onDelete,
  onAnimate,
  isDownloading,
  isSharing
}: {
  selectedImage: StoredImage | null;
  allMedia: StoredImage[];
  onClose: () => void;
  onDownload: (image: StoredImage) => void;
  onShare: (image: StoredImage) => void;
  onDelete: (image: StoredImage) => void;
  onAnimate: (image: StoredImage) => void;
  isDownloading: boolean;
  isSharing: boolean;
}) => {
  if (!selectedImage) return null;

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMedia, setCurrentMedia] = useState(selectedImage);

  const initialIndex = useMemo(() => {
    return allMedia.findIndex(item => item.id === selectedImage.id);
  }, [allMedia, selectedImage]);

  useEffect(() => {
    if (initialIndex >= 0 && flatListRef.current) {
      setCurrentIndex(initialIndex);
      setCurrentMedia(allMedia[initialIndex]);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
  }, [initialIndex, allMedia]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);
      setCurrentMedia(allMedia[index]);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const { height: screenHeight } = Dimensions.get('window');


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
        onPress={() => onDelete(currentMedia)}
      >
        <Ionicons name="trash" size={24} color="#FF3B30" />
      </TouchableOpacity>

      {/* FlatList avec pagination verticale */}
      <FlatList
        ref={flatListRef}
        data={allMedia}
        renderItem={({ item }) => (
          <MediaItem
            item={item}
            onDownload={onDownload}
            onShare={onShare}
            onAnimate={onAnimate}
            isDownloading={isDownloading}
            isSharing={isSharing}
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
      />
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
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  tabActive: {
    backgroundColor: '#007AFF',
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
    right: 0,
    bottom: 0,
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
  downloadIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
  },
  mediaItemContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  closeButtonTopLeft: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
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
    bottom: 110,
    left: 16,
    right: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.95,
  },
  fullscreenPromptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.85,
    lineHeight: 19,
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
  // Delete confirmation modal
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteModalContainer: {
    backgroundColor: 'rgba(50, 50, 52, 0.98)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalButtonDelete: {
    backgroundColor: 'rgba(40, 40, 42, 1)',
  },
  deleteModalButtonCancel: {
    backgroundColor: 'rgba(99, 99, 102, 1)',
  },
  deleteModalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF453A',
  },
  deleteModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Profile edit modal styles
  profileEditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileEditModalContainer: {
    backgroundColor: '#111111',
    borderRadius: 24,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  profileEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileEditTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileEditCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEditContent: {
    padding: 24,
  },
  profileEditAvatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileEditAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C6C70',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileEditAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileEditAvatarLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  profileEditInputSection: {
    marginBottom: 24,
  },
  profileEditLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  profileEditInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileEditSaveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEditSaveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  profileEditAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  changePhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});

