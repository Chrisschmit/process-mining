import os
import csv
from typing import List
from subprocess import call, run, PIPE
from .models import VideoChunk


class SceneDetector:
    def __init__(self, threshold: float = 80.0):
        self.threshold = threshold

    def detect_scenes(
        self, video_path: str, output_dir: str = None
    ) -> List[VideoChunk]:
        """
        Detect scene changes in video using CLI approach and return list of video chunks

        Args:
            video_path: Path to input video file
            output_dir: Directory to save scene analysis (optional)

        Returns:
            List of VideoChunk objects with scene information
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Create output directory if provided
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        else:
            output_dir = os.path.dirname(video_path)

        # Store output_dir for later use
        self.output_dir = output_dir

        self.stats_file = os.path.join(output_dir, f"scene_detection_stats.csv")

        # Run scenedetect CLI command with stats only (no other outputs)
        print(f"Running scene detection with threshold {self.threshold}")
        cmd = [
            "scenedetect",
            "-i",
            video_path,
            "-s",
            self.stats_file,
            "detect-content",
            "-t",
            str(self.threshold),
        ]

        try:
            run(cmd, capture_output=True, text=True, check=True)
            print("Scene detection completed successfully")
        except Exception as e:
            print(f"Scene detection failed: {str(e)}")
            # Fallback: create single chunk for entire video
            return [
                VideoChunk(
                    chunk_id="chunk_0000",
                    start_time=0.0,
                    end_time=60.0,  # Default 60s duration
                    file_path=video_path,
                    scene_score=1.0,
                )
            ]

        # Parse the stats CSV file to get scene times
        chunks = []
        try:
            if os.path.exists(self.stats_file):
                chunks = self._parse_stats_file(self.stats_file, video_path)

            if not chunks:
                # Fallback if no scenes detected
                chunks = [
                    VideoChunk(
                        chunk_id="chunk_0000",
                        start_time=0.0,
                        end_time=60.0,
                        file_path=video_path,
                        scene_score=1.0,
                    )
                ]

        except Exception as e:
            print(f"Error parsing scene stats: {str(e)}")
            chunks = [
                VideoChunk(
                    chunk_id="chunk_0000",
                    start_time=0.0,
                    end_time=60.0,
                    file_path=video_path,
                    scene_score=1.0,
                )
            ]

        return chunks

    def _parse_stats_file(self, stats_file: str, video_path: str) -> List[VideoChunk]:
        """Parse the scenedetect stats CSV file to extract scene timings"""
        chunks = []

        try:
            with open(stats_file, "r") as f:
                # Skip header lines that start with #
                lines = [
                    line for line in f if not line.startswith("#") and line.strip()
                ]

                if not lines:
                    return chunks

                # Parse CSV data - format is typically: Scene Number, Start Timecode, End Timecode, Length
                reader = csv.reader(lines)
                for i, row in enumerate(reader):
                    if len(row) >= 3:
                        try:
                            # Parse timecodes (format: HH:MM:SS.mmm)
                            start_time = self._timecode_to_seconds(row[1].strip())
                            end_time = self._timecode_to_seconds(row[2].strip())

                            chunk = VideoChunk(
                                chunk_id=f"chunk_{i:04d}",
                                start_time=start_time,
                                end_time=end_time,
                                file_path=video_path,
                                scene_score=min((end_time - start_time) / 10.0, 1.0),
                            )
                            chunks.append(chunk)

                        except (ValueError, IndexError) as e:
                            print(f"Error parsing CSV row {i}: {str(e)}")
                            continue

        except Exception as e:
            print(f"Error reading stats file: {str(e)}")

        return chunks

    def _timecode_to_seconds(self, timecode: str) -> float:
        """Convert HH:MM:SS.mmm format to seconds"""
        try:
            parts = timecode.split(":")
            if len(parts) == 3:
                hours = float(parts[0])
                minutes = float(parts[1])
                seconds = float(parts[2])
                return hours * 3600 + minutes * 60 + seconds
            elif len(parts) == 2:
                minutes = float(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            else:
                return float(timecode)
        except ValueError:
            return 0.0
