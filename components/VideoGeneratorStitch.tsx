import React, { useState } from 'react';

// Composant Material Icon (remplacement des icônes Google Material)
const MaterialIcon = ({ icon, className = "" }: { icon: string; className?: string }) => {
  // Mapping des icônes Material vers des symboles Unicode ou texte
  const iconMap: { [key: string]: string } = {
    'arrow_back_ios_new': '‹',
    'unfold_more': '⇕',
    'auto_awesome': '✨',
    'close': '✕',
    'tune': '⚙',
    'expand_more': '⌄',
    'videocam': '🎥',
    'ios_share': '↗',
    'download': '↓',
    'upload': '↑',
    'aspect_ratio': '⊡',
    'arrow_forward_ios': '›',
  };

  return (
    <span className={`inline-block ${className}`} style={{ fontFamily: 'inherit' }}>
      {iconMap[icon] || icon}
    </span>
  );
};

export default function VideoGeneratorStitch() {
  // États pour gérer les bottom sheets
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [isAdvancedSheetOpen, setIsAdvancedSheetOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('veo');
  const [selectedFormat, setSelectedFormat] = useState('9:16');
  const [selectedStyle, setSelectedStyle] = useState('cinema');
  const [prompt, setPrompt] = useState('Un astronaute surfant sur une vague cosmique...');

  // Handler pour "Me faire la surprise"
  const handleSurprise = () => {
    const surprises = [
      "Un dragon majestueux volant au-dessus d'un château médiéval",
      "Une forêt enchantée avec des créatures lumineuses",
      "Un robot futuriste explorant une planète alien",
      "Des aurores boréales dansant dans le ciel arctique",
    ];
    setPrompt(surprises[Math.floor(Math.random() * surprises.length)]);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-black overflow-x-hidden font-sans">
      {/* Bottom Sheet pour sélection de modèle IA */}
      {isModelSheetOpen && (
        <div className="group" id="ai-model-selection">
          <button
            className="fixed inset-0 z-40 bg-black/60 opacity-100"
            onClick={() => setIsModelSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] transform translate-y-0 transition-transform duration-300">
            <div className="flex h-full flex-col rounded-t-3xl bg-gradient-to-b from-[#0B0B0D] to-[#141418]">
              <div className="flex-shrink-0 p-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20"></div>
              </div>
              <div className="px-5 pb-5">
                <h3 className="text-white text-lg font-bold">Modèle d'IA</h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-8">
                <button
                  className={`block w-full cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                    selectedModel === 'veo'
                      ? 'border-[#3B82F6] bg-white/10 shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                      : 'border-transparent bg-gray-900/50 hover:border-white/30'
                  }`}
                  onClick={() => {
                    setSelectedModel('veo');
                    setIsModelSheetOpen(false);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <img
                      alt="Veo 3.1 logo"
                      className="h-10 w-10 rounded-lg"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHYg98GJHcg74vCg1QsWMg-DmJsRze7u6n8wY3KuTxaX2UbdEUaIMmi8NIhGahRiLDMWCJn-ZJci0SLTrDhA6yLfe0JSuelHhV3t1oEmig1MJQgrBHvpfo6FJkfKv2p9xb9M_ehTksp-lCANjrtsY6M7QXDvNXf0xpoCbXfSwgWTl3c8rKzbQgBYL2p771UwUiblFCAyQ9xMHxwE9nR-u26yWIpCOVu4tNR8vo46bocKx63qdQFSpI2pQt6NZSjp4YywO-cWABLSMF"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-white">veo 3.1</h4>
                      <p className="mt-1 text-sm text-white/60">
                        Le modèle le plus avancé de Google pour des vidéos de haute qualité et réalistes.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  className={`block w-full cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                    selectedModel === 'seedance'
                      ? 'border-[#3B82F6] bg-white/10 shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                      : 'border-transparent bg-gray-900/50 hover:border-white/30'
                  }`}
                  onClick={() => {
                    setSelectedModel('seedance');
                    setIsModelSheetOpen(false);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <img
                      alt="Seedance logo"
                      className="h-10 w-10 rounded-lg"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEAiwNKJhny-OcBLAPfgmiwATHt4YaPFqs72zsc2I1KuHJK6SNPleIzIbqy98Fy5xV3qyC-vMNhij8XW9XTzNeryb0VCoMUvkCusVEzOu0EA4bY-rH8P71LF5T08_v2z5D-uD2-KND4Q_UiAPel63XF-iNqoECOw67bRNi7CDLYGCzuJrPOeHkGAr2VgpIppTwStRPgmJhopfAXE7_OUfer2PxCVIiZLaAYwSJaNGsjYxkwQirzufNIDjLn9vtBFH2qak_9YUgaaxy"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-white/80">seedance</h4>
                      <p className="mt-1 text-sm text-white/50">
                        Idéal pour les animations de personnages et les mouvements de danse complexes.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  className={`block w-full cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                    selectedModel === 'sora'
                      ? 'border-[#3B82F6] bg-white/10 shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                      : 'border-transparent bg-gray-900/50 hover:border-white/30'
                  }`}
                  onClick={() => {
                    setSelectedModel('sora');
                    setIsModelSheetOpen(false);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <img
                      alt="Sora logo"
                      className="h-10 w-10 rounded-lg"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsMDUPaRKU6NkpyGXKquknSO98WjuHbTGNSt6UF9pTISi9n7I4jcrFBySYrvOSG5rJhhjwvytOHuYEhzkipPHbw8t6tfFq6mjrkXz0OV1-EDguJeasfXVh9P4sN_K_VnmWJv0JblOnRTr1OOjbLRK0zPgD9O2p6d0IE0fvtwe6vb4Dmexg2V5OnPAzBOpqEzq0avvJy7U9PwjHvlX6VKmVIiyBGXg1uM0Em5lLRHR5cL8c41_0X0UNzKE44SBaQdCoOBzcuyVlyrf8"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-white/80">sora</h4>
                      <p className="mt-1 text-sm text-white/50">
                        Le modèle phare d'OpenAI, créant des scènes imaginatives à partir de textes.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet pour paramètres avancés */}
      {isAdvancedSheetOpen && (
        <div className="group" id="advanced-settings">
          <button
            className="fixed inset-0 z-40 bg-black/60 opacity-100"
            onClick={() => setIsAdvancedSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] transform translate-y-0 transition-transform duration-300">
            <div className="flex h-full flex-col rounded-t-3xl bg-gradient-to-b from-[#0B0B0D] to-[#141418]">
              <div className="flex-shrink-0 p-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20"></div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-8">
                <div className="space-y-4">
                  {/* Upload Photo */}
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-900/50 border border-white/10 p-6 h-40 text-center cursor-pointer hover:bg-white/5 transition-colors">
                    <MaterialIcon icon="upload" className="text-4xl text-white/50 mb-2" />
                    <p className="text-white/70 text-sm">
                      Appuyez ici pour uploader la photo à laquelle vous voulez donner vie !
                    </p>
                  </div>

                  {/* Format */}
                  <div className="flex items-center justify-between rounded-xl bg-gray-900/50 border border-white/10 p-4 h-16">
                    <div className="flex items-center gap-3">
                      <MaterialIcon icon="aspect_ratio" className="text-[#A855F7]" />
                      <span className="text-base font-medium text-white/90">Format</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-4 py-1.5 rounded-lg text-sm text-white/80 transition-colors ${
                          selectedFormat === '9:16'
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-black border border-white/10 hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedFormat('9:16')}
                      >
                        9:16
                      </button>
                      <button
                        className={`px-4 py-1.5 rounded-lg text-sm text-white/80 transition-colors ${
                          selectedFormat === '16:9'
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-black border border-white/10 hover:bg-white/5'
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
                      <MaterialIcon icon="tune" className="text-[#A855F7]" />
                      <span className="text-base font-medium text-white/90">Qualité</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white/90">Standard</span>
                      <MaterialIcon icon="unfold_more" className="text-white/50" />
                    </div>
                  </div>

                  {/* Style */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white text-base font-bold">Style</h3>
                      <button className="text-sm font-medium text-[#A855F7]/80 hover:text-[#A855F7] transition-colors flex items-center gap-1">
                        <span>Tout voir</span>
                        <MaterialIcon icon="arrow_forward_ios" className="text-base" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Style Cinéma */}
                      <button
                        className={`relative bg-cover bg-center rounded-xl aspect-[3/4] overflow-hidden group border-2 transition-colors ${
                          selectedStyle === 'cinema'
                            ? 'border-[#3B82F6] shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                            : 'border-transparent hover:border-white/50'
                        }`}
                        style={{
                          backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBi20A-yT3bi-Aa7-3i-K4tffdiqPhUBtaQJhx4Qf2A1DKpKGi9krVT9ROnYbeJMMnxfbuIJAWkfsUX7vL59JV-f9ojnbDKeRz2rs6ikb4LuznQm_8LAeSy-9Q1i5Erc3kGeUM4pDJxAvo4jQUBrWhlBaNoeFKmERKOU6Od8ozzuoHs0ZvBirQ_dL43VFi16agTtlAWfjN2AY-Zar43S5L8B2wXbvGkzhvAmialDnsLsrGVnqvX24-psPFfc5mlau4w9JOhsj_1XhYj")',
                        }}
                        onClick={() => setSelectedStyle('cinema')}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <p className="absolute bottom-3 left-0 right-0 text-white text-sm font-bold leading-tight text-center px-2">
                          Cinéma
                        </p>
                      </button>

                      {/* Style Anime */}
                      <button
                        className={`relative bg-cover bg-center rounded-xl aspect-[3/4] overflow-hidden group border-2 transition-colors ${
                          selectedStyle === 'anime'
                            ? 'border-[#3B82F6] shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                            : 'border-transparent hover:border-white/50'
                        }`}
                        style={{
                          backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCr-GjIN7IqO-UBMtxjSSHW3HCyj0rm_m2l-M-GFPDddGzYSoBuiOvoviuOIEREfvP2g0QA-64mqMXC2HmTpM0xmD0FH0WX4qVLC6BRAY_Y6qi2pwpGYnsf9__2qgNJcjwNzWSjtSaZFCjM0KWZPASVbG4v7znrsdBLr2mQ4UgGT0Svqt5-FOMcPRAd_acs17uR3CEXrhdKkVt-PVjGlfuLIF98eeM16yP7HUX5wZ1ygt4jxdfRY0XWIu-vA2YrpLcznXLVRosU2Lrl")',
                        }}
                        onClick={() => setSelectedStyle('anime')}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 group-hover:opacity-80 transition-opacity"></div>
                        <p className="absolute bottom-3 left-0 right-0 text-white text-sm font-bold leading-tight text-center px-2">
                          Anime
                        </p>
                      </button>

                      {/* Style Rétro */}
                      <button
                        className={`relative bg-cover bg-center rounded-xl aspect-[3/4] overflow-hidden group border-2 transition-colors ${
                          selectedStyle === 'retro'
                            ? 'border-[#3B82F6] shadow-[0_0_20px_0_rgba(59,130,246,0.5)]'
                            : 'border-transparent hover:border-white/50'
                        }`}
                        style={{
                          backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC36vgIwTjf2sOTG4-i-aZ5952oY2CpdXL4PxKrm8pw3DMExSIDSplgXkzcRGazgWM7J9GJTUEXLXkBxgNQYPir41RyzQAvENHeRQY7eX3njVu5BfH_N9VqG2R7fbyQRDVhcckR-W6Gsr3TbvBwOjuNNNxtwxxQiQOjpCx5zt5SGhcOeyKijRhKvFJaIeMYbH0YOm7g3fpvcoU7cG3iHwpkruHUkltJ4EYd4ZbXAddipA_DRjhokgf8gbNHtO8fsoUO5RxmlAWbHFiN")',
                        }}
                        onClick={() => setSelectedStyle('retro')}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 group-hover:opacity-80 transition-opacity"></div>
                        <p className="absolute bottom-3 left-0 right-0 text-white text-sm font-bold leading-tight text-center px-2">
                          Rétro
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Bouton Appliquer */}
                  <button
                    className="w-full flex items-center justify-center rounded-lg h-12 bg-[#1A1A1A] text-white text-base font-semibold border border-white/15 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow mt-6"
                    onClick={() => setIsAdvancedSheetOpen(false)}
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
            <MaterialIcon icon="arrow_back_ios_new" className="text-3xl" />
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
          {/* Modèle d'IA */}
          <div>
            <h3 className="text-white text-base font-bold mb-3 px-1">Modèle d'IA</h3>
            <button
              className="flex w-full items-center justify-between rounded-xl bg-[#1A1A1A] p-4 border border-white/10 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow"
              onClick={() => setIsModelSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <img
                  alt="Veo 3.1 logo"
                  className="h-8 w-8 rounded-md"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8zWbt6KVx0QUDTkAuREl9nU6ieoiKy7nRJaqKbhaX_Gp-hhc6YuZ0HVlQCDhySuqnrSKxOmrGJlY5SqcTw7LVeJ4qv3D7wrEU9L7wu3C9-ZkUm7K9Aig4dI9FSsRrGyICQ8SiRm9t5JNe2a08IlAM9KZhAoxqS5xuiCEr7pZE6y0J1LwwkvPAV2X9I8YCYgP_FHiEHRuxYIamz0fxMUNdKDXePwubOGWsxIbezWoaKybixhiqq-KGtIh-DjB9mBnzX04kDSX8JN45"
                />
                <div className="text-left">
                  <p className="font-bold text-white">veo 3.1</p>
                  <p className="text-xs text-white/60">Google</p>
                </div>
              </div>
              <MaterialIcon icon="unfold_more" className="text-white/50" />
            </button>
          </div>

          {/* Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white px-1" htmlFor="prompt-input">
              Invite
            </label>
            <div className="prompt-container relative flex flex-col rounded-lg bg-[#1A1A1A] border border-white/10 p-2">
              <textarea
                className="w-full flex-1 resize-none text-gray-400 text-base font-normal leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none p-2 placeholder:text-gray-500 focus:text-white min-h-[112px]"
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-4">
                <button
                  className="border border-white/10 rounded-full px-2 py-1 hover:border-white/20 transition-colors flex items-center gap-1.5"
                  onClick={handleSurprise}
                >
                  <MaterialIcon icon="auto_awesome" className="text-lg text-white" />
                  <span className="text-xs font-medium text-white">Me faire la surprise</span>
                </button>
                {prompt && (
                  <button
                    className="prompt-clear text-gray-400 hover:text-white transition-colors"
                    onClick={() => setPrompt('')}
                  >
                    <MaterialIcon icon="close" className="text-xl" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Paramètres avancés */}
        <div>
          <button
            className="w-full flex justify-between items-center rounded-xl bg-[#1A1A1A] border border-white/10 p-4 h-16 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow"
            onClick={() => setIsAdvancedSheetOpen(true)}
          >
            <div className="flex items-center gap-3">
              <MaterialIcon icon="tune" className="text-white/80" />
              <h3 className="text-white text-base font-bold">Paramètres avancés</h3>
            </div>
            <MaterialIcon icon="expand_more" className="text-white/50" />
          </button>
        </div>

        {/* Résultat */}
        <div className="space-y-4">
          <h3 className="text-white text-base font-bold">Résultat</h3>
          <div className="relative bg-gray-900 rounded-lg aspect-video overflow-hidden group border border-white/10 flex flex-col items-center justify-center text-center p-4">
            <MaterialIcon icon="videocam" className="text-5xl text-white/30 mb-2" />
            <p className="text-white/60 font-medium">Aperçu du modèle choisi</p>
            <p className="text-white/40 text-sm">Ex: Aperçu de Veo 3</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-[#1A1A1A] text-white text-base font-semibold border border-white/15 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow">
              <MaterialIcon icon="ios_share" className="text-xl" />
              <span>Partager</span>
            </button>
            <button className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-[#1A1A1A] text-white text-base font-semibold border border-white/15 hover:shadow-[0_0_15px_0_rgba(255,255,255,0.1)] transition-shadow">
              <MaterialIcon icon="download" className="text-xl" />
              <span>Télécharger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bouton Créer sticky */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-lg pb-4">
        <div className="flex items-center px-4 py-3">
          <button className="w-full cursor-pointer flex items-center justify-center overflow-hidden rounded-full h-16 bg-[#2563EB] text-white text-xl font-bold leading-normal transition-colors hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-[rgba(37,99,235,0.3)]">
            <span className="truncate">Créer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
