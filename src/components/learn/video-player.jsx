"use client";

import * as React from "react";
import { Lock, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SEEK_TOLERANCE_SECONDS } from "@/lib/constants";
import { useWatchThreshold } from "@/hooks/use-watch-threshold";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Custom HTML5 video player with sequential-watch enforcement.
 *
 * Watched time is counted in media seconds from `timeupdate` deltas, so a
 * 2x playback rate reaches the threshold in half the wall-clock time. If the
 * product needs wall-clock verification, the backend should compare the
 * timestamped playback events it receives rather than trust this counter.
 * All of this is UI-level guidance only; the backend owns unlock decisions.
 */
export function VideoPlayer({ src, title, maxPosition, startAt, completed, nominalDuration, onPlayback, onThresholdReached, onEnded }) {
  const videoRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [current, setCurrent] = React.useState(startAt);
  // Render-safe mirror of allowedMaxRef (refs must not be read during render).
  const [allowedMaxState, setAllowedMax] = React.useState(maxPosition);
  const allowedMax = Math.max(allowedMaxState, maxPosition);
  const [duration, setDuration] = React.useState(0);
  const [buffering, setBuffering] = React.useState(true);
  const [error, setError] = React.useState();
  const [seekBlocked, setSeekBlocked] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);

  // Mutable tracking refs so event handlers never see stale state.
  const allowedMaxRef = React.useRef(maxPosition);
  const lastTimeRef = React.useRef(startAt);
  const pendingDeltaRef = React.useRef(0);
  const lastFlushRef = React.useRef(0);
  const thresholdFiredRef = React.useRef(false);
  const threshold = useWatchThreshold();
  const thresholdRef = React.useRef(threshold);
  React.useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);
  const hideTimer = React.useRef(undefined);

  React.useEffect(() => {
    allowedMaxRef.current = Math.max(allowedMaxRef.current, maxPosition);
  }, [maxPosition]);

  // The parent keys this component by lesson, so a lesson change remounts it
  // and every ref/state above starts fresh.
  const effectiveDuration = duration || nominalDuration;
  const watchedPercent = effectiveDuration ? Math.min(100, Math.round((Math.max(allowedMax, current) / effectiveDuration) * 100)) : 0;
  const thresholdReached = completed || (effectiveDuration > 0 && Math.max(allowedMax, current) / effectiveDuration >= threshold);

  // Keep the latest callback in a ref so `flush` stays referentially stable.
  // Parents pass inline handlers; depending on them would re-run the unmount
  // flush effect on every render and loop through the progress store.
  const onPlaybackRef = React.useRef(onPlayback);
  React.useEffect(() => {
    onPlaybackRef.current = onPlayback;
  }, [onPlayback]);

  const flush = React.useCallback(
    (force = false) => {
      const v = videoRef.current;
      if (!v) return;
      const now = performance.now();
      if (!force && now - lastFlushRef.current < 1000) return;
      lastFlushRef.current = now;
      const delta = pendingDeltaRef.current;
      pendingDeltaRef.current = 0;
      // Nothing new to record (e.g. unmount before playback started).
      if (force && delta === 0 && v.currentTime === 0) return;
      onPlaybackRef.current({ position: v.currentTime, delta, duration: v.duration || nominalDuration });
    },
    [nominalDuration],
  );

  const handleLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setBuffering(false);
    if (!completed && startAt > 0 && startAt < v.duration - 1) {
      v.currentTime = startAt;
      lastTimeRef.current = startAt;
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    const delta = t - lastTimeRef.current;
    // Deltas larger than the tolerance mean a seek happened, not playback.
    if (delta > 0 && delta <= SEEK_TOLERANCE_SECONDS) pendingDeltaRef.current += delta;
    lastTimeRef.current = t;
    if (t > allowedMaxRef.current) {
      allowedMaxRef.current = t;
      setAllowedMax(t);
    }
    setCurrent(t);
    const d = v.duration || nominalDuration;
    if (!thresholdFiredRef.current && d && allowedMaxRef.current / d >= thresholdRef.current) {
      thresholdFiredRef.current = true;
      flush(true);
      onThresholdReached?.();
    } else {
      flush();
    }
  };

  const handleSeeking = () => {
    const v = videoRef.current;
    if (!v || completed) return;
    const limit = allowedMaxRef.current + SEEK_TOLERANCE_SECONDS;
    if (v.currentTime > limit) {
      v.currentTime = Math.max(0, allowedMaxRef.current);
      lastTimeRef.current = v.currentTime;
      setSeekBlocked(true);
      setTimeout(() => setSeekBlocked(false), 1800);
    } else {
      lastTimeRef.current = v.currentTime;
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setError("Playback could not start. Check your connection and try again."));
    else v.pause();
  };

  const seekTo = (value) => {
    const v = videoRef.current;
    if (!v) return;
    const target = completed ? value : Math.min(value, allowedMaxRef.current + SEEK_TOLERANCE_SECONDS);
    if (!completed && value > allowedMaxRef.current + SEEK_TOLERANCE_SECONDS) {
      setSeekBlocked(true);
      setTimeout(() => setSeekBlocked(false), 1800);
    }
    v.currentTime = target;
    lastTimeRef.current = target;
    setCurrent(target);
  };

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {}
  };

  React.useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = speed;
      v.volume = volume;
      v.muted = muted;
    }
  }, [speed, volume, muted]);

  // Flush any pending seconds when unmounting / switching lessons.
  React.useEffect(() => () => flush(true), [flush, src]);

  const bump = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => playing && setShowControls(false), 2500);
  };

  const onKey = (e) => {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowLeft") seekTo(Math.max(0, current - 5));
    else if (e.key === "ArrowRight") seekTo(current + 5);
    else if (e.key === "m") setMuted((m) => !m);
    else if (e.key === "f") void toggleFullscreen();
  };

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={bump}
      onTouchStart={bump}
      className="group relative w-full aspect-video overflow-hidden rounded-xl bg-black text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Video player: ${title}`}
    >
      <video
        key={src}
        ref={videoRef}
        data-testid="video-player"
        className="h-full w-full"
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoaded}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onPlay={() => {
          setPlaying(true);
          bump();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
          flush(true);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onEnded={() => {
          flush(true);
          onEnded?.();
        }}
        onClick={togglePlay}
      >
        {/* Primary CDN clip, then a local fallback so the player works offline. */}
        <source src={src} />
        <source
          src="/media/sample-lesson.webm"
          type="video/webm"
          onError={() => {
            setBuffering(false);
            setError("This video could not be loaded. Check your connection and try again.");
          }}
        />
      </video>

      {/* Centre state overlays */}
      {!playing && !error && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center cursor-pointer" aria-label="Play">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-panel transition-transform hover:scale-105">
            {current > 0 && current >= effectiveDuration - 0.5 ? <RotateCcw className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
          </span>
        </button>
      )}
      {buffering && playing && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm bg-black/80">
          <p className="max-w-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="text-primary"
            onClick={() => {
              setError(undefined);
              videoRef.current?.load();
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {seekBlocked && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <Lock className="h-3.5 w-3.5 text-accent" /> Skipping ahead is disabled until you have watched this part
        </div>
      )}

      <div className="absolute right-3 top-3 flex gap-2 pointer-events-none">
        <Badge
          variant={thresholdReached ? "success" : "outline"}
          className={cn("backdrop-blur", !thresholdReached && "bg-black/50 text-white border-white/20")}
        >
          {thresholdReached ? "Watched" : `${watchedPercent}% watched`}
        </Badge>
      </div>

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-2 pt-10 transition-opacity",
          showControls || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="relative">
          {/* Allowed-range marker */}
          {!completed && effectiveDuration > 0 && (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-0 h-1.5 top-[7px] rounded-full bg-white/15"
              style={{ width: `${Math.min(100, (allowedMax / effectiveDuration) * 100)}%` }}
            />
          )}
          <Slider
            value={[Math.min(current, effectiveDuration || current)]}
            max={effectiveDuration || 1}
            step={0.1}
            onValueChange={([v]) => seekTo(v)}
            aria-label="Seek"
            className="relative z-10"
          />
        </div>
        <div className="mt-1.5 flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
          </Button>
          <div className="hidden sm:block w-20">
            <Slider
              value={[muted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={([v]) => {
                setVolume(v);
                setMuted(v === 0);
              }}
              aria-label="Volume"
            />
          </div>
          <span className="ml-1 text-xs tabular-nums">
            {formatClock(current)} / {formatClock(effectiveDuration)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-white/15 cursor-pointer"
                  aria-label="Playback speed"
                >
                  {speed}x
                </button>
              </TooltipTrigger>
              <TooltipContent>Playback speed</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/15 hover:text-white"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              {fullscreen ? <Minimize /> : <Maximize />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
