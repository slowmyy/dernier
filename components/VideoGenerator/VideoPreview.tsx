import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoPreviewProps {
  generatedVideoUrl: string | null;
  previewVideoUrl?: string;
  isGenerating: boolean;
  loadingProgress: number;
  selectedModelName: string;
  videoWidth?: number;
  videoHeight?: number;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function VideoPreview({
  generatedVideoUrl,
  previewVideoUrl,
  isGenerating,
  loadingProgress,
  selectedModelName,
  videoWidth,
  videoHeight,
  onDownload,
  onShare,
}: VideoPreviewProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Calculer le ratio selon le format sélectionné
  const getAspectRatio = (): number => {
    if (videoWidth && videoHeight) {
      return videoWidth / videoHeight;
    }
    // Valeur par défaut (portrait 9:16)
    return 9 / 16;
  };

  const aspectRatio = getAspectRatio();

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = (error: any) => {
    console.error('Erreur de chargement vidéo:', error);
    setVideoError(true);
    setVideoLoaded(false);
  };

  const renderVideo = (videoUrl: string, isPreview: boolean = false) => {
    if (Platform.OS === 'web') {
      return (
        <video
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 18,
            objectFit: 'cover',
          }}
          controls={!isPreview}
          autoPlay={isPreview}
          loop={isPreview}
          muted={isPreview}
          playsInline
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        />
      );
    }

    return (
      <ExpoVideo
        source={{ uri: videoUrl }}
        style={styles.video}
        useNativeControls={!isPreview}
        resizeMode={ResizeMode.COVER}
        isLooping={isPreview}
        shouldPlay={isPreview}
        isMuted={isPreview}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.videoContainer, { aspectRatio }]}>
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2d7dff" />
            <Text style={styles.loadingText}>
              Création de votre vidéo...
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${loadingProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(loadingProgress)}%</Text>
          </View>
        ) : generatedVideoUrl ? (
          <>
            {renderVideo(generatedVideoUrl, false)}
            {!videoLoaded && !videoError && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2d7dff" />
              </View>
            )}
            {videoError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle" size={48} color="#ff4444" />
                <Text style={styles.errorText}>
                  Erreur de chargement
                </Text>
              </View>
            )}
          </>
        ) : previewVideoUrl ? (
          renderVideo(previewVideoUrl, true)
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="film-outline" size={64} color="#3a3a3c" />
            <Text style={styles.placeholderText}>
              Aucune bande-annonce disponible
            </Text>
          </View>
        )}
      </View>

      {generatedVideoUrl && !isGenerating && (
        <View style={styles.actionsContainer}>
          {onDownload && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDownload}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Télécharger</Text>
            </TouchableOpacity>
          )}
          {onShare && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Partager</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  videoContainer: {
    borderRadius: 18,
    backgroundColor: '#161618',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e0e0e0',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#2a2a2c',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2d7dff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d7dff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 22, 24, 0.8)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 22, 24, 0.95)',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff4444',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#b3b3b3',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
