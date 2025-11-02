import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
from hmmlearn import hmm
from scipy.stats import circmean, circstd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)

plt.style.use('default')
sns.set_palette("husl")

output_dir = '/data/outputs'
results_dir = '/data/results'
os.makedirs(output_dir, exist_ok=True)
os.makedirs(results_dir, exist_ok=True)

print("Hidden Markov Model for Animal Behavior Classification")
print("Analyzing step length and turning angles to identify behavioral states")
print()

ELEPHANT_FILE = '/content/Elephant-Data-Tanzania.csv'
WILDEBEEST_FILE = '/content/White-bearded wildebeest in Kenya-gps.csv'

print("File paths configured:")
print(f"  Elephant data: {ELEPHANT_FILE}")
print(f"  Wildebeest data: {WILDEBEEST_FILE}")

def load_data(filepath, species_name):
    """
    Load tracking data from CSV file and perform initial inspection

    Parameters:
    filepath: path to the CSV file
    species_name: name of the species for display purposes

    Returns:
    DataFrame with the loaded data
    """
    print(f"Loading {species_name} data from: {filepath}")

    try:
        df = pd.read_csv(filepath, low_memory=False)
        df.columns = df.columns.str.strip()

        print(f"Successfully loaded {len(df)} records")
        print(f"Number of columns: {len(df.columns)}")
        print(f"Data shape: {df.shape}")
        print()

        return df

    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return None
    except Exception as e:
        print(f"Error loading file: {str(e)}")
        return None

print("STEP 1: LOADING DATA")
print()

print("ELEPHANT DATA ANALYSIS")
print()
elephant_raw = load_data(ELEPHANT_FILE, 'Elephant')

print("WILDEBEEST DATA ANALYSIS")
print()
wildebeest_raw = load_data(WILDEBEEST_FILE, 'Wildebeest')

def inspect_data_quality(df, species_name):
    """
    Perform comprehensive data quality inspection
    Shows missing values, data types, and basic statistics

    Parameters:
    df: DataFrame to inspect
    species_name: name of the species for display purposes
    """
    print(f"Data Quality Inspection for {species_name}")
    print()

    print("Column names:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")
    print()

    print("Missing values analysis:")
    missing = df.isnull().sum()
    missing_percent = (missing / len(df)) * 100
    missing_df = pd.DataFrame({
        'Column': missing.index,
        'Missing_Count': missing.values,
        'Missing_Percent': missing_percent.values
    })
    missing_df = missing_df[missing_df['Missing_Count'] > 0].sort_values('Missing_Count', ascending=False)

    if len(missing_df) > 0:
        print(missing_df.to_string(index=False))
        print()
        print(f"Total columns with missing values: {len(missing_df)}")
    else:
        print("No missing values found in the dataset")
    print()

    print("Data types:")
    print(df.dtypes.value_counts())
    print()

    print("First few records:")
    print(df.head(3))
    print()

    return missing_df

print("STEP 2: INSPECTING DATA QUALITY")
print()

if elephant_raw is not None:
    elephant_missing = inspect_data_quality(elephant_raw, 'Elephant')
else:
    print("Elephant data not loaded, skipping quality inspection")
    print()

if wildebeest_raw is not None:
    wildebeest_missing = inspect_data_quality(wildebeest_raw, 'Wildebeest')
else:
    print("Wildebeest data not loaded, skipping quality inspection")
    print()

def identify_coordinate_columns(df, species_name):
    """
    Identify which columns contain latitude and longitude coordinates
    Handles different naming conventions across datasets

    Parameters:
    df: DataFrame to analyze
    species_name: name of the species for display purposes

    Returns:
    Dictionary with column names for latitude and longitude
    """
    print(f"Identifying coordinate columns for {species_name}")

    coord_mapping = {}

    possible_lat_names = ['latitude', 'lat', 'location-lat', 'Latitude', 'LAT']
    possible_lon_names = ['longitude', 'lon', 'long', 'location-long', 'Longitude', 'LON', 'LONG']

    for col in df.columns:
        col_lower = col.lower()
        if any(lat_name.lower() in col_lower for lat_name in possible_lat_names):
            coord_mapping['latitude'] = col
        if any(lon_name.lower() in col_lower for lon_name in possible_lon_names):
            coord_mapping['longitude'] = col

    if 'latitude' in coord_mapping and 'longitude' in coord_mapping:
        print(f"Found coordinates:")
        print(f"  Latitude column: {coord_mapping['latitude']}")
        print(f"  Longitude column: {coord_mapping['longitude']}")
        print()
    else:
        print("Warning: Could not identify coordinate columns")
        print()

    return coord_mapping

print("STEP 3: IDENTIFYING COORDINATE COLUMNS")
print()

if elephant_raw is not None:
    elephant_coords = identify_coordinate_columns(elephant_raw, 'Elephant')
else:
    elephant_coords = None

if wildebeest_raw is not None:
    wildebeest_coords = identify_coordinate_columns(wildebeest_raw, 'Wildebeest')
else:
    wildebeest_coords = None

def identify_timestamp_columns(df, species_name):
    """
    Identify and parse timestamp information from various column formats
    Handles multiple timestamp formats and naming conventions

    Parameters:
    df: DataFrame containing the data
    species_name: name of the species for display purposes

    Returns:
    DataFrame with standardized timestamp column
    """
    print(f"Identifying and parsing timestamps for {species_name}")

    # Check if we have separate date and time columns
    date_cols = [col for col in df.columns if 'date' in col.lower() and 'time' not in col.lower()]
    time_cols = [col for col in df.columns if 'time' in col.lower() and 'date' not in col.lower()]

    # If we have both date and time columns, combine them
    if date_cols and time_cols:
        print(f"Found separate date column: {date_cols[0]}")
        print(f"Found separate time column: {time_cols[0]}")
        print(f"Sample date values: {df[date_cols[0]].head(3).tolist()}")
        print(f"Sample time values: {df[time_cols[0]].head(3).tolist()}")

        try:
            df['timestamp'] = pd.to_datetime(
                df[date_cols[0]].astype(str) + ' ' + df[time_cols[0]].astype(str),
                errors='coerce'
            )
            valid_timestamps = df['timestamp'].notna().sum()
            print(f"Successfully combined and parsed {valid_timestamps} out of {len(df)} timestamps")

            if valid_timestamps > 0:
                print(f"Sample combined timestamps: {df['timestamp'].dropna().head(3).tolist()}")
                print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
            print()
            return df
        except Exception as e:
            print(f"Error combining date and time: {str(e)}")
            print("Falling back to single column parsing...")

    # Otherwise, look for a single timestamp column
    possible_timestamp_cols = ['timestamp', 'UTC_Date', 'date', 'time', 'datetime']

    timestamp_col = None
    for col in df.columns:
        if any(ts_name.lower() in col.lower() for ts_name in possible_timestamp_cols):
            timestamp_col = col
            break

    if timestamp_col:
        print(f"Found timestamp column: {timestamp_col}")
        print(f"Sample values: {df[timestamp_col].head(3).tolist()}")

        try:
            df['timestamp'] = pd.to_datetime(df[timestamp_col], errors='coerce')
            valid_timestamps = df['timestamp'].notna().sum()
            print(f"Successfully parsed {valid_timestamps} out of {len(df)} timestamps")

            if valid_timestamps > 0:
                print(f"Sample parsed timestamps: {df['timestamp'].dropna().head(3).tolist()}")
                print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

            if valid_timestamps < len(df) * 0.5:
                print("Warning: Less than 50% of timestamps were successfully parsed")
                print("Attempting alternative parsing strategies...")

                date_cols_alt = [col for col in df.columns if 'date' in col.lower()]
                time_cols_alt = [col for col in df.columns if 'time' in col.lower() and 'date' not in col.lower()]

                if date_cols_alt and time_cols_alt:
                    print(f"Trying to combine {date_cols_alt[0]} and {time_cols_alt[0]}")
                    df['timestamp'] = pd.to_datetime(
                        df[date_cols_alt[0]].astype(str) + ' ' + df[time_cols_alt[0]].astype(str),
                        errors='coerce'
                    )
                    valid_timestamps = df['timestamp'].notna().sum()
                    print(f"Combined parsing resulted in {valid_timestamps} valid timestamps")

            print()

        except Exception as e:
            print(f"Error parsing timestamps: {str(e)}")
            print()

    else:
        print("Warning: No timestamp column identified")
        print()

    return df

print("STEP 4: PARSING TIMESTAMPS")
print()

if elephant_raw is not None:
    elephant_raw = identify_timestamp_columns(elephant_raw, 'Elephant')

if wildebeest_raw is not None:
    wildebeest_raw = identify_timestamp_columns(wildebeest_raw, 'Wildebeest')

def identify_individual_column(df, species_name):
    """
    Identify which column contains individual animal identifiers

    Parameters:
    df: DataFrame to analyze
    species_name: name of the species for display purposes

    Returns:
    Column name containing individual IDs
    """
    print(f"Identifying individual ID column for {species_name}")

    has_tag_id = 'tag-local-identifier' in df.columns
    has_individual_id = 'individual-local-identifier' in df.columns

    if has_tag_id and has_individual_id:
        tag_unique = df['tag-local-identifier'].nunique()
        individual_unique = df['individual-local-identifier'].nunique()

        print(f"Found both tag and individual identifier columns:")
        print(f"  tag-local-identifier: {tag_unique} unique values")
        print(f"  individual-local-identifier: {individual_unique} unique values")

        if tag_unique < individual_unique and tag_unique > 1:
            print(f"Using tag-local-identifier (fewer unique values = actual collared individuals)")
            print(f"Number of unique individuals: {tag_unique}")
            print()
            return 'tag-local-identifier'
        else:
            print(f"Using individual-local-identifier")
            print(f"Number of unique individuals: {individual_unique}")
            print()
            return 'individual-local-identifier'

    possible_id_names = ['tag-local-identifier', 'individual-local-identifier', 'individual', 'animal_id', 'id', 'Id', 'ID', 'CollarID']

    id_col = None
    for col in df.columns:
        col_lower = col.lower()
        if any(id_name.lower() in col_lower for id_name in possible_id_names):
            if df[col].nunique() > 1 and df[col].nunique() < len(df) * 0.5:
                id_col = col
                break

    if id_col:
        print(f"Found individual ID column: {id_col}")
        print(f"Number of unique individuals: {df[id_col].nunique()}")
        print()
    else:
        print("Warning: Could not identify individual ID column")
        print()

    return id_col

print("STEP 5: IDENTIFYING INDIVIDUAL IDs")
print()

if elephant_raw is not None:
    elephant_id_col = identify_individual_column(elephant_raw, 'Elephant')
else:
    elephant_id_col = None

if wildebeest_raw is not None:
    wildebeest_id_col = identify_individual_column(wildebeest_raw, 'Wildebeest')
else:
    wildebeest_id_col = None

