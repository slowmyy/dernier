// app/(tabs)/video.tsx - Nouveau design noir moderne

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoGenerationService } from '@/utils/runware';
import { storageService } from '@/services/storage';
import ModelSelector, { ModelOption } from '@/components/VideoGenerator/ModelSelector';
import AdvancedPanel, { VideoStyle } from '@/components/VideoGenerator/AdvancedPanel';
import VideoPreview from '@/components/VideoGenerator/VideoPreview';
import ModelBottomSheet from '@/components/VideoGenerator/ModelBottomSheet';
import { VideoFormat } from '@/components/VideoGenerator/FormatSelector';
import { Ionicons } from '@expo/vector-icons';

// Generate a valid UUIDv4
const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Configuration des modèles IA
const AI_MODELS: ModelOption[] = [
  {
    id: 'veo3',
    name: 'Google Veo 3',
    description: 'Haute qualité, réaliste',
    model: 'google:3@1',
    duration: 8,
    supportedFormats: [
      { id: 'landscape', name: 'Paysage', width: 1920, height: 1080, emoji: '🖥️' },
    ]
  },
  {
    id: 'seedance',
    name: 'Seedance 1.0 Lite',
    description: 'Rapide et fluide',
    model: 'bytedance:1@1',
    duration: 6,
    supportedFormats: [
      { id: 'square', name: 'Carré', width: 960, height: 960, emoji: '⬜' },
      { id: 'landscape', name: 'Paysage', width: 1248, height: 704, emoji: '🖥️' },
      { id: 'portrait', name: 'Portrait', width: 832, height: 1120, emoji: '📱' },
    ]
  },
  {
    id: 'sora2',
    name: 'Sora 2 Pro',
    description: 'Ultra qualité 720p',
    model: 'sora-2-pro',
    duration: 10,
    supportedFormats: [
      { id: 'landscape', name: 'Paysage 720p', width: 1280, height: 720, emoji: '🖥️' },
      { id: 'portrait', name: 'Portrait 720p', width: 720, height: 1280, emoji: '📱' },
      { id: 'square', name: 'Carré 720p', width: 720, height: 720, emoji: '⬜' },
    ]
  },
];

// Styles de vidéo
const VIDEO_STYLES: VideoStyle[] = [
  { id: 'realistic', name: 'Réaliste' },
  { id: 'cinematic', name: 'Ciné' },
  { id: 'anime', name: 'Animé' },
  { id: 'satisfying', name: 'Satisfaisant' },
];

interface GeneratedVideo {
  url: string;
  prompt: string;
  timestamp: number;
  duration: number;
  model: string;
  taskUUID: string;
  referenceImage?: string;
}

