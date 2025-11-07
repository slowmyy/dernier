# VideoGeneratorStitch - Documentation

## 🎬 Description

Composant React fonctionnel qui convertit le code HTML de Stitch en JSX compatible avec Bolt/React.

## ✅ Conversions effectuées

- ✅ Suppression des balises `<html>`, `<head>`, `<body>`
- ✅ Conversion de tous les `class` en `className`
- ✅ Intégration de la police **Space Grotesk** via CSS global
- ✅ Remplacement des Material Icons par un composant React personnalisé
- ✅ Conservation de tous les IDs (`#ai-model-selection`, `#advanced-settings`)
- ✅ Implémentation des bottom sheets (modals) avec état React
- ✅ Style identique à l'original avec Tailwind CSS

## 📦 Installation

### 1. Le composant est déjà créé
Le fichier `components/VideoGeneratorStitch.tsx` contient le composant complet.

### 2. Les polices sont configurées
La police Google **Space Grotesk** a été ajoutée au fichier `global.css`.

## 🚀 Utilisation

### Option 1: Intégrer dans une page existante

```tsx
import VideoGeneratorStitch from '@/components/VideoGeneratorStitch';

export default function Page() {
  return <VideoGeneratorStitch />;
}
```

### Option 2: Remplacer le composant video.tsx actuel

Pour utiliser ce composant dans l'onglet vidéo, modifiez `app/(tabs)/video.tsx` :

```tsx
import VideoGeneratorStitch from '@/components/VideoGeneratorStitch';

export default function VideoScreen() {
  return <VideoGeneratorStitch />;
}
```

## 🎨 Fonctionnalités

### États gérés
- ✅ Sélection du modèle IA (Veo 3.1, Seedance, Sora)
- ✅ Gestion du prompt (textarea avec bouton "Me faire la surprise")
- ✅ Paramètres avancés (format, qualité, style)
- ✅ Bottom sheets interactifs pour les modaux

### Interactions
- ✅ Bouton "Me faire la surprise" - génère un prompt aléatoire
- ✅ Bouton "X" pour effacer le prompt
- ✅ Sélection de format (9:16 / 16:9)
- ✅ Sélection de style (Cinéma / Anime / Rétro)
- ✅ Bottom sheets avec overlay cliquable

### Design
- ✅ Fond noir (#000000)
- ✅ Police Space Grotesk
- ✅ Tous les styles Tailwind préservés
- ✅ Effets de hover et transitions
- ✅ Shadow effects (glow-blue, glow-purple)
- ✅ Border radius et espacements identiques

## 🛠️ Personnalisation

### Modifier les modèles IA
Éditez les objets dans le state ou créez une constante :

```tsx
const models = [
  { id: 'veo', name: 'veo 3.1', logo: '...' },
  { id: 'seedance', name: 'seedance', logo: '...' },
  // Ajoutez vos modèles
];
```

### Modifier les styles
Les 3 styles sont définis dans le bottom sheet des paramètres avancés :
- Cinéma
- Anime
- Rétro

### Remplacer les icônes
Le composant `MaterialIcon` utilise des symboles Unicode. Pour utiliser de vraies icônes :

1. Installez une bibliothèque d'icônes :
```bash
npm install lucide-react
# ou
npm install react-icons
```

2. Remplacez le composant `MaterialIcon` par vos icônes préférées

## 🐛 Debugging

### Si vous avez un écran blanc

1. **Vérifiez la console** : Ouvrez les DevTools et vérifiez les erreurs
2. **Vérifiez Tailwind** : Assurez-vous que Tailwind CSS est bien configuré
3. **Vérifiez les imports** : Le chemin `@/components/...` doit être valide
4. **Testez le composant isolé** : Créez une page de test

```tsx
// app/test-stitch.tsx
import VideoGeneratorStitch from '@/components/VideoGeneratorStitch';

export default function TestPage() {
  return (
    <div className="min-h-screen">
      <VideoGeneratorStitch />
    </div>
  );
}
```

### Si les images ne s'affichent pas

Les images utilisent des URLs Google Cloud. Vérifiez que :
- Votre connexion internet est active
- Les URLs sont accessibles
- Il n'y a pas de bloqueur de contenu

## 📝 Notes importantes

- **Aucune dépendance externe** requise (sauf React et Tailwind)
- **Compatible** avec Next.js, Vite, Create React App, Expo Web
- **Responsive** : Le design s'adapte aux différentes tailles d'écran
- **Accessible** : Tous les boutons sont cliquables et ont des labels

## 🔄 Différences avec l'original

1. **Navigation** : Les liens `<a href="#...">` sont remplacés par des états React et des boutons
2. **Icônes** : Les Material Icons Google sont remplacées par des symboles Unicode (facilement modifiable)
3. **Interactivité** : Logique JavaScript intégrée directement dans le composant React

## 🎯 Prochaines étapes

Pour connecter ce composant à votre backend :

1. Ajoutez les props nécessaires
2. Connectez les handlers (`handleSurprise`, bouton "Créer")
3. Intégrez votre service de génération vidéo
4. Gérez l'état de chargement et les résultats

Exemple :

```tsx
<VideoGeneratorStitch
  onGenerate={(prompt, model, settings) => {
    // Votre logique de génération
  }}
  isGenerating={isLoading}
  generatedVideo={videoUrl}
/>
```