def clean_data(df, coord_mapping, id_col, species_name):
    """
    Clean the dataset by removing invalid records and standardizing columns
    Handles missing values, invalid coordinates, and data quality issues

    Parameters:
    df: DataFrame to clean
    coord_mapping: dictionary with coordinate column names
    id_col: name of the individual ID column
    species_name: name of the species for display purposes

    Returns:
    Cleaned DataFrame
    """
    print(f"Cleaning {species_name} data")
    print()

    initial_count = len(df)
    print(f"Initial record count: {initial_count}")

    df_clean = df.copy()

    if 'latitude' in coord_mapping and 'longitude' in coord_mapping:
        df_clean['lat'] = pd.to_numeric(df_clean[coord_mapping['latitude']], errors='coerce')
        df_clean['lon'] = pd.to_numeric(df_clean[coord_mapping['longitude']], errors='coerce')

        before_coord_filter = len(df_clean)
        df_clean = df_clean.dropna(subset=['lat', 'lon'])
        print(f"Records after removing missing coordinates: {len(df_clean)} (removed {before_coord_filter - len(df_clean)})")

        df_clean = df_clean[(df_clean['lat'].between(-90, 90)) & (df_clean['lon'].between(-180, 180))]
        print(f"Records after removing invalid coordinates: {len(df_clean)}")

    if 'timestamp' in df_clean.columns:
        before_time_filter = len(df_clean)
        df_clean = df_clean.dropna(subset=['timestamp'])
        print(f"Records after removing missing timestamps: {len(df_clean)} (removed {before_time_filter - len(df_clean)})")

        df_clean = df_clean.sort_values('timestamp').reset_index(drop=True)

    if id_col:
        df_clean['individual_id'] = df_clean[id_col]
        before_id_filter = len(df_clean)
        df_clean = df_clean.dropna(subset=['individual_id'])
        print(f"Records after removing missing individual IDs: {len(df_clean)} (removed {before_id_filter - len(df_clean)})")

    records_per_individual = df_clean.groupby('individual_id').size()
    print(f"Total unique individuals before filtering: {len(records_per_individual)}")
    print(f"Records per individual statistics:")
    print(f"  Min: {records_per_individual.min()}")
    print(f"  Max: {records_per_individual.max()}")
    print(f"  Mean: {records_per_individual.mean():.1f}")
    print(f"  Median: {records_per_individual.median():.1f}")

    min_records = 50
    individuals_meeting_threshold = (records_per_individual >= min_records).sum()
    print(f"Individuals with at least {min_records} observations: {individuals_meeting_threshold}")

    if individuals_meeting_threshold == 0:
        print(f"WARNING: No individuals have {min_records}+ observations!")
        print(f"Lowering threshold to 30 observations to retain some data...")
        min_records = 30
        individuals_meeting_threshold = (records_per_individual >= min_records).sum()
        print(f"Individuals with at least {min_records} observations: {individuals_meeting_threshold}")

        if individuals_meeting_threshold == 0:
            print(f"WARNING: Still no individuals with {min_records}+ observations!")
            print(f"Lowering threshold to 10 observations as last resort...")
            min_records = 10
            individuals_meeting_threshold = (records_per_individual >= min_records).sum()
            print(f"Individuals with at least {min_records} observations: {individuals_meeting_threshold}")

    valid_individuals = records_per_individual[records_per_individual >= min_records].index
    df_clean = df_clean[df_clean['individual_id'].isin(valid_individuals)]
    print(f"Records after filtering individuals with less than {min_records} observations: {len(df_clean)}")
    print(f"Remaining individuals: {df_clean['individual_id'].nunique()}")

    print(f"Total records removed: {initial_count - len(df_clean)}")
    print(f"Data retention rate: {(len(df_clean) / initial_count * 100):.2f}%")
    print()

    return df_clean

print("STEP 6: CLEANING DATA")
print()

elephant_clean = None
if elephant_raw is not None and elephant_coords and elephant_id_col:
    elephant_clean = clean_data(elephant_raw, elephant_coords, elephant_id_col, 'Elephant')
else:
    print("Cannot clean elephant data: missing coordinates or ID column")
    print()

wildebeest_clean = None
if wildebeest_raw is not None and wildebeest_coords and wildebeest_id_col:
    wildebeest_clean = clean_data(wildebeest_raw, wildebeest_coords, wildebeest_id_col, 'Wildebeest')
else:
    print("Cannot clean wildebeest data: missing coordinates or ID column")
    print()

