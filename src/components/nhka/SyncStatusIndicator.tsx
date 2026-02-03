import React from 'react';
import { useOffline, SyncStatus } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface SyncStatusIndicatorProps {
  onManageQueue?: () => void;
  compact?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  onManageQueue,
  compact = false 
}) => {
  const {
    isOnline,
    syncStatus,
    syncProgress,
    pendingCount,
    failedCount,
    conflictCount,
    syncStats,
    syncNow,
  } = useOffline();

  const totalPending = pendingCount + failedCount + conflictCount;

  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-gray-500" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Cloud className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = (): string => {
    if (!isOnline) return 'Van-lyn-af';
    
    switch (syncStatus) {
      case 'syncing':
        return 'Sinkroniseer...';
      case 'success':
        return 'Gesinkroniseer';
      case 'error':
        return 'Sinkronisering misluk';
      case 'conflict':
        return 'Konflikte gevind';
      default:
        return 'Aanlyn';
    }
  };

  const getStatusColor = (): string => {
    if (!isOnline) return 'bg-gray-100 text-gray-700 border-gray-300';
    
    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'conflict':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Nooit';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Nou net';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min gelede`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} uur gelede`;
    return new Date(timestamp).toLocaleDateString('af-ZA');
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`relative px-2 py-1 h-8 ${!isOnline ? 'opacity-75' : ''}`}
          >
            {getStatusIcon()}
            {totalPending > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {totalPending > 9 ? '9+' : totalPending}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <SyncStatusDetails 
            onManageQueue={onManageQueue}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {syncStatus === 'syncing' && (
        <div className="flex-1 max-w-[100px]">
          <Progress value={syncProgress} className="h-1.5" />
        </div>
      )}
      
      {totalPending > 0 && syncStatus !== 'syncing' && (
        <Badge variant="secondary" className="ml-1">
          {totalPending} wagend
        </Badge>
      )}
      
      {isOnline && totalPending > 0 && syncStatus !== 'syncing' && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2"
          onClick={() => syncNow()}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sinkroniseer
        </Button>
      )}
    </div>
  );
};

// Detailed sync status for popover
const SyncStatusDetails: React.FC<{ onManageQueue?: () => void }> = ({ onManageQueue }) => {
  const {
    isOnline,
    syncStatus,
    syncProgress,
    pendingCount,
    failedCount,
    conflictCount,
    syncStats,
    syncNow,
  } = useOffline();

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Nooit';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Nou net';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min gelede`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} uur gelede`;
    return new Date(timestamp).toLocaleDateString('af-ZA');
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Cloud className="h-5 w-5 text-green-500" />
          ) : (
            <CloudOff className="h-5 w-5 text-gray-500" />
          )}
          <span className="font-medium">
            {isOnline ? 'Aanlyn' : 'Van-lyn-af'}
          </span>
        </div>
        {syncStatus === 'syncing' && (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Sync Progress */}
      {syncStatus === 'syncing' && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Sinkroniseer...</span>
            <span>{Math.round(syncProgress)}%</span>
          </div>
          <Progress value={syncProgress} className="h-2" />
        </div>
      )}

      {/* Queue Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Tou Status</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-600">{pendingCount}</div>
            <div className="text-xs text-blue-600">Wagend</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="text-lg font-bold text-red-600">{failedCount}</div>
            <div className="text-xs text-red-600">Misluk</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-2">
            <div className="text-lg font-bold text-amber-600">{conflictCount}</div>
            <div className="text-xs text-amber-600">Konflikte</div>
          </div>
        </div>
      </div>

      {/* Sync Stats */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Laaste sinkronisering
          </span>
          <span>{formatTime(syncStats.lastSyncTime)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Totaal gesinkroniseer
          </span>
          <span>{syncStats.totalSynced}</span>
        </div>
        {syncStats.totalFailed > 0 && (
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Totaal misluk
            </span>
            <span>{syncStats.totalFailed}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => syncNow()}
          disabled={!isOnline || syncStatus === 'syncing' || (pendingCount + failedCount) === 0}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          Sinkroniseer Nou
        </Button>
        {onManageQueue && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageQueue}
          >
            Bestuur
          </Button>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
