import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { runwareService, UserPlan } from '@/services/runware';
import { authService, UserCredential } from '@/services/auth';

export default function Profile() {
  const [userPlan, setUserPlan] = useState<UserPlan>(runwareService.getUserPlan());
  const [userCredential, setUserCredential] = useState<UserCredential | null>(null);
  const [displayName, setDisplayName] = useState<string>('Utilisateur');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
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
      setNameInput(name);
    } catch (error) {
      console.error('Erreur chargement info utilisateur:', error);
    }
  };

  const handleSelectAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour changer votre photo de profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection avatar:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une photo de profil');
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      Alert.alert('Nom requis', 'Veuillez saisir un nom d\'utilisateur.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const updatedCredential = await authService.updateProfile({
        displayName: trimmedName,
        avatarUri: avatarUri ?? null,
      });

      setDisplayName(trimmedName);
      setNameInput(trimmedName);
      setUserCredential(updatedCredential);
      setAvatarUri(updatedCredential.avatarUri ?? null);

      Alert.alert('Profil mis à jour', 'Vos informations ont bien été enregistrées.');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const handleUpgradeToPremium = () => {
    if (userPlan.isPremium) {
      // For testing purposes, allow downgrading back to free
      runwareService.downgradeToFree();
      setUserPlan(runwareService.getUserPlan());
      Alert.alert(
        'Downgraded to Free',
        'You are now using the free Flux Schnell model.',
        [{ text: 'OK' }]
      );
    } else {
      runwareService.upgradeToPremium();
      setUserPlan(runwareService.getUserPlan());
      Alert.alert(
        'Upgraded to Premium!',
        'You now have access to the Juggernaut Pro model with higher quality generations.',
        [{ text: 'Awesome!' }]
      );
    }
  };

  const handleSignOut = () => {
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
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };
  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    isPremium = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    isPremium?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, isPremium && styles.premiumSettingItem]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, isPremium && styles.premiumSettingTitle]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {isPremium && (
        <Ionicons name="trophy" size={20} color="#FFD700" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectAvatar}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons
                  name="person"
                  size={32}
                  color={userCredential?.isGuest ? '#666666' : '#007AFF'}
                />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{displayName}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                Alert.alert('Astuce', 'Modifiez votre nom ci-dessous puis appuyez sur "Envoyer".');
              }}
            >
              <Ionicons name="create" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {userCredential?.isGuest ? 'Mode invité' : 'Compte connecté'}
          </Text>

          <View style={styles.profileForm}>
            <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Entrez votre nom"
              placeholderTextColor="#A3A3A3"
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[styles.submitButton, isUpdatingProfile && styles.submitButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Envoyer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Plan Status */}
        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>Abonnement Actuel</Text>
          <View style={[styles.planCard, userPlan.isPremium ? styles.premiumPlanCard : styles.freePlanCard]}>
            <View style={styles.planHeader}>
              {userPlan.isPremium && <Ionicons name="trophy" size={24} color="#FFD700" />}
              <Text style={[styles.planName, userPlan.isPremium ? styles.premiumPlanName : styles.freePlanName]}>
                {userPlan.isPremium ? 'Premium' : 'Gratuit'}
              </Text>
            </View>
            <Text style={styles.planModel}>
              Modèle: {userPlan.displayName}
            </Text>
            <Text style={styles.planDescription}>
              {userPlan.isPremium 
                ? 'Générations haute qualité avec le modèle Juggernaut Pro'
                : 'Générations rapides avec le modèle Flux Schnell'
              }
            </Text>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <SettingItem
            icon={<Ionicons name="trophy" size={24} color={userPlan.isPremium ? "#FFD700" : "#007AFF"} />}
            title={userPlan.isPremium ? "Passer en Gratuit" : "Passer Premium"}
            subtitle={userPlan.isPremium 
              ? "Revenir au modèle gratuit" 
              : "Débloquez le modèle IA haute qualité"
            }
            onPress={handleUpgradeToPremium}
            isPremium={!userPlan.isPremium}
          />

          <SettingItem
            icon={<Ionicons name="person" size={24} color="#666666" />}
            title="Paramètres du compte"
            subtitle="Gérez votre profil et vos préférences"
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingItem
            icon={<Ionicons name="help-circle" size={24} color="#666666" />}
            title="Aide & Support"
            subtitle="Obtenez de l'aide et contactez le support"
          />

          <SettingItem
            icon={<Ionicons name="information-circle" size={24} color="#666666" />}
            title="À propos de Genly"
            subtitle="Version 2.0.0"
          />

          <SettingItem
            icon={<Ionicons name="log-out" size={24} color="#FF3B30" />}
            title="Déconnexion"
            subtitle={userCredential?.isGuest ? "Quitter le mode invité" : "Se déconnecter du compte"}
            onPress={handleSignOut}
          />
        </View>
      </View>
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
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 40,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5F3FF',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  defaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  editButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  profileForm: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  planSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  freePlanCard: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5EA',
  },
  premiumPlanCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  freePlanName: {
    color: '#000000',
  },
  premiumPlanName: {
    color: '#B8860B',
  },
  planModel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  premiumSettingItem: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  premiumSettingTitle: {
    color: '#B8860B',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});