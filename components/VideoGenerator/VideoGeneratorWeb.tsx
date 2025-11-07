// components/VideoGenerator/VideoGeneratorWeb.tsx
// Version web pure du générateur vidéo (compatible Bolt)

import React, { useState, useRef, useEffect } from 'react';
import '../../global.css';

// Interface pour ModelOption
interface ModelOption {
  id: string;
  name: string;
  description: string;
  model: string;
  duration: number;
  logo?: string;
  company: string;
}

// Interface pour VideoStyle
interface VideoStyle {
  id: string;
  name: string;
  thumbnail: string;
}

// Configuration des modèles IA
const AI_MODELS: ModelOption[] = [
  {
    id: 'veo3',
    name: 'veo 3.1',
    description: 'Le modèle le plus avancé de Google pour des vidéos de haute qualité et réalistes.',
    model: 'google:3@1',
    duration: 8,
    company: 'Google',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8zWbt6KVx0QUDTkAuREl9nU6ieoiKy7nRJaqKbhaX_Gp-hhc6YuZ0HVlQCDhySuqnrSKxOmrGJlY5SqcTw7LVeJ4qv3D7wrEU9L7wu3C9-ZkUm7K9Aig4dI9FSsRrGyICQ8SiRm9t5JNe2a08IlAM9KZhAoxqS5xuiCEr7pZE6y0J1LwwkvPAV2X9I8YCYgP_FHiEHRuxYIamz0fxMUNdKDXePwubOGWsxIbezWoaKybixhiqq-KGtIh-DjB9mBnzX04kDSX8JN45',
  },
  {
    id: 'seedance',
    name: 'seedance',
    description: 'Idéal pour les animations de personnages et les mouvements de danse complexes.',
    model: 'bytedance:1@1',
    duration: 6,
    company: 'ByteDance',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEAiwNKJhny-OcBLAPfgmiwATHt4YaPFqs72zsc2I1KuHJK6SNPleIzIbqy98Fy5xV3qyC-vMNhij8XW9XTzNeryb0VCoMUvkCusVEzOu0EA4bY-rH8P71LF5T08_v2z5D-uD2-KND4Q_UiAPel63XF-iNqoECOw67bRNi7CDLYGCzuJrPOeHkGAr2VgpIppTwStRPgmJhopfAXE7_OUfer2PxCVIiZLaAYwSJaNGsjYxkwQirzufNIDjLn9vtBFH2qak_9YUgaaxy',
  },
  {
    id: 'sora2',
    name: 'sora',
    description: "Le modèle phare d'OpenAI, créant des scènes imaginatives à partir de textes.",
    model: 'sora-2-pro',
    duration: 10,
    company: 'OpenAI',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsMDUPaRKU6NkpyGXKquknSO98WjuHbTGNSt6UF9pTISi9n7I4jcrFBySYrvOSG5rJhhjwvytOHuYEhzkipPHbw8t6tfFq6mjrkXz0OV1-EDguJeasfXVh9P4sN_K_VnmWJv0JblOnRTr1OOjbLRK0zPgD9O2p6d0IE0fvtwe6vb4Dmexg2V5OnPAzBOpqEzq0avvJy7U9PwjHvlX6VKmVIiyBGXg1uM0Em5lLRHR5cL8c41_0X0UNzKE44SBaQdCoOBzcuyVlyrf8',
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

export default function VideoGeneratorWeb() {
  // États principaux
  const [prompt, setPrompt] = useState('Un astronaute surfant sur une vague cosmique...');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AI_MODELS[0]);
  const [selectedFormat, setSelectedFormat] = useState<'9:16' | '16:9'>('9:16');
  const [selectedQuality, setSelectedQuality] = useState('Standard');
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>(VIDEO_STYLES[0]);
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [advancedSheetOpen, setAdvancedSheetOpen] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Handler pour le changement de modèle
  const handleModelChange = (model: ModelOption) => {
    setSelectedModel(model);
    setModelSheetOpen(false);
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
  };

  // Handler pour la génération
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Veuillez entrer une description pour générer une vidéo.');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);

    // Simuler la génération (vous intégrerez votre vraie logique API ici)
    setTimeout(() => {
      setIsGenerating(false);
      // Remplacer par votre URL de vidéo générée
      setGeneratedVideoUrl('https://example.com/generated-video.mp4');
    }, 3000);
  };

  // Handler pour l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-black group/design-root overflow-x-hidden font-['Space_Grotesk',sans-serif] text-white">

      {/* Bottom Sheet - Sélection du Modèle IA */}
      {modelSheetOpen && (
        <div className="group" id="ai-model-selection">
          <button
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setModelSheetOpen(false)}
            aria-label="Fermer"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] animate-slideUp">
            <div className="flex h-full flex-col rounded-t-3xl bg-gradient-to-b from-[#0B0B0D] to-[#141418]">
              <div className="flex-shrink-0 p-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20"></div>
              </div>
              <div className="px-5 pb-5">
                <h3 className="text-white text-lg font-bold">Modèle d'IA</h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-8">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    className={`block w-full cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 text-left ${
                      selectedModel.id === model.id
                        ? 'border-[#3B82F6] bg-white/10 shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                        : 'border-transparent bg-gray-900/50 hover:border-white/30'
                    }`}
                    onClick={() => handleModelChange(model)}
                  >
                    <div className="flex items-start gap-4">
                      {model.logo && (
                        <img alt={`${model.name} logo`} className="h-10 w-10 rounded-lg" src={model.logo} />
                      )}
                      <div className="flex-1">
                        <h4 className={`text-base font-bold ${selectedModel.id === model.id ? 'text-white' : 'text-white/80'}`}>
                          {model.name}
                        </h4>
                        <p className={`mt-1 text-sm ${selectedModel.id === model.id ? 'text-white/60' : 'text-white/50'}`}>
                          {model.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet - Paramètres Avancés */}
      {advancedSheetOpen && (
        <div className="group" id="advanced-settings">
          <button
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setAdvancedSheetOpen(false)}
            aria-label="Fermer"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] animate-slideUp">
            <div className="flex h-full flex-col rounded-t-3xl bg-gradient-to-b from-[#0B0B0D] to-[#141418]">
              <div className="flex-shrink-0 p-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20"></div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-8">
                <div className="space-y-4">
                  {/* Upload Photo */}
                  <label className="flex flex-col items-center justify-center rounded-2xl bg-gray-900/50 border border-white/10 p-6 h-40 text-center cursor-pointer hover:bg-white/5 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {referenceImage ? (
                      <>
                        <img src={referenceImage} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setReferenceImage(null);
                          }}
                          className="absolute top-2 right-2 bg-black/50 rounded-full p-2 hover:bg-black/70"
                        >
                          <span className="material-symbols-outlined text-white">close</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-white/50 mb-2">upload</span>
                        <p className="text-white/70 text-sm">
                          Appuyez ici pour uploader la photo à laquelle vous voulez donner vie !
                        </p>
                      </>
                    )}
                  </label>

                  {/* Format */}
                  <div className="flex items-center justify-between rounded-xl bg-gray-900/50 border border-white/10 p-4 h-16">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#A855F7]">aspect_ratio</span>
                      <span className="text-base font-medium text-white/90">Format</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedFormat === '9:16'
                            ? 'bg-white/10 text-white/80'
                            : 'bg-black text-white/80 border border-white/10 hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedFormat('9:16')}
                      >
                        9:16
                      </button>
                      <button
                        className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedFormat === '16:9'
                            ? 'bg-white/10 text-white/80'
                            : 'bg-black text-white/80 border border-white/10 hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedFormat('16:9')}
                      >
                        16:9
                      </button>
                    </div>
                  </div>

                  {/* Qualité */}
                  <div className="flex items-center justify-between rounded-xl bg-gray-900/50 border border-white/10 p-4 h-16">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#A855F7]">tune</span>
                      <span className="text-base font-medium text-white/90">Qualité</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white/90">{selectedQuality}</span>
                      <span className="material-symbols-outlined text-white/50">unfold_more</span>
                    </div>
                  </div>

                  {/* Style */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white text-base font-bold">Style</h3>
                      <button className="text-sm font-medium text-[#A855F7]/80 hover:text-[#A855F7] transition-colors flex items-center gap-1">
                        <span>Tout voir</span>
                        <span className="material-symbols-outlined text-base">arrow_forward_ios</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {VIDEO_STYLES.map((style) => (
                        <button
                          key={style.id}
                          className={`relative bg-cover bg-center rounded-xl aspect-[3/4] overflow-hidden group border-2 transition-colors ${
                            selectedStyle.id === style.id
                              ? 'border-[#3B82F6] shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                              : 'border-transparent hover:border-white/50'
                          }`}
                          style={{ backgroundImage: `url("${style.thumbnail}")` }}
                          onClick={() => setSelectedStyle(style)}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
                            selectedStyle.id === style.id ? 'opacity-100' : 'opacity-100 group-hover:opacity-80'
                          }`}></div>
                          <p className="absolute bottom-3 left-0 right-0 text-white text-sm font-bold leading-tight text-center px-2">
                            {style.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bouton Appliquer */}
                  <button
                    className="w-full flex items-center justify-center rounded-lg h-12 bg-[#1A1A1A] text-white text-base font-semibold border border-white/15 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow mt-6"
                    onClick={() => setAdvancedSheetOpen(false)}
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center p-4 justify-between sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex size-10 shrink-0 items-center justify-start">
          <button className="text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-3xl">arrow_back_ios_new</span>
          </button>
        </div>
        <h2 className="text-white text-xl font-extrabold leading-tight tracking-[-0.015em] flex-1 text-center">
          Générateur Vidéo
        </h2>
        <div className="flex w-10 items-center justify-end">
          <div className="flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-1">
            <span className="text-sm font-bold tracking-wider text-white">PRO</span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-4 space-y-6">
        <div className="pt-4 space-y-4">

          {/* Sélection du Modèle IA */}
          <div>
            <h3 className="text-white text-base font-bold mb-3 px-1">Modèle d'IA</h3>
            <button
              className="flex w-full items-center justify-between rounded-xl bg-[#1A1A1A] p-4 border border-white/10 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow"
              onClick={() => setModelSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                {selectedModel.logo && (
                  <img alt={`${selectedModel.name} logo`} className="h-8 w-8 rounded-md" src={selectedModel.logo} />
                )}
                <div className="text-left">
                  <p className="font-bold text-white">{selectedModel.name}</p>
                  <p className="text-xs text-white/60">{selectedModel.company}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/50">unfold_more</span>
            </button>
          </div>

          {/* Champ Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white px-1" htmlFor="prompt-input">
              Invite
            </label>
            <div className="prompt-container relative flex flex-col rounded-lg bg-[#1A1A1A] border border-white/10 p-2">
              <textarea
                className="form-input w-full flex-1 resize-none text-gray-400 text-base font-normal leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none p-2 placeholder:text-gray-500 focus:text-white min-h-[112px]"
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez votre scène..."
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-4">
                <button
                  className="border border-white/10 rounded-full px-2 py-1 hover:border-white/20 transition-colors flex items-center gap-1.5"
                  onClick={handleSurpriseMe}
                >
                  <span className="material-symbols-outlined text-lg text-white">auto_awesome</span>
                  <span className="text-xs font-medium text-white">Me faire la surprise</span>
                </button>
                {prompt.length > 0 && (
                  <button
                    className="prompt-clear text-gray-400 hover:text-white transition-colors"
                    onClick={() => setPrompt('')}
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paramètres Avancés */}
          <div>
            <button
              className="w-full flex justify-between items-center rounded-xl bg-[#1A1A1A] border border-white/10 p-4 h-16 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow"
              onClick={() => setAdvancedSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white/80">tune</span>
                <h3 className="text-white text-base font-bold">Paramètres avancés</h3>
              </div>
              <span className="material-symbols-outlined text-white/50 transition-transform">expand_more</span>
            </button>
          </div>

          {/* Résultat */}
          <div className="space-y-4">
            <h3 className="text-white text-base font-bold">Résultat</h3>
            <div className="relative bg-gray-900 rounded-lg aspect-video overflow-hidden group border border-white/10 flex flex-col items-center justify-center text-center p-4">
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white/50"></div>
                  <p className="text-white/60 font-medium mt-4">Génération en cours...</p>
                </>
              ) : generatedVideoUrl ? (
                <video src={generatedVideoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-white/30 mb-2">videocam</span>
                  <p className="text-white/60 font-medium">Aperçu du modèle choisi</p>
                  <p className="text-white/40 text-sm">Ex: Aperçu de {selectedModel.name}</p>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-[#1A1A1A] text-white text-base font-semibold border border-white/15 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow">
                <span className="material-symbols-outlined text-xl">ios_share</span>
                <span>Partager</span>
              </button>
              <button className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-[#1A1A1A] text-white text-base font-semibold border border-white/15 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow">
                <span className="material-symbols-outlined text-xl">download</span>
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Créer sticky */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-lg pb-4">
        <div className="flex items-center px-4 py-3">
          <button
            className="w-full cursor-pointer flex items-center justify-center overflow-hidden rounded-full h-16 bg-[#2563EB] text-white text-xl font-bold leading-normal transition-colors hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-[#3B82F6]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <span className="truncate">{isGenerating ? 'Génération...' : 'Créer'}</span>
          </button>
        </div>
      </div>

      {/* Styles pour les polices Material Symbols */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
