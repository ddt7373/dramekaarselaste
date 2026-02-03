import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict';

// Conflict resolution strategies
export type ConflictResolutionStrategy = 'client_wins' | 'server_wins' | 'manual' | 'merge';

// Conflict types
export interface SyncConflict {
  id: string;
  queueItemId: string;
  type: 'pastoral' | 'crisis';
  clientData: any;
  serverData: any;
  conflictField: string;
  detectedAt: number;
  resolved: boolean;
  resolution?: 'client' | 'server' | 'merged';
}

// Types for offline queue items
interface QueuedPastoralAction {
  id: string;
  type: 'pastoral';
  data: {
    gebruiker_id: string;
    leier_id: string;
    tipe: string;
    datum: string;
    nota: string;
    gemeente_id: string;
  };
  timestamp: number;
  retries: number;
  lastRetryAt?: number;
  nextRetryAt?: number;
  error?: string;
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  serverVersion?: number;
}

interface QueuedCrisisReport {
  id: string;
  type: 'crisis';
  data: {
    gebruiker_id: string;
    tipe: string;
    beskrywing: string;
    prioriteit: string;
    ingedien_deur: string;
    status: string;
    gemeente_id: string;
  };
  timestamp: number;
  retries: number;
  lastRetryAt?: number;
  nextRetryAt?: number;
  error?: string;
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  serverVersion?: number;
}

export type QueuedItem = QueuedPastoralAction | QueuedCrisisReport;

interface CachedDocument {
  id: string;
  name: string;
  url: string;
  cachedAt: number;
  size?: number;
}

interface CachedDagstukkie {
  id: string;
  titel: string;
  inhoud: string;
  datum: string;
  skrywer?: string;
  cachedAt: number;
}

// Sync statistics
export interface SyncStats {
  totalSynced: number;
  totalFailed: number;
  lastSyncTime: number | null;
  lastSuccessTime: number | null;
  averageSyncDuration: number;
}

interface OfflineContextType {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  syncQueue: QueuedItem[];
  cachedDocuments: CachedDocument[];
  cachedDagstukkies: CachedDagstukkie[];
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  
  // Sync status
  syncStatus: SyncStatus;
  syncProgress: number;
  syncStats: SyncStats;
  conflicts: SyncConflict[];
  
  // Conflict resolution
  conflictStrategy: ConflictResolutionStrategy;
  setConflictStrategy: (strategy: ConflictResolutionStrategy) => void;
  resolveConflict: (conflictId: string, resolution: 'client' | 'server' | 'merged', mergedData?: any) => Promise<void>;
  
  // Queue operations
  addToQueue: (item: Omit<QueuedItem, 'id' | 'timestamp' | 'retries' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  retryItem: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  clearQueue: () => void;
  clearFailedItems: () => void;
  
  // Document caching
  cacheDocument: (doc: Omit<CachedDocument, 'cachedAt'>) => Promise<void>;
  removeCachedDocument: (id: string) => void;
  isDocumentCached: (id: string) => boolean;
  
  // Dagstukkies caching
  cacheDagstukkies: (items: Omit<CachedDagstukkie, 'cachedAt'>[]) => void;
  getCachedDagstukkies: () => CachedDagstukkie[];
  
  // Storage info
  getStorageUsage: () => Promise<{ used: number; quota: number }>;
  clearAllOfflineData: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

// Local storage keys
const STORAGE_KEYS = {
  SYNC_QUEUE: 'nhka_sync_queue',
  CACHED_DOCUMENTS: 'nhka_cached_documents',
  CACHED_DAGSTUKKIES: 'nhka_cached_dagstukkies',
  SYNC_STATS: 'nhka_sync_stats',
  CONFLICTS: 'nhka_conflicts',
  CONFLICT_STRATEGY: 'nhka_conflict_strategy',
};

// Exponential backoff configuration
const BACKOFF_CONFIG = {
  initialDelay: 1000, // 1 second
  maxDelay: 300000, // 5 minutes
  multiplier: 2,
  maxRetries: 10,
  jitter: 0.1, // 10% jitter
};

// Calculate next retry delay with exponential backoff
const calculateBackoffDelay = (retries: number): number => {
  const delay = Math.min(
    BACKOFF_CONFIG.initialDelay * Math.pow(BACKOFF_CONFIG.multiplier, retries),
    BACKOFF_CONFIG.maxDelay
  );
  // Add jitter
  const jitter = delay * BACKOFF_CONFIG.jitter * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
};

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [syncQueue, setSyncQueue] = useState<QueuedItem[]>([]);
  const [cachedDocuments, setCachedDocuments] = useState<CachedDocument[]>([]);
  const [cachedDagstukkies, setCachedDagstukkies] = useState<CachedDagstukkie[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [conflictStrategy, setConflictStrategyState] = useState<ConflictResolutionStrategy>('client_wins');
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalSynced: 0,
    totalFailed: 0,
    lastSyncTime: null,
    lastSuccessTime: null,
    averageSyncDuration: 0,
  });
  