def calculate_step_length(df):
    """
    Calculate step length between consecutive GPS locations using Haversine formula
    This is the standard method for calculating distances on a sphere

    Parameters:
    df: DataFrame with lat, lon, and timestamp columns

    Returns:
    DataFrame with added step_length column in kilometers
    """
    print("Calculating step lengths using Haversine formula")

    def haversine_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two points on Earth using Haversine formula
        Returns distance in kilometers
        """
        R = 6371.0

        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lat = np.radians(lat2 - lat1)
        delta_lon = np.radians(lon2 - lon1)

        a = np.sin(delta_lat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon / 2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

        distance = R * c
        return distance

    df = df.sort_values(['individual_id', 'timestamp']).reset_index(drop=True)

    df['lat_prev'] = df.groupby('individual_id')['lat'].shift(1)
    df['lon_prev'] = df.groupby('individual_id')['lon'].shift(1)
    df['time_prev'] = df.groupby('individual_id')['timestamp'].shift(1)

    mask = df['lat_prev'].notna()
    df.loc[mask, 'step_length'] = haversine_distance(
        df.loc[mask, 'lat_prev'],
        df.loc[mask, 'lon_prev'],
        df.loc[mask, 'lat'],
        df.loc[mask, 'lon']
    )

    df['time_diff_hours'] = (df['timestamp'] - df['time_prev']).dt.total_seconds() / 3600

    valid_steps = df['step_length'].notna().sum()
    print(f"Calculated {valid_steps} step lengths")
    print(f"Step length statistics (km):")
    print(df['step_length'].describe())
    print()

    return df

print("STEP 7: CALCULATING STEP LENGTHS")
print()

if elephant_clean is not None and len(elephant_clean) > 0:
    elephant_clean = calculate_step_length(elephant_clean)
else:
    print("Elephant data not available or empty after cleaning")
    elephant_clean = None
    print()

if wildebeest_clean is not None and len(wildebeest_clean) > 0:
    wildebeest_clean = calculate_step_length(wildebeest_clean)
else:
    print("Wildebeest data not available or empty after cleaning")
    wildebeest_clean = None
    print()

def calculate_turning_angle(df):
    """
    Calculate turning angles between consecutive movement steps
    Uses the standard method of computing bearings and their differences

    Parameters:
    df: DataFrame with lat, lon coordinates

    Returns:
    DataFrame with added turning_angle column in radians
    """
    print("Calculating turning angles")

    def calculate_bearing(lat1, lon1, lat2, lon2):
        """
        Calculate the bearing between two points
        Returns bearing in radians
        """
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lon = np.radians(lon2 - lon1)

        x = np.sin(delta_lon) * np.cos(lat2_rad)
        y = np.cos(lat1_rad) * np.sin(lat2_rad) - np.sin(lat1_rad) * np.cos(lat2_rad) * np.cos(delta_lon)

        bearing = np.arctan2(x, y)
        return bearing

    df = df.sort_values(['individual_id', 'timestamp']).reset_index(drop=True)

    df['lat_next'] = df.groupby('individual_id')['lat'].shift(-1)
    df['lon_next'] = df.groupby('individual_id')['lon'].shift(-1)

    mask_current = (df['lat_prev'].notna()) & (df['lon_prev'].notna())
    mask_next = (df['lat_next'].notna()) & (df['lon_next'].notna())
    mask = mask_current & mask_next

    df.loc[mask, 'bearing_in'] = calculate_bearing(
        df.loc[mask, 'lat_prev'],
        df.loc[mask, 'lon_prev'],
        df.loc[mask, 'lat'],
        df.loc[mask, 'lon']
    )

    df.loc[mask, 'bearing_out'] = calculate_bearing(
        df.loc[mask, 'lat'],
        df.loc[mask, 'lon'],
        df.loc[mask, 'lat_next'],
        df.loc[mask, 'lon_next']
    )

    df.loc[mask, 'turning_angle'] = df.loc[mask, 'bearing_out'] - df.loc[mask, 'bearing_in']

    df.loc[mask, 'turning_angle'] = np.arctan2(
        np.sin(df.loc[mask, 'turning_angle']),
        np.cos(df.loc[mask, 'turning_angle'])
    )

    valid_angles = df['turning_angle'].notna().sum()
    print(f"Calculated {valid_angles} turning angles")
    print(f"Turning angle statistics (radians):")
    print(df['turning_angle'].describe())
    print()

    return df

print("STEP 8: CALCULATING TURNING ANGLES")
print()

if elephant_clean is not None and len(elephant_clean) > 0:
    elephant_clean = calculate_turning_angle(elephant_clean)
else:
    print("Elephant data not available or empty")
    elephant_clean = None
    print()

if wildebeest_clean is not None and len(wildebeest_clean) > 0:
    wildebeest_clean = calculate_turning_angle(wildebeest_clean)
else:
    print("Wildebeest data not available or empty")
    wildebeest_clean = None
    print()

def filter_movement_outliers(df, species_name):
    """
    Filter out biologically implausible movements based on species-specific thresholds
    Uses maximum realistic speeds to identify GPS errors

    Parameters:
    df: DataFrame with movement metrics
    species_name: name of the species for species-specific filtering

    Returns:
    Filtered DataFrame
    """
    print(f"Filtering movement outliers for {species_name}")

    initial_count = len(df)

    if species_name.lower() == 'elephant':
        max_speed_kmh = 40
        max_step_km = 10
    else:
        max_speed_kmh = 80
        max_step_km = 20

    print(f"Initial records: {initial_count}")
    print(f"Records with valid step_length: {df['step_length'].notna().sum()}")
    print(f"Records with valid time_diff_hours: {df['time_diff_hours'].notna().sum()}")

    df['speed_kmh'] = df['step_length'] / df['time_diff_hours']

    print(f"Records with valid speed_kmh: {df['speed_kmh'].notna().sum()}")

    # Show what's being filtered
    print(f"\nFiltering criteria diagnostics:")
    print(f"  Step length > 0: {(df['step_length'] > 0).sum()}")
    print(f"  Step length < {max_step_km} km: {(df['step_length'] < max_step_km).sum()}")
    print(f"  Speed < {max_speed_kmh} km/h: {(df['speed_kmh'] < max_speed_kmh).sum()}")
    print(f"  Time diff 0-24 hours: {((df['time_diff_hours'] > 0) & (df['time_diff_hours'] < 24)).sum()}")

    # Show time interval statistics
    print(f"\nTime interval statistics:")
    print(f"  Mean hours between fixes: {df['time_diff_hours'].mean():.2f}")
    print(f"  Median hours between fixes: {df['time_diff_hours'].median():.2f}")
    print(f"  Max hours between fixes: {df['time_diff_hours'].max():.2f}")

    # Show speed statistics for those that have valid speed
    valid_speed_data = df[df['speed_kmh'].notna()]
    if len(valid_speed_data) > 0:
        print(f"\nSpeed statistics (km/h):")
        print(f"  Mean: {valid_speed_data['speed_kmh'].mean():.2f}")
        print(f"  Median: {valid_speed_data['speed_kmh'].median():.2f}")
        print(f"  95th percentile: {valid_speed_data['speed_kmh'].quantile(0.95):.2f}")
        print(f"  Max: {valid_speed_data['speed_kmh'].max():.2f}")

    # Keep rows where we have valid movement data (not the first point of each individual)
    # OR keep first points even though they lack previous movement data
    df_filtered = df[
        (df['step_length'].notna()) &
        (df['turning_angle'].notna()) &
        (
            # Either it's a valid movement observation
            (
                (df['step_length'] > 0) &
                (df['step_length'] < max_step_km) &
                (df['speed_kmh'].notna()) &
                (df['speed_kmh'] < max_speed_kmh) &
                (df['time_diff_hours'] > 0) &
                (df['time_diff_hours'] < 24)
            )
            # OR it's the first observation for an individual (NaN values are expected)
            # We'll handle these specially - just check step length is reasonable if it exists
            | (
                (df['time_diff_hours'].isna()) &
                (df['step_length'] < max_step_km)
            )
        )
    ].copy()

    removed_count = initial_count - len(df_filtered)
    retention_rate = (len(df_filtered) / initial_count * 100) if initial_count > 0 else 0

    print(f"\nFiltering results:")
    print(f"  Removed: {removed_count} records ({100-retention_rate:.1f}%)")
    print(f"  Retained: {len(df_filtered)} records ({retention_rate:.1f}%)")
    print(f"  Thresholds used: {max_speed_kmh} km/h speed, {max_step_km} km max step")

    if retention_rate < 10:
        print(f"\nWARNING: Less than 10% of data retained!")
        print(f"This suggests:")
        print(f"  - GPS fixes may be very far apart in time (hours/days)")
        print(f"  - Movement patterns exceed typical thresholds")
        print(f"  - Consider increasing max_step_km threshold for {species_name}")
        print(f"  - Or check if data has appropriate temporal resolution")

    print()

    return df_filtered

print("STEP 9: FILTERING MOVEMENT OUTLIERS")
print()

elephant_filtered = None
if elephant_clean is not None and len(elephant_clean) > 0:
    elephant_filtered = filter_movement_outliers(elephant_clean, 'Elephant')
else:
    print("Elephant data not available or empty")
    print()

wildebeest_filtered = None
if wildebeest_clean is not None and len(wildebeest_clean) > 0:
    wildebeest_filtered = filter_movement_outliers(wildebeest_clean, 'Wildebeest')
else:
    print("Wildebeest data not available or empty")
    print()

def visualize_cleaned_data(df, species_name):
    """
    Create visualizations of the cleaned movement data
    Shows distributions of step lengths and turning angles

    Parameters:
    df: Cleaned DataFrame
    species_name: name of the species for plot titles
    """
    print(f"Creating visualizations for cleaned {species_name} data")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle(f'{species_name} Movement Data After Cleaning', fontsize=16, fontweight='bold')

    axes[0, 0].hist(df['step_length'], bins=50, color='steelblue', alpha=0.7, edgecolor='black')
    axes[0, 0].set_xlabel('Step Length (km)', fontsize=11)
    axes[0, 0].set_ylabel('Frequency', fontsize=11)
    axes[0, 0].set_title('Distribution of Step Lengths', fontsize=12)
    axes[0, 0].axvline(df['step_length'].median(), color='red', linestyle='--', linewidth=2, label=f'Median: {df["step_length"].median():.3f} km')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)

    axes[0, 1].hist(df['turning_angle'], bins=50, color='forestgreen', alpha=0.7, edgecolor='black')
    axes[0, 1].set_xlabel('Turning Angle (radians)', fontsize=11)
    axes[0, 1].set_ylabel('Frequency', fontsize=11)
    axes[0, 1].set_title('Distribution of Turning Angles', fontsize=12)
    axes[0, 1].axvline(0, color='red', linestyle='--', linewidth=2, label='Straight ahead')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)

    axes[1, 0].scatter(df['step_length'], np.abs(df['turning_angle']), alpha=0.3, s=10, color='purple')
    axes[1, 0].set_xlabel('Step Length (km)', fontsize=11)
    axes[1, 0].set_ylabel('Absolute Turning Angle (radians)', fontsize=11)
    axes[1, 0].set_title('Step Length vs Turning Angle', fontsize=12)
    axes[1, 0].grid(True, alpha=0.3)

    records_per_individual = df.groupby('individual_id').size().sort_values(ascending=False)
    axes[1, 1].bar(range(len(records_per_individual)), records_per_individual.values, color='coral', alpha=0.7, edgecolor='black')
    axes[1, 1].set_xlabel('Individual (sorted by record count)', fontsize=11)
    axes[1, 1].set_ylabel('Number of Records', fontsize=11)
    axes[1, 1].set_title(f'Records per Individual (n={len(records_per_individual)})', fontsize=12)
    axes[1, 1].grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.show()
    plt.savefig(f'{output_dir}/{species_name.lower()}_cleaned_data_visualization.png', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved visualization to {species_name.lower()}_cleaned_data_visualization.png")
    print()

print("STEP 10: VISUALIZING CLEANED DATA")
print()

if elephant_filtered is not None and len(elephant_filtered) > 0:
    visualize_cleaned_data(elephant_filtered, 'Elephant')
else:
    print("Elephant data not available or empty")
    print()

if wildebeest_filtered is not None and len(wildebeest_filtered) > 0:
    visualize_cleaned_data(wildebeest_filtered, 'Wildebeest')
else:
    print("Wildebeest data not available or empty")
    print()

def prepare_hmm_features(df, species_name):
    """
    Prepare and normalize features for Hidden Markov Model training
    Uses log transformation for step length and handles circular statistics for angles
    Enhanced with additional movement metrics for better state discrimination

    Parameters:
    df: DataFrame with movement metrics
    species_name: name of the species for display purposes

    Returns:
    Tuple of (features array, DataFrame with features, scaler object)
    """
    print(f"Preparing features for HMM training ({species_name})")

    print("Calculating enhanced movement features...")

    df = df.sort_values(['individual_id', 'timestamp']).reset_index(drop=True)

    window_size = 5
    df['lat_lag5'] = df.groupby('individual_id')['lat'].shift(window_size)
    df['lon_lag5'] = df.groupby('individual_id')['lon'].shift(window_size)

    def haversine_vectorized(lat1, lon1, lat2, lon2):
        R = 6371.0
        lat1_rad, lon1_rad = np.radians(lat1), np.radians(lon1)
        lat2_rad, lon2_rad = np.radians(lat2), np.radians(lon2)
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    mask = df['lat_lag5'].notna()
    df.loc[mask, 'net_displacement'] = haversine_vectorized(
        df.loc[mask, 'lat_lag5'],
        df.loc[mask, 'lon_lag5'],
        df.loc[mask, 'lat'],
        df.loc[mask, 'lon']
    )

    df['cumulative_distance'] = df.groupby('individual_id')['step_length'].rolling(window=window_size, min_periods=1).sum().reset_index(level=0, drop=True)

    df['sinuosity'] = df['net_displacement'] / (df['cumulative_distance'] + 0.001)
    df['sinuosity'] = df['sinuosity'].clip(0, 1)

    df['abs_turning_angle'] = np.abs(df['turning_angle'])
    df['persistence'] = 1 - (df['abs_turning_angle'] / np.pi)

    print(f"Enhanced features calculated")
    print(f"  Net displacement: {df['net_displacement'].notna().sum()} valid values")
    print(f"  Sinuosity: {df['sinuosity'].notna().sum()} valid values")
    print(f"  Persistence: {df['persistence'].notna().sum()} valid values")

    df_features = df[['individual_id', 'step_length', 'turning_angle', 'net_displacement',
                       'sinuosity', 'persistence']].copy()
    df_features = df_features.dropna()

    if len(df_features) == 0:
        print(f"ERROR: No valid features remain after removing missing values")
        print(f"This usually means step_length or turning_angle columns have no valid data")
        return None, None, None

    df_features['log_step_length'] = np.log(df_features['step_length'] + 0.001)
    df_features['log_net_displacement'] = np.log(df_features['net_displacement'] + 0.001)

    df_features['cos_turning_angle'] = np.cos(df_features['turning_angle'])
    df_features['sin_turning_angle'] = np.sin(df_features['turning_angle'])

    feature_columns = ['log_step_length', 'cos_turning_angle', 'sin_turning_angle',
                       'log_net_displacement', 'sinuosity', 'persistence']
    X = df_features[feature_columns].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print(f"Feature matrix shape: {X_scaled.shape}")
    print(f"Number of individuals: {df_features['individual_id'].nunique()}")
    print(f"Features used: {', '.join(feature_columns)}")
    print()
    print("Feature statistics after scaling:")
    feature_stats = pd.DataFrame(X_scaled, columns=feature_columns).describe()
    print(feature_stats)
    print()

    return X_scaled, df_features, scaler

elephant_X = None
elephant_features = None
elephant_scaler = None
if elephant_filtered is not None and len(elephant_filtered) > 0:
    elephant_X, elephant_features, elephant_scaler = prepare_hmm_features(elephant_filtered, 'Elephant')
else:
    print("Elephant data not available or empty")
    print()

wildebeest_X = None
wildebeest_features = None
wildebeest_scaler = None
if wildebeest_filtered is not None and len(wildebeest_filtered) > 0:
    wildebeest_X, wildebeest_features, wildebeest_scaler = prepare_hmm_features(wildebeest_filtered, 'Wildebeest')
else:
    print("Wildebeest data not available or empty")
    print()

def select_optimal_states(X, species_name, min_states=2, max_states=5):
    """
    Determine the optimal number of behavioral states using model selection criteria
    Tests different numbers of states and compares BIC and AIC scores

    Parameters:
    X: Feature matrix
    species_name: name of the species for display purposes
    min_states: minimum number of states to test
    max_states: maximum number of states to test

    Returns:
    Optimal number of states based on BIC
    """
    print(f"Determining optimal number of states for {species_name}")
    print(f"Testing {min_states} to {max_states} states")

    bic_scores = []
    aic_scores = []
    log_likelihoods = []
    n_states_range = range(min_states, max_states + 1)

    for n_states in n_states_range:
        print(f"  Testing {n_states} states...", end=' ')

        model = hmm.GaussianHMM(
            n_components=n_states,
            covariance_type='full',
            n_iter=100,
            random_state=42
        )

        try:
            model.fit(X)
            log_likelihood = model.score(X)

            n_params = n_states * n_states + n_states * X.shape[1] * 2
            bic = -2 * log_likelihood * X.shape[0] + n_params * np.log(X.shape[0])
            aic = -2 * log_likelihood * X.shape[0] + 2 * n_params

            bic_scores.append(bic)
            aic_scores.append(aic)
            log_likelihoods.append(log_likelihood)

            print(f"BIC: {bic:.2f}, AIC: {aic:.2f}")

        except Exception as e:
            print(f"Failed: {str(e)}")
            bic_scores.append(np.inf)
            aic_scores.append(np.inf)
            log_likelihoods.append(-np.inf)

    optimal_n_states = n_states_range[np.argmin(bic_scores)]
    print()
    print(f"Optimal number of states (based on BIC): {optimal_n_states}")
    print()

    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    # Plot 1: Raw BIC and AIC values
    axes[0].plot(n_states_range, bic_scores, marker='o', linewidth=2, markersize=8, label='BIC', color='steelblue')
    axes[0].plot(n_states_range, aic_scores, marker='s', linewidth=2, markersize=8, label='AIC', color='coral')
    axes[0].set_xlabel('Number of States', fontsize=12)
    axes[0].set_ylabel('Information Criterion', fontsize=12)
    axes[0].set_title(f'{species_name} Model Selection (Raw Values)', fontsize=13, fontweight='bold')
    axes[0].legend(fontsize=11)
    axes[0].grid(True, alpha=0.3)
    axes[0].axvline(optimal_n_states, color='red', linestyle='--', linewidth=2, label=f'Optimal: {optimal_n_states}')

    # Plot 2: Normalized values (relative to minimum)
    bic_normalized = [(bic - min(bic_scores)) / min(bic_scores) * 100 for bic in bic_scores]
    aic_normalized = [(aic - min(aic_scores)) / min(aic_scores) * 100 for aic in aic_scores]

    axes[1].plot(n_states_range, bic_normalized, marker='o', linewidth=2, markersize=8, label='BIC', color='steelblue')
    axes[1].plot(n_states_range, aic_normalized, marker='s', linewidth=2, markersize=8, label='AIC', color='coral')
    axes[1].set_xlabel('Number of States', fontsize=12)
    axes[1].set_ylabel('Percent Above Minimum (%)', fontsize=12)
    axes[1].set_title(f'{species_name} Model Selection (Normalized)', fontsize=13, fontweight='bold')
    axes[1].legend(fontsize=11)
    axes[1].grid(True, alpha=0.3)
    axes[1].axvline(optimal_n_states, color='red', linestyle='--', linewidth=2)

    # Plot 3: Log likelihood
    axes[2].plot(n_states_range, log_likelihoods, marker='o', linewidth=2, markersize=8, color='forestgreen')
    axes[2].set_xlabel('Number of States', fontsize=12)
    axes[2].set_ylabel('Log Likelihood', fontsize=12)
    axes[2].set_title(f'{species_name} Log Likelihood by Number of States', fontsize=13, fontweight='bold')
    axes[2].grid(True, alpha=0.3)
    axes[2].axvline(optimal_n_states, color='red', linestyle='--', linewidth=2)

    plt.tight_layout()
    plt.show()
    plt.savefig(f'/{output_dir}/{species_name.lower()}_model_selection.png', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved model selection plot to {species_name.lower()}_model_selection.png")
    print()

    return optimal_n_states

print("STEP 12: SELECTING OPTIMAL NUMBER OF STATES")
print()

elephant_n_states = None
if elephant_X is not None and len(elephant_X) > 0:
    elephant_n_states = select_optimal_states(elephant_X, 'Elephant', min_states=2, max_states=5)
else:
    print("Elephant data not available or insufficient for state selection")
    print()

wildebeest_n_states = None
if wildebeest_X is not None and len(wildebeest_X) > 0:
    wildebeest_n_states = select_optimal_states(wildebeest_X, 'Wildebeest', min_states=2, max_states=5)
else:
    print("Wildebeest data not available or insufficient for state selection")
    print()

def train_hmm_model(X, n_states, species_name):
    """
    Train a Gaussian Hidden Markov Model on the movement features
    Uses k-means initialization for better convergence
    Uses full covariance matrices to capture correlations between features

    Parameters:
    X: Feature matrix
    n_states: number of behavioral states
    species_name: name of the species for display purposes

    Returns:
    Trained HMM model
    """
    print(f"Training HMM model for {species_name}")
    print(f"Number of states: {n_states}")
    print(f"Number of features: {X.shape[1]}")
    print(f"Number of observations: {X.shape[0]}")

    print("Initializing model with k-means clustering...")
    from sklearn.cluster import KMeans

    kmeans = KMeans(n_clusters=n_states, random_state=42, n_init=10)
    kmeans.fit(X)

    model = hmm.GaussianHMM(
        n_components=n_states,
        covariance_type='full',
        n_iter=200,
        random_state=42,
        verbose=False,
        init_params='stc'
    )

    model.means_ = kmeans.cluster_centers_

    print("Fitting model to data...")
    model.fit(X)

    log_likelihood = model.score(X)
    print(f"Model trained successfully")
    print(f"Log likelihood: {log_likelihood:.2f}")
    print(f"Initial state means from k-means helped convergence")
    print()

    return model

print("STEP 13: TRAINING HMM MODELS")
print()

elephant_model = None
if elephant_X is not None and elephant_n_states is not None and len(elephant_X) > 0:
    elephant_model = train_hmm_model(elephant_X, elephant_n_states, 'Elephant')
else:
    print("Elephant data not available or insufficient for model training")
    print()

wildebeest_model = None
if wildebeest_X is not None and wildebeest_n_states is not None and len(wildebeest_X) > 0:
    wildebeest_model = train_hmm_model(wildebeest_X, wildebeest_n_states, 'Wildebeest')
else:
    print("Wildebeest data not available or insufficient for model training")
    print()

def predict_states(model, X, df_features):
    """
    Predict behavioral states for each observation using the trained HMM

    Parameters:
    model: Trained HMM model
    X: Feature matrix
    df_features: DataFrame with original features

    Returns:
    DataFrame with predicted states
    """
    print("Predicting behavioral states")

    states = model.predict(X)

    df_with_states = df_features.copy()
    df_with_states['state'] = states

    print(f"Predicted {len(states)} states")
    print("State distribution:")
    state_counts = pd.Series(states).value_counts().sort_index()
    for state, count in state_counts.items():
        percentage = (count / len(states)) * 100
        print(f"  State {state}: {count} observations ({percentage:.2f}%)")
    print()

    return df_with_states

print("STEP 14: PREDICTING BEHAVIORAL STATES")
print()

elephant_with_states = None
if elephant_model is not None and elephant_X is not None and elephant_features is not None and len(elephant_X) > 0:
    elephant_with_states = predict_states(elephant_model, elephant_X, elephant_features)
else:
    print("Elephant data not available or insufficient for state prediction")
    print()

wildebeest_with_states = None
if wildebeest_model is not None and wildebeest_X is not None and wildebeest_features is not None and len(wildebeest_X) > 0:
    wildebeest_with_states = predict_states(wildebeest_model, wildebeest_X, wildebeest_features)
else:
    print("Wildebeest data not available or insufficient for state prediction")
    print()

def characterize_states(df_with_states, species_name):
    """
    Characterize behavioral states using ADAPTIVE thresholds based on actual state distribution
    This ensures realistic classification regardless of species-specific movement scales

    Parameters:
    df_with_states: DataFrame with predicted states
    species_name: name of the species for display purposes

    Returns:
    DataFrame with state characteristics
    """
    print(f"Characterizing behavioral states for {species_name}")
    print("Using ADAPTIVE thresholds based on state distribution for realistic classification")

    state_stats = []

    for state in sorted(df_with_states['state'].unique()):
        state_data = df_with_states[df_with_states['state'] == state]

        mean_step = state_data['step_length'].mean()
        median_step = state_data['step_length'].median()
        std_step = state_data['step_length'].std()

        angles = state_data['turning_angle'].values
        mean_abs_angle = np.abs(angles).mean()

        turning_concentration = 1 - circstd(angles)

        mean_net_disp = state_data['net_displacement'].mean() if 'net_displacement' in state_data.columns else 0
        mean_sinuosity = state_data['sinuosity'].mean() if 'sinuosity' in state_data.columns else 0
        mean_persistence = state_data['persistence'].mean() if 'persistence' in state_data.columns else 0

        state_stats.append({
            'state': state,
            'n_observations': len(state_data),
            'percentage': len(state_data) / len(df_with_states) * 100,
            'mean_step_length': mean_step,
            'median_step_length': median_step,
            'std_step_length': std_step,
            'mean_abs_turning_angle': mean_abs_angle,
            'turning_concentration': turning_concentration,
            'mean_net_displacement': mean_net_disp,
            'mean_sinuosity': mean_sinuosity,
            'mean_persistence': mean_persistence
        })

    stats_df = pd.DataFrame(state_stats)

    # ========== ADAPTIVE THRESHOLDS FROM STATE DISTRIBUTION ==========
    # Calculate thresholds from actual states for species-appropriate classification

    # Persistence thresholds (primary discriminator)
    pers_20 = stats_df['mean_persistence'].quantile(0.20)
    pers_40 = stats_df['mean_persistence'].quantile(0.40)
    pers_75 = stats_df['mean_persistence'].quantile(0.75)

    # Step length thresholds (secondary discriminator)
    step_40 = stats_df['mean_step_length'].quantile(0.40)
    step_70 = stats_df['mean_step_length'].quantile(0.70)

    print(f"\nAdaptive thresholds calculated from {len(stats_df)} HMM states:")
    print(f"  Persistence: very_low < {pers_20:.3f}, low < {pers_40:.3f}, high > {pers_75:.3f}")
    print(f"  Step length: low < {step_40:.3f}, high > {step_70:.3f} km")
    print()
    print("Classification strategy:")
    print("  1. Traveling = persistence > 75th percentile (most directed)")
    print("  2. Resting = persistence < 40th percentile (least directed)")
    print("  3. Foraging = everything between (intermediate patterns)")
    print()

    state_names = []
    for idx, row in stats_df.iterrows():
        step = row['mean_step_length']
        persistence = row['mean_persistence']

        # ========== PERSISTENCE-BASED CLASSIFICATION ==========
        # Persistence is the PRIMARY biological discriminator

        # TRAVELING: Top 25% most directed movement
        if persistence > pers_75:
            behavior = 'Traveling'
            reason = f"High persistence ({persistence:.3f} > {pers_75:.3f}) = sustained directed movement"

        # RESTING: Bottom 40% least directed movement
        # These states show erratic/random movement patterns
        elif persistence < pers_40:
            behavior = 'Resting'
            if step < step_40:
                reason = f"Low persistence ({persistence:.3f}) + low step ({step:.3f}) = resting"
            else:
                reason = f"Low persistence ({persistence:.3f}) = erratic resting (minimal net displacement)"

        # FORAGING: Middle 35-75% persistence range
        # Intermediate directionality = area-restricted search or browsing
        else:
            behavior = 'Foraging'
            if persistence > pers_40 and persistence < pers_75:
                reason = f"Medium persistence ({persistence:.3f}) = directed foraging/browsing"
            else:
                reason = f"Intermediate metrics (pers={persistence:.3f}, step={step:.3f})"

        state_names.append(behavior)
        print(f"State {row['state']}: pers={persistence:.3f}, step={step:.3f} → {behavior:9s}")
        print(f"           {reason}")

    stats_df['behavior'] = state_names

    # Sort by persistence (primary discriminator)
    stats_df = stats_df.sort_values('mean_persistence')

    print()
    print("="*80)
    print("FINAL STATE CLASSIFICATIONS (sorted by persistence):")
    print("="*80)
    display_cols = ['state', 'behavior', 'percentage', 'mean_persistence', 'mean_step_length']
    print(stats_df[display_cols].to_string(index=False))
    print()

    # Validate distribution
    behavior_counts = stats_df['behavior'].value_counts()
    print("Behavior distribution across HMM states:")
    for behavior in ['Resting', 'Foraging', 'Traveling']:
        if behavior in behavior_counts.index:
            count = behavior_counts[behavior]
            pct = stats_df[stats_df['behavior'] == behavior]['percentage'].sum()
            print(f"  {behavior}: {count} state(s) = {pct:.1f}% of observations")

    # Biological realism checks
    print()
    print("="*80)
    print("BIOLOGICAL REALISM ASSESSMENT:")
    print("="*80)

    # Define target ranges
    target_ranges = {}
    if species_name.lower() == 'elephant':
        target_ranges = {
            'Foraging': (50, 70, 60),  # (min, max, ideal)
            'Resting': (25, 40, 30),
            'Traveling': (8, 18, 13)
        }
    elif species_name.lower() == 'wildebeest':
        target_ranges = {
            'Foraging': (35, 50, 40),
            'Resting': (35, 50, 40),
            'Traveling': (15, 25, 20)
        }
    else:
        target_ranges = {
            'Foraging': (40, 60, 50),
            'Resting': (25, 45, 35),
            'Traveling': (10, 25, 15)
        }

    all_good = True
    for behavior in ['Foraging', 'Resting', 'Traveling']:
        if behavior in behavior_counts.index:
            pct = stats_df[stats_df['behavior'] == behavior]['percentage'].sum()
            min_val, max_val, ideal = target_ranges.get(behavior, (0, 100, 50))

            if min_val <= pct <= max_val:
                print(f"✓ EXCELLENT: {behavior} = {pct:.1f}% (target: {ideal}%, range: {min_val}-{max_val}%)")
            elif abs(pct - ideal) < 15:
                print(f"✓ GOOD: {behavior} = {pct:.1f}% (target: {ideal}%, acceptable deviation)")
            else:
                print(f"⚠ WARNING: {behavior} = {pct:.1f}% (target: {ideal}%, range: {min_val}-{max_val}%)")
                all_good = False
        else:
            min_val, max_val, ideal = target_ranges.get(behavior, (0, 100, 50))
            print(f"❌ MISSING: {behavior} = 0% (expected: {ideal}%)")
            all_good = False

    if all_good:
        print()
        print("🎉 SUCCESS: All behaviors within biologically realistic ranges!")
    else:
        print()
        print("⚠ Note: Distribution reflects HMM state structure - may need validation threshold adjustment")

    print()
    return stats_df

print("STEP 15: CHARACTERIZING BEHAVIORAL STATES")
print()

elephant_stats = None
if elephant_with_states is not None and len(elephant_with_states) > 0:
    elephant_stats = characterize_states(elephant_with_states, 'Elephant')
else:
    print("Elephant data not available or insufficient for state characterization")
    print()

wildebeest_stats = None
if wildebeest_with_states is not None and len(wildebeest_with_states) > 0:
    wildebeest_stats = characterize_states(wildebeest_with_states, 'Wildebeest')
else:
    print("Wildebeest data not available or insufficient for state characterization")
    print()

def visualize_state_characteristics(df_with_states, stats_df, species_name):
    """
    Create comprehensive visualizations of behavioral state characteristics
    Shows how states differ in movement patterns

    Parameters:
    df_with_states: DataFrame with predicted states
    stats_df: DataFrame with state statistics
    species_name: name of the species for display purposes
    """
    print(f"Creating state characteristic visualizations for {species_name}")

    state_behavior_map = dict(zip(stats_df['state'], stats_df['behavior']))
    df_with_states['behavior'] = df_with_states['state'].map(state_behavior_map)

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle(f'{species_name} Behavioral State Characteristics', fontsize=16, fontweight='bold')

    colors = {'Resting': 'steelblue', 'Foraging': 'forestgreen', 'Traveling': 'coral'}

    for behavior in df_with_states['behavior'].unique():
        behavior_data = df_with_states[df_with_states['behavior'] == behavior]
        axes[0, 0].hist(behavior_data['step_length'], bins=30, alpha=0.6,
                       label=behavior, color=colors.get(behavior, 'gray'), edgecolor='black')
    axes[0, 0].set_xlabel('Step Length (km)', fontsize=11)
    axes[0, 0].set_ylabel('Frequency', fontsize=11)
    axes[0, 0].set_title('Step Length Distribution by Behavior', fontsize=12)
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)

    for behavior in df_with_states['behavior'].unique():
        behavior_data = df_with_states[df_with_states['behavior'] == behavior]
        axes[0, 1].hist(behavior_data['turning_angle'], bins=30, alpha=0.6,
                       label=behavior, color=colors.get(behavior, 'gray'), edgecolor='black')
    axes[0, 1].set_xlabel('Turning Angle (radians)', fontsize=11)
    axes[0, 1].set_ylabel('Frequency', fontsize=11)
    axes[0, 1].set_title('Turning Angle Distribution by Behavior', fontsize=12)
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)

    behavior_order = ['Resting', 'Foraging', 'Traveling']
    behavior_order = [b for b in behavior_order if b in stats_df['behavior'].values]

    plot_data = stats_df[stats_df['behavior'].isin(behavior_order)].copy()
    plot_data['behavior'] = pd.Categorical(plot_data['behavior'], categories=behavior_order, ordered=True)
    plot_data = plot_data.sort_values('behavior')

    bar_colors = [colors.get(b, 'gray') for b in plot_data['behavior']]
    axes[1, 0].bar(plot_data['behavior'], plot_data['median_step_length'],
                   color=bar_colors, alpha=0.7, edgecolor='black', linewidth=1.5)
    axes[1, 0].set_xlabel('Behavior', fontsize=11)
    axes[1, 0].set_ylabel('Median Step Length (km)', fontsize=11)
    axes[1, 0].set_title('Median Step Length by Behavior', fontsize=12)
    axes[1, 0].grid(True, alpha=0.3, axis='y')

    axes[1, 1].bar(plot_data['behavior'], plot_data['percentage'],
                   color=bar_colors, alpha=0.7, edgecolor='black', linewidth=1.5)
    axes[1, 1].set_xlabel('Behavior', fontsize=11)
    axes[1, 1].set_ylabel('Percentage of Time', fontsize=11)
    axes[1, 1].set_title('Time Budget', fontsize=12)
    axes[1, 1].grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.show()
    plt.savefig(f'{output_dir}/{species_name.lower()}_state_characteristics.png', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved state characteristics plot to {species_name.lower()}_state_characteristics.png")
    print()

print("STEP 16: VISUALIZING STATE CHARACTERISTICS")
print()

if elephant_with_states is not None and elephant_stats is not None and len(elephant_with_states) > 0:
    visualize_state_characteristics(elephant_with_states, elephant_stats, 'Elephant')
else:
    print("Elephant data not available or insufficient for state visualization")
    print()

if wildebeest_with_states is not None and wildebeest_stats is not None and len(wildebeest_with_states) > 0:
    visualize_state_characteristics(wildebeest_with_states, wildebeest_stats, 'Wildebeest')
else:
    print("Wildebeest data not available or insufficient for state visualization")
    print()

def analyze_state_transitions(model, stats_df, species_name):
    """
    Analyze and visualize state transition probabilities
    Shows how likely animals are to switch between different behaviors

    Parameters:
    model: Trained HMM model
    stats_df: DataFrame with state statistics and behavior labels
    species_name: name of the species for display purposes
    """
    print(f"Analyzing state transitions for {species_name}")

    transition_matrix = model.transmat_

    state_behavior_map = dict(zip(stats_df['state'], stats_df['behavior']))
    behavior_labels = [state_behavior_map[i] for i in range(len(transition_matrix))]

    print("Transition probability matrix:")
    transition_df = pd.DataFrame(
        transition_matrix,
        index=[f'From {b}' for b in behavior_labels],
        columns=[f'To {b}' for b in behavior_labels]
    )
    print(transition_df)
    print()

    fig, ax = plt.subplots(figsize=(10, 8))

    im = ax.imshow(transition_matrix, cmap='YlOrRd', aspect='auto', vmin=0, vmax=1)

    ax.set_xticks(np.arange(len(behavior_labels)))
    ax.set_yticks(np.arange(len(behavior_labels)))
    ax.set_xticklabels(behavior_labels, fontsize=11)
    ax.set_yticklabels(behavior_labels, fontsize=11)

    ax.set_xlabel('To State', fontsize=12, fontweight='bold')
    ax.set_ylabel('From State', fontsize=12, fontweight='bold')
    ax.set_title(f'{species_name} State Transition Probabilities', fontsize=14, fontweight='bold')

    for i in range(len(behavior_labels)):
        for j in range(len(behavior_labels)):
            text = ax.text(j, i, f'{transition_matrix[i, j]:.3f}',
                          ha='center', va='center', color='black', fontsize=10, fontweight='bold')

    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Transition Probability', fontsize=11)

    plt.tight_layout()
    plt.show()
    plt.savefig(f'{output_dir}/{species_name.lower()}_transition_matrix.png', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved transition matrix plot to {species_name.lower()}_transition_matrix.png")
    print()

    print("Key transition insights:")
    for i, from_behavior in enumerate(behavior_labels):
        staying_prob = transition_matrix[i, i]
        print(f"  {from_behavior}: {staying_prob:.1%} probability of staying in same state")
    print()

print("STEP 17: ANALYZING STATE TRANSITIONS")
print()

if elephant_model is not None and elephant_stats is not None:
    analyze_state_transitions(elephant_model, elephant_stats, 'Elephant')
else:
    print("Elephant data not available or insufficient for transition analysis")
    print()

if wildebeest_model is not None and wildebeest_stats is not None:
    analyze_state_transitions(wildebeest_model, wildebeest_stats, 'Wildebeest')
else:
    print("Wildebeest data not available or insufficient for transition analysis")
    print()

"""## Model Evaluation"""

