// app/(tabs)/video.tsx - Nouveau design avec NativeWind/Tailwind

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoGenerationService } from '@/utils/runware';
import { storageService } from '@/services/storage';
import { VideoStyle } from '@/components/VideoGenerator/AdvancedPanel';
import VideoPreview from '@/components/VideoGenerator/VideoPreview';
import { VideoFormat } from '@/components/VideoGenerator/FormatSelector';
import { MaterialIcons } from '@expo/vector-icons';

// Generate a valid UUIDv4
const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Interface pour ModelOption
interface ModelOption {
  id: string;
  name: string;
  description: string;
  model: string;
  duration: number;
  logo?: string;
  supportedFormats: VideoFormat[];
}

// Configuration des modèles IA
const AI_MODELS: ModelOption[] = [
  {
    id: 'veo3',
    name: 'veo 3.1',
    description: 'Le modèle le plus avancé de Google pour des vidéos de haute qualité et réalistes.',
    model: 'google:3@1',
    duration: 8,
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8zWbt6KVx0QUDTkAuREl9nU6ieoiKy7nRJaqKbhaX_Gp-hhc6YuZ0HVlQCDhySuqnrSKxOmrGJlY5SqcTw7LVeJ4qv3D7wrEU9L7wu3C9-ZkUm7K9Aig4dI9FSsRrGyICQ8SiRm9t5JNe2a08IlAM9KZhAoxqS5xuiCEr7pZE6y0J1LwwkvPAV2X9I8YCYgP_FHiEHRuxYIamz0fxMUNdKDXePwubOGWsxIbezWoaKybixhiqq-KGtIh-DjB9mBnzX04kDSX8JN45',
    supportedFormats: [
      { id: 'landscape', name: 'Paysage', width: 1920, height: 1080, emoji: '🖥️' },
    ]
  },
  {
    id: 'seedance',
    name: 'seedance',
    description: 'Idéal pour les animations de personnages et les mouvements de danse complexes.',
    model: 'bytedance:1@1',
    duration: 6,
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEAiwNKJhny-OcBLAPfgmiwATHt4YaPFqs72zsc2I1KuHJK6SNPleIzIbqy98Fy5xV3qyC-vMNhij8XW9XTzNeryb0VCoMUvkCusVEzOu0EA4bY-rH8P71LF5T08_v2z5D-uD2-KND4Q_UiAPel63XF-iNqoECOw67bRNi7CDLYGCzuJrPOeHkGAr2VgpIppTwStRPgmJhopfAXE7_OUfer2PxCVIiZLaAYwSJaNGsjYxkwQirzufNIDjLn9vtBFH2qak_9YUgaaxy',
    supportedFormats: [
      { id: 'square', name: 'Carré', width: 960, height: 960, emoji: '⬜' },
      { id: 'landscape', name: 'Paysage', width: 1248, height: 704, emoji: '🖥️' },
      { id: 'portrait', name: 'Portrait', width: 832, height: 1120, emoji: '📱' },
    ]
  },
  {
    id: 'sora2',
    name: 'sora',
    description: 'Le modèle phare d\'OpenAI, créant des scènes imaginatives à partir de textes.',
    model: 'sora-2-pro',
    duration: 10,
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsMDUPaRKU6NkpyGXKquknSO98WjuHbTGNSt6UF9pTISi9n7I4jcrFBySYrvOSG5rJhhjwvytOHuYEhzkipPHbw8t6tfFq6mjrkXz0OV1-EDguJeasfXVh9P4sN_K_VnmWJv0JblOnRTr1OOjbLRK0zPgD9O2p6d0IE0fvtwe6vb4Dmexg2V5OnPAzBOpqEzq0avvJy7U9PwjHvlX6VKmVIiyBGXg1uM0Em5lLRHR5cL8c41_0X0UNzKE44SBaQdCoOBzcuyVlyrf8',
    supportedFormats: [
      { id: 'landscape', name: 'Paysage 720p', width: 1280, height: 720, emoji: '🖥️' },
      { id: 'portrait', name: 'Portrait 720p', width: 720, height: 1280, emoji: '📱' },
      { id: 'square', name: 'Carré 720p', width: 720, height: 720, emoji: '⬜' },
    ]
  },
];

