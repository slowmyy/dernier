import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Type pour un élément média
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  userId: string;
}

// Type pour le profil utilisateur
interface UserProfile {
  id: string;
  username: string;
  avatar: string;
}

export default function GalleryScreen() {
  // États pour la galerie et le profil
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user123',
    username: 'MonUsername',
    avatar: 'https://via.placeholder.com/150',
  });

  // États pour le modal d'édition
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Charger les données au démarrage
  useEffect(() => {
    loadGallery();
  }, []);

  // FONCTION 1: Charger la galerie depuis le backend
  const loadGallery = async () => {
    try {
      // ⚠️ REMPLACEZ PAR VOTRE APPEL API (Supabase, Firebase, etc.)
      // Exemple avec Supabase:
      // const { data, error } = await supabase
      //   .from('media')
      //   .select('*')
      //   .eq('userId', profile.id);

      // Données de test
      const mockData: MediaItem[] = [
        { id: '1', type: 'image', url: 'https://picsum.photos/400/300?random=1', userId: 'user123' },
        { id: '2', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', userId: 'user123' },
        { id: '3', type: 'image', url: 'https://picsum.photos/400/300?random=2', userId: 'user123' },
      ];

      setGallery(mockData);
    } catch (error) {
      console.error('Erreur chargement galerie:', error);
      Alert.alert('Erreur', 'Impossible de charger la galerie');
    }
  };

  // FONCTION 2: Suppression instantanée (UI + Backend)
  const handleDeleteMedia = async (mediaId: string) => {
    // Confirmation avant suppression
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Suppression IMMÉDIATE de l'UI (optimistic update)
              setGallery(prev => prev.filter(item => item.id !== mediaId));

              // 2. Suppression côté backend
              // ⚠️ REMPLACEZ PAR VOTRE APPEL API
              // Exemple avec Supabase:
              // const { error } = await supabase
              //   .from('media')
              //   .delete()
              //   .eq('id', mediaId);

              // Exemple avec Firebase:
              // await firebase.firestore().collection('media').doc(mediaId).delete();

              // Simulation d'un appel API
              await new Promise(resolve => setTimeout(resolve, 500));

              console.log('Média supprimé:', mediaId);

            } catch (error) {
              console.error('Erreur suppression:', error);
              // En cas d'erreur, recharger la galerie pour restaurer l'état correct
              loadGallery();
              Alert.alert('Erreur', 'Impossible de supprimer le média');
            }
          },
        },
      ]
    );
  };

  // FONCTION 3: Rendu d'un élément (Video ou Image)
  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    return (
      <View style={styles.mediaContainer}>
        {/* Affichage selon le type */}
        {item.type === 'video' ? (
          <Video
            source={{ uri: item.url }}
            style={styles.media}
            useNativeControls
            resizeMode="contain"
            isLooping
            shouldPlay={false} // Ne démarre pas automatiquement
          />
        ) : (
          <Image
            source={{ uri: item.url }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        {/* Bouton de suppression */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMedia(item.id)}
        >
          <Ionicons name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>

        {/* Badge type de média */}
        {item.type === 'video' && (
          <View style={styles.videoBadge}>
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.videoBadgeText}>Vidéo</Text>
          </View>
        )}
      </View>
    );
  };

  // FONCTION 4: Ouvrir le modal d'édition
  const openEditModal = () => {
    setNewUsername(profile.username);
    setNewAvatar(profile.avatar);
    setIsEditModalVisible(true);
  };

  // FONCTION 5: Choisir une nouvelle photo de profil
  const pickProfileImage = async () => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder aux photos');
        return;
      }

      // Ouvrir le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  // FONCTION 6: Sauvegarder les modifications du profil
  const saveProfile = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Erreur', "Le nom d'utilisateur ne peut pas être vide");
      return;
    }

    setIsLoading(true);
    try {
      // ⚠️ REMPLACEZ PAR VOTRE APPEL API
      // Exemple avec Supabase:
      // const { error } = await supabase
      //   .from('users')
      //   .update({ username: newUsername, avatar: newAvatar })
      //   .eq('id', profile.id);

      // Exemple avec Firebase:
      // await firebase.firestore().collection('users').doc(profile.id).update({
      //   username: newUsername,
      //   avatar: newAvatar
      // });

      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mise à jour de l'UI
      setProfile({
        ...profile,
        username: newUsername,
        avatar: newAvatar,
      });

      setIsEditModalVisible(false);
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER PROFIL */}
      <View style={styles.header}>
        <Image
          source={{ uri: profile.avatar }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.mediaCount}>{gallery.length} médias</Text>
        </View>
        {/* BOUTON ÉDITION PROFIL */}
        <TouchableOpacity onPress={openEditModal} style={styles.editButton}>
          <Ionicons name="create" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* GALERIE STYLE TIKTOK */}
      <FlatList
        data={gallery}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT * 0.7}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* MODAL D'ÉDITION DU PROFIL */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Éditer le profil</Text>

            {/* Photo de profil */}
            <TouchableOpacity onPress={pickProfileImage} style={styles.avatarPicker}>
              <Image source={{ uri: newAvatar }} style={styles.modalAvatar} />
              <View style={styles.avatarPickerIcon}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            </TouchableOpacity>

            {/* Nom d'utilisateur */}
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Nom d'utilisateur"
              autoCapitalize="none"
            />

            {/* Boutons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  mediaCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  mediaContainer: {
    height: SCREEN_HEIGHT * 0.7,
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  videoBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarPicker: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPickerIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