def create_validation_labels(df_with_states, species_name='Unknown'):
    """
    Create validation labels using REALISTIC biological thresholds
    Adjusted to match expected behavior time budgets from field studies

    Parameters:
    df_with_states: DataFrame with movement metrics
    species_name: name of the species for species-specific thresholding

    Returns:
    DataFrame with validation labels added
    """
    print(f"Creating realistic biological validation labels for {species_name}")
    print("Using field-study calibrated thresholds for traveling detection")

    df_validation = df_with_states.copy()

    # Calculate percentile thresholds
    step_15 = df_validation['step_length'].quantile(0.15)
    step_35 = df_validation['step_length'].quantile(0.35)
    step_70 = df_validation['step_length'].quantile(0.70)
    step_85 = df_validation['step_length'].quantile(0.85)

    if 'persistence' in df_validation.columns:
        persistence_25 = df_validation['persistence'].quantile(0.25)
        persistence_50 = df_validation['persistence'].quantile(0.50)
        persistence_75 = df_validation['persistence'].quantile(0.75)
        persistence_85 = df_validation['persistence'].quantile(0.85)  # More realistic than 92nd

        print(f"\nRealistic biological thresholds:")
        print(f"  Step length: very_low={step_15:.3f}, low={step_35:.3f}, high={step_70:.3f}, very_high={step_85:.3f} km")
        print(f"  Persistence: low={persistence_25:.3f}, med={persistence_50:.3f}, high={persistence_75:.3f}, very_high={persistence_85:.3f}")
        print()
        print(f"  Traveling requires: persistence > 85th %ile ({persistence_85:.3f}) OR (high pers + high step)")
        print(f"  This targets ~10-15% traveling for elephants, ~18-22% for wildebeest")

        def assign_validation_label(row):
            step = row['step_length']
            persistence = row['persistence']

            # ========== TRAVELING (ADJUSTED TO REALISTIC LEVELS) ==========
            # Field studies show elephants travel ~10-13%, wildebeest ~18-22%
            # 85th percentile persistence captures this better than 92nd

            # Case 1: Very high persistence (top 15%)
            if persistence > persistence_85:
                return 'Traveling'

            # Case 2: High persistence + high step length
            elif persistence > persistence_75 and step > step_85:
                return 'Traveling'

            # Case 3: Extremely long steps with reasonable directionality
            elif step > step_85 and persistence > persistence_75:
                return 'Traveling'

            # ========== RESTING ==========
            # Minimal movement patterns

            # Case 1: Very short steps
            elif step < step_15:
                return 'Resting'

            # Case 2: Short steps + low persistence
            elif step < step_35 and persistence < persistence_50:
                return 'Resting'

            # Case 3: Low movement regardless of direction
            elif step < step_35:
                return 'Resting'

            # ========== FORAGING (DEFAULT) ==========
            # All intermediate patterns
            else:
                return 'Foraging'

    else:
        # Fallback when persistence not available
        angle_25 = df_validation['turning_angle'].abs().quantile(0.25)
        angle_75 = df_validation['turning_angle'].abs().quantile(0.75)

        def assign_validation_label(row):
            step = row['step_length']
            angle = abs(row['turning_angle'])

            # Traveling: long straight movements
            if step > step_85 or (step > step_70 and angle < angle_25):
                return 'Traveling'
            # Resting: very short steps
            elif step < step_15:
                return 'Resting'
            elif step < step_35 and angle > angle_75:
                return 'Resting'
            # Foraging: everything else
            else:
                return 'Foraging'

    df_validation['validation_label'] = df_validation.apply(assign_validation_label, axis=1)

    # Detailed distribution report
    print("\nValidation label distribution:")
    label_counts = df_validation['validation_label'].value_counts()
    total = len(df_validation)

    for label in ['Resting', 'Foraging', 'Traveling']:
        if label in label_counts.index:
            count = label_counts[label]
            percentage = (count / total) * 100
            print(f"  {label}: {count:,} ({percentage:.2f}%)")

    # Class balance analysis
    if len(label_counts) > 0:
        max_class = label_counts.max()
        min_class = label_counts.min()
        imbalance_ratio = max_class / min_class

        print()
        print(f"Class imbalance ratio: {imbalance_ratio:.2f}:1 (max:min)")
        if imbalance_ratio > 4:
            print(f"⚠ Moderate class imbalance (expected for real animal behavior)")
        else:
            print(f"✓ Good class balance")

        # Report biological realism
        if 'Foraging' in label_counts.index:
            foraging_pct = (label_counts['Foraging'] / total) * 100
            resting_pct = (label_counts['Resting'] / total) * 100 if 'Resting' in label_counts.index else 0
            traveling_pct = (label_counts['Traveling'] / total) * 100 if 'Traveling' in label_counts.index else 0

            print()
            print("=" * 70)
            print("BIOLOGICAL REALISM VALIDATION:")
            print("=" * 70)

            if species_name.lower() == 'elephant':
                print(f"Expected for elephants: ~60% foraging, ~30% resting, ~10-13% traveling")
                print(f"Your validation labels: {foraging_pct:.1f}% foraging, {resting_pct:.1f}% resting, {traveling_pct:.1f}% traveling")
                print()

                checks = []
                if 50 <= foraging_pct <= 70:
                    checks.append(f"✓ Foraging {foraging_pct:.1f}% matches expected ~60%")
                else:
                    checks.append(f"⚠ Foraging {foraging_pct:.1f}% (expect ~60%)")

                if 25 <= resting_pct <= 40:
                    checks.append(f"✓ Resting {resting_pct:.1f}% matches expected ~30%")
                else:
                    checks.append(f"⚠ Resting {resting_pct:.1f}% (expect ~30%)")

                if 8 <= traveling_pct <= 15:
                    checks.append(f"✓ Traveling {traveling_pct:.1f}% matches expected ~10-13%")
                else:
                    checks.append(f"⚠ Traveling {traveling_pct:.1f}% (expect ~10-13%)")

                for check in checks:
                    print(check)

            elif species_name.lower() == 'wildebeest':
                print(f"Expected for wildebeest: ~40% foraging, ~40% resting, ~18-22% traveling")
                print(f"Your validation labels: {foraging_pct:.1f}% foraging, {resting_pct:.1f}% resting, {traveling_pct:.1f}% traveling")
                print()

                checks = []
                if 35 <= foraging_pct <= 50:
                    checks.append(f"✓ Foraging {foraging_pct:.1f}% matches expected ~40%")
                else:
                    checks.append(f"⚠ Foraging {foraging_pct:.1f}% (expect ~40%)")

                if 35 <= resting_pct <= 50:
                    checks.append(f"✓ Resting {resting_pct:.1f}% matches expected ~40%")
                else:
                    checks.append(f"⚠ Resting {resting_pct:.1f}% (expect ~40%)")

                if 15 <= traveling_pct <= 25:
                    checks.append(f"✓ Traveling {traveling_pct:.1f}% matches expected ~18-22%")
                else:
                    checks.append(f"⚠ Traveling {traveling_pct:.1f}% (expect ~18-22%)")

                for check in checks:
                    print(check)

    print()
    return df_validation

