import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';

const AudioPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Fallback for missing audio source
    if (!src || src === '/audio/placeholder.mp3') {
        return;
    }

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [src]);
  
  if (!src || src === '/audio/placeholder.mp3') {
    return (
        <div className="p-4 text-center rounded-lg bg-red-900/50 border border-red-500 text-white">
            <p><strong>Audio no disponible.</strong></p>
            <p className="text-sm">Esta es una demostración. El audio se conectará en el futuro.</p>
        </div>
    );
  }

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value) => {
    const audio = audioRef.current;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time) => {
    if (time && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const seconds = Math.floor(time % 60);
      const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${formatMinutes}:${formatSeconds}`;
    }
    return '00:00';
  };

  return (
    <div className="p-4 rounded-lg glass-card space-y-4">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)}></audio>
      <div className="flex items-center space-x-4">
        <Button onClick={togglePlayPause} size="icon" className="bg-vita-orange">
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <div className="flex-grow flex items-center space-x-2">
          <span className="text-sm text-vita-white w-12">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSliderChange}
          />
          <span className="text-sm text-vita-muted-foreground w-12">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;