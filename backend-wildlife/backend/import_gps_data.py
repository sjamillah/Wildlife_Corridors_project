"""
GPS Data Import Script
Imports raw GPS collar data from Cloudflare R2 storage into the database
Handles elephant and wildebeest data with specific column mappings
Creates a representative sample of animals and tracking points
"""
import os
import sys
import django
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import pytz

# Load .env file before Django setup (optional, for local dev)
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"Loaded environment from: {env_path}")
    else:
        print(f"INFO: .env file not found at {env_path}, using system environment variables")
except ImportError:
    # python-dotenv not installed (e.g., in Docker) - use system env vars
    print("INFO: Using system environment variables (Docker mode)")

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wildlife_backend.settings')
django.setup()

from apps.tracking.models import Tracking
from apps.animals.models import Animal
from django.contrib.auth import get_user_model
import httpx
import tempfile

User = get_user_model()


def download_from_cloudflare(cloudflare_base_url: str, file_path: str):
    """Download file from Cloudflare R2 and return local path"""
    cache_dir = Path(tempfile.gettempdir()) / "gps_import_cache"
    cache_dir.mkdir(exist_ok=True)
    
    cache_filename = file_path.replace('/', '_').replace('-', '_')
    cached_file = cache_dir / cache_filename
    
    if cached_file.exists():
        print(f"Using cached file: {cached_file}")
        return cached_file
    
    url = f"{cloudflare_base_url.rstrip('/')}/{file_path}"
    print(f"Downloading from: {url}")
    
    try:
        with httpx.Client(timeout=300.0) as client:
            response = client.get(url)
            response.raise_for_status()
            
            with open(cached_file, 'wb') as f:
                f.write(response.content)
            
            print(f"Downloaded and cached to: {cached_file}")
            return cached_file
    except Exception as e:
        raise FileNotFoundError(f"Failed to download from Cloudflare: {url}. Error: {e}")


