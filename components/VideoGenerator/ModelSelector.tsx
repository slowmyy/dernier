import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  model: string;
  duration: number;
  supportedFormats: {
    id: string;
    name: string;
    width: number;
    height: number;
    emoji: string;
  }[];
}

interface ModelSelectorProps {
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
}

export default function ModelSelector({ selectedModel, models, onSelectModel }: ModelSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Modèle IA</Text>
      <View style={styles.selectorContainer}>
        {models.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelButton,
              selectedModel.id === model.id && styles.selectedModelButton
            ]}
            onPress={() => onSelectModel(model)}
            activeOpacity={0.8}
          >
            <View style={styles.modelContent}>
              <Text style={styles.modelIcon}>🎬</Text>
              <View style={styles.modelTextContainer}>
                <Text style={[
                  styles.modelName,
                  selectedModel.id === model.id && styles.selectedModelName
                ]}>
                  {model.name}
                </Text>
                <Text style={styles.modelDescription}>{model.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    opacity: 0.9,
  },
  selectorContainer: {
    gap: 10,
  },
  modelButton: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModelButton: {
    borderColor: '#2d7dff',
    backgroundColor: 'rgba(45, 125, 255, 0.1)',
  },
  modelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modelIcon: {
    fontSize: 24,
  },
  modelTextContainer: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 2,
  },
  selectedModelName: {
    color: '#2d7dff',
  },
  modelDescription: {
    fontSize: 12,
    color: '#b3b3b3',
  },
});
