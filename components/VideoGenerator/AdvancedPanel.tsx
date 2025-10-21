import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormatSelector, { VideoFormat } from './FormatSelector';

export interface VideoStyle {
  id: string;
  name: string;
  thumbnail?: string;
}

interface AdvancedPanelProps {
  visible: boolean;
  selectedStyle: VideoStyle;
  videoStyles: VideoStyle[];
  onSelectStyle: (style: VideoStyle) => void;
  onImportImage: () => void;
  referenceImagePreview: string | null;
  onRemoveImage: () => void;
  // Format selector props
  formats?: VideoFormat[];
  selectedFormat?: VideoFormat;
  onSelectFormat?: (format: VideoFormat) => void;
}

export default function AdvancedPanel({
  visible,
  selectedStyle,
  videoStyles,
  onSelectStyle,
  onImportImage,
  referenceImagePreview,
  onRemoveImage,
  formats,
  selectedFormat,
  onSelectFormat,
}: AdvancedPanelProps) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && animatedHeight._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500],
          }),
          opacity: animatedOpacity,
        },
      ]}
    >
      {/* Style de vidéo */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Style de vidéo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stylesScrollContainer}
        >
          {videoStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleButton,
                selectedStyle.id === style.id && styles.selectedStyleButton,
              ]}
              onPress={() => onSelectStyle(style)}
              activeOpacity={0.7}
            >
              <View style={styles.styleThumbnail}>
                <Text style={styles.stylePlaceholder}>
                  {style.name.charAt(0)}
                </Text>
              </View>
              <Text style={[
                styles.styleName,
                selectedStyle.id === style.id && styles.selectedStyleName,
              ]}>
                {style.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Format vidéo */}
      {formats && selectedFormat && onSelectFormat && (
        <FormatSelector
          formats={formats}
          selectedFormat={selectedFormat}
          onSelectFormat={onSelectFormat}
        />
      )}

      {/* Import d'image */}
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
            <Ionicons name="image-outline" size={36} color="#2d7dff" />
            <Text style={styles.uploadText}>
              Appuyez ici pour uploader la photo à laquelle vous voulez donner vie !
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(22, 22, 24, 0.6)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b3b3b3',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stylesScrollContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  styleButton: {
    alignItems: 'center',
    gap: 8,
  },
  selectedStyleButton: {
    transform: [{ scale: 1.05 }],
  },
  styleThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#2a2a2c',
    borderWidth: 2,
    borderColor: '#3a3a3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylePlaceholder: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2d7dff',
    opacity: 0.6,
  },
  styleName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#b3b3b3',
  },
  selectedStyleName: {
    color: '#2d7dff',
    fontWeight: '600',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#2d7dff',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(45, 125, 255, 0.05)',
    gap: 12,
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
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 14,
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
});
