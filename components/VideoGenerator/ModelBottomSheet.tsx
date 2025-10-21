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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModelOption } from './ModelSelector';

interface ModelBottomSheetProps {
  visible: boolean;
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ModelBottomSheet({
  visible,
  selectedModel,
  models,
  onSelectModel,
  onClose,
}: ModelBottomSheetProps) {
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
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelectModel = (model: ModelOption) => {
    onSelectModel(model);
    onClose();
  };

  const getModelIcon = (modelId: string) => {
    switch (modelId) {
      case 'veo3':
        return '🌐'; // Google icon representation
      case 'seedance':
        return '🌊'; // Wave for Seedance
      case 'sora2':
        return '💎'; // Diamond for premium Sora
      default:
        return '🎬';
    }
  };

  const getCreditsForModel = (modelId: string): number => {
    switch (modelId) {
      case 'veo3':
        return 2000;
      case 'seedance':
        return 300;
      case 'sora2':
        return 500;
      default:
        return 0;
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
        <Text style={styles.title}>Choisissez un modèle</Text>

        {/* Model options */}
        <View style={styles.modelsContainer}>
          {models.map((model) => {
            const isSelected = selectedModel.id === model.id;
            const credits = getCreditsForModel(model.id);

            return (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelCard,
                  isSelected && styles.selectedModelCard,
                ]}
                onPress={() => handleSelectModel(model)}
                activeOpacity={0.7}
              >
                <View style={styles.modelHeader}>
                  <View style={styles.modelIconContainer}>
                    <Text style={styles.modelIcon}>{getModelIcon(model.id)}</Text>
                  </View>
                  <View style={styles.modelInfo}>
                    <Text style={[styles.modelName, isSelected && styles.selectedText]}>
                      {model.name}
                    </Text>
                    <Text style={styles.modelDescription}>{model.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#2d7dff" />
                  )}
                </View>
                <View style={styles.creditsContainer}>
                  <Ionicons name="star" size={14} color="#ffaa00" />
                  <Text style={styles.creditsText}>{credits} crédits</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

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
    maxHeight: SCREEN_HEIGHT * 0.75,
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
  modelsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  modelCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModelCard: {
    borderColor: '#2d7dff',
    backgroundColor: 'rgba(45, 125, 255, 0.1)',
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modelIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2a2a2c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modelIcon: {
    fontSize: 24,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  selectedText: {
    color: '#2d7dff',
  },
  modelDescription: {
    fontSize: 13,
    color: '#9a9a9a',
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffaa00',
  },
  applyButton: {
    backgroundColor: '#2d7dff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
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
