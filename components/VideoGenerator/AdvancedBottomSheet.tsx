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
          {/* 1️⃣ Style de vidéo - Rectangles arrondis */}
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

          {/* 2️⃣ Image de référence */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Import d'image</Text>
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
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="image-outline" size={48} color="#6a6a6a" />
                  <View style={styles.uploadPlusIcon}>
                    <Ionicons name="add" size={20} color="#ffffff" />
                  </View>
                </View>
                <Text style={styles.uploadText}>
                  Appuyez ici pour uploader la photo à laquelle vous voulez donner vie !
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3️⃣ Format vidéo */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Format vidéo</Text>
            <View style={styles.formatsContainer}>
              {formats.map((format) => {
                const isSelected = selectedFormat.id === format.id;
                // Choisir l'icône selon le format
                const formatIcon = format.id === 'square' ? 'square-outline' :
                                 format.id === 'portrait' ? 'phone-portrait-outline' :
                                 'desktop-outline';
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
                    <Ionicons
                      name={formatIcon}
                      size={22}
                      color={isSelected ? '#2d7dff' : '#9a9a9a'}
                    />
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
    paddingHorizontal: 18,
    paddingBottom: 32,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    opacity: 0.9,
  },

  // Style de vidéo - Rectangles arrondis, taille réduite de 20%
  stylesContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  styleButton: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2c',
    minHeight: 40,
  },
  selectedStyleButton: {
    borderColor: '#2d7dff',
    backgroundColor: 'rgba(45, 125, 255, 0.15)',
  },
  styleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9a9a9a',
  },
  selectedStyleName: {
    color: '#2d7dff',
    fontWeight: '700',
  },

  // Format vidéo - Taille réduite de 25%, icônes professionnelles
  formatsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 5,
  },
  selectedFormatButton: {
    borderColor: '#2d7dff',
    backgroundColor: 'rgba(45, 125, 255, 0.1)',
  },
  formatName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedFormatName: {
    color: '#2d7dff',
  },
  formatDimensions: {
    fontSize: 10,
    color: '#9a9a9a',
  },

  // Image de référence - Fond noir, icône grise avec "+" en haut à droite
  uploadButton: {
    borderWidth: 1.5,
    borderColor: '#2a2a2c',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    gap: 16,
  },
  uploadIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlusIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#2d7dff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#e0e0e0',
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

  // Apply button - Noir avec texte blanc, sans lueur bleue
  applyButton: {
    backgroundColor: '#0D0D0D',
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
