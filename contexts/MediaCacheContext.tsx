import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storageService, StoredImage } from '@/services/storage';
import { galleryEvents } from '@/services/galleryEvents';

interface MediaCacheContextType {
  allMedia: StoredImage[];
  isLoading: boolean;
  refreshMedia: () => Promise<void>;
}

const MediaCacheContext = createContext<MediaCacheContextType | undefined>(undefined);

export function MediaCacheProvider({ children }: { children: ReactNode }) {
  const [allMedia, setAllMedia] = useState<StoredImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMedia = useCallback(async () => {
    try {
      const storedImages = storageService.getAllImages();
      const storedVideos = storageService.getAllVideos();

      const images: StoredImage[] = storedImages.map(img => ({ ...img, isVideo: false }));
      const videos: StoredImage[] = storedVideos.map(vid => ({ ...vid, isVideo: true }));

      const combined = [...images, ...videos].sort((a, b) => b.timestamp - a.timestamp);

      setAllMedia(combined);
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMedia = useCallback(async () => {
    await loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    loadMedia();

    const handleNewMedia = () => {
      loadMedia();
    };

    galleryEvents.onNewMedia(handleNewMedia);

    return () => {
      galleryEvents.removeNewMediaListener(handleNewMedia);
    };
  }, [loadMedia]);

  return (
    <MediaCacheContext.Provider value={{ allMedia, isLoading, refreshMedia }}>
      {children}
    </MediaCacheContext.Provider>
  );
}

export function useMediaCache() {
  const context = useContext(MediaCacheContext);
  if (context === undefined) {
    throw new Error('useMediaCache doit être utilisé dans un MediaCacheProvider');
  }
  return context;
}