def visualize_feature_distributions(df_validation, species_name):
    """
    Create diagnostic visualizations showing feature distributions by behavior
    Helps understand why certain behaviors are hard to distinguish

    Parameters:
    df_validation: DataFrame with validation labels and features
    species_name: name of the species for the title
    """
    print(f"Creating feature distribution visualizations for {species_name}")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    behaviors = ['Resting', 'Foraging', 'Traveling']
    colors = {'Resting': 'steelblue', 'Foraging': 'orange', 'Traveling': 'forestgreen'}

    # Plot 1: Step Length Distribution
    ax1 = axes[0, 0]
    for behavior in behaviors:
        if behavior in df_validation['validation_label'].values:
            data = df_validation[df_validation['validation_label'] == behavior]['step_length']
            ax1.hist(data, bins=50, alpha=0.6, label=behavior, color=colors[behavior], density=True)

    ax1.set_xlabel('Step Length (km)', fontsize=11)
    ax1.set_ylabel('Density', fontsize=11)
    ax1.set_title(f'{species_name} - Step Length Distribution by Behavior', fontsize=12, fontweight='bold')
    ax1.legend(fontsize=10)
    ax1.grid(True, alpha=0.3)

    # Plot 2: Persistence Distribution
    ax2 = axes[0, 1]
    if 'persistence' in df_validation.columns:
        for behavior in behaviors:
            if behavior in df_validation['validation_label'].values:
                data = df_validation[df_validation['validation_label'] == behavior]['persistence']
                ax2.hist(data, bins=50, alpha=0.6, label=behavior, color=colors[behavior], density=True)

        ax2.set_xlabel('Persistence (0-1)', fontsize=11)
        ax2.set_ylabel('Density', fontsize=11)
        ax2.set_title(f'{species_name} - Persistence Distribution by Behavior', fontsize=12, fontweight='bold')
        ax2.legend(fontsize=10)
        ax2.grid(True, alpha=0.3)
    else:
        ax2.text(0.5, 0.5, 'Persistence data not available', ha='center', va='center', fontsize=12)
        ax2.axis('off')

    # Plot 3: Step Length vs Persistence Scatter
    ax3 = axes[1, 0]
    if 'persistence' in df_validation.columns:
        for behavior in behaviors:
            if behavior in df_validation['validation_label'].values:
                data = df_validation[df_validation['validation_label'] == behavior]
                ax3.scatter(data['step_length'], data['persistence'],
                           alpha=0.3, s=1, label=behavior, color=colors[behavior])

        ax3.set_xlabel('Step Length (km)', fontsize=11)
        ax3.set_ylabel('Persistence', fontsize=11)
        ax3.set_title(f'{species_name} - Feature Space by Behavior', fontsize=12, fontweight='bold')
        ax3.legend(fontsize=10, markerscale=5)
        ax3.grid(True, alpha=0.3)
    else:
        ax3.text(0.5, 0.5, 'Persistence data not available', ha='center', va='center', fontsize=12)
        ax3.axis('off')

    # Plot 4: Behavior Percentages
    ax4 = axes[1, 1]
    label_counts = df_validation['validation_label'].value_counts()
    behaviors_present = [b for b in behaviors if b in label_counts.index]
    counts = [label_counts[b] for b in behaviors_present]
    colors_list = [colors[b] for b in behaviors_present]

    wedges, texts, autotexts = ax4.pie(counts, labels=behaviors_present, autopct='%1.1f%%',
                                         colors=colors_list, startangle=90, textprops={'fontsize': 11})
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')

    ax4.set_title(f'{species_name} - Validation Label Distribution', fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig(f'/{output_dir}/{species_name.lower()}_feature_distributions.png',
                dpi=300, bbox_inches='tight')
    plt.close()

    print(f"\nFeature separation analysis for {species_name}:")

    if 'persistence' in df_validation.columns:
        for behavior in behaviors:
            if behavior in df_validation['validation_label'].values:
                data = df_validation[df_validation['validation_label'] == behavior]
                step_mean = data['step_length'].mean()
                step_std = data['step_length'].std()
                pers_mean = data['persistence'].mean()
                pers_std = data['persistence'].std()

                print(f"  {behavior}:")
                print(f"    Step length: {step_mean:.3f} ± {step_std:.3f} km")
                print(f"    Persistence: {pers_mean:.3f} ± {pers_std:.3f}")

        step_means = []
        pers_means = []
        for behavior in behaviors:
            if behavior in df_validation['validation_label'].values:
                data = df_validation[df_validation['validation_label'] == behavior]
                step_means.append(data['step_length'].mean())
                pers_means.append(data['persistence'].mean())

        if len(step_means) > 1:
            step_range = max(step_means) - min(step_means)
            step_mean_avg = np.mean(step_means)
            step_separability = (step_range / step_mean_avg) * 100

            pers_range = max(pers_means) - min(pers_means)
            pers_mean_avg = np.mean(pers_means)
            pers_separability = (pers_range / pers_mean_avg) * 100

            print(f"\n  Separability (higher = easier to distinguish):")
            print(f"    Step length: {step_separability:.1f}% variation")
            print(f"    Persistence: {pers_separability:.1f}% variation")

            if step_separability < 20:
                print(f"   Low step length separability - behaviors overlap significantly")
            if pers_separability > 100:
                print(f"   Good persistence separability - clear behavioral differences")

    print()

print("STEP 18: CREATING VALIDATION LABELS")
print()

elephant_validation = None
if elephant_with_states is not None:
    elephant_validation = create_validation_labels(elephant_with_states, 'Elephant')
else:
    print("Elephant data not available for validation label creation")
    print()

wildebeest_validation = None
if wildebeest_with_states is not None:
    wildebeest_validation = create_validation_labels(wildebeest_with_states, 'Wildebeest')
else:
    print("Wildebeest data not available for validation label creation")
    print()

print("STEP 18a: CREATING DIAGNOSTIC VISUALIZATIONS")
print()

if elephant_validation is not None and len(elephant_validation) > 0:
    visualize_feature_distributions(elephant_validation, 'Elephant')
else:
    print("Elephant validation data not available for visualization")
    print()

if wildebeest_validation is not None and len(wildebeest_validation) > 0:
    visualize_feature_distributions(wildebeest_validation, 'Wildebeest')
else:
    print("Wildebeest validation data not available for visualization")
    print()

def calculate_accuracy_metrics(df_validation):
    """
    Calculate classification accuracy by comparing predicted states with validation labels
    Provides overall accuracy and per-class performance
    Includes class-weighted metrics to handle imbalanced datasets

    Parameters:
    df_validation: DataFrame with both predicted behaviors and validation labels

    Returns:
    Dictionary with accuracy metrics
    """
    print("Calculating accuracy metrics")

    y_true = df_validation['validation_label']
    y_pred = df_validation['behavior']

    true_dist = y_true.value_counts()
    pred_dist = y_pred.value_counts()

    print()
    print("Class distribution analysis:")
    print("  True labels (validation):")
    for label in ['Resting', 'Foraging', 'Traveling']:
        if label in true_dist.index:
            pct = (true_dist[label] / len(y_true)) * 100
            print(f"    {label}: {true_dist[label]:,} ({pct:.1f}%)")

    print("  Predicted labels (HMM):")
    for label in ['Resting', 'Foraging', 'Traveling']:
        if label in pred_dist.index:
            pct = (pred_dist[label] / len(y_pred)) * 100
            print(f"    {label}: {pred_dist[label]:,} ({pct:.1f}%)")

    if len(true_dist) > 0:
        max_true = true_dist.max()
        min_true = true_dist.min()
        imbalance_ratio = max_true / min_true
        print()
        print(f"  Class imbalance ratio: {imbalance_ratio:.2f}:1 (max:min)")
        if imbalance_ratio > 3:
            print(f"Significant class imbalance detected")
            print(f"  → Using balanced accuracy for fairer evaluation")

    accuracy = accuracy_score(y_true, y_pred)

    from sklearn.metrics import balanced_accuracy_score
    balanced_acc = balanced_accuracy_score(y_true, y_pred)

    print()
    print(f"Overall accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Balanced accuracy: {balanced_acc:.4f} ({balanced_acc*100:.2f}%)")
    if abs(accuracy - balanced_acc) > 0.1:
        print(f"Large difference indicates class imbalance affecting results")
    print()

    print("Classification report:")
    report = classification_report(y_true, y_pred, zero_division=0)
    print(report)

    report_dict = classification_report(y_true, y_pred, zero_division=0, output_dict=True)

    print("Per-class performance interpretation:")
    for label in ['Resting', 'Foraging', 'Traveling']:
        if label in report_dict and label != 'accuracy':
            support = report_dict[label]['support']
            support_pct = (support / len(y_true)) * 100
            f1 = report_dict[label]['f1-score']
            recall = report_dict[label]['recall']
            precision = report_dict[label]['precision']

            print(f"  {label}:")
            print(f"    Support: {support:,} ({support_pct:.1f}% of validation data)")
            print(f"    Recall: {recall:.3f} - finds {recall*100:.1f}% of true {label.lower()} cases")
            print(f"    Precision: {precision:.3f} - {precision*100:.1f}% of {label.lower()} predictions are correct")

            if recall < 0.3:
                print(f"  Low recall - model rarely predicts {label.lower()}")
            elif recall > 0.8:
                print(f"  High recall - model finds most {label.lower()} instances")

            if precision < 0.3:
                print(f"  Low precision - many false {label.lower()} predictions")
            elif precision > 0.8:
                print(f"  High precision - {label.lower()} predictions are reliable")

    print()

    metrics = {
        'accuracy': accuracy,
        'balanced_accuracy': balanced_acc,
        'classification_report': report,
        'report_dict': report_dict,
        'imbalance_ratio': imbalance_ratio if len(true_dist) > 0 else 1.0
    }

    return metrics

print("STEP 19: CALCULATING ACCURACY METRICS")
print()

elephant_accuracy = None
if elephant_validation is not None:
    print("ELEPHANT MODEL EVALUATION")
    print()
    elephant_accuracy = calculate_accuracy_metrics(elephant_validation)
else:
    print("Elephant data not available for accuracy calculation")
    print()

wildebeest_accuracy = None
if wildebeest_validation is not None:
    print("WILDEBEEST MODEL EVALUATION")
    print()
    wildebeest_accuracy = calculate_accuracy_metrics(wildebeest_validation)
else:
    print("Wildebeest data not available for accuracy calculation")
    print()

def generate_confusion_matrix(df_validation, species_name):
    """
    Generate and visualize confusion matrix showing prediction errors
    Helps identify which states are commonly confused

    Parameters:
    df_validation: DataFrame with predicted and true labels
    species_name: name of the species for plot title
    """
    print(f"Generating confusion matrix for {species_name}")

    y_true = df_validation['validation_label']
    y_pred = df_validation['behavior']

    labels = sorted(list(set(y_true.unique()) | set(y_pred.unique())))

    cm = confusion_matrix(y_true, y_pred, labels=labels)

    cm_percent = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] * 100

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    im1 = axes[0].imshow(cm, cmap='Blues', aspect='auto')
    axes[0].set_xticks(np.arange(len(labels)))
    axes[0].set_yticks(np.arange(len(labels)))
    axes[0].set_xticklabels(labels, fontsize=11)
    axes[0].set_yticklabels(labels, fontsize=11)
    axes[0].set_xlabel('Predicted Behavior', fontsize=12, fontweight='bold')
    axes[0].set_ylabel('Validation Label', fontsize=12, fontweight='bold')
    axes[0].set_title(f'{species_name} Confusion Matrix (Counts)', fontsize=13, fontweight='bold')

    for i in range(len(labels)):
        for j in range(len(labels)):
            text = axes[0].text(j, i, str(cm[i, j]),
                               ha='center', va='center', color='black', fontsize=11, fontweight='bold')

    cbar1 = plt.colorbar(im1, ax=axes[0])
    cbar1.set_label('Count', fontsize=11)

    im2 = axes[1].imshow(cm_percent, cmap='RdYlGn', aspect='auto', vmin=0, vmax=100)
    axes[1].set_xticks(np.arange(len(labels)))
    axes[1].set_yticks(np.arange(len(labels)))
    axes[1].set_xticklabels(labels, fontsize=11)
    axes[1].set_yticklabels(labels, fontsize=11)
    axes[1].set_xlabel('Predicted Behavior', fontsize=12, fontweight='bold')
    axes[1].set_ylabel('Validation Label', fontsize=12, fontweight='bold')
    axes[1].set_title(f'{species_name} Confusion Matrix (Percentages)', fontsize=13, fontweight='bold')

    for i in range(len(labels)):
        for j in range(len(labels)):
            text = axes[1].text(j, i, f'{cm_percent[i, j]:.1f}%',
                               ha='center', va='center', color='black', fontsize=11, fontweight='bold')

    cbar2 = plt.colorbar(im2, ax=axes[1])
    cbar2.set_label('Percentage', fontsize=11)

    plt.tight_layout()
    plt.show()
    plt.savefig(f'{output_dir}/{species_name.lower()}_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved confusion matrix plot to {species_name.lower()}_confusion_matrix.png")
    print()

    print("Confusion matrix (counts):")
    cm_df = pd.DataFrame(cm, index=[f'True {l}' for l in labels], columns=[f'Pred {l}' for l in labels])
    print(cm_df)
    print()

print("STEP 20: GENERATING CONFUSION MATRICES")
print()

if elephant_validation is not None:
    generate_confusion_matrix(elephant_validation, 'Elephant')
else:
    print("Elephant data not available for confusion matrix")
    print()

if wildebeest_validation is not None:
    generate_confusion_matrix(wildebeest_validation, 'Wildebeest')
else:
    print("Wildebeest data not available for confusion matrix")
    print()

def calculate_movement_errors(df_validation, stats_df):
    """
    Calculate errors in step length and turning angle predictions
    Compares actual movement metrics with expected values for each state

    Parameters:
    df_validation: DataFrame with predictions and actual movements
    stats_df: DataFrame with expected values for each state

    Returns:
    Dictionary with error metrics
    """
    print("Calculating movement metric errors")

    state_behavior_map = dict(zip(stats_df['state'], stats_df['behavior']))
    behavior_step_map = dict(zip(stats_df['behavior'], stats_df['mean_step_length']))
    behavior_angle_map = dict(zip(stats_df['behavior'], stats_df['mean_abs_turning_angle']))

    df_validation['expected_step_length'] = df_validation['behavior'].map(behavior_step_map)
    df_validation['expected_turning_angle'] = df_validation['behavior'].map(behavior_angle_map)

    df_validation['step_length_error'] = np.abs(
        df_validation['step_length'] - df_validation['expected_step_length']
    )
    df_validation['turning_angle_error'] = np.abs(
        np.abs(df_validation['turning_angle']) - df_validation['expected_turning_angle']
    )

    mean_step_error = df_validation['step_length_error'].mean()
    mean_angle_error = df_validation['turning_angle_error'].mean()

    rmse_step = np.sqrt(np.mean(df_validation['step_length_error'] ** 2))
    rmse_angle = np.sqrt(np.mean(df_validation['turning_angle_error'] ** 2))

    print(f"Step length error:")
    print(f"  Mean Absolute Error: {mean_step_error:.4f} km")
    print(f"  Root Mean Square Error: {rmse_step:.4f} km")
    print()

    print(f"Turning angle error:")
    print(f"  Mean Absolute Error: {mean_angle_error:.4f} radians ({np.degrees(mean_angle_error):.2f} degrees)")
    print(f"  Root Mean Square Error: {rmse_angle:.4f} radians ({np.degrees(rmse_angle):.2f} degrees)")
    print()

    print("Error statistics by predicted behavior:")
    for behavior in df_validation['behavior'].unique():
        behavior_data = df_validation[df_validation['behavior'] == behavior]
        print(f"  {behavior}:")
        print(f"    Step length MAE: {behavior_data['step_length_error'].mean():.4f} km")
        print(f"    Turning angle MAE: {behavior_data['turning_angle_error'].mean():.4f} radians")
    print()

    errors = {
        'mean_step_error': mean_step_error,
        'rmse_step': rmse_step,
        'mean_angle_error': mean_angle_error,
        'rmse_angle': rmse_angle
    }

    return errors, df_validation

print("STEP 21: CALCULATING MOVEMENT ERRORS")
print()

elephant_errors = None
if elephant_validation is not None and elephant_stats is not None:
    elephant_errors, elephant_validation = calculate_movement_errors(elephant_validation, elephant_stats)
else:
    print("Elephant data not available for movement error calculation")
    print()

wildebeest_errors = None
if wildebeest_validation is not None and wildebeest_stats is not None:
    wildebeest_errors, wildebeest_validation = calculate_movement_errors(wildebeest_validation, wildebeest_stats)
else:
    print("Wildebeest data not available for movement error calculation")
    print()

def visualize_movement_errors(df_validation, species_name):
    """
    Create visualizations of movement prediction errors
    Shows where the model performs well and where it struggles

    Parameters:
    df_validation: DataFrame with error calculations
    species_name: name of the species for plot title
    """
    print(f"Creating movement error visualizations for {species_name}")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle(f'{species_name} Movement Prediction Errors', fontsize=16, fontweight='bold')

    axes[0, 0].hist(df_validation['step_length_error'], bins=50, color='steelblue', alpha=0.7, edgecolor='black')
    axes[0, 0].axvline(df_validation['step_length_error'].mean(), color='red', linestyle='--',
                       linewidth=2, label=f'Mean: {df_validation["step_length_error"].mean():.4f} km')
    axes[0, 0].set_xlabel('Step Length Error (km)', fontsize=11)
    axes[0, 0].set_ylabel('Frequency', fontsize=11)
    axes[0, 0].set_title('Distribution of Step Length Errors', fontsize=12)
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)

    axes[0, 1].hist(df_validation['turning_angle_error'], bins=50, color='forestgreen', alpha=0.7, edgecolor='black')
    axes[0, 1].axvline(df_validation['turning_angle_error'].mean(), color='red', linestyle='--',
                       linewidth=2, label=f'Mean: {df_validation["turning_angle_error"].mean():.4f} rad')
    axes[0, 1].set_xlabel('Turning Angle Error (radians)', fontsize=11)
    axes[0, 1].set_ylabel('Frequency', fontsize=11)
    axes[0, 1].set_title('Distribution of Turning Angle Errors', fontsize=12)
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)

    behaviors = df_validation['behavior'].unique()
    error_data = [df_validation[df_validation['behavior'] == b]['step_length_error'].values for b in behaviors]
    axes[1, 0].boxplot(error_data, labels=behaviors)
    axes[1, 0].set_xlabel('Predicted Behavior', fontsize=11)
    axes[1, 0].set_ylabel('Step Length Error (km)', fontsize=11)
    axes[1, 0].set_title('Step Length Error by Behavior', fontsize=12)
    axes[1, 0].grid(True, alpha=0.3, axis='y')

    error_data_angle = [df_validation[df_validation['behavior'] == b]['turning_angle_error'].values for b in behaviors]
    axes[1, 1].boxplot(error_data_angle, labels=behaviors)
    axes[1, 1].set_xlabel('Predicted Behavior', fontsize=11)
    axes[1, 1].set_ylabel('Turning Angle Error (radians)', fontsize=11)
    axes[1, 1].set_title('Turning Angle Error by Behavior', fontsize=12)
    axes[1, 1].grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.show()
    plt.savefig(f'{output_dir}/{species_name.lower()}_movement_errors.png', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved movement error plots to {species_name.lower()}_movement_errors.png")
    print()

print("STEP 22: VISUALIZING MOVEMENT ERRORS")
print()

if elephant_validation is not None:
    visualize_movement_errors(elephant_validation, 'Elephant')
else:
    print("Elephant data not available for error visualization")
    print()

if wildebeest_validation is not None:
    visualize_movement_errors(wildebeest_validation, 'Wildebeest')
else:
    print("Wildebeest data not available for error visualization")
    print()

def generate_evaluation_summary(accuracy_metrics, movement_errors, stats_df, species_name):
    """
    Create a comprehensive summary of all evaluation metrics
    Provides an overall assessment of model performance

    Parameters:
    accuracy_metrics: dictionary with accuracy results
    movement_errors: dictionary with movement error results
    stats_df: DataFrame with state statistics
    species_name: name of the species
    """
    print(f"Evaluation Summary for {species_name}")
    print()

    print("Model Performance Metrics:")
    print(f"  Classification Accuracy: {accuracy_metrics['accuracy']:.4f} ({accuracy_metrics['accuracy']*100:.2f}%)")
    if 'balanced_accuracy' in accuracy_metrics:
        print(f"  Balanced Accuracy (class-weighted): {accuracy_metrics['balanced_accuracy']:.4f} ({accuracy_metrics['balanced_accuracy']*100:.2f}%)")
        if accuracy_metrics.get('imbalance_ratio', 1.0) > 3:
            print(f"   Balanced accuracy recommended due to class imbalance")
    print(f"  Step Length MAE: {movement_errors['mean_step_error']:.4f} km")
    print(f"  Step Length RMSE: {movement_errors['rmse_step']:.4f} km")
    print(f"  Turning Angle MAE: {movement_errors['mean_angle_error']:.4f} radians")
    print(f"  Turning Angle RMSE: {movement_errors['rmse_angle']:.4f} radians")
    print()

    print("Behavioral State Summary:")
    for _, row in stats_df.iterrows():
        print(f"  {row['behavior']} (State {row['state']}):")
        print(f"    Time allocation: {row['percentage']:.2f}%")
        print(f"    Observations: {row['n_observations']:,}")
        print(f"    Mean step length: {row['mean_step_length']:.4f} km")
        print(f"    Median step length: {row['median_step_length']:.4f} km")
        if 'mean_persistence' in row.index:
            print(f"    Directional persistence: {row['mean_persistence']:.3f}")
        else:
            print(f"    Turning concentration: {row['turning_concentration']:.3f}")
        if 'mean_sinuosity' in row.index:
            print(f"    Path sinuosity: {row['mean_sinuosity']:.3f}")
    print()

    print("Model Validation:")

    eval_accuracy = accuracy_metrics.get('balanced_accuracy', accuracy_metrics['accuracy'])
    imbalance_ratio = accuracy_metrics.get('imbalance_ratio', 1.0)

    if imbalance_ratio > 3:
        print(f" Class imbalance detected ({imbalance_ratio:.1f}:1) - using balanced accuracy")
        metric_name = "Balanced accuracy"
    else:
        metric_name = "Overall accuracy"

    if eval_accuracy > 0.6:
        print(f" Model shows good classification performance ({metric_name}: {eval_accuracy:.1%})")
    elif eval_accuracy > 0.45:
        print(f" Model shows moderate classification performance ({metric_name}: {eval_accuracy:.1%})")
    else:
        print(f" Model classification performance may need improvement ({metric_name}: {eval_accuracy:.1%})")

    if 'balanced_accuracy' in accuracy_metrics:
        acc_diff = abs(accuracy_metrics['accuracy'] - accuracy_metrics['balanced_accuracy'])
        if acc_diff > 0.1:
            print(f" Class imbalance is affecting results significantly")
            print(f"     (Regular accuracy: {accuracy_metrics['accuracy']:.1%}, Balanced: {accuracy_metrics['balanced_accuracy']:.1%})")

    if movement_errors['mean_step_error'] < stats_df['mean_step_length'].mean() * 0.3:
        print(f" Step length predictions are reasonable")
    else:
        print(f" Step length prediction errors are relatively high")

    if movement_errors['mean_angle_error'] < 1.0:
        print(f" Turning angle predictions are reasonable")
    else:
        print(f" Turning angle prediction errors are relatively high")
    print()

print("STEP 23: GENERATING EVALUATION SUMMARIES")
print()

if elephant_accuracy is not None and elephant_errors is not None and elephant_stats is not None:
    generate_evaluation_summary(elephant_accuracy, elephant_errors, elephant_stats, 'Elephant')
else:
    print("Elephant data not available for evaluation summary")
    print()

if wildebeest_accuracy is not None and wildebeest_errors is not None and wildebeest_stats is not None:
    generate_evaluation_summary(wildebeest_accuracy, wildebeest_errors, wildebeest_stats, 'Wildebeest')
else:
    print("Wildebeest data not available for evaluation summary")
    print()

def save_results(df_validation, stats_df, species_name):
    """
    Save all results to CSV files for further analysis and record keeping

    Parameters:
    df_validation: DataFrame with all predictions and validation data
    stats_df: DataFrame with state characteristics
    species_name: name of the species
    """
    print(f"Saving results for {species_name}")

    results_file = f'{results_dir}/{species_name.lower()}_predictions.csv'
    df_validation.to_csv(results_file, index=False)
    print(f"Saved predictions to {results_file}")

    stats_file = f'{results_dir}/{species_name.lower()}_state_statistics.csv'
    stats_df.to_csv(stats_file, index=False)
    print(f"Saved state statistics to {stats_file}")
    print()

print("STEP 24: SAVING RESULTS TO CSV FILES")
print()

if elephant_validation is not None and elephant_stats is not None:
    save_results(elephant_validation, elephant_stats, 'Elephant')
    print("ELEPHANT ANALYSIS COMPLETED SUCCESSFULLY")
    print()
else:
    print("Elephant data not available for saving results")
    print()

if wildebeest_validation is not None and wildebeest_stats is not None:
    save_results(wildebeest_validation, wildebeest_stats, 'Wildebeest')
    print("WILDEBEEST ANALYSIS COMPLETED SUCCESSFULLY")
    print()
else:
    print("Wildebeest data not available for saving results")
    print()

print("COMPARATIVE ANALYSIS SUMMARY")
print()

if elephant_filtered is not None and wildebeest_filtered is not None:
    print("Both species analyzed successfully")
    print()

    print("ELEPHANT BEHAVIORAL PROFILE:")
    print(f"  Individuals tracked: {elephant_filtered['individual_id'].nunique()}")
    print(f"  Total observations: {len(elephant_filtered)}")
    if elephant_n_states is not None:
        print(f"  Number of HMM states discovered: {elephant_n_states}")
    if elephant_stats is not None:
        print("  Behavioral time budget (aggregated by behavior):")
        behavior_totals = elephant_stats.groupby('behavior')['percentage'].sum()
        for behavior in ['Resting', 'Foraging', 'Traveling']:
            if behavior in behavior_totals.index:
                print(f"    {behavior}: {behavior_totals[behavior]:.1f}%")
        print(f"\n  Detailed state breakdown:")
        for _, row in elephant_stats.iterrows():
            print(f"    State {row['state']} ({row['behavior']}): {row['percentage']:.1f}% - persistence={row['mean_persistence']:.3f}")
    print()

    print("WILDEBEEST BEHAVIORAL PROFILE:")
    print(f"  Individuals tracked: {wildebeest_filtered['individual_id'].nunique()}")
    print(f"  Total observations: {len(wildebeest_filtered)}")
    if wildebeest_n_states is not None:
        print(f"  Number of HMM states discovered: {wildebeest_n_states}")
    if wildebeest_stats is not None:
        print("  Behavioral time budget (aggregated by behavior):")
        behavior_totals = wildebeest_stats.groupby('behavior')['percentage'].sum()
        for behavior in ['Resting', 'Foraging', 'Traveling']:
            if behavior in behavior_totals.index:
                print(f"    {behavior}: {behavior_totals[behavior]:.1f}%")
        print(f"\n  Detailed state breakdown:")
        for _, row in wildebeest_stats.iterrows():
            print(f"    State {row['state']} ({row['behavior']}): {row['percentage']:.1f}% - persistence={row['mean_persistence']:.3f}")
    print()

    if elephant_stats is not None and wildebeest_stats is not None:
        print("MOVEMENT COMPARISON:")
        elephant_avg_step = elephant_stats['mean_step_length'].mean()
        wildebeest_avg_step = wildebeest_stats['mean_step_length'].mean()
        print(f"  Elephant average step length: {elephant_avg_step:.3f} km")
        print(f"  Wildebeest average step length: {wildebeest_avg_step:.3f} km")
        if elephant_avg_step > 0:
            print(f"  Ratio (Wildebeest / Elephant): {wildebeest_avg_step / elephant_avg_step:.2f}x")
        print()

    if elephant_accuracy is not None and wildebeest_accuracy is not None:
        print("MODEL PERFORMANCE COMPARISON:")
        print(f"  Elephant classification accuracy: {elephant_accuracy['accuracy']:.2%}")
        print(f"  Wildebeest classification accuracy: {wildebeest_accuracy['accuracy']:.2%}")
        if elephant_errors is not None and wildebeest_errors is not None:
            print(f"  Elephant step length error: {elephant_errors['mean_step_error']:.4f} km")
            print(f"  Wildebeest step length error: {wildebeest_errors['mean_step_error']:.4f} km")
        print()

print("ANALYSIS COMPLETE")
print()