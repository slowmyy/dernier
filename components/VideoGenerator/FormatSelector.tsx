import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface VideoFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  emoji: string;
}

interface FormatSelectorProps {
  formats: VideoFormat[];
  selectedFormat: VideoFormat;
  onSelectFormat: (format: VideoFormat) => void;
}

export default function FormatSelector({
  formats,
  selectedFormat,
  onSelectFormat,
}: FormatSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Format vidéo</Text>

      <View style={styles.formatsContainer}>
        {formats.map((format) => {
          const isSelected = selectedFormat.id === format.id;

          return (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatCard,
                isSelected && styles.selectedFormatCard,
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
              <Text style={styles.formatResolution}>
                {format.width}×{format.height}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.note}>
        Le format dépend du modèle sélectionné.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b3b3b3',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  selectedFormatCard: {
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
    color: '#e0e0e0',
  },
  selectedFormatName: {
    color: '#2d7dff',
  },
  formatResolution: {
    fontSize: 11,
    color: '#9a9a9a',
  },
  note: {
    fontSize: 12,
    color: '#9a9a9a',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
