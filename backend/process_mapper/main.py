#!/usr/bin/env python3

# Add the parent directory to the path for imports
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
"""
Main CLI entry point for the Process Mapper.
Direct transformation of video analysis data into business process maps.
"""

import asyncio
import json
import logging
import os
import sys
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Optional
import argparse
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from simple_process_mapper import generate_simple_process_map
from process_mapper.process_models import ProcessMap

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def print_banner():
    """Print application banner."""
    print("=" * 60)
    print("PROCESS MAPPER")
    print("Direct video analysis to business process mapping")
    print("Using Google Gemini API")
    print("=" * 60)
    print()


def validate_api_key() -> str:
    """Validate and get Gemini API key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is required")
        print("Set it with: export GEMINI_API_KEY=your_api_key_here")
        sys.exit(1)

    logger.info("Gemini API key found")
    return api_key


def load_video_analysis_data(input_file: Path) -> dict:
    """Load and validate video analysis JSON data."""

    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    logger.info(f"Loading video analysis data from: {input_file}")

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Basic validation
    required_fields = ["events", "transcripts", "process_summary"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        raise ValueError(f"Missing required fields in input data: {missing_fields}")

    logger.info(f"Video analysis data loaded successfully")
    logger.info(
        f'Events: {len(data.get("events", []))}, Transcripts: {len(data.get("transcripts", []))}'
    )

    return data


def save_process_map(process_map: ProcessMap, output_file: Path) -> None:
    """Save process map to file."""

    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(process_map.model_dump(), f, indent=2, default=str)

    logger.info(f"Process map saved to: {output_file}")
    print(f"Process map saved to: {output_file}")


async def open_visualizer(
    process_map: ProcessMap,
    template_path: Optional[Path] = None,
    output_file: Optional[Path] = None,
) -> None:
    """Open process map in browser visualizer."""

    logger.info("Opening process map visualizer...")

    # Get template path
    if not template_path:
        current_dir = Path(__file__).parent
        template_path = current_dir / "process_map_visualizer.html"

    if not template_path.exists():
        logger.error(f"Visualizer template not found: {template_path}")
        print(f"Visualizer template not found: {template_path}")
        return

    # Read template
    with open(template_path, "r", encoding="utf-8") as f:
        template_content = f.read()

    # Embed the JSON data directly into the template
    process_map_json = json.dumps(process_map.model_dump(), indent=2)
    json_file_path = (
        output_file.resolve() if output_file else "generated_process_map.json"
    )

    # Create a more robust data injection - replace the entire loadSampleData function
    old_function = """        function loadSampleData() {
            const sampleData = {"""

    new_function = f"""        function loadSampleData() {{
            // Auto-load generated process map data instead
            const generatedProcessMap = {process_map_json};
            
            document.getElementById('jsonInput').value = JSON.stringify(generatedProcessMap, null, 2);
            
            // Automatically load the process map
            setTimeout(() => {{
                console.log('Auto-loading generated process map...');
                loadProcessMap();
                showMessage(`Process map auto-loaded: ${{generatedProcessMap.nodes.length}} nodes, ${{generatedProcessMap.edges.length}} edges`, 'success');
            }}, 500);
            
            console.log('Generated from file: {json_file_path}');
        }}

        // Call loadSampleData automatically when page loads
        window.addEventListener('DOMContentLoaded', () => {{
            setTimeout(() => {{
                loadSampleData();
            }}, 1000);
        }});

        function loadOriginalSampleData() {{
            const sampleData = {{"""

    modified_template = template_content.replace(old_function, new_function)

    # Create temporary file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", delete=False, encoding="utf-8"
    ) as temp_file:
        temp_file.write(modified_template)
        temp_path = temp_file.name

    try:
        # Open in browser
        webbrowser.open(f"file://{temp_path}")
        logger.info("Process map visualizer opened in browser")
        print("Process map visualizer opened in browser")
        print(f"JSON data source: {json_file_path}")
        print(f"Visualizer temp file: {temp_path}")
        print("Press Enter when done viewing (to clean up temporary file)...")
        input()

    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_path)
            logger.info("Cleaned up temporary visualizer file")
        except Exception as e:
            logger.warning(
                f"Warning: Could not clean up temporary file {temp_path}: {e}"
            )


async def main():
    """Main application entry point."""

    parser = argparse.ArgumentParser(
        description="Process Mapper - Generate business process maps from video analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python -m process_mapper.main \\
    --input output/session_123/analysis_result.json \\
    --output process_maps/workflow.json

  # With visualization
  python -m process_mapper.main \\
    --input output/session_123/analysis_result.json \\
    --output process_maps/workflow.json \\
    --visualize

  # Use sample data
  python -m process_mapper.main \\
    --input output/session_20250908_213220_4ff3eaeb/analysis_result_20250908_213220.json \\
    --visualize

Environment Variables:
  GEMINI_API_KEY  - Required: Your Google Gemini API key
        """,
    )

    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        required=True,
        help="Path to video analysis JSON file",
    )

    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Output path for generated process map JSON (default: auto-generated)",
    )

    parser.add_argument(
        "--visualize",
        "-v",
        action="store_true",
        help="Open process map in browser visualizer after generation",
    )

    parser.add_argument(
        "--template-path", type=Path, help="Path to custom visualizer template"
    )

    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    # Setup logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")

    # Print banner
    print_banner()

    try:
        # Validate API key
        api_key = validate_api_key()

        # Load input data
        video_data = load_video_analysis_data(args.input)

        # Generate default output path if not provided
        if not args.output:
            # Use the same directory as the input file
            input_dir = args.input.parent
            session_id = video_data.get("session_id", "unknown")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            args.output = input_dir / f"process_map_{session_id}_{timestamp}.json"

        # Generate process map using simple approach
        logger.info("Generating process map from video events...")
        print("Generating process map from video events...")

        process_map = generate_simple_process_map(video_data)

        # Save process map
        save_process_map(process_map, args.output)

        # Print success summary
        print()
        print("SUCCESS! Process map generated successfully")
        print("=" * 60)
        print(f"Generated: {len(process_map.nodes)} process steps")
        print(f"Connected: {len(process_map.edges)} workflow connections")
        print(
            f"Tools: {len(process_map.metadata.get('tools', []))} unique applications"
        )
        print(f'Confidence: {process_map.metadata.get("confidence", 0):.1%}')
        print("=" * 60)

        # Open visualizer if requested
        if args.visualize:
            await open_visualizer(process_map, args.template_path, args.output)

        logger.info("Process mapping completed successfully")
        print("All done!")

    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
        print("\nProcess interrupted by user")
        sys.exit(1)

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(f"Error: {e}")
        if args.verbose:
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
