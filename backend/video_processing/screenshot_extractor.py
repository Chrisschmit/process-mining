#!/usr/bin/env python3

import logging
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from .models import VideoEvent, EventType


@dataclass
class ScreenshotConfig:
    """Configuration for screenshot extraction."""
    image_quality: int = 2  # 1-31 for JPEG, lower is better
    image_format: str = "jpg"  # jpg or png
    max_concurrent_extractions: int = 4
    timeout_seconds: int = 30
    screenshot_subdir: str = "screenshots"
    dedup_threshold_ms: int = 500  # Merge screenshots within 500ms
    fast_seek: bool = True  # Use fast seek before accurate seek


class ScreenshotExtractor:
    """
    Handles extraction of screenshots from video at specific timestamps
    corresponding to detected events.
    """

    def __init__(self, config: Optional[ScreenshotConfig] = None):
        """
        Initialize screenshot extractor.

        Args:
            config: Configuration object for extraction settings
        """
        self.config = config or ScreenshotConfig()
        self.logger = logging.getLogger(__name__)
        self._semaphore = threading.Semaphore(self.config.max_concurrent_extractions)

    def extract_event_screenshots(
        self, 
        video_path: str, 
        events: List[VideoEvent], 
        session_dir: str
    ) -> List[VideoEvent]:
        """
        Extract screenshots for all non-transcript events and update event objects
        with screenshot paths.

        Args:
            video_path: Path to the source video file
            events: List of VideoEvent objects to extract screenshots for
            session_dir: Session directory to save screenshots

        Returns:
            Updated list of VideoEvent objects with screenshot_path populated
        """
        if not events:
            self.logger.info("📸 No events to extract screenshots for")
            return events

        # Filter out transcript events
        action_events = [e for e in events if e.event_type != EventType.TRANSCRIPT]
        
        if not action_events:
            self.logger.info("📸 No action events found for screenshot extraction")
            return events

        # Validate video path
        video_path_obj = self._sanitize_path(video_path)
        if not video_path_obj.exists():
            self.logger.error(f"Video file not found: {video_path}")
            return events

        # Get video duration for clamping
        video_duration_ms = self._get_video_duration_ms(str(video_path_obj))
        if video_duration_ms is None:
            self.logger.warning("Could not determine video duration, proceeding without clamping")
            video_duration_ms = float('inf')

        # Create screenshots directory
        screenshots_dir = Path(session_dir) / self.config.screenshot_subdir
        screenshots_dir.mkdir(exist_ok=True)

        self.logger.info(f"📸 Extracting screenshots for {len(action_events)} events...")

        # Extract unique, clamped timestamps
        extraction_tasks = self._prepare_extraction_tasks(
            action_events, video_duration_ms, screenshots_dir
        )

        if not extraction_tasks:
            self.logger.warning("No valid timestamps found for extraction")
            return events

        # Perform batch extraction with concurrency
        screenshot_results = self._batch_extract_screenshots(
            str(video_path_obj), extraction_tasks
        )

        # Update events with screenshot paths
        self._update_events_with_screenshots(action_events, screenshot_results)

        success_count = sum(1 for result in screenshot_results.values() if result)
        self.logger.info(f"📸 Screenshot extraction complete: {success_count}/{len(extraction_tasks)} successful")
        
        return events

    def _sanitize_path(self, path: str) -> Path:
        """Sanitize and validate file path."""
        try:
            return Path(path).resolve()
        except Exception as e:
            raise ValueError(f"Invalid path: {path}") from e

    def _validate_timestamp(self, timestamp_ms: int, max_duration_ms: float) -> Optional[float]:
        """Validate and clamp timestamp to video duration."""
        if not isinstance(timestamp_ms, (int, float)) or timestamp_ms < 0:
            return None
        
        # Clamp to video duration minus small epsilon to avoid EOF
        max_timestamp_ms = max_duration_ms - 100  # 100ms buffer
        clamped_ms = max(0, min(timestamp_ms, max_timestamp_ms))
        return clamped_ms / 1000.0

    def _deduplicate_timestamps(self, timestamps_ms: List[int]) -> List[int]:
        """Remove near-duplicate timestamps within threshold."""
        if not timestamps_ms:
            return []
        
        sorted_timestamps = sorted(set(timestamps_ms))
        deduplicated = [sorted_timestamps[0]]
        
        for ts in sorted_timestamps[1:]:
            if ts - deduplicated[-1] >= self.config.dedup_threshold_ms:
                deduplicated.append(ts)
        
        return deduplicated

    def _get_video_duration_ms(self, video_path: str) -> Optional[float]:
        """Get video duration in milliseconds using FFprobe with fallback methods."""
        try:
            # Try multiple methods for duration detection
            methods = [
                # Method 1: Get duration from format metadata
                [
                    "ffprobe",
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_format",
                    str(video_path)
                ],
                # Method 2: Get duration from stream info
                [
                    "ffprobe",
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_streams",
                    "-select_streams", "v:0",
                    str(video_path)
                ],
                # Method 3: Get duration by counting frames (slower but more reliable)
                [
                    "ffprobe",
                    "-v", "quiet",
                    "-select_streams", "v:0",
                    "-count_frames",
                    "-show_entries", "stream=nb_read_frames,r_frame_rate",
                    "-print_format", "json",
                    str(video_path)
                ]
            ]
            
            for i, cmd in enumerate(methods):
                try:
                    result = subprocess.run(
                        cmd, 
                        capture_output=True, 
                        text=True, 
                        timeout=30 if i == 2 else 10  # Longer timeout for frame counting
                    )
                    
                    if result.returncode == 0:
                        import json
                        data = json.loads(result.stdout)
                        
                        if i == 0:  # Format method
                            duration_sec = data.get("format", {}).get("duration")
                            if duration_sec and duration_sec != "N/A":
                                return float(duration_sec) * 1000
                        
                        elif i == 1:  # Stream method
                            streams = data.get("streams", [])
                            if streams:
                                duration_sec = streams[0].get("duration")
                                if duration_sec and duration_sec != "N/A":
                                    return float(duration_sec) * 1000
                        
                        elif i == 2:  # Frame counting method
                            streams = data.get("streams", [])
                            if streams:
                                stream = streams[0]
                                frame_count = stream.get("nb_read_frames")
                                frame_rate = stream.get("r_frame_rate")
                                
                                if frame_count and frame_rate:
                                    # Parse frame rate (e.g., "30/1" -> 30.0)
                                    if "/" in frame_rate:
                                        num, den = frame_rate.split("/")
                                        fps = float(num) / float(den)
                                    else:
                                        fps = float(frame_rate)
                                    
                                    duration_sec = int(frame_count) / fps
                                    return duration_sec * 1000
                    
                except subprocess.TimeoutExpired:
                    self.logger.warning(f"Timeout on duration method {i+1}")
                    continue
                except Exception as e:
                    self.logger.warning(f"Duration method {i+1} failed: {e}")
                    continue
            
            self.logger.warning("All duration detection methods failed")
            return None
            
        except Exception as e:
            self.logger.error(f"Critical error in duration detection: {e}")
            return None

    def _prepare_extraction_tasks(
        self, 
        events: List[VideoEvent], 
        video_duration_ms: float, 
        screenshots_dir: Path
    ) -> Dict[int, Tuple[float, Path, int]]:
        """
        Prepare extraction tasks with deduplicated and clamped timestamps.
        
        Returns:
            Dict mapping original timestamp_ms to (timestamp_sec, output_path, event_index)
        """
        # Collect valid timestamps with their event indices
        timestamp_to_events = {}
        for i, event in enumerate(events):
            if event.timestamp_ms is not None:
                timestamp_to_events.setdefault(event.timestamp_ms, []).append(i)
        
        # Deduplicate timestamps
        unique_timestamps = self._deduplicate_timestamps(list(timestamp_to_events.keys()))
        
        extraction_tasks = {}
        for timestamp_ms in unique_timestamps:
            timestamp_sec = self._validate_timestamp(timestamp_ms, video_duration_ms)
            if timestamp_sec is not None:
                # Use first event index for filename
                first_event_idx = timestamp_to_events[timestamp_ms][0]
                filename = f"event_{first_event_idx+1:03d}_{timestamp_ms}ms.{self.config.image_format}"
                output_path = screenshots_dir / filename
                
                extraction_tasks[timestamp_ms] = (timestamp_sec, output_path, first_event_idx)
        
        return extraction_tasks

    def _build_ffmpeg_command(self, video_path: str, timestamp_sec: float, output_path: Path) -> List[str]:
        """Build FFmpeg command with VP8/WebM compatibility fixes."""
        cmd = ["ffmpeg"]
        
        # Fast seek for performance (optional)
        if self.config.fast_seek and timestamp_sec > 10:  # Only for seeks > 10s
            cmd.extend(["-ss", str(max(0, timestamp_sec - 5))])  # Fast seek to ~5s before
        
        cmd.extend([
            "-i", str(video_path),  # Input
            "-ss", str(timestamp_sec),  # Accurate seek
            "-frames:v", "1",  # One frame
        ])
        
        # VP8/WebM compatibility fixes
        cmd.extend([
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",  # Ensure even dimensions for encoder
            "-pix_fmt", "yuv420p",  # Force compatible pixel format
            "-strict", "unofficial",  # Allow non-standard YUV range
        ])
        
        # Format-aware quality settings  
        if self.config.image_format.lower() == "jpg":
            cmd.extend([
                "-q:v", str(self.config.image_quality),
                "-huffman", "optimal"  # Better JPEG compression
            ])
        elif self.config.image_format.lower() == "png":
            cmd.extend([
                "-compression_level", str(min(9, self.config.image_quality)),
                "-pix_fmt", "rgba"  # PNG with alpha support
            ])
        
        cmd.extend([
            "-y",  # Overwrite
            str(output_path)
        ])
        
        return cmd

    def _extract_single_screenshot(self, video_path: str, timestamp_sec: float, output_path: Path) -> bool:
        """
        Extract a single screenshot using FFmpeg.
        
        Returns:
            True if successful, False otherwise
        """
        with self._semaphore:  # Rate limiting
            try:
                cmd = self._build_ffmpeg_command(video_path, timestamp_sec, output_path)
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=self.config.timeout_seconds
                )

                if result.returncode == 0 and output_path.exists():
                    return True
                else:
                    self.logger.warning(
                        f"FFmpeg failed for {output_path.name}: {result.stderr.strip()}"
                    )
                    return False

            except subprocess.TimeoutExpired:
                self.logger.warning(f"Timeout extracting {output_path.name}")
                return False
            except Exception as e:
                self.logger.error(f"Error extracting {output_path.name}: {e}")
                return False

    def _batch_extract_screenshots(
        self, 
        video_path: str, 
        extraction_tasks: Dict[int, Tuple[float, Path, int]]
    ) -> Dict[int, Optional[str]]:
        """
        Extract screenshots concurrently.
        
        Returns:
            Dict mapping timestamp_ms to screenshot path (or None if failed)
        """
        results = {}
        
        with ThreadPoolExecutor(max_workers=self.config.max_concurrent_extractions) as executor:
            # Submit all tasks
            future_to_timestamp = {}
            for timestamp_ms, (timestamp_sec, output_path, _) in extraction_tasks.items():
                future = executor.submit(
                    self._extract_single_screenshot, 
                    video_path, 
                    timestamp_sec, 
                    output_path
                )
                future_to_timestamp[future] = timestamp_ms
            
            # Collect results
            for future in as_completed(future_to_timestamp):
                timestamp_ms = future_to_timestamp[future]
                try:
                    success = future.result()
                    if success:
                        _, output_path, _ = extraction_tasks[timestamp_ms]
                        # Store relative path
                        results[timestamp_ms] = output_path.name
                    else:
                        results[timestamp_ms] = None
                except Exception as e:
                    self.logger.error(f"Task failed for timestamp {timestamp_ms}: {e}")
                    results[timestamp_ms] = None
        
        return results

    def _update_events_with_screenshots(
        self, 
        events: List[VideoEvent], 
        screenshot_results: Dict[int, Optional[str]]
    ) -> None:
        """Update event objects with screenshot paths."""
        for event in events:
            if event.timestamp_ms in screenshot_results:
                screenshot_path = screenshot_results[event.timestamp_ms]
                if screenshot_path:
                    # Store relative path from screenshots directory
                    event.screenshot_path = f"{self.config.screenshot_subdir}/{screenshot_path}"

