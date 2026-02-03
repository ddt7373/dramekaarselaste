import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  Mail, 
  User, 
  CheckCircle2,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface OnboardingGidsProps {
  onComplete: () => void;
  onMenuToggle: () => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

const OnboardingGids: React.FC<OnboardingGidsProps> = ({ onComplete, onMenuToggle }) => {
  const { currentUser } = useNHKA();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const steps: Step[] = [
    {
      id: 1,
      title: 'Welkom by Dra Mekaar!',
      description: 'Hierdie kort gids sal jou wys hoe om die app te gebruik. Kom ons begin!',
      targetSelector: '',
      position: 'bottom',
      icon: <Sparkles className="w-8 h-8 text-[#D4A84B]" />
    },
    {
      id: 2,
      title: 'Die "Meer" Kieslys',
      description: 'Druk op die "Meer" knoppie om die navigasie-kieslys oop te maak. Hier vind jy al die funksies soos jou wyk, betalings, dokumente, en nog baie meer!',
      targetSelector: '[aria-label="Toggle menu"]',
      position: 'bottom',
      icon: <Menu className="w-8 h-8 text-[#D4A84B]" />,
      action: onMenuToggle,
      actionLabel: 'Probeer dit nou!'
    },
    {
      id: 3,
      title: 'Boodskappe',
      description: 'Hier kan jy boodskappe stuur en ontvang van ander gemeentelede en leiers. \'n Rooi nommer wys hoeveel ongelese boodskappe jy het.',
      targetSelector: '[title="Boodskappe"]',
      position: 'bottom',
      icon: <Mail className="w-8 h-8 text-[#D4A84B]" />
    },
    {
      id: 4,
      title: 'Jou Profiel',
      description: 'Druk op jou naam of die gebruiker-ikoon om jou profiel te sien, jou instellings te verander, of om uit te teken.',
      targetSelector: '.relative [class*="bg-white/10"]',
      position: 'bottom',
      icon: <User className="w-8 h-8 text-[#D4A84B]" />
    },
    {
      id: 5,
      title: 'Jy is gereed!',
      description: 'Jy weet nou hoe om die app te gebruik. Onthou, jy kan altyd die "Meer" kieslys gebruik om enige funksie te vind. Geniet dit!',
      targetSelector: '',
      position: 'bottom',
      icon: <CheckCircle2 className="w-8 h-8 text-green-500" />
    }
  ];

  // Update highlight position when step changes
  useEffect(() => {
    const step = steps[currentStep];
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });
      } else {
        setHighlightPosition(null);
      }
    } else {
      setHighlightPosition(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleAction = () => {
    const step = steps[currentStep];
    if (step.action) {
      step.action();
    }
  };

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Calculate tooltip position based on highlight
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightPosition) {
      // Center the tooltip for intro/outro steps
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const padding = 20;
    const tooltipWidth = 380;
    const tooltipHeight = 280;

    switch (step.position) {
      case 'bottom':
        return {
          position: 'fixed',
          top: highlightPosition.top + highlightPosition.height + padding,
          left: Math.max(16, Math.min(
            highlightPosition.left + highlightPosition.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - 16
          ))
        };
      case 'top':
        return {
          position: 'fixed',
          top: highlightPosition.top - tooltipHeight - padding,
          left: Math.max(16, Math.min(
            highlightPosition.left + highlightPosition.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - 16
          ))
        };
      case 'left':
        return {
          position: 'fixed',
          top: highlightPosition.top,
          left: highlightPosition.left - tooltipWidth - padding
        };
      case 'right':
        return {
          position: 'fixed',
          top: highlightPosition.top,
          left: highlightPosition.left + highlightPosition.width + padding
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  // Arrow component pointing to the target
  const Arrow = () => {
    if (!highlightPosition) return null;

    const arrowSize = 60;
    
    return (
      <div 
        className="fixed z-[10002] pointer-events-none animate-bounce"
        style={{
          top: highlightPosition.top + highlightPosition.height + 4,
          left: highlightPosition.left + highlightPosition.width / 2 - arrowSize / 2
        }}
      >
        <svg 
          width={arrowSize} 
          height={arrowSize} 
          viewBox="0 0 24 24" 
          fill="none"
          className="text-[#D4A84B] drop-shadow-lg"
        >
          <path 
            d="M12 4L12 16M12 4L6 10M12 4L18 10" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Dark overlay with cutout for highlighted element */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Highlighted area cutout */}
      {highlightPosition && (
        <>
          {/* Spotlight effect */}
          <div 
            className="absolute bg-transparent rounded-xl ring-4 ring-[#D4A84B] ring-offset-4 ring-offset-transparent z-[10001] transition-all duration-300 ease-out"
            style={{
              top: highlightPosition.top,
              left: highlightPosition.left,
              width: highlightPosition.width,
              height: highlightPosition.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px 10px rgba(212, 168, 75, 0.5)'
            }}
          />
          {/* Pulsing ring animation */}
          <div 
            className="absolute rounded-xl z-[10001] animate-ping"
            style={{
              top: highlightPosition.top,
              left: highlightPosition.left,
              width: highlightPosition.width,
              height: highlightPosition.height,
              border: '3px solid rgba(212, 168, 75, 0.6)'
            }}
          />
        </>
      )}

      {/* Arrow pointing to target */}
      <Arrow />

      {/* Tooltip/Card */}
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 w-[380px] max-w-[calc(100vw-32px)] z-[10003] animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={getTooltipStyle()}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Slaan oor"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-8 bg-[#D4A84B]' 
                  : index < currentStep 
                    ? 'w-2 bg-[#002855]' 
                    : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#002855]/10 flex items-center justify-center">
            {step.icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-[#002855] mb-3">
            {step.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Action button if available */}
        {step.action && step.actionLabel && (
          <button
            onClick={handleAction}
            className="w-full mb-4 px-4 py-3 bg-[#D4A84B]/20 text-[#D4A84B] rounded-xl font-semibold hover:bg-[#D4A84B]/30 transition-colors flex items-center justify-center gap-2"
          >
            <Menu className="w-5 h-5" />
            {step.actionLabel}
          </button>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          {!isFirstStep ? (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Terug</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#003d7a] transition-colors shadow-lg"
          >
            <span>{isLastStep ? 'Begin Gebruik' : 'Volgende'}</span>
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Skip link */}
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Slaan gids oor
          </button>
        )}
      </div>
    </div>
  );
};

// Hook to manage onboarding state
export const useOnboarding = (userId: string | null) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (userId && !hasChecked) {
      const storageKey = `nhka_onboarding_completed_${userId}`;
      const completed = localStorage.getItem(storageKey);
      
      if (!completed) {
        // Small delay to let the UI render first
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        return () => clearTimeout(timer);
      }
      setHasChecked(true);
    }
  }, [userId, hasChecked]);

  const completeOnboarding = () => {
    if (userId) {
      const storageKey = `nhka_onboarding_completed_${userId}`;
      localStorage.setItem(storageKey, 'true');
    }
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    if (userId) {
      const storageKey = `nhka_onboarding_completed_${userId}`;
      localStorage.removeItem(storageKey);
      setShowOnboarding(true);
    }
  };

  return {
    showOnboarding,
    completeOnboarding,
    resetOnboarding
  };
};

export default OnboardingGids;