  const isSyncing = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (savedQueue) {
        setSyncQueue(JSON.parse(savedQueue));
      }

      const savedDocs = localStorage.getItem(STORAGE_KEYS.CACHED_DOCUMENTS);
      if (savedDocs) {
        setCachedDocuments(JSON.parse(savedDocs));
      }

      const savedDagstukkies = localStorage.getItem(STORAGE_KEYS.CACHED_DAGSTUKKIES);
      if (savedDagstukkies) {
        setCachedDagstukkies(JSON.parse(savedDagstukkies));
      }

      const savedStats = localStorage.getItem(STORAGE_KEYS.SYNC_STATS);
      if (savedStats) {
        setSyncStats(JSON.parse(savedStats));
      }

      const savedConflicts = localStorage.getItem(STORAGE_KEYS.CONFLICTS);
      if (savedConflicts) {
        setConflicts(JSON.parse(savedConflicts));
      }

      const savedStrategy = localStorage.getItem(STORAGE_KEYS.CONFLICT_STRATEGY);
      if (savedStrategy) {
        setConflictStrategyState(savedStrategy as ConflictResolutionStrategy);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CACHED_DOCUMENTS, JSON.stringify(cachedDocuments));
  }, [cachedDocuments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CACHED_DAGSTUKKIES, JSON.stringify(cachedDagstukkies));
  }, [cachedDagstukkies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATS, JSON.stringify(syncStats));
  }, [syncStats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFLICTS, JSON.stringify(conflicts));
  }, [conflicts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFLICT_STRATEGY, conflictStrategy);
  }, [conflictStrategy]);

  // Register service worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully');
          setIsServiceWorkerReady(true);

          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Service Worker registration failed:', errorMessage);
        }
      }
    };

    registerServiceWorker();

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
      case 'SYNC_PASTORAL_ACTIONS':
      case 'SYNC_CRISIS_REPORTS':
        syncNow();
        break;
      case 'DOCUMENT_CACHED':
        if (payload.success) {
          toast.success(`Dokument "${payload.name}" is nou beskikbaar van-lyn-af`);
        }
        break;
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Jy is weer aanlyn!', {
        description: syncQueue.length > 0 ? `${syncQueue.length} aksies wag om te sinkroniseer` : undefined
      });
      
      // Auto-sync when coming back online
      if (syncQueue.length > 0) {
        setTimeout(() => syncNow(), 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Jy is van-lyn-af', {
        description: 'Aksies sal gestoor word en later gesinkroniseer word'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue.length]);

  // Automatic retry scheduler
  useEffect(() => {
    const scheduleRetries = () => {
      if (!isOnline || isSyncing.current) return;

      const now = Date.now();
      const itemsToRetry = syncQueue.filter(
        item => item.status === 'failed' && 
                item.nextRetryAt && 
                item.nextRetryAt <= now &&
                item.retries < BACKOFF_CONFIG.maxRetries
      );

      if (itemsToRetry.length > 0) {
        syncNow();
      }

      // Find next retry time
      const pendingRetries = syncQueue.filter(
        item => item.status === 'failed' && 
                item.nextRetryAt && 
                item.nextRetryAt > now &&
                item.retries < BACKOFF_CONFIG.maxRetries
      );

      if (pendingRetries.length > 0) {
        const nextRetry = Math.min(...pendingRetries.map(item => item.nextRetryAt!));
        const delay = nextRetry - now;

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        retryTimeoutRef.current = setTimeout(scheduleRetries, delay);
      }
    };

    scheduleRetries();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isOnline, syncQueue]);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add item to sync queue
  const addToQueue = useCallback((item: Omit<QueuedItem, 'id' | 'timestamp' | 'retries' | 'status'>) => {
    const newItem: QueuedItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    } as QueuedItem;

    setSyncQueue(prev => [...prev, newItem]);
    
    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        if (item.type === 'pastoral') {
          (registration as any).sync.register('sync-pastoral-actions');
        } else if (item.type === 'crisis') {
          (registration as any).sync.register('sync-crisis-reports');
        }
      });
    }

    // Try to sync immediately if online
    if (isOnline) {
      setTimeout(() => syncNow(), 100);
    }
  }, [isOnline]);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setSyncQueue(prev => prev.filter(item => item.id !== id));
    // Also remove any associated conflicts
    setConflicts(prev => prev.filter(c => c.queueItemId !== id));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setSyncQueue([]);
    setConflicts([]);
  }, []);

  // Clear only failed items
  const clearFailedItems = useCallback(() => {
    setSyncQueue(prev => prev.filter(item => item.status !== 'failed'));
  }, []);

  // Check for conflicts with server data
  const checkForConflicts = async (item: QueuedItem): Promise<SyncConflict | null> => {
    try {
      // For new items (no server version), no conflict possible
      if (!item.serverVersion) return null;

      let serverData: any = null;
      
      if (item.type === 'pastoral') {
        const { data } = await supabase
          .from('pastorale_aksies')
          .select('*')
          .eq('id', item.data.gebruiker_id)
          .eq('datum', item.data.datum)
          .single();
        serverData = data;
      } else if (item.type === 'crisis') {
        const { data } = await supabase
          .from('krisis_verslae')
          .select('*')
          .eq('id', item.data.gebruiker_id)
          .single();
        serverData = data;
      }

      if (serverData && serverData.updated_at !== item.serverVersion) {
        return {
          id: generateId(),
          queueItemId: item.id,
          type: item.type,
          clientData: item.data,
          serverData,
          conflictField: 'updated_at',
          detectedAt: Date.now(),
          resolved: false,
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  // Resolve a conflict
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'client' | 'server' | 'merged',
    mergedData?: any
  ) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    const queueItem = syncQueue.find(q => q.id === conflict.queueItemId);
    if (!queueItem) return;

    try {
      let dataToSync: any;

      switch (resolution) {
        case 'client':
          dataToSync = conflict.clientData;
          break;
        case 'server':
          // Remove from queue, server data is already correct
          removeFromQueue(conflict.queueItemId);
          setConflicts(prev => prev.map(c => 
            c.id === conflictId ? { ...c, resolved: true, resolution } : c
          ));
          toast.success('Konflik opgelos - bediener data behou');
          return;
        case 'merged':
          dataToSync = mergedData || { ...conflict.serverData, ...conflict.clientData };
          break;
      }

      // Update the queue item with resolved data
      setSyncQueue(prev => prev.map(q => 
        q.id === conflict.queueItemId 
          ? { ...q, data: dataToSync, status: 'pending' as const }
          : q
      ));

      setConflicts(prev => prev.map(c => 
        c.id === conflictId ? { ...c, resolved: true, resolution } : c
      ));

      toast.success('Konflik opgelos');
      
      // Retry sync
      setTimeout(() => syncNow(), 500);
    } catch (error) {
      toast.error('Kon nie konflik oplos nie');
    }
  }, [conflicts, syncQueue, removeFromQueue]);

  // Retry a specific item
  const retryItem = useCallback(async (id: string) => {
    setSyncQueue(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'pending' as const, error: undefined }
        : item
    ));
    
    setTimeout(() => syncNow(), 100);
  }, []);

  // Sync all queued items
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing.current) return;
    
    const pendingItems = syncQueue.filter(item => 
      item.status === 'pending' || 
      (item.status === 'failed' && item.retries < BACKOFF_CONFIG.maxRetries && 
       (!item.nextRetryAt || item.nextRetryAt <= Date.now()))
    );

    if (pendingItems.length === 0) return;

    isSyncing.current = true;
    setSyncStatus('syncing');
    setSyncProgress(0);

    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    let conflictCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setSyncProgress(((i + 1) / pendingItems.length) * 100);

      // Update item status to syncing
      setSyncQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'syncing' as const } : q
      ));

      try {
        // Check for conflicts first
        const conflict = await checkForConflicts(item);
        
        if (conflict && conflictStrategy === 'manual') {
          // Add to conflicts list for manual resolution
          setConflicts(prev => [...prev, conflict]);
          setSyncQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, status: 'conflict' as const } : q
          ));
          conflictCount++;
          continue;
        }

        // Auto-resolve conflict if strategy is set
        let dataToSync = item.data;
        if (conflict) {
          if (conflictStrategy === 'server_wins') {
            // Skip this item, server data is correct
            removeFromQueue(item.id);
            continue;
          } else if (conflictStrategy === 'merge') {
            dataToSync = { ...conflict.serverData, ...item.data };
          }
          // client_wins: use item.data as-is
        }

        if (item.type === 'pastoral') {
          const { error } = await supabase
            .from('pastorale_aksies')
            .insert([dataToSync]);

          if (error) throw error;
          removeFromQueue(item.id);
          successCount++;
        } else if (item.type === 'crisis') {
          const { error } = await supabase
            .from('krisis_verslae')
            .insert([dataToSync]);

          if (error) throw error;
          removeFromQueue(item.id);
          successCount++;
        }
      } catch (error) {
        console.error('Sync error for item:', item.id, error);
        failCount++;
        
        const newRetries = item.retries + 1;
        const nextRetryDelay = calculateBackoffDelay(newRetries);
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
        
        // Update item with retry info
        setSyncQueue(prev => prev.map(q => 
          q.id === item.id 
            ? { 
                ...q, 
                status: 'failed' as const,
                retries: newRetries,
                lastRetryAt: Date.now(),
                nextRetryAt: Date.now() + nextRetryDelay,
                error: errorMessage
              } 
            : q
        ));
      }
    }

    const duration = Date.now() - startTime;

    // Update stats
    setSyncStats(prev => ({
      totalSynced: prev.totalSynced + successCount,
      totalFailed: prev.totalFailed + failCount,
      lastSyncTime: Date.now(),
      lastSuccessTime: successCount > 0 ? Date.now() : prev.lastSuccessTime,
      averageSyncDuration: prev.averageSyncDuration 
        ? (prev.averageSyncDuration + duration) / 2 
        : duration,
    }));

    isSyncing.current = false;
    setSyncProgress(100);

    if (conflictCount > 0) {
      setSyncStatus('conflict');
      toast.warning(`${conflictCount} konflik(te) gevind`, {
        description: 'Gaan na van-lyn-af bestuur om op te los'
      });
    } else if (failCount > 0 && successCount === 0) {
      setSyncStatus('error');
      toast.error(`${failCount} aksie(s) kon nie sinkroniseer nie`, {
        description: 'Sal outomaties weer probeer'
      });
    } else if (successCount > 0) {
      setSyncStatus('success');
      toast.success(`${successCount} aksie(s) suksesvol gesinkroniseer`);
      
      // Reset to idle after a delay
      setTimeout(() => setSyncStatus('idle'), 3000);
    }

    if (failCount > 0) {
      // Reset to idle after showing error
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [isOnline, syncQueue, conflictStrategy, removeFromQueue]);

  // Set conflict strategy
  const setConflictStrategy = useCallback((strategy: ConflictResolutionStrategy) => {
    setConflictStrategyState(strategy);
  }, []);

  // Cache a document
  const cacheDocument = useCallback(async (doc: Omit<CachedDocument, 'cachedAt'>) => {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DOCUMENT',
          payload: { url: doc.url, name: doc.name }
        });
      }

      const cachedDoc: CachedDocument = {
        ...doc,
        cachedAt: Date.now()
      };

      setCachedDocuments(prev => {
        const filtered = prev.filter(d => d.id !== doc.id);
        return [...filtered, cachedDoc];
      });

      toast.success(`"${doc.name}" word afgelaai vir van-lyn-af gebruik`);
    } catch (error) {
      console.error('Error caching document:', error);
      toast.error('Kon nie dokument stoor nie');
    }
  }, []);

  // Remove cached document
  const removeCachedDocument = useCallback((id: string) => {
    setCachedDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  // Check if document is cached
  const isDocumentCached = useCallback((id: string) => {
    return cachedDocuments.some(d => d.id === id);
  }, [cachedDocuments]);

  // Cache dagstukkies
  const cacheDagstukkies = useCallback((items: Omit<CachedDagstukkie, 'cachedAt'>[]) => {
    const cachedItems = items.map(item => ({
      ...item,
      cachedAt: Date.now()
    }));

    setCachedDagstukkies(cachedItems);

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_DAGSTUKKIES',
        payload: { data: cachedItems }
      });
    }
  }, []);

  // Get cached dagstukkies
  const getCachedDagstukkies = useCallback(() => {
    return cachedDagstukkies;
  }, [cachedDagstukkies]);

  // Get storage usage
  const getStorageUsage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }, []);

  // Clear all offline data
  const clearAllOfflineData = useCallback(() => {
    setSyncQueue([]);
    setCachedDocuments([]);
    setCachedDagstukkies([]);
    setConflicts([]);
    setSyncStats({
      totalSynced: 0,
      totalFailed: 0,
      lastSyncTime: null,
      lastSuccessTime: null,
      averageSyncDuration: 0,
    });
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }

    toast.success('Alle van-lyn-af data is verwyder');
  }, []);

  const pendingCount = syncQueue.filter(item => item.status === 'pending').length;
  const failedCount = syncQueue.filter(item => item.status === 'failed').length;
  const conflictCountValue = syncQueue.filter(item => item.status === 'conflict').length;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isServiceWorkerReady,
        syncQueue,
        cachedDocuments,
        cachedDagstukkies,
        pendingCount,
        failedCount,
        conflictCount: conflictCountValue,
        syncStatus,
        syncProgress,
        syncStats,
        conflicts,
        conflictStrategy,
        setConflictStrategy,
        resolveConflict,
        addToQueue,
        removeFromQueue,
        retryItem,
        syncNow,
        clearQueue,
        clearFailedItems,
        cacheDocument,
        removeCachedDocument,
        isDocumentCached,
        cacheDagstukkies,
        getCachedDagstukkies,
        getStorageUsage,
        clearAllOfflineData
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
