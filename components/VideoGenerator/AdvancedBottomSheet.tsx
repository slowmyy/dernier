import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoStyle } from './AdvancedPanel';
import { VideoFormat } from './FormatSelector';

interface AdvancedBottomSheetProps {
  visible: boolean;
  selectedStyle: VideoStyle;
  videoStyles: VideoStyle[];
  onSelectStyle: (style: VideoStyle) => void;
  formats: VideoFormat[];
  selectedFormat: VideoFormat;
  onSelectFormat: (format: VideoFormat) => void;
  onImportImage: () => void;
  referenceImagePreview: string | null;
  onRemoveImage: () => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AdvancedBottomSheet({
  visible,
  selectedStyle,
  videoStyles,
  onSelectStyle,
  formats,
  selectedFormat,
  onSelectFormat,
  onImportImage,
  referenceImagePreview,
  onRemoveImage,
  onClose,
}: AdvancedBottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Raccourcir les noms pour l'affichage
  const getStyleInitial = (style: VideoStyle): string => {
    switch (style.id) {
      case 'realistic':
        return 'R';
      case 'cinematic':
        return 'C';
      case 'anime':
        return 'A';
      case 'satisfying':
        return 'S';
      default:
        return style.name.charAt(0);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Paramètres avancés</Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1️⃣ Style de vidéo */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Style de vidéo</Text>
            <View style={styles.stylesContainer}>
              {videoStyles.map((style) => {
                const isSelected = selectedStyle.id === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.styleButton,
                      isSelected && styles.selectedStyleButton,
                    ]}
                    onPress={() => onSelectStyle(style)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.styleCircle,
                      isSelected && styles.selectedStyleCircle,
                    ]}>
                      <Text style={[
                        styles.styleInitial,
                        isSelected && styles.selectedStyleInitial,
                      ]}>
                        {getStyleInitial(style)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.styleName,
                      isSelected && styles.selectedStyleName,
                    ]}>
                      {style.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2️⃣ Format vidéo */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Format vidéo</Text>
            <View style={styles.formatsContainer}>
              {formats.map((format) => {
                const isSelected = selectedFormat.id === format.id;
                return (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.formatButton,
                      isSelected && styles.selectedFormatButton,
                    ]}
                    onPress={() => onSelectFormat(format)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.formatEmoji}>{format.emoji}</Text>
                    <Text style={[
                      styles.formatName,
                      isSelected && styles.selectedFormatName,
                    ]}>
                      {format.name}
                    </Text>
                    <Text style={styles.formatDimensions}>
                      {format.width}×{format.height}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3️⃣ Image de référence */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Image de référence (optionnelle)</Text>
            {referenceImagePreview ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: referenceImagePreview }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={onRemoveImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={28} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={onImportImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={40} color="#2d7dff" />
                <Text style={styles.uploadText}>
                  Appuyez ici pour uploader la photo à laquelle vous voulez donner vie !
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Apply button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.applyButtonText}>Appliquer</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161618',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3a3a3c',
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 14,
    opacity: 0.9,
  },

  // Style de vidéo
  stylesContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  styleButton: {
    alignItems: 'center',
    gap: 10,
  },
  styleCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1c1c1e',
    borderWidth: 2,
    borderColor: '#2a2a2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStyleCircle: {
    borderColor: '#2d7dff',
    backgroundColor: 'rgba(45, 125, 255, 0.15)',
  },
  styleInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9a9a9a',
  },
  selectedStyleInitial: {
    color: '#2d7dff',
  },
  styleName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9a9a9a',
  },
  selectedStyleName: {
    color: '#2d7dff',
    fontWeight: '600',
  },

  // Format vidéo
  formatsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  selectedFormatButton: {
    borderColor: '#2d7dff',
    backgroundColor: 'rgba(45, 125, 255, 0.1)',
  },
  formatEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  formatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedFormatName: {
    color: '#2d7dff',
  },
  formatDimensions: {
    fontSize: 11,
    color: '#9a9a9a',
  },

  // Image de référence
  uploadButton: {
    borderWidth: 2,
    borderColor: '#2d7dff',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(45, 125, 255, 0.05)',
    gap: 14,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2d7dff',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#161618',
    borderRadius: 14,
  },

  // Apply button
  applyButton: {
    backgroundColor: '#2d7dff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2d7dff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