def import_gps_data_from_cloudflare(species: str, max_points_per_animal: int = 20, max_animals: int = 10, batch_size: int = 1000):
    """
    Import GPS data sample from Cloudflare R2 storage
    
    Args:
        species: 'elephant' or 'wildebeest'
        max_points_per_animal: Maximum tracking points per animal (default: 20)
        max_animals: Maximum number of animals to import (default: 10)
        batch_size: Number of records to insert at once
    
    Data locations on Cloudflare R2:
        Uses BBMM processed data (includes GPS coords + HMM behavioral states):
        Elephant: ml_information/trained_models/bbmm/elephant_bbmm_gps_data.csv
        Wildebeest: ml_information/trained_models/bbmm/wildebeest_bbmm_gps_data.csv
        
        BBMM files contain:
        GPS coordinates (lat, lon, timestamp) + HMM behavioral states + movement features
        
        Creates a representative sample with diverse collar IDs and behaviors
        Total points imported: approximately max_animals * max_points_per_animal
    """
    
    print(f"\n")
    print(f"GPS DATA IMPORT FROM CLOUDFLARE R2 {species.upper()}")
    print(f"\n")
    
    # Get Cloudflare URL from environment
    cloudflare_base_url = os.getenv('CLOUDFLARE_BASE_URL')
    
    if not cloudflare_base_url:
        print("ERROR: CLOUDFLARE_BASE_URL not set in environment variables")
        print("Add to your .env file:")
        print("CLOUDFLARE_BASE_URL=https://your_bucket.r2.cloudflarestorage.com")
        return
    
    print(f"Cloudflare Base URL: {cloudflare_base_url}")
    
    # File paths on Cloudflare (using BBMM data with GPS coords + HMM states)
    file_paths = {
        'elephant': 'ml-information/trained_models/bbmm/elephant_bbmm_gps_data.csv',
        'wildebeest': 'ml-information/trained_models/bbmm/wildebeest_bbmm_gps_data.csv'
    }
    
    if species not in file_paths:
        print(f"ERROR: Unknown species: {species}")
        print(f"Supported: {list(file_paths.keys())}")
        return
    
    cloudflare_path = file_paths[species]
    
    # Load BBMM file (has GPS coords) and HMM file (has 3-state behaviors)
    bbmm_file = Path(__file__).parent / f"{species}_bbmm_gps_data.csv"
    hmm_file = Path(__file__).parent / f"{species}_predictions.csv"
    
    if not bbmm_file.exists():
        print(f"ERROR: BBMM GPS file not found: {bbmm_file.name}")
        print(f"  Place {bbmm_file.name} in backend/ directory")
        return
    
    if not hmm_file.exists():
        print(f"ERROR: HMM predictions not found: {hmm_file.name}")
        print(f"  Place {hmm_file.name} in backend/ directory")
        return
    
    # Load BBMM GPS data
    print(f"Loading BBMM GPS data: {bbmm_file.name}")
    bbmm_df = pd.read_csv(bbmm_file, low_memory=False)
    bbmm_df.columns = bbmm_df.columns.str.strip()
    print(f"  Loaded {len(bbmm_df)} records with GPS coordinates")
    
    # Load HMM 3-state predictions
    print(f"Loading HMM 3-state predictions: {hmm_file.name}")
    hmm_df = pd.read_csv(hmm_file)
    hmm_df.columns = hmm_df.columns.str.strip()
    print(f"  Loaded {len(hmm_df)} predictions\n")
    
    print("HMM Behavior distribution (3 states):")
    print(hmm_df['behavior'].value_counts())
    print()
    
    # Merge by index (files are aligned from same preprocessing)
    print("Merging BBMM GPS + HMM behaviors...")
    min_len = min(len(bbmm_df), len(hmm_df))
    df = bbmm_df.iloc[:min_len].reset_index(drop=True)
    
    # Replace 2-state HMM with 3-state HMM behaviors
    df['hmm_behavioral_state'] = hmm_df.iloc[:min_len]['behavior'].values
    df['step_length'] = hmm_df.iloc[:min_len]['step_length'].values
    df['turning_angle'] = hmm_df.iloc[:min_len]['turning_angle'].values
    
    print(f"SUCCESS: Merged {len(df)} records")
    print(f"Columns: {list(df.columns)[:10]}... (showing first 10)\n")
    
    print("Final behavior distribution:")
    print(df['hmm_behavioral_state'].value_counts())
    print()
    
    # Column mapping based on actual BBMM model output structure
    # BBMM files have GPS coords + HMM behavioral states merged
    col_patterns = {
        'collar_id': ['individual_id', 'tag_local_identifier', 'tag-local-identifier', 'CollarID'],
        'timestamp': ['timestamp', 'time', 'datetime'],
        'latitude': ['lat', 'latitude', 'Latitude'],
        'longitude': ['lon', 'longitude', 'Longitude'],
        'altitude': ['altitude', 'elevation', 'height', 'Heigh'],
        'temperature': ['temperature', 'temp', 'Temp'],
        'activity': ['behavior', 'hmm_behavioral_state', 'behavioral_state', 'state'],
        'speed': ['step_length', 'speed'],
        'direction': ['turning_angle', 'bearing'],
        'persistence': ['persistence'],
        'sinuosity': ['sinuosity'],
    }
    
    # Auto detect actual columns in the CSV
    col_map = {}
    for field, patterns in col_patterns.items():
        for pattern in patterns:
            if pattern in df.columns:
                col_map[field] = pattern
                break
    
    print("Column mapping:")
    for key, val in col_map.items():
        if val in df.columns:
            print(f"   {key} -> {val}")
        else:
            print(f"   WARNING: {key} -> {val} (NOT FOUND)")
    print()
    
    # Get or create system user for imports
    system_user, _ = User.objects.get_or_create(
        email='system@wildlife.com',
        defaults={'name': 'System Import', 'role': 'admin'}
    )
    
    total_imported = 0
    total_skipped = 0
    
    # Get unique collar IDs and sample for representative dataset
    collar_id_col = col_map['collar_id']
    all_collar_ids = df[collar_id_col].unique()
    
    print(f"\nFound {len(all_collar_ids)} unique collars in dataset")
    print(f"Sampling {min(max_animals, len(all_collar_ids))} animals with {max_points_per_animal} points each")
    print(f"Target: ~{max_animals * max_points_per_animal} total tracking points\n")
    
    # Sample diverse collars (take first N for consistency)
    sampled_collar_ids = all_collar_ids[:max_animals] if len(all_collar_ids) > max_animals else all_collar_ids
    
    print(f"Selected collars: {list(sampled_collar_ids)[:5]}{'...' if len(sampled_collar_ids) > 5 else ''}")
    print()
    
    for collar_id in sampled_collar_ids:
        collar_df = df[df[collar_id_col] == collar_id].copy()
        
        # Find or create animal for this collar
        animal = _get_or_create_animal(collar_id, species, system_user)
        if not animal:
            print(f"  WARNING: Skipping collar {collar_id}, could not create animal")
            total_skipped += len(collar_df)
            continue
        
        # Sample points for this animal (ensure diverse behaviors)
        original_count = len(collar_df)
        if len(collar_df) > max_points_per_animal:
            # Strategy: Sample to ensure diverse behaviors
            if col_map.get('activity') and col_map['activity'] in collar_df.columns:
                # Get behavior distribution
                behaviors = collar_df[col_map['activity']].unique()
                sampled_rows = []
                
                # Sample from each behavior proportionally
                points_per_behavior = max(1, max_points_per_animal // len(behaviors))
                for behavior in behaviors:
                    behavior_data = collar_df[collar_df[col_map['activity']] == behavior]
                    if len(behavior_data) > 0:
                        n_sample = min(points_per_behavior, len(behavior_data))
                        # Evenly spaced within this behavior
                        indices = np.linspace(0, len(behavior_data) - 1, n_sample, dtype=int)
                        sampled_rows.append(behavior_data.iloc[indices])
                
                collar_df = pd.concat(sampled_rows).sort_index()
                # Trim to exact max if we oversampled
                if len(collar_df) > max_points_per_animal:
                    collar_df = collar_df.iloc[:max_points_per_animal]
            else:
                # Fallback: evenly spaced temporal sampling
                sample_indices = np.linspace(0, len(collar_df) - 1, max_points_per_animal, dtype=int)
                collar_df = collar_df.iloc[sample_indices].copy()
            
            print(f"  Sampled {len(collar_df)} points from {original_count} (behavior-diverse) for {animal.name}")
        else:
            print(f"  Using all {len(collar_df)} points for {animal.name}")
        
        # Prepare tracking points
        tracking_points = []
        for idx, row in collar_df.iterrows():
            try:
                # Parse timestamp flexibly and make it timezone-aware
                if 'timestamp' in col_map:
                    timestamp = pd.to_datetime(row[col_map['timestamp']], errors='coerce')
                    # Make timezone-aware (assume UTC for GPS data)
                    if timestamp and pd.notna(timestamp):
                        if timestamp.tzinfo is None:
                            timestamp = pytz.UTC.localize(timestamp)
                else:
                    # Create sequential timestamp if missing
                    timestamp = pytz.UTC.localize(pd.Timestamp('2020-01-01') + pd.Timedelta(hours=idx))
                
                if pd.isna(timestamp):
                    total_skipped += 1
                    continue
                
                # Get coordinates
                lat = float(row[col_map['latitude']])
                lon = float(row[col_map['longitude']])
                
                # Skip invalid coordinates
                if pd.isna(lat) or pd.isna(lon) or lat < -90 or lat > 90 or lon < -180 or lon > 180:
                    total_skipped += 1
                    continue
                
                # Get optional fields
                altitude = None
                if col_map.get('altitude') and col_map['altitude'] in row.index:
                    try:
                        altitude = float(row[col_map['altitude']])
                    except (ValueError, TypeError):
                        pass
                
                temperature = None
                if col_map.get('temperature') and col_map['temperature'] in row.index:
                    try:
                        temperature = float(row[col_map['temperature']])
                    except (ValueError, TypeError):
                        pass
                
                battery = None
                if col_map.get('battery') and col_map['battery'] in row.index:
                    try:
                        battery = str(row[col_map['battery']])
                    except:
                        pass
                
                # Get behavioral state from HMM (activity)
                activity_type = 'unknown'
                if col_map.get('activity') and col_map['activity'] in row.index:
                    try:
                        activity_val = row[col_map['activity']]
                        # Map HMM behavioral states to tracking activity types
                        behavior_mapping = {
                            # Numeric states
                            1: 'resting', 2: 'feeding', 3: 'moving', 4: 'moving',
                            '1': 'resting', '2': 'feeding', '3': 'moving', '4': 'moving',
                            # Text states (case insensitive)
                            'resting': 'resting',
                            'foraging': 'feeding',
                            'feeding': 'feeding', 
                            'traveling': 'moving',
                            'moving': 'moving',
                            'exploring': 'moving',
                        }
                        key = str(activity_val).lower().strip() if isinstance(activity_val, str) else activity_val
                        activity_type = behavior_mapping.get(key, 'unknown')
                    except:
                        pass
                
                # Get speed from processed data (step_length from HMM/BBMM)
                speed_kmh = None
                if col_map.get('speed') and col_map['speed'] in row.index:
                    try:
                        # step_length is usually in km, convert if needed
                        speed_kmh = float(row[col_map['speed']])
                        if speed_kmh > 0 and speed_kmh < 1:  # Likely in meters
                            speed_kmh = speed_kmh * 3.6  # m/s to km/h
                    except:
                        pass
                
                # Get direction from processed data (turning_angle from HMM/BBMM)
                directional_angle = None
                if col_map.get('direction') and col_map['direction'] in row.index:
                    try:
                        directional_angle = float(row[col_map['direction']])
                        # Normalize to 0-360 if needed
                        if directional_angle < 0:
                            directional_angle = (directional_angle + 360) % 360
                    except:
                        pass
                
                # Create tracking point with HMM/BBMM processed features
                tracking_points.append(Tracking(
                    animal=animal,
                    collar_id=str(collar_id),
                    timestamp=timestamp,
                    lat=lat,
                    lon=lon,
                    altitude=altitude,
                    temperature=temperature,
                    battery_level=battery,
                    signal_strength=None,
                    # These come from HMM/BBMM processing:
                    speed_kmh=speed_kmh,
                    directional_angle=directional_angle,
                    activity_type=activity_type,  # Behavioral state from HMM
                    source='imported',
                    uploaded_by=system_user,
                ))
                
                # Batch insert
                if len(tracking_points) >= batch_size:
                    Tracking.objects.bulk_create(tracking_points, ignore_conflicts=True)
                    total_imported += len(tracking_points)
                    print(f"    SUCCESS: Imported batch of {len(tracking_points)} points")
                    tracking_points = []
                    
            except Exception as e:
                print(f"    ERROR: Could not process row {idx}: {e}")
                total_skipped += 1
        
        # Insert remaining points
        if tracking_points:
            Tracking.objects.bulk_create(tracking_points, ignore_conflicts=True)
            total_imported += len(tracking_points)
            print(f"    SUCCESS: Imported final batch of {len(tracking_points)} points")
    
    print(f"\n")
    print(f"Import Complete for {species.upper()}!")
    print(f"   Animals created: {len(sampled_collar_ids)}")
    print(f"   Tracking points imported: {total_imported}")
    print(f"   Points skipped: {total_skipped}")
    print(f"\n")
    
    print("Next steps:")
    print("   1. Your HMM/BBMM processed data is now in the database!")
    print("   2. Data includes:")
    print("      GPS coordinates (lat, lon, timestamp)")
    print("      Behavioral states (from HMM): resting, feeding, moving")
    print("      Movement features (from BBMM): speed, direction")
    print("   3. Your trained models are ready to use:")
    print("      LSTM: Predict next positions")
    print("      XGBoost: Score habitat quality")
    print("      RL: Optimize corridors and detect risk zones")
    print("   4. View data:")
    print("      Admin: http://localhost:8000/admin/tracking/tracking/")
    print("      API: http://localhost:8000/api/v1/animals/live_status/")
    print("      Corridors: http://localhost:8000/api/v1/corridors/optimize/\n")


def import_mixed_sample():
    """
    Import a mixed sample of both elephant and wildebeest data
    Creates ~200 total tracking points across both species
    """
    print("\n")
    print("IMPORTING MIXED SPECIES SAMPLE")
    print("Creating representative dataset with both elephants and wildebeest")
    print("\n")
    
    # Import 5 elephants with 20 points each = 100 points
    print("Step 1: Importing elephant sample")
    import_gps_data_from_cloudflare('elephant', max_points_per_animal=20, max_animals=5)
    
    # Import 5 wildebeest with 20 points each = 100 points
    print("\nStep 2: Importing wildebeest sample")
    import_gps_data_from_cloudflare('wildebeest', max_points_per_animal=20, max_animals=5)
    
    # Summary
    from apps.animals.models import Animal
    from apps.tracking.models import Tracking
    
    total_animals = Animal.objects.count()
    total_tracking = Tracking.objects.count()
    elephant_count = Animal.objects.filter(species='elephant').count()
    wildebeest_count = Animal.objects.filter(species='wildebeest').count()
    
    print("\n")
    print("MIXED IMPORT COMPLETE!")
    print(f"   Total Animals: {total_animals} ({elephant_count} elephants, {wildebeest_count} wildebeest)")
    print(f"   Total Tracking Points: {total_tracking}")
    print("\n")
    
    # Behavior distribution
    from django.db.models import Count
    behavior_stats = Tracking.objects.values('activity_type').annotate(count=Count('id'))
    print("Behavior distribution:")
    for stat in behavior_stats:
        print(f"   {stat['activity_type']}: {stat['count']} points")
    print("\n")


def _get_or_create_animal(collar_id: str, species: str, user):
    """Get or create an animal for a collar ID"""
    # Try to find existing animal with this collar
    tracking = Tracking.objects.filter(collar_id=collar_id).first()
    if tracking and tracking.animal:
        return tracking.animal
    
    # Create new animal
    try:
        animal = Animal.objects.create(
            name=f"{species.capitalize()} {collar_id}",
            species=species,
            age=None,
            weight=None,
            status='active',
            notes=f'Imported from GPS data (Collar: {collar_id})',
            created_by=user
        )
        return animal
    except Exception as e:
        print(f"    ERROR: Could not create animal: {e}")
        return None


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python import_gps_data.py <option>")
        print("\nOptions:")
        print("  mixed       Import both species (5 animals each, 20 points each = ~200 total)")
        print("  elephant    Import elephant data only")
        print("  wildebeest  Import wildebeest data only")
        print("\nExamples:")
        print("  python import_gps_data.py mixed      (RECOMMENDED for demo)")
        print("  python import_gps_data.py elephant")
        print("  python import_gps_data.py wildebeest")
        print("\nData source: BBMM GPS data from Cloudflare R2")
        print("  Elephant: ml_information/trained_models/bbmm/elephant_bbmm_gps_data.csv")
        print("  Wildebeest: ml_information/trained_models/bbmm/wildebeest_bbmm_gps_data.csv")
        print("\nOr place files locally in backend/ directory:")
        print("  elephant_bbmm_gps_data.csv")
        print("  wildebeest_bbmm_gps_data.csv")
        print("\nBBMM files should include:")
        print("  GPS coordinates (lat, lon, timestamp)")
        print("  Behavioral states from HMM (behavior column)")
        print("  Movement features (step_length, turning_angle)")
        print("\nMake sure CLOUDFLARE_BASE_URL is set in your .env file!")
        sys.exit(1)
    
    option = sys.argv[1].lower()
    
    if option == 'mixed':
        # Import mixed sample of both species
        import_mixed_sample()
    elif option in ['elephant', 'wildebeest']:
        # Import single species
        # You can customize: max_points_per_animal and max_animals
        import_gps_data_from_cloudflare(
            species=option,
            max_points_per_animal=20,  # 20 points per animal
            max_animals=10             # 10 different animals
        )
    else:
        print(f"ERROR: Unknown option: {option}")
        print("Supported: mixed, elephant, wildebeest")
        sys.exit(1)