export default function VideoGeneratorScreen() {
  // États principaux
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AI_MODELS[0]);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>(AI_MODELS[0].supportedFormats[0]);
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [modelSheetVisible, setModelSheetVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>(VIDEO_STYLES[0]);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Service de génération vidéo
  const videoService = useRef<VideoGenerationService | null>(null);

  useEffect(() => {
    videoService.current = new VideoGenerationService();
    checkForPendingReferenceImage();
  }, []);

  // Vérifier aussi quand la page devient active
  useFocusEffect(
    React.useCallback(() => {
      checkForPendingReferenceImage();
    }, [])
  );

  const checkForPendingReferenceImage = async () => {
    try {
      const pendingImageData = await AsyncStorage.getItem('pendingVideoReferenceImage');

      if (pendingImageData) {
        const imageData = JSON.parse(pendingImageData);
        await AsyncStorage.removeItem('pendingVideoReferenceImage');

        if (referenceImage || referenceImagePreview) {
          setReferenceImage(null);
          setReferenceImagePreview(null);
        }

        try {
          const response = await fetch(imageData.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const file = new File([blob], 'reference-from-generator.jpg', { type: 'image/jpeg' });

          setReferenceImage(file);
          setReferenceImagePreview(imageData.url);

          if (!prompt.trim() || imageData.fromImageGenerator === true) {
            setPrompt(imageData.prompt || '');
          }

          Alert.alert(
            '🎬 Image importée !',
            'L\'image générée a été automatiquement importée comme référence pour votre vidéo.',
            [{ text: 'Parfait !', style: 'default' }]
          );
        } catch (fetchError) {
          console.error('Erreur lors du téléchargement de l\'image:', fetchError);
          Alert.alert('Erreur', 'Impossible de charger l\'image. Veuillez réessayer.');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'import automatique d\'image:', error);
    }
  };

  // Handler pour le changement de modèle
  const handleModelChange = (model: ModelOption) => {
    setSelectedModel(model);
    // Mettre à jour le format avec le premier format supporté par le nouveau modèle
    if (model.supportedFormats.length > 0) {
      setSelectedFormat(model.supportedFormats[0]);
    }
  };

  // Handler pour "Me faire la surprise"
  const handleSurpriseMe = () => {
    const surprisePrompts = [
      "Un chat qui joue dans un jardin fleuri au coucher du soleil",
      "Un astronaute dansant sur la lune avec des aurores boréales",
      "Une forêt magique avec des papillons lumineux volant autour d'arbres géants",
      "Un robot futuriste préparant du café dans une cuisine cyberpunk",
      "Des vagues océaniques dorées se transformant en oiseaux lumineux",
      "Un dragon amical jouant avec des enfants dans un parc médiéval",
      "Une ville flottante dans les nuages avec des cascades arc-en-ciel",
      "Un phénix renaissant de ses cendres dans un temple ancien",
    ];

    const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(randomPrompt);

    Alert.alert('✨ Surprise !', `Voici une idée créative : "${randomPrompt}"`, [
      { text: 'Super !', style: 'default' }
    ]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Prompt requis', 'Veuillez entrer une description pour générer une vidéo.');
      return;
    }

    if (!videoService.current) {
      Alert.alert('Erreur', 'Service de génération vidéo non initialisé. Vérifiez votre clé API.');
      return;
    }

    setIsGenerating(true);
    setLoadingProgress(0);
    setGeneratedVideo(null);

    try {
      const videoWidth = selectedFormat.width;
      const videoHeight = selectedFormat.height;

      const videoUrl = await videoService.current!.generateVideo({
        prompt: prompt,
        referenceImage: referenceImage || undefined,
        model: selectedModel.model,
        width: videoWidth,
        height: videoHeight,
        duration: selectedModel.duration,
        onProgress: (progress) => {
          setLoadingProgress(progress);
        },
      });

      const newVideo: GeneratedVideo = {
        url: videoUrl,
        prompt: prompt,
        timestamp: Date.now(),
        duration: selectedModel.duration,
        model: selectedModel.name,
        taskUUID: generateUUIDv4(),
        referenceImage: referenceImagePreview || undefined,
      };

      setGeneratedVideo(newVideo);

      await storageService.saveImage({
        url: videoUrl,
        prompt: prompt,
        timestamp: Date.now(),
        model: selectedModel.name,
        format: `Vidéo ${selectedModel.duration}s`,
        dimensions: `${videoWidth}x${videoHeight}`,
        style: 'Video Generation',
        isVideo: true,
        duration: selectedModel.duration,
        videoWidth: videoWidth,
        videoHeight: videoHeight,
      });

    } catch (error) {
      console.error('Erreur de génération:', error);
      Alert.alert('Erreur', 'La génération a échoué. Réessayez ou modifiez votre prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire pour importer une image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        if (Platform.OS === 'web') {
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          const file = new File([blob], 'reference-image.jpg', { type: 'image/jpeg' });
          setReferenceImage(file);
        }
        setReferenceImagePreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error importing image:', error);
      Alert.alert('Erreur', 'Impossible d\'importer l\'image. Veuillez réessayer.');
    }
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;

    try {
      const filename = `genly-video-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.mp4`;
      await storageService.downloadImage(generatedVideo.url, filename);

      const successMessage = Platform.OS === 'web'
        ? 'Vidéo téléchargée avec succès!'
        : 'Vidéo sauvegardée dans votre galerie!';

      Alert.alert('Succès', successMessage);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de télécharger la vidéo');
    }
  };

  const handleShare = async () => {
    if (!generatedVideo) return;

    try {
      await storageService.shareImage(generatedVideo.url, generatedVideo.prompt);

      if (Platform.OS === 'web') {
        Alert.alert('Succès', 'Vidéo partagée avec succès!');
      }
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de partager la vidéo');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête avec bouton PRO */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Créer une vidéo</Text>
            <TouchableOpacity style={styles.proButton} activeOpacity={0.8}>
              <Text style={styles.proButtonText}>PRO</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1️⃣ Sélecteur de modèle d'IA - Déplacé en haut */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Modèle d'IA</Text>
          <TouchableOpacity
            style={styles.modelDropdownButton}
            onPress={() => setModelSheetVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.modelDropdownContent}>
              <View style={styles.modelDropdownLeft}>
                <Text style={styles.modelDropdownIcon}>🎬</Text>
                <View>
                  <Text style={styles.modelDropdownTitle}>Text to Video</Text>
                  <Text style={styles.modelDropdownSubtitle}>{selectedModel.name}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9a9a9a" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 2️⃣ Champ d'invite + Me faire la surprise */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Invite</Text>
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Décrivez votre scène, par ex : un chat qui joue dans un jardin fleuri au coucher du soleil."
            placeholderTextColor="#9a9a9a"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Bouton "Me faire la surprise" */}
          <TouchableOpacity
            style={styles.surpriseButton}
            onPress={handleSurpriseMe}
            activeOpacity={0.7}
          >
            <Text style={styles.surpriseIcon}>✨</Text>
            <Text style={styles.surpriseText}>Me faire la surprise</Text>
          </TouchableOpacity>
        </View>

        {/* 3️⃣ Paramètres avancés - Déplacés après l'invite */}
        <TouchableOpacity
          style={styles.advancedButton}
          onPress={() => setAdvancedVisible(!advancedVisible)}
          activeOpacity={0.7}
        >
          <Text style={styles.advancedButtonText}>
            {advancedVisible ? 'Masquer' : 'Afficher'} les paramètres avancés
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <AdvancedPanel
            visible={advancedVisible}
            selectedStyle={selectedStyle}
            videoStyles={VIDEO_STYLES}
            onSelectStyle={setSelectedStyle}
            onImportImage={handleImportImage}
            referenceImagePreview={referenceImagePreview}
            onRemoveImage={handleRemoveReferenceImage}
            formats={selectedModel.supportedFormats}
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
          />
        </View>

        {/* 4️⃣ Bouton Créer */}
        <TouchableOpacity
          style={[styles.createButton, isGenerating && styles.createButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>
            {isGenerating ? 'Génération en cours...' : 'Créer'}
          </Text>
        </TouchableOpacity>

        {/* 5️⃣ Bloc Aperçu - Bande-annonce du modèle + 6️⃣ Votre vidéo */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isGenerating
              ? 'Génération en cours...'
              : generatedVideo
              ? 'Votre vidéo'
              : `Aperçu – ${selectedModel.name}`}
          </Text>
          <VideoPreview
            generatedVideoUrl={generatedVideo?.url || null}
            previewVideoUrl={undefined}
            isGenerating={isGenerating}
            loadingProgress={loadingProgress}
            selectedModelName={selectedModel.name}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </View>
      </ScrollView>

      {/* Model Bottom Sheet */}
      <ModelBottomSheet
        visible={modelSheetVisible}
        selectedModel={selectedModel}
        models={AI_MODELS}
        onSelectModel={handleModelChange}
        onClose={() => setModelSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  proButton: {
    backgroundColor: '#2d7dff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  proButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    opacity: 0.9,
  },
  promptInput: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  surpriseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2d2d2f',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 8,
  },
  surpriseIcon: {
    fontSize: 18,
  },
  surpriseText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9a9a9a',
  },
  modelDropdownButton: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modelDropdownIcon: {
    fontSize: 24,
  },
  modelDropdownTitle: {
    fontSize: 12,
    color: '#9a9a9a',
    marginBottom: 2,
  },
  modelDropdownSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  advancedButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  advancedButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d7dff',
  },
  createButton: {
    backgroundColor: '#2d7dff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2d7dff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
