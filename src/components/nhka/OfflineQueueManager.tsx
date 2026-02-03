import React, { useState, useEffect } from 'react';
import { useOffline, QueuedItem, SyncConflict, ConflictResolutionStrategy } from '@/contexts/OfflineContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  RefreshCw, 
  Trash2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  Check,
  X,
  FileText,
  Heart,
  HardDrive,
  Wifi,
  WifiOff,
  Settings,
  ChevronRight,
  Loader2,
  RotateCcw,
  Merge,
  Server,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

const OfflineQueueManager: React.FC = () => {
  const {
    isOnline,
    syncQueue,
    syncStatus,
    syncProgress,
    syncStats,
    conflicts,
    conflictStrategy,
    setConflictStrategy,
    pendingCount,
    failedCount,
    conflictCount,
    syncNow,
    removeFromQueue,
    retryItem,
    clearQueue,
    clearFailedItems,
    resolveConflict,
    cachedDocuments,
    cachedDagstukkies,
    getStorageUsage,
    clearAllOfflineData,
  } = useOffline();

  const [activeTab, setActiveTab] = useState('queue');
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 });

  useEffect(() => {
    const loadStorageUsage = async () => {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    };
    loadStorageUsage();
  }, [getStorageUsage]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Nou net';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min gelede`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} uur gelede`;
    return new Date(timestamp).toLocaleDateString('af-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNextRetry = (timestamp: number | undefined): string => {
    if (!timestamp) return '-';
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Nou';
    if (diff < 60000) return `${Math.ceil(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.ceil(diff / 60000)} min`;
    return `${Math.ceil(diff / 3600000)} uur`;
  };

  const getItemTypeLabel = (type: string): string => {
    switch (type) {
      case 'pastoral': return 'Pastorale Aksie';
      case 'crisis': return 'Krisis Verslag';
      default: return type;
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 whitespace-nowrap">Wagend</Badge>;
      case 'syncing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 whitespace-nowrap">
          <Loader2 className="h-3 w-3 mr-1 animate-spin flex-shrink-0" />
          Sink...
        </Badge>;
      case 'failed':
        return <Badge variant="destructive" className="whitespace-nowrap">Misluk</Badge>;
      case 'conflict':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 whitespace-nowrap">Konflik</Badge>;
      default:
        return <Badge variant="secondary" className="whitespace-nowrap">{status}</Badge>;
    }
  };

  const getStrategyLabel = (strategy: ConflictResolutionStrategy): string => {
    switch (strategy) {
      case 'client_wins': return 'Kliënt Wen';
      case 'server_wins': return 'Bediener Wen';
      case 'manual': return 'Handmatig';
      case 'merge': return 'Saamvoeg';
      default: return strategy;
    }
  };

  const getStrategyDescription = (strategy: ConflictResolutionStrategy): string => {
    switch (strategy) {
      case 'client_wins': return 'Jou van-lyn-af veranderinge word altyd gebruik';
      case 'server_wins': return 'Bediener data word altyd behou';
      case 'manual': return 'Kies self watter data om te gebruik';
      case 'merge': return 'Probeer om data outomaties saam te voeg';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header with connection status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Van-lyn-af Bestuur</h2>
          <p className="text-sm sm:text-base text-gray-600 break-words">Bestuur jou van-lyn-af data en sinkronisering</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0 ${
          isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Aanlyn</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Van-lyn-af</span>
            </>
          )}
        </div>
      </div>

      {/* Sync Progress */}
      {syncStatus === 'syncing' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium text-blue-700">Sinkroniseer...</span>
                  <span className="text-xs sm:text-sm text-blue-600">{Math.round(syncProgress)}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Wagend</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{failedCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Misluk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{conflictCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Konflikte</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{syncStats.totalSynced}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Gesink.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="queue" className="relative text-xs sm:text-sm px-1 sm:px-3 py-2">
            <span className="hidden sm:inline">Tou</span>
            <span className="sm:hidden">Tou</span>
            {(pendingCount + failedCount) > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 sm:h-5 px-1 text-xs">
                {pendingCount + failedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="relative text-xs sm:text-sm px-1 sm:px-3 py-2">
            <span className="hidden sm:inline">Konflikte</span>
            <span className="sm:hidden">Konfl.</span>
            {conflictCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 sm:h-5 px-1 text-xs">
                {conflictCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cached" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
            <span className="hidden sm:inline">Gestoor</span>
            <span className="sm:hidden">Stoor</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
            <span className="hidden sm:inline">Instellings</span>
            <span className="sm:hidden">Inst.</span>
          </TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Sinkronisering Tou</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Aksies wat wag om gesinkroniseer te word
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncNow()}
                    disabled={!isOnline || syncStatus === 'syncing' || syncQueue.length === 0}
                    className="text-xs sm:text-sm"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Sinkroniseer</span>
                    <span className="sm:hidden">Sink</span>
                  </Button>
                  {failedCount > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline">Verwyder</span>
                          <span className="sm:hidden">Vee</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Verwyder Mislukte Items?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            Dit sal {failedCount} mislukte item(s) permanent verwyder. 
                            Hierdie aksie kan nie ongedaan gemaak word nie.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Kanselleer</AlertDialogCancel>
                          <AlertDialogAction onClick={clearFailedItems} className="w-full sm:w-auto">
                            Verwyder
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {syncQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen items in die tou nie</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="space-y-3">
                    {syncQueue.map((item) => (
                      <QueueItemCard
                        key={item.id}
                        item={item}
                        onRetry={() => retryItem(item.id)}
                        onRemove={() => removeFromQueue(item.id)}
                        formatTime={formatTime}
                        formatNextRetry={formatNextRetry}
                        getItemTypeLabel={getItemTypeLabel}
                        getItemStatusBadge={getItemStatusBadge}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="mt-4">
          <Card>
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Data Konflikte</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Konflikte tussen van-lyn-af en bediener data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {conflicts.filter(c => !c.resolved).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Check className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Geen onopgeloste konflikte nie</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="space-y-3">
                    {conflicts.filter(c => !c.resolved).map((conflict) => (
                      <ConflictCard
                        key={conflict.id}
                        conflict={conflict}
                        onResolve={() => setSelectedConflict(conflict)}
                        formatTime={formatTime}
                        getItemTypeLabel={getItemTypeLabel}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cached Tab */}
        <TabsContent value="cached" className="mt-4">
          <div className="space-y-4">
            {/* Storage Usage */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="break-words">Stoorplek Gebruik</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="truncate">{formatBytes(storageUsage.used)} gebruik</span>
                    <span className="truncate ml-2">{formatBytes(storageUsage.quota)} beskikbaar</span>
                  </div>
                  <Progress 
                    value={(storageUsage.used / storageUsage.quota) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cached Documents */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Gestoor Dokumente</span>
                  <Badge variant="secondary" className="text-xs">{cachedDocuments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {cachedDocuments.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">
                    Geen dokumente gestoor nie
                  </p>
                ) : (
                  <ScrollArea className="h-[150px] sm:h-[200px]">
                    <div className="space-y-2">
                      {cachedDocuments.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                Gestoor: {formatTime(doc.cachedAt)}
                                {doc.size && ` • ${formatBytes(doc.size)}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Cached Dagstukkies */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Gestoor Dagstukkies</span>
                  <Badge variant="secondary" className="text-xs">{cachedDagstukkies.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {cachedDagstukkies.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">
                    Geen dagstukkies gestoor nie
                  </p>
                ) : (
                  <ScrollArea className="h-[150px] sm:h-[200px]">
                    <div className="space-y-2">
                      {cachedDagstukkies.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">{item.titel}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.datum} • Gestoor: {formatTime(item.cachedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="space-y-4">
            {/* Conflict Resolution Strategy */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="break-words">Konflik Strategie</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm break-words">
                  Kies hoe konflikte hanteer word
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-3 sm:px-6">
                <Select
                  value={conflictStrategy}
                  onValueChange={(value) => setConflictStrategy(value as ConflictResolutionStrategy)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Kies strategie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_wins">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 flex-shrink-0" />
                        <span>Kliënt Wen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="server_wins">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 flex-shrink-0" />
                        <span>Bediener Wen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>Handmatig</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="merge">
                      <div className="flex items-center gap-2">
                        <Merge className="h-4 w-4 flex-shrink-0" />
                        <span>Saamvoeg</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    {getStrategyDescription(conflictStrategy)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sync Statistics */}
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Sink. Statistieke</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Totaal Gesink.</p>
                    <p className="text-lg sm:text-2xl font-bold">{syncStats.totalSynced}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Totaal Misluk</p>
                    <p className="text-lg sm:text-2xl font-bold">{syncStats.totalFailed}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Laaste Sink.</p>
                    <p className="text-sm sm:text-lg font-medium truncate">
                      {syncStats.lastSyncTime ? formatTime(syncStats.lastSyncTime) : 'Nooit'}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Gem. Duur</p>
                    <p className="text-sm sm:text-lg font-medium">
                      {syncStats.averageSyncDuration 
                        ? `${Math.round(syncStats.averageSyncDuration / 1000)}s`
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clear All Data */}
            <Card className="border-red-200">
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="text-red-600 text-base sm:text-lg">Gevaar Sone</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full text-xs sm:text-sm">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Verwyder Alle Van-lyn-af Data</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base sm:text-lg">Is jy seker?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Dit sal alle van-lyn-af data permanent verwyder, insluitend:
                        <ul className="list-disc list-inside mt-2 text-xs sm:text-sm">
                          <li>Alle items in die sinkronisering tou</li>
                          <li>Alle gestoor dokumente</li>
                          <li>Alle gestoor dagstukkies</li>
                          <li>Alle sinkronisering statistieke</li>
                        </ul>
                        Hierdie aksie kan nie ongedaan gemaak word nie.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Kanselleer</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={clearAllOfflineData}
                        className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                      >
                        Verwyder Alles
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
        onResolve={resolveConflict}
        getItemTypeLabel={getItemTypeLabel}
      />
    </div>
  );
};

// Queue Item Card Component
interface QueueItemCardProps {
  item: QueuedItem;
  onRetry: () => void;
  onRemove: () => void;
  formatTime: (timestamp: number) => string;
  formatNextRetry: (timestamp: number | undefined) => string;
  getItemTypeLabel: (type: string) => string;
  getItemStatusBadge: (status: string) => React.ReactNode;
}

const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  onRetry,
  onRemove,
  formatTime,
  formatNextRetry,
  getItemTypeLabel,
  getItemStatusBadge,
}) => {
  return (
    <div className={`p-3 sm:p-4 rounded-lg border ${
      item.status === 'failed' ? 'border-red-200 bg-red-50' :
      item.status === 'conflict' ? 'border-amber-200 bg-amber-50' :
      item.status === 'syncing' ? 'border-blue-200 bg-blue-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
            {getItemStatusBadge(item.status)}
            <Badge variant="outline" className="text-xs truncate max-w-[100px] sm:max-w-none">{getItemTypeLabel(item.type)}</Badge>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
            Geskep: {formatTime(item.timestamp)}
          </p>
          
          {item.status === 'failed' && (
            <div className="space-y-1">
              {item.error && (
                <p className="text-xs sm:text-sm text-red-600 break-words">
                  <AlertCircle className="h-3 w-3 inline mr-1 flex-shrink-0" />
                  {item.error}
                </p>
              )}
              <p className="text-xs text-gray-500 break-words">
                Pogings: {item.retries} • Volgende: {formatNextRetry(item.nextRetryAt)}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {item.status === 'failed' && (
            <Button variant="outline" size="sm" onClick={onRetry} className="h-8 w-8 p-0">
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Conflict Card Component
interface ConflictCardProps {
  conflict: SyncConflict;
  onResolve: () => void;
  formatTime: (timestamp: number) => string;
  getItemTypeLabel: (type: string) => string;
}

const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  onResolve,
  formatTime,
  getItemTypeLabel,
}) => {
  return (
    <div className="p-3 sm:p-4 rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Data Konflik</span>
            <Badge variant="outline" className="text-xs truncate max-w-[80px] sm:max-w-none">{getItemTypeLabel(conflict.type)}</Badge>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
            Ontdek: {formatTime(conflict.detectedAt)}
          </p>
          
          <p className="text-xs sm:text-sm text-amber-700 break-words">
            Veld: <code className="bg-amber-100 px-1 rounded text-xs break-all">{conflict.conflictField}</code>
          </p>
        </div>
        
        <Button variant="outline" size="sm" onClick={onResolve} className="flex-shrink-0 text-xs sm:text-sm">
          <span className="hidden sm:inline">Los Op</span>
          <span className="sm:hidden">Op</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// Conflict Resolution Dialog
interface ConflictResolutionDialogProps {
  conflict: SyncConflict | null;
  onClose: () => void;
  onResolve: (conflictId: string, resolution: 'client' | 'server' | 'merged', mergedData?: any) => Promise<void>;
  getItemTypeLabel: (type: string) => string;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflict,
  onClose,
  onResolve,
  getItemTypeLabel,
}) => {
  const [isResolving, setIsResolving] = useState(false);

  if (!conflict) return null;

  const handleResolve = async (resolution: 'client' | 'server' | 'merged') => {
    setIsResolving(true);
    try {
      await onResolve(conflict.id, resolution);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog open={!!conflict} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
            <span className="break-words">Los Data Konflik Op</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm break-words">
            Daar is 'n verskil tussen jou van-lyn-af data en die bediener data.
            Kies watter weergawe om te behou.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-4">
          {/* Client Data */}
          <div className="p-3 sm:p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <h4 className="font-medium text-blue-700 text-sm sm:text-base">Jou Data</h4>
            </div>
            <pre className="text-xs bg-white p-2 sm:p-3 rounded overflow-auto max-h-32 sm:max-h-48 break-all whitespace-pre-wrap">
              {JSON.stringify(conflict.clientData, null, 2)}
            </pre>
          </div>

          {/* Server Data */}
          <div className="p-3 sm:p-4 rounded-lg border-2 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <h4 className="font-medium text-green-700 text-sm sm:text-base">Bediener Data</h4>
            </div>
            <pre className="text-xs bg-white p-2 sm:p-3 rounded overflow-auto max-h-32 sm:max-h-48 break-all whitespace-pre-wrap">
              {JSON.stringify(conflict.serverData, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleResolve('server')}
            disabled={isResolving}
            className="w-full sm:flex-1 text-xs sm:text-sm"
          >
            <Server className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Bediener</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleResolve('merged')}
            disabled={isResolving}
            className="w-full sm:flex-1 text-xs sm:text-sm"
          >
            <Merge className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Saamvoeg</span>
          </Button>
          <Button
            onClick={() => handleResolve('client')}
            disabled={isResolving}
            className="w-full sm:flex-1 text-xs sm:text-sm"
          >
            {isResolving ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin flex-shrink-0" />
            ) : (
              <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            )}
            <span className="truncate">My Data</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfflineQueueManager;