// Styles de vidéo
const VIDEO_STYLES: VideoStyle[] = [
  {
    id: 'cinematic',
    name: 'Cinéma',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi20A-yT3bi-Aa7-3i-K4tffdiqPhUBtaQJhx4Qf2A1DKpKGi9krVT9ROnYbeJMMnxfbuIJAWkfsUX7vL59JV-f9ojnbDKeRz2rs6ikb4LuznQm_8LAeSy-9Q1i5Erc3kGeUM4pDJxAvo4jQUBrWhlBaNoeFKmERKOU6Od8ozzuoHs0ZvBirQ_dL43VFi16agTtlAWfjN2AY-Zar43S5L8B2wXbvGkzhvAmialDnsLsrGVnqvX24-psPFfc5mlau4w9JOhsj_1XhYj'
  },
  {
    id: 'anime',
    name: 'Anime',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr-GjIN7IqO-UBMtxjSSHW3HCyj0rm_m2l-M-GFPDddGzYSoBuiOvoviuOIEREfvP2g0QA-64mqMXC2HmTpM0xmD0FH0WX4qVLC6BRAY_Y6qi2pwpGYnsf9__2qgNJcjwNzWSjtSaZFCjM0KWZPASVbG4v7znrsdBLr2mQ4UgGT0Svqt5-FOMcPRAd_acs17uR3CEXrhdKkVt-PVjGlfuLIF98eeM16yP7HUX5wZ1ygt4jxdfRY0XWIu-vA2YrpLcznXLVRosU2Lrl'
  },
  {
    id: 'retro',
    name: 'Rétro',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC36vgIwTjf2sOTG4-i-aZ5952oY2CpdXL4PxKrm8pw3DMExSIDSplgXkzcRGazgWM7J9GJTUEXLXkBxgNQYPir41RyzQAvENHeRQY7eX3njVu5BfH_N9VqG2R7fbyQRDVhcckR-W6Gsr3TbvBwOjuNNNxtwxxQiQOjpCx5zt5SGhcOeyKijRhKvFJaIeMYbH0YOm7g3fpvcoU7cG3iHwpkruHUkltJ4EYd4ZbXAddipA_DRjhokgf8gbNHtO8fsoUO5RxmlAWbHFiN'
  },
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
  const [prompt, setPrompt] = useState('Un astronaute surfant sur une vague cosmique...');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AI_MODELS[0]);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>(AI_MODELS[0].supportedFormats[0]);
  const [advancedSheetVisible, setAdvancedSheetVisible] = useState(false);
  const [modelSheetVisible, setModelSheetVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>(VIDEO_STYLES[0]);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('Standard');

  // Service de génération vidéo
  const videoService = useRef<VideoGenerationService | null>(null);

  // Animation pour le bouton Créer
  const createButtonScale = useRef(new Animated.Value(1)).current;
  const createButtonGlow = useRef(new Animated.Value(0)).current;

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
    setModelSheetVisible(false);
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

    // Animation du bouton Créer au clic
    Animated.parallel([
      Animated.sequence([
        Animated.timing(createButtonScale, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(createButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(createButtonGlow, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(createButtonGlow, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

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
    <View className="flex-1 bg-[#000000]">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-[#000000]/80 border-b border-white/5">
        <View className="w-10 h-10 items-start justify-center">
          <TouchableOpacity className="text-white/80">
            <MaterialIcons name="arrow-back-ios" size={24} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <Text className="text-white text-xl font-extrabold flex-1 text-center">Générateur Vidéo</Text>
        <View className="w-10 items-end justify-center">
          <View className="rounded-lg bg-[#2563EB] px-3 py-1">
            <Text className="text-sm font-bold text-white">PRO</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pb-4" showsVerticalScrollIndicator={false}>
        <View className="pt-4 space-y-4">
          {/* Modèle d'IA */}
          <View>
            <Text className="text-white text-base font-bold mb-3 px-1">Modèle d'IA</Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl bg-[#1A1A1A] p-4 border border-white/10"
              onPress={() => setModelSheetVisible(true)}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center gap-3">
                {selectedModel.logo && (
                  <Image
                    source={{ uri: selectedModel.logo }}
                    className="h-8 w-8 rounded-md"
                  />
                )}
                <View>
                  <Text className="font-bold text-white">{selectedModel.name}</Text>
                  <Text className="text-xs text-white/60">Google</Text>
                </View>
              </View>
              <MaterialIcons name="unfold-more" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Invite */}
          <View className="space-y-2">
            <Text className="text-sm font-medium text-white px-1">Invite</Text>
            <View className="relative rounded-lg bg-[#1A1A1A] border border-white/10 p-2">
              <TextInput
                className="w-full flex-1 text-gray-400 text-base bg-transparent border-0 p-2 min-h-[112px]"
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Décrivez votre scène..."
                placeholderTextColor="#9a9a9a"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ color: '#ffffff' }}
              />
              <View className="absolute bottom-3 right-3 flex-row items-center gap-4">
                <TouchableOpacity
                  className="border border-white/10 rounded-full px-2 py-1 flex-row items-center gap-1.5"
                  onPress={handleSurpriseMe}
                  activeOpacity={0.6}
                >
                  <MaterialIcons name="auto-awesome" size={18} color="#ffffff" />
                  <Text className="text-xs font-medium text-white">Me faire la surprise</Text>
                </TouchableOpacity>
                {prompt.length > 0 && (
                  <TouchableOpacity
                    className="text-gray-400"
                    onPress={() => setPrompt('')}
                    activeOpacity={0.6}
                  >
                    <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Paramètres avancés */}
          <View>
            <TouchableOpacity
              className="flex-row justify-between items-center rounded-xl bg-[#1A1A1A] border border-white/10 p-4 h-16"
              onPress={() => setAdvancedSheetVisible(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="tune" size={20} color="rgba(255,255,255,0.8)" />
                <Text className="text-white text-base font-bold">Paramètres avancés</Text>
              </View>
              <MaterialIcons name="expand-more" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Résultat */}
          <View className="space-y-4">
            <Text className="text-white text-base font-bold">Résultat</Text>
            <VideoPreview
              generatedVideoUrl={generatedVideo?.url || null}
              previewVideoUrl={undefined}
              isGenerating={isGenerating}
              loadingProgress={loadingProgress}
              selectedModelName={selectedModel.name}
              videoWidth={selectedFormat.width}
              videoHeight={selectedFormat.height}
              onDownload={handleDownload}
              onShare={handleShare}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bouton Créer sticky en bas */}
      <View className="bg-[#000000]/80 pb-4">
        <View className="px-4 py-3">
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            <Animated.View
              className="w-full rounded-full h-16 bg-[#2563EB] items-center justify-center shadow-lg"
              style={{
                transform: [{ scale: createButtonScale }],
              }}
            >
              <Text className="text-white text-xl font-bold">
                {isGenerating ? 'Génération en cours...' : 'Créer'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Model Bottom Sheet */}
      <Modal
        visible={modelSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModelSheetVisible(false)}
      >
        <View className="flex-1 bg-black/60">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setModelSheetVisible(false)}
          />
          <View className="h-[70vh] rounded-t-3xl bg-gradient-to-b from-[#0B0B0D] to-[#141418]" style={{ backgroundColor: '#0B0B0D' }}>
            <View className="p-4">
              <View className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
            </View>
            <View className="px-5 pb-5">
              <Text className="text-white text-lg font-bold">Modèle d'IA</Text>
            </View>
            <ScrollView className="flex-1 px-5 pb-8">
              {AI_MODELS.map((model, index) => (
                <TouchableOpacity
                  key={model.id}
                  className={`w-full rounded-xl p-4 mb-4 ${
                    selectedModel.id === model.id
                      ? 'border-2 border-[#3B82F6] bg-white/10'
                      : 'border-2 border-transparent bg-[#1C1C1E]'
                  }`}
                  onPress={() => handleModelChange(model)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-start gap-4">
                    {model.logo && (
                      <Image
                        source={{ uri: model.logo }}
                        className="h-10 w-10 rounded-lg"
                      />
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-white">{model.name}</Text>
                      <Text className="mt-1 text-sm text-white/60">{model.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Advanced Bottom Sheet */}
      <Modal
        visible={advancedSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAdvancedSheetVisible(false)}
      >
        <View className="flex-1 bg-black/60">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setAdvancedSheetVisible(false)}
          />
          <View className="h-[70vh] rounded-t-3xl" style={{ backgroundColor: '#0B0B0D' }}>
            <View className="p-4">
              <View className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
            </View>
            <ScrollView className="flex-1 px-5 pb-8">
              <View className="space-y-4">
                {/* Upload Photo */}
                <TouchableOpacity
                  className="flex-col items-center justify-center rounded-2xl bg-[#1C1C1E] border border-white/10 p-6 h-40"
                  onPress={handleImportImage}
                  activeOpacity={0.6}
                >
                  {referenceImagePreview ? (
                    <View className="relative w-full h-full">
                      <Image
                        source={{ uri: referenceImagePreview }}
                        className="w-full h-full rounded-lg"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                        onPress={handleRemoveReferenceImage}
                      >
                        <MaterialIcons name="close" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <MaterialIcons name="cloud-upload" size={40} color="rgba(255,255,255,0.5)" />
                      <Text className="text-white/70 text-sm text-center mt-2">
                        Appuyez ici pour uploader la photo à laquelle vous voulez donner vie !
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Format */}
                <View className="flex-row items-center justify-between rounded-xl bg-[#1C1C1E] border border-white/10 p-4 h-16">
                  <View className="flex-row items-center gap-3">
                    <MaterialIcons name="aspect-ratio" size={20} color="#A855F7" />
                    <Text className="text-base font-medium text-white/90">Format</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className={`px-4 py-1.5 rounded-lg ${
                        selectedFormat.id === 'portrait' ? 'bg-white/10' : 'bg-black border border-white/10'
                      }`}
                      onPress={() => {
                        const portraitFormat = selectedModel.supportedFormats.find(f => f.id === 'portrait');
                        if (portraitFormat) setSelectedFormat(portraitFormat);
                      }}
                    >
                      <Text className="text-sm text-white/80">9:16</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`px-4 py-1.5 rounded-lg ${
                        selectedFormat.id === 'landscape' ? 'bg-white/10' : 'bg-black border border-white/10'
                      }`}
                      onPress={() => {
                        const landscapeFormat = selectedModel.supportedFormats.find(f => f.id === 'landscape');
                        if (landscapeFormat) setSelectedFormat(landscapeFormat);
                      }}
                    >
                      <Text className="text-sm text-white/80">16:9</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Qualité */}
                <View className="flex-row items-center justify-between rounded-xl bg-[#1C1C1E] border border-white/10 p-4 h-16">
                  <View className="flex-row items-center gap-3">
                    <MaterialIcons name="tune" size={20} color="#A855F7" />
                    <Text className="text-base font-medium text-white/90">Qualité</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-medium text-white/90">{selectedQuality}</Text>
                    <MaterialIcons name="unfold-more" size={20} color="rgba(255,255,255,0.5)" />
                  </View>
                </View>

                {/* Style */}
                <View>
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-base font-bold">Style</Text>
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <Text className="text-sm font-medium text-[#A855F7]/80">Tout voir</Text>
                      <MaterialIcons name="arrow-forward-ios" size={14} color="rgba(168,85,247,0.8)" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-3">
                    {VIDEO_STYLES.map((style) => (
                      <TouchableOpacity
                        key={style.id}
                        className={`relative rounded-xl overflow-hidden flex-1 aspect-[3/4] ${
                          selectedStyle.id === style.id
                            ? 'border-2 border-[#3B82F6]'
                            : 'border-2 border-transparent'
                        }`}
                        onPress={() => setSelectedStyle(style)}
                        activeOpacity={0.8}
                      >
                        {style.thumbnail && (
                          <Image
                            source={{ uri: style.thumbnail }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        )}
                        <View className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <Text className="absolute bottom-3 left-0 right-0 text-white text-sm font-bold text-center px-2">
                          {style.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bouton Appliquer */}
                <TouchableOpacity
                  className="w-full rounded-lg h-12 bg-[#1A1A1A] items-center justify-center border border-white/15 mt-6"
                  onPress={() => setAdvancedSheetVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-base font-semibold">Appliquer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
