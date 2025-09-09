#!/usr/bin/env python3
"""
Entry point script for video processing pipeline.
This allows running the video processing module from the command line.
"""

import sys
from pathlib import Path

# Add backend directory to Python path to enable proper imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import and run the main function from video processing
from video_processing.process_video import main

if __name__ == "__main__":
    exit(main())