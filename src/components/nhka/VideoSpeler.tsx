import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  Loader2,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoSpelerProps {
  videoUrl: string;
  lesId: string;
  kursusId: string;
  lesTitel: string;
  onComplete: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  savedPosition?: number;
  autoAdvance?: boolean;
}

const VideoSpeler: React.FC<VideoSpelerProps> = ({
  videoUrl,
  lesId,
  kursusId,
  lesTitel,
  onComplete,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  savedPosition = 0,
  autoAdvance = true
}) => {
  const { currentUser } = useNHKA();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [countdownToNext, setCountdownToNext] = useState(5);
  const [buffered, setBuffered] = useState(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset error when URL changes
  useEffect(() => {
    setError(null);
    setIsLoading(true);
    setShowCompletionOverlay(false);
  }, [videoUrl]);

  // Format time to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse video URL to get embed or direct URL
  const getVideoSource = useCallback((): { type: 'direct' | 'youtube' | 'vimeo' | 'iframe'; url: string } => {
    if (!videoUrl) return { type: 'direct', url: '' };

    const trimmedUrl = String(videoUrl).trim();

    // 1. Raw iframe or any HTML string
    // If it contains <, it's definitely an embed or HTML snippet, not a valid direct URL
    if (trimmedUrl.includes('<')) {
      return { type: 'iframe', url: trimmedUrl };
    }

    // 2. Synthesia Link (direct sharing link)
    if (trimmedUrl.includes('synthesia.io')) {
      let videoId = '';
      if (trimmedUrl.includes('/videos/')) {
        videoId = trimmedUrl.split('/videos/')[1]?.split(/[?#]/)[0];
      }
      if (videoId) {
        return {
          type: 'iframe',
          url: `<iframe src="https://share.synthesia.io/embeds/videos/${videoId}" loading="lazy" title="Synthesia video player" allowfullscreen allow="encrypted-media; fullscreen; microphone;" style="width: 100%; height: 100%; border: none;"></iframe>`
        };
      }
    }

    // 3. YouTube
    if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
      let videoId = '';
      if (trimmedUrl.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(trimmedUrl.split('?')[1]);
        videoId = urlParams.get('v') || '';
      } else if (trimmedUrl.includes('youtu.be/')) {
        videoId = trimmedUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (trimmedUrl.includes('youtube.com/embed/')) {
        videoId = trimmedUrl.split('embed/')[1]?.split('?')[0] || '';
      }
      if (videoId) {
        return { type: 'youtube', url: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0` };
      }
    }

    // 4. Vimeo
    if (trimmedUrl.includes('vimeo.com')) {
      const videoId = trimmedUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
      if (videoId && !isNaN(Number(videoId.charAt(0)))) {
        return { type: 'vimeo', url: `https://player.vimeo.com/video/${videoId}` };
      }
    }

    // 5. Direct video URL
    return { type: 'direct', url: trimmedUrl };
  }, [videoUrl]);

  const videoSource = getVideoSource();

  // Save progress to database
  const saveProgress = useCallback(async (position: number, videoDuration: number, completed: boolean = false) => {
    if (!currentUser || !lesId || !kursusId) return;

    try {
      await supabase
        .from('lms_vordering')
        .upsert({
          gebruiker_id: currentUser.id,
          kursus_id: kursusId,
          les_id: lesId,
          video_posisie: Math.floor(position),
          video_duur: Math.floor(videoDuration),
          laaste_gekyk: new Date().toISOString(),
          status: completed ? 'voltooi' : 'in_vordering',
          ...(completed && { voltooi_datum: new Date().toISOString() })
        }, {
          onConflict: 'gebruiker_id,les_id'
        });
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  }, [currentUser, lesId, kursusId]);

  // Load saved position on mount
  useEffect(() => {
    const loadSavedPosition = async () => {
      if (!currentUser || !lesId) return;

      try {
        const { data } = await supabase
          .from('lms_vordering')
          .select('video_posisie, status')
          .eq('gebruiker_id', currentUser.id)
          .eq('les_id', lesId)
          .maybeSingle();

        if (data) {
          if (data.status === 'voltooi') {
            setIsCompleted(true);
          }
          if (data.video_posisie && videoRef.current) {
            videoRef.current.currentTime = data.video_posisie;
            setCurrentTime(data.video_posisie);
          }
        }
      } catch (error) {
        console.error('Error loading saved position:', error);
      }
    };

    if (videoSource.type === 'direct') {
      loadSavedPosition();
    }
  }, [currentUser, lesId, videoSource.type]);

  // Set up progress save interval
  useEffect(() => {
    if (isPlaying && videoSource.type === 'direct') {
      progressSaveInterval.current = setInterval(() => {
        if (videoRef.current) {
          saveProgress(videoRef.current.currentTime, videoRef.current.duration);
        }
      }, 10000); // Save every 10 seconds
    }

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [isPlaying, saveProgress, videoSource.type]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Countdown timer for auto-advance
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    if (showCompletionOverlay && autoAdvance && hasNext && countdownToNext > 0) {
      countdownInterval = setInterval(() => {
        setCountdownToNext(prev => {
          if (prev <= 1) {
            if (onNext) onNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showCompletionOverlay, autoAdvance, hasNext, countdownToNext, onNext]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);

      // Restore saved position
      if (savedPosition > 0 && savedPosition < videoRef.current.duration - 5) {
        videoRef.current.currentTime = savedPosition;
        setCurrentTime(savedPosition);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    setIsCompleted(true);
    setShowCompletionOverlay(true);
    setCountdownToNext(5);

    // Save completion
    if (videoRef.current) {
      await saveProgress(videoRef.current.duration, videoRef.current.duration, true);
    }

    onComplete();

    toast({
      title: 'Video voltooi!',
      description: hasNext ? 'Gaan outomaties na die volgende les...' : 'Jy het hierdie les voltooi.',
    });
  };

  const handleError = () => {
    setError('Kon nie video laai nie. Probeer asseblief later weer.');
    setIsLoading(false);
  };

  const handleWaiting = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);

  // Control handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const replayVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setShowCompletionOverlay(false);
      setIsCompleted(false);
    }
  };

  const cancelAutoAdvance = () => {
    setCountdownToNext(0);
    setShowCompletionOverlay(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, currentTime, duration]);

  // Render YouTube/Vimeo/Iframe embed
  if (videoSource.type === 'youtube' || videoSource.type === 'vimeo' || videoSource.type === 'iframe') {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg mx-auto relative z-[60]" style={{ maxWidth: '800px' }}>
          {videoSource.type === 'iframe' ? (
            <div
              className="w-full h-full flex items-center justify-center [&_iframe]:w-full [&_iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: videoSource.url }}
            />
          ) : (
            // Only render iframe if URL doesn't contain HTML tags
            videoSource.url && !videoSource.url.includes('<') ? (
              <iframe
                src={videoSource.url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>Invalid video URL format</p>
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasPrevious && (
              <Button variant="outline" size="sm" onClick={onPrevious}>
                <SkipBack className="w-4 h-4 mr-1" />
                Vorige
              </Button>
            )}
          </div>

          <Button
            className="bg-[#D4A84B] hover:bg-[#C49A3B]"
            onClick={onComplete}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Merk as Voltooi
          </Button>

          <div className="flex items-center gap-2">
            {hasNext && (
              <Button variant="outline" size="sm" onClick={onNext}>
                Volgende
                <SkipForward className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center">
          Nota: Vir YouTube, Vimeo of embedded video's, merk asseblief self die les as voltooi wanneer jy klaar gekyk het.
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Probeer Weer
          </Button>
        </div>
      </div>
    );
  }

  // No video URL
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Video sal binnekort beskikbaar wees</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden shadow-lg group aspect-video mx-auto z-[60]`}
      style={{ maxWidth: '800px' }}
    >
      {/* Video Element - ONLY render if it's a real direct URL and not an HTML snippet */}
      {videoSource.type === 'direct' && videoSource.url && !videoSource.url.includes('<') && (
        <video
          ref={videoRef}
          src={videoSource.url}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
      )}

      {/* Completion Overlay */}
      {showCompletionOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center text-white p-8 max-w-md">
            <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-400" />
            <h3 className="text-2xl font-bold mb-2">Video Voltooi!</h3>
            <p className="text-gray-300 mb-6">{lesTitel}</p>

            {hasNext && autoAdvance && countdownToNext > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">
                  Volgende les begin in {countdownToNext} sekondes...
                </p>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-[#D4A84B] h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdownToNext / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={replayVideo} className="text-white border-white hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Kyk Weer
              </Button>

              {hasNext && (
                <>
                  {countdownToNext > 0 && (
                    <Button variant="ghost" onClick={cancelAutoAdvance} className="text-gray-400 hover:text-white">
                      Kanselleer
                    </Button>
                  )}
                  <Button onClick={onNext} className="bg-[#D4A84B] hover:bg-[#C49A3B]">
                    <SkipForward className="w-4 h-4 mr-2" />
                    Volgende Les
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause Center Button */}
      {!isPlaying && !showCompletionOverlay && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {/* Progress Bar */}
        <div className="mb-3 group/progress">
          <div className="relative h-1 group-hover/progress:h-2 transition-all bg-white/20 rounded-full cursor-pointer">
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            {/* Progress */}
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="absolute inset-0"
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 h-9 w-9"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {/* Skip Back */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20 h-9 w-9"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20 h-9 w-9"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-9 w-9"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs px-2"
                >
                  {playbackRate}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[80px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={playbackRate === rate ? 'bg-[#002855]/10' : ''}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-9 w-9"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={replayVideo}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Begin oor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-9 w-9"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {showControls && !isPlaying && !showCompletionOverlay && (
        <div className="absolute top-4 right-4 text-white/60 text-xs bg-black/50 px-3 py-2 rounded-lg">
          <div className="space-y-1">
            <div><kbd className="bg-white/20 px-1 rounded">Spasie</kbd> Speel/Pause</div>
            <div><kbd className="bg-white/20 px-1 rounded">←</kbd><kbd className="bg-white/20 px-1 rounded ml-1">→</kbd> Skip 10s</div>
            <div><kbd className="bg-white/20 px-1 rounded">F</kbd> Volskerm</div>
            <div><kbd className="bg-white/20 px-1 rounded">M</kbd> Demp</div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isCompleted && !showCompletionOverlay && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Voltooi
        </div>
      )}
    </div>
  );
};

export default VideoSpeler;
