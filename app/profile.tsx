import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { runwareService, UserPlan } from '@/services/runware';
import { authService, UserCredential } from '@/services/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const [userPlan, setUserPlan] = useState<UserPlan>(runwareService.getUserPlan());
  const [userCredential, setUserCredential] = useState<UserCredential | null>(null);
  const [displayName, setDisplayName] = useState<string>('Utilisateur');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  // 🆕 États pour la modal d'édition
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const credential = await authService.getUserCredential();
      const name = await authService.getDisplayName();
      const storedAvatar = await authService.getAvatarUri();
      
      setUserCredential(credential);
      setDisplayName(name);
      setAvatarUri(storedAvatar);
      setEditNameInput(name);
      setEditAvatarUri(storedAvatar);
    } catch (error) {
      console.error('Erreur chargement info utilisateur:', error);
    }
  };

  // 🆕 Ouvrir la modal d'édition
  const handleOpenEditModal = () => {
    setEditNameInput(displayName);
    setEditAvatarUri(avatarUri);
    setIsEditModalVisible(true);
  };

  // 🆕 Changer la photo dans la modal
  const handleChangePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setEditAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection avatar:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une photo');
    }
  };

  // 🆕 Sauvegarder les modifications
  const handleSaveProfile = async () => {
    const trimmedName = editNameInput.trim();

    if (!trimmedName) {
      Alert.alert('Nom requis', 'Veuillez saisir un nom d\'utilisateur');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      
      const updatedCredential = await authService.updateProfile({
        displayName: trimmedName,
        avatarUri: editAvatarUri,
      });

      // Mise à jour des états locaux
      setDisplayName(trimmedName);
      setAvatarUri(editAvatarUri);
      setUserCredential(updatedCredential);

      // Fermeture de la modal
      setIsEditModalVisible(false);
      
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpgradeToPremium = () => {
    const newPlan = runwareService.togglePremium();
    setUserPlan(newPlan);
    Alert.alert(
      'Plan modifié',
      newPlan.isPremium 
        ? '✨ Vous êtes maintenant Premium! Profitez du modèle haute qualité.'
        : 'Vous êtes revenu au plan Gratuit'
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              router.replace('/');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* 🎯 Section Profil avec bouton d'édition */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={64} color="#007AFF" />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            <TouchableOpacity style={styles.editIconButton} onPress={handleOpenEditModal}>
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {userCredential?.email && (
            <Text style={styles.email}>{userCredential.email}</Text>
          )}
        </View>

        {/* Section Plan */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Abonnement</Text>
          
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>
                {userPlan.isPremium ? '✨ Plan Premium' : '🆓 Plan Gratuit'}
              </Text>
              <View style={[styles.planBadge, userPlan.isPremium && styles.planBadgePremium]}>
                <Text style={styles.planBadgeText}>
                  {userPlan.isPremium ? 'PREMIUM' : 'GRATUIT'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.planDescription}>
              {userPlan.isPremium 
                ? 'Accès au modèle IA haute qualité' 
                : 'Accès au modèle IA standard'
              }
            </Text>

            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeToPremium}>
              <Text style={styles.upgradeButtonText}>
                {userPlan.isPremium ? 'Revenir au Gratuit' : 'Passer Premium'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Support */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666666" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Aide & Support</Text>
              <Text style={styles.settingSubtitle}>Obtenez de l'aide</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="information-circle-outline" size={24} color="#666666" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>À propos</Text>
              <Text style={styles.settingSubtitle}>Version 2.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, styles.signOutText]}>Déconnexion</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🆕 MODAL D'ÉDITION DU PROFIL */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Photo de profil */}
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalAvatarContainer} 
                onPress={handleChangePhoto}
                disabled={isUpdatingProfile}
              >
                {editAvatarUri ? (
                  <Image source={{ uri: editAvatarUri }} style={styles.modalAvatarImage} />
                ) : (
                  <View style={styles.modalDefaultAvatar}>
                    <Ionicons name="person" size={64} color="#8E8E93" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleChangePhoto} disabled={isUpdatingProfile} activeOpacity={0.7}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>

              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editNameInput}
                  onChangeText={setEditNameInput}
                  placeholder="Entrez votre nom"
                  placeholderTextColor="#8E8E93"
                  editable={!isUpdatingProfile}
                />
              </View>

              {/* Bouton Save */}
              <TouchableOpacity
                style={[styles.saveButtonWrapper, isUpdatingProfile && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0A84FF', '#0051FF']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.saveButtonGradient}
                >
                  {isUpdatingProfile ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#E5F3FF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  editIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  settingsSection: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  planBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  planBadgePremium: {
    backgroundColor: '#FFD700',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  signOutText: {
    color: '#FF3B30',
  },

  // 🆕 Styles de la modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalHeader: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 24,
    top: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalContent: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  modalAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: 2,
    borderColor: '#2F2F31',
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modalDefaultAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#0A84FF',
    marginBottom: 28,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  saveButtonWrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    width: '100%',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
