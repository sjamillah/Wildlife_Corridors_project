import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import norm, chi2, circmean
from scipy.spatial.distance import cdist, euclidean
from datetime import datetime, timedelta
import warnings
import os
warnings.filterwarnings('ignore')

np.random.seed(42)

plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

output_dir = '/data/outputs'
results_dir = '/data/results'
os.makedirs(output_dir, exist_ok=True)
os.makedirs(results_dir, exist_ok=True)

print("Brownian Bridge Movement Model for Animal Tracking")
print("Purpose: Map probability of animal location between observed GPS points")
print("Output: Continuous movement paths and home range corridors")
print()

ELEPHANT_FILE = '/content/Elephant-Data-Tanzania.csv'
WILDEBEEST_FILE = '/content/White-bearded wildebeest in Kenya-gps.csv'
ELEPHANT_HMM_FILE = '/content/elephant_predictions.csv'
WILDEBEEST_HMM_FILE = '/content/wildebeest_predictions.csv'

print("Data files configured:")
print(f"  Elephant GPS data: {ELEPHANT_FILE}")
print(f"  Wildebeest GPS data: {WILDEBEEST_FILE}")
print(f"  Elephant HMM results: {ELEPHANT_HMM_FILE}")
print(f"  Wildebeest HMM results: {WILDEBEEST_HMM_FILE}")
print()

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate great circle distance between two points on Earth using Haversine formula

    This is the standard method for calculating distances on a sphere and accounts
    for Earth's curvature. Used throughout the BBMM model for all distance calculations.

    Formula:
    a = sin squared(delta_lat/2) + cos(lat1) * cos(lat2) * sin squared(delta_lon/2)
    c = 2 * atan2(sqrt(a), sqrt(1 minus a))
    distance = R * c

    where R is Earth's radius (6371 km)

    Parameters:
    lat1: latitude of first point in decimal degrees
    lon1: longitude of first point in decimal degrees
    lat2: latitude of second point in decimal degrees
    lon2: longitude of second point in decimal degrees

    Returns:
    float distance in kilometers
    """
    R = 6371.0  # Earth's radius in kilometers

    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lat = np.radians(lat2 - lat1)
    delta_lon = np.radians(lon2 - lon1)

    a = np.sin(delta_lat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    distance = R * c
    return distance

def load_data(filepath, species_name):
    """
    Load tracking data from CSV file and perform initial inspection
    This function follows the exact approach from the HMM model

    Parameters:
    filepath: path to the CSV file
    species_name: name of the species for display purposes

    Returns:
    DataFrame with the loaded data
    """
    print(f"Loading {species_name} data from: {filepath}")

    try:
        if not os.path.exists(filepath):
            print(f"Error: File not found at {filepath}")
            return None

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
    This follows the exact logic from the HMM model for compatibility

    Parameters:
    df: DataFrame containing the data
    species_name: name of the species for display purposes

    Returns:
    DataFrame with standardized timestamp column
    """
    print(f"Identifying and parsing timestamps for {species_name}")

    date_cols = [col for col in df.columns if 'date' in col.lower() and 'time' not in col.lower()]
    time_cols = [col for col in df.columns if 'time' in col.lower() and 'date' not in col.lower()]

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
    This follows the exact cleaning logic from the HMM model

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
    This follows the exact approach from the HMM model using shift for efficiency

    Parameters:
    df: DataFrame with lat, lon, and timestamp columns

    Returns:
    DataFrame with added step_length column in kilometers
    """
    print("Calculating step lengths using Haversine formula")

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
    This follows the exact approach from the HMM model

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
    print("Elephant data not available")
    print()

if wildebeest_clean is not None and len(wildebeest_clean) > 0:
    wildebeest_clean = calculate_turning_angle(wildebeest_clean)
else:
    print("Wildebeest data not available")
    print()

def remove_outliers(df, species_name, max_speed_kmh=50):
    """
    Remove outliers based on unrealistic speeds

    Parameters:
    df: DataFrame with step_length and time_diff_hours
    species_name: name of the species
    max_speed_kmh: maximum plausible speed in km per hour

    Returns:
    DataFrame with outliers removed
    """
    print(f"Removing outliers for {species_name} (max speed: {max_speed_kmh} km/h)")

    initial_count = len(df)

    df['speed_kmh'] = df['step_length'] / df['time_diff_hours']

    outlier_mask = (df['speed_kmh'] > max_speed_kmh) | (df['speed_kmh'] < 0)
    n_outliers = outlier_mask.sum()

    print(f"Found {n_outliers} outlier records ({n_outliers/initial_count*100:.2f}%)")

    df_filtered = df[~outlier_mask].copy()

    print(f"Records after removing outliers: {len(df_filtered)}")
    print()

    return df_filtered

print("STEP 9: REMOVING OUTLIERS")
print()

if elephant_clean is not None and len(elephant_clean) > 0:
    elephant_filtered = remove_outliers(elephant_clean, 'Elephant', max_speed_kmh=25)
else:
    elephant_filtered = None
    print("Elephant data not available")
    print()

if wildebeest_clean is not None and len(wildebeest_clean) > 0:
    wildebeest_filtered = remove_outliers(wildebeest_clean, 'Wildebeest', max_speed_kmh=40)
else:
    wildebeest_filtered = None
    print("Wildebeest data not available")
    print()

def visualize_cleaned_data(df, species_name):
    """
    Create visualization of cleaned GPS data

    Parameters:
    df: DataFrame with cleaned GPS data
    species_name: name of the species
    """
    print(f"Generating visualizations for {species_name}")

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    ax1 = axes[0]
    individuals = df['individual_id'].unique()
    colors = plt.cm.tab20(np.linspace(0, 1, min(len(individuals), 20)))

    for idx, individual_id in enumerate(individuals[:20]):
        individual_data = df[df['individual_id'] == individual_id]
        ax1.scatter(individual_data['lon'], individual_data['lat'],
                   c=[colors[idx]], label=str(individual_id), s=1, alpha=0.6)

    ax1.set_xlabel('Longitude (degrees)', fontsize=12)
    ax1.set_ylabel('Latitude (degrees)', fontsize=12)
    ax1.set_title(f'{species_name} GPS Locations After Cleaning', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)

    if len(individuals) <= 10:
        ax1.legend(markerscale=5, fontsize=8, loc='best')

    ax2 = axes[1]
    hex_plot = ax2.hexbin(df['lon'], df['lat'], gridsize=50, cmap='YlOrRd', mincnt=1)
    ax2.set_xlabel('Longitude (degrees)', fontsize=12)
    ax2.set_ylabel('Latitude (degrees)', fontsize=12)
    ax2.set_title(f'{species_name} Location Density', fontsize=14, fontweight='bold')

    cbar = plt.colorbar(hex_plot, ax=ax2)
    cbar.set_label('Number of GPS Points', fontsize=10)

    plt.tight_layout()

    output_file = f'{output_dir}/{species_name.lower()}_cleaned_coordinates.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Saved visualization to {output_file}")

    plt.show()
    plt.close()
    print()

print("STEP 10: VISUALIZING CLEANED DATA")
print()

if elephant_filtered is not None and len(elephant_filtered) > 0:
    visualize_cleaned_data(elephant_filtered, 'Elephant')

if wildebeest_filtered is not None and len(wildebeest_filtered) > 0:
    visualize_cleaned_data(wildebeest_filtered, 'Wildebeest')

def visualize_movement_distributions(df, species_name):
    """
    Create visualization of movement metric distributions

    Parameters:
    df: DataFrame with movement metrics
    species_name: name of the species
    """
    print(f"Generating movement distribution plots for {species_name}")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    ax1 = axes[0, 0]
    step_data = df['step_length'].dropna()
    if len(step_data) > 0:
        ax1.hist(step_data, bins=50, color='steelblue', alpha=0.7, edgecolor='black')
        ax1.axvline(step_data.mean(), color='red', linestyle='dashed', linewidth=2, label=f'Mean: {step_data.mean():.3f} km')
        ax1.axvline(step_data.median(), color='green', linestyle='dashed', linewidth=2, label=f'Median: {step_data.median():.3f} km')
        ax1.set_xlabel('Step Length (km)', fontsize=11)
        ax1.set_ylabel('Frequency', fontsize=11)
        ax1.set_title('Distribution of Step Lengths', fontsize=13, fontweight='bold')
        ax1.legend(fontsize=10)
        ax1.grid(True, alpha=0.3, axis='y')

    ax2 = axes[0, 1]
    angle_data = df['turning_angle'].dropna()
    if len(angle_data) > 0:
        ax2.hist(angle_data, bins=50, color='coral', alpha=0.7, edgecolor='black')
        ax2.axvline(0, color='red', linestyle='dashed', linewidth=2, label='Straight ahead')
        ax2.set_xlabel('Turning Angle (radians)', fontsize=11)
        ax2.set_ylabel('Frequency', fontsize=11)
        ax2.set_title('Distribution of Turning Angles', fontsize=13, fontweight='bold')
        ax2.legend(fontsize=10)
        ax2.grid(True, alpha=0.3, axis='y')

    ax3 = axes[1, 0]
    time_data = df['time_diff_hours'].dropna()
    if len(time_data) > 0:
        ax3.hist(time_data, bins=50, color='mediumseagreen', alpha=0.7, edgecolor='black')
        ax3.axvline(time_data.mean(), color='red', linestyle='dashed', linewidth=2, label=f'Mean: {time_data.mean():.2f} hours')
        ax3.axvline(time_data.median(), color='orange', linestyle='dashed', linewidth=2, label=f'Median: {time_data.median():.2f} hours')
        ax3.set_xlabel('Time Interval (hours)', fontsize=11)
        ax3.set_ylabel('Frequency', fontsize=11)
        ax3.set_title('Distribution of Time Intervals', fontsize=13, fontweight='bold')
        ax3.legend(fontsize=10)
        ax3.grid(True, alpha=0.3, axis='y')

    ax4 = axes[1, 1]
    speed_data = df['speed_kmh'].dropna()
    if len(speed_data) > 0:
        ax4.hist(speed_data, bins=50, color='mediumpurple', alpha=0.7, edgecolor='black')
        ax4.axvline(speed_data.mean(), color='red', linestyle='dashed', linewidth=2, label=f'Mean: {speed_data.mean():.2f} km/h')
        ax4.axvline(speed_data.median(), color='yellow', linestyle='dashed', linewidth=2, label=f'Median: {speed_data.median():.2f} km/h')
        ax4.set_xlabel('Speed (km/h)', fontsize=11)
        ax4.set_ylabel('Frequency', fontsize=11)
        ax4.set_title('Distribution of Movement Speeds', fontsize=13, fontweight='bold')
        ax4.legend(fontsize=10)
        ax4.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()

    output_file = f'{output_dir}/{species_name.lower()}_movement_distributions.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Saved visualization to {output_file}")

    plt.show()
    plt.close()
    print()

print("STEP 11: VISUALIZING MOVEMENT DISTRIBUTIONS")
print()

if elephant_filtered is not None and len(elephant_filtered) > 0:
    visualize_movement_distributions(elephant_filtered, 'Elephant')

if wildebeest_filtered is not None and len(wildebeest_filtered) > 0:
    visualize_movement_distributions(wildebeest_filtered, 'Wildebeest')

def calculate_bbmm_variance(df, species_name):
    """
    Estimate movement variance parameter for Brownian Bridge Movement Model

    The BBMM variance represents the random component of animal movement
    Formula: sigma squared = sum(step_length squared) / (4 * sum(time_interval))

    This formula comes from the diffusion approximation of Brownian motion
    Reference: Horne et al. (2007) Ecology 88(9): 2354-2363

    Parameters:
    df: DataFrame with movement metrics
    species_name: name of the species

    Returns:
    tuple of (overall variance, variance by individual dictionary)
    """
    print(f"Calculating BBMM movement variance for {species_name}")

    valid_data = df.dropna(subset=['step_length', 'time_diff_hours'])
    valid_data = valid_data[valid_data['time_diff_hours'] > 0]

    sum_squared_distances = np.sum(valid_data['step_length']**2)
    sum_time_intervals = np.sum(valid_data['time_diff_hours'])

    overall_variance = sum_squared_distances / (4 * sum_time_intervals)

    print(f"Overall movement variance (sigma squared): {overall_variance:.6f} km squared per hour")
    print(f"Calculated from {len(valid_data):,} valid movement steps")

    variance_by_individual = {}

    for individual_id in df['individual_id'].unique():
        individual_data = valid_data[valid_data['individual_id'] == individual_id]

        if len(individual_data) > 5:
            ind_sum_squared = np.sum(individual_data['step_length']**2)
            ind_sum_time = np.sum(individual_data['time_diff_hours'])

            if ind_sum_time > 0:
                ind_variance = ind_sum_squared / (4 * ind_sum_time)
                variance_by_individual[individual_id] = ind_variance

    print(f"Calculated individual variances for {len(variance_by_individual)} individuals")

    if len(variance_by_individual) > 0:
        print(f"Individual variance range:")
        print(f"  Min: {min(variance_by_individual.values()):.6f} km squared per hour")
        print(f"  Max: {max(variance_by_individual.values()):.6f} km squared per hour")
        print(f"  Mean: {np.mean(list(variance_by_individual.values())):.6f} km squared per hour")

    print()
    return overall_variance, variance_by_individual

print("STEP 12: CALCULATING BBMM VARIANCE PARAMETER")
print()

if elephant_filtered is not None and len(elephant_filtered) > 0:
    elephant_variance, elephant_ind_variance = calculate_bbmm_variance(elephant_filtered, 'Elephant')
    print()
else:
    elephant_variance, elephant_ind_variance = None, {}
    print("Elephant data not available for variance calculation")
    print()

if wildebeest_filtered is not None and len(wildebeest_filtered) > 0:
    wildebeest_variance, wildebeest_ind_variance = calculate_bbmm_variance(wildebeest_filtered, 'Wildebeest')
    print()
else:
    wildebeest_variance, wildebeest_ind_variance = None, {}
    print("Wildebeest data not available for variance calculation")
    print()

def calculate_brownian_bridge_probability(x, y, x1, y1, x2, y2, t, t1, t2, sigma_squared, location_error=0.01):
    """
    Calculate probability density at location given Brownian bridge between two GPS fixes

    Formula from Horne et al. (2007) Ecology paper:
    The probability density is proportional to:
    exp( minus ((x minus mu_x) squared + (y minus mu_y) squared) / (2 * variance_xy) )

    where:
    mu_x = x1 + (x2 minus x1) * (t minus t1) / (t2 minus t1)
    mu_y = y1 + (y2 minus y1) * (t minus t1) / (t2 minus t1)
    variance_xy = sigma_squared * (t minus t1) * (t2 minus t) / (t2 minus t1) + location_error squared

    Parameters:
    x, y: coordinates where we want to calculate probability
    x1, y1: coordinates at first GPS fix
    x2, y2: coordinates at second GPS fix
    t: time at which to calculate probability
    t1: time of first GPS fix
    t2: time of second GPS fix
    sigma_squared: movement variance parameter
    location_error: GPS measurement error standard deviation

    Returns:
    float probability density value
    """
    time_proportion = (t - t1) / (t2 - t1)
    mu_x = x1 + (x2 - x1) * time_proportion
    mu_y = y1 + (y2 - y1) * time_proportion

    time_variance = sigma_squared * (t - t1) * (t2 - t) / (t2 - t1)
    total_variance = time_variance + location_error**2

    squared_distance = (x - mu_x)**2 + (y - mu_y)**2
    probability = np.exp(-squared_distance / (2 * total_variance))

    return probability

def create_utilization_distribution(df, individual_id, sigma_squared, grid_resolution=20, location_error=0.01):
    """
    Create utilization distribution showing probable locations for an individual

    The UD represents the probability distribution of the animal's location across
    space by summing Brownian bridge probabilities for all movement steps

    Parameters:
    df: DataFrame with GPS data for all individuals
    individual_id: ID of individual to create UD for
    sigma_squared: movement variance parameter
    grid_resolution: number of grid cells along each dimension
    location_error: GPS measurement error

    Returns:
    tuple of (longitude grid, latitude grid, probability grid)
    """
    print(f"Creating utilization distribution for individual {individual_id}")

    individual_data = df[df['individual_id'] == individual_id].copy()
    individual_data = individual_data.dropna(subset=['lat', 'lon', 'timestamp'])
    individual_data = individual_data.sort_values('timestamp')

    if len(individual_data) < 2:
        print(f"Insufficient data points for individual {individual_id}")
        return None, None, None

    print(f"Processing {len(individual_data)} GPS fixes")

    lon_min, lon_max = individual_data['lon'].min(), individual_data['lon'].max()
    lat_min, lat_max = individual_data['lat'].min(), individual_data['lat'].max()

    lon_buffer = (lon_max - lon_min) * 0.1
    lat_buffer = (lat_max - lat_min) * 0.1

    lon_grid = np.linspace(lon_min - lon_buffer, lon_max + lon_buffer, grid_resolution)
    lat_grid = np.linspace(lat_min - lat_buffer, lat_max + lat_buffer, grid_resolution)

    lon_mesh, lat_mesh = np.meshgrid(lon_grid, lat_grid)
    probability_grid = np.zeros_like(lon_mesh)

    for i in range(len(individual_data) - 1):
        row1 = individual_data.iloc[i]
        row2 = individual_data.iloc[i + 1]

        x1, y1 = row1['lon'], row1['lat']
        x2, y2 = row2['lon'], row2['lat']

        t1 = row1['timestamp']
        t2 = row2['timestamp']

        if t2 <= t1:
            continue

        time_diff_hours = (t2 - t1).total_seconds() / 3600.0
        t_mid_hours = time_diff_hours / 2.0

        for ix in range(grid_resolution):
            for iy in range(grid_resolution):
                x = lon_mesh[iy, ix]
                y = lat_mesh[iy, ix]

                prob = calculate_brownian_bridge_probability(
                    x, y, x1, y1, x2, y2,
                    t_mid_hours, 0, time_diff_hours,
                    sigma_squared, location_error
                )

                probability_grid[iy, ix] += prob

    probability_sum = np.sum(probability_grid)
    if probability_sum > 0:
        probability_grid = probability_grid / probability_sum

    print(f"Created {grid_resolution}x{grid_resolution} utilization distribution")
    print(f"Maximum probability density: {np.max(probability_grid):.6e}")
    print()

    return lon_mesh, lat_mesh, probability_grid

def visualize_utilization_distribution(lon_mesh, lat_mesh, probability_grid, df, individual_id, species_name):
    """
    Visualize the utilization distribution and movement corridors for an individual

    Parameters:
    lon_mesh: 2D array of longitude coordinates
    lat_mesh: 2D array of latitude coordinates
    probability_grid: 2D array of probability densities
    df: DataFrame with GPS data
    individual_id: ID of the individual
    species_name: name of the species
    """
    print(f"Visualizing utilization distribution for {species_name} individual {individual_id}")

    fig, ax = plt.subplots(1, 1, figsize=(12, 10))

    contour_levels = 20
    contour = ax.contourf(lon_mesh, lat_mesh, probability_grid,
                          levels=contour_levels, cmap='YlOrRd', alpha=0.7)

    contour_lines = ax.contour(lon_mesh, lat_mesh, probability_grid,
                               levels=5, colors='black', linewidths=1, alpha=0.4)

    individual_data = df[df['individual_id'] == individual_id]
    ax.scatter(individual_data['lon'], individual_data['lat'],
              c='blue', s=20, alpha=0.6, edgecolors='black', linewidths=0.5,
              label='Observed GPS fixes', zorder=5)

    ax.plot(individual_data['lon'], individual_data['lat'],
           'b-', alpha=0.3, linewidth=1, zorder=4)

    ax.set_xlabel('Longitude (degrees)', fontsize=12)
    ax.set_ylabel('Latitude (degrees)', fontsize=12)
    ax.set_title(f'{species_name} Utilization Distribution\nIndividual: {individual_id}',
                fontsize=14, fontweight='bold')

    cbar = plt.colorbar(contour, ax=ax)
    cbar.set_label('Probability Density', fontsize=11)

    ax.legend(fontsize=10, loc='best')
    ax.grid(True, alpha=0.3)

    plt.tight_layout()

    output_file = f'{output_dir}/{species_name.lower()}_ud_individual_{individual_id}.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Saved visualization to {output_file}")

    plt.show()
    plt.close()
    print()

print("STEP 13: CREATING UTILIZATION DISTRIBUTIONS")
print()

if elephant_filtered is not None and elephant_variance is not None and len(elephant_filtered) > 0:
    print("Creating utilization distributions for Elephant individuals")
    elephant_individuals = elephant_filtered['individual_id'].unique()[:1]

    for individual_id in elephant_individuals:
        lon_mesh, lat_mesh, prob_grid = create_utilization_distribution(
            elephant_filtered, individual_id, elephant_variance,
            grid_resolution=80, location_error=0.01
        )

        if prob_grid is not None:
            visualize_utilization_distribution(
                lon_mesh, lat_mesh, prob_grid,
                elephant_filtered, individual_id, 'Elephant'
            )
    print()

if wildebeest_filtered is not None and wildebeest_variance is not None and len(wildebeest_filtered) > 0:
    print("Creating utilization distributions for Wildebeest individuals")
    wildebeest_individuals = wildebeest_filtered['individual_id'].unique()[:3]

    for individual_id in wildebeest_individuals:
        lon_mesh, lat_mesh, prob_grid = create_utilization_distribution(
            wildebeest_filtered, individual_id, wildebeest_variance,
            grid_resolution=80, location_error=0.01
        )

        if prob_grid is not None:
            visualize_utilization_distribution(
                lon_mesh, lat_mesh, prob_grid,
                wildebeest_filtered, individual_id, 'Wildebeest'
            )
    print()

def load_hmm_predictions(hmm_filepath, species_name):
    """
    Load HMM behavioral state predictions for validation

    Parameters:
    hmm_filepath: path to CSV file with HMM predictions
    species_name: name of the species

    Returns:
    DataFrame with HMM predictions or None if file not found
    """
    print(f"Loading HMM behavioral predictions for {species_name}")
    print(f"File path: {hmm_filepath}")

    try:
        if not os.path.exists(hmm_filepath):
            print(f"HMM predictions file not found at {hmm_filepath}")
            return None

        hmm_df = pd.read_csv(hmm_filepath)
        print(f"Successfully loaded {len(hmm_df):,} HMM predictions")

        if 'behavior' in hmm_df.columns or 'validation_label' in hmm_df.columns:
            print("Found behavioral state column")
        else:
            print("Warning: No behavioral state column found in HMM predictions")

        print()
        return hmm_df

    except Exception as e:
        print(f"Error loading HMM predictions: {str(e)}")
        return None

def predict_intermediate_locations(df, sigma_squared, species_name, n_predictions_per_step=5):
    """
    Predict animal locations at intermediate times between observed GPS fixes using BBMM

    This function uses the Brownian bridge model to estimate where the animal was
    located at times between actual GPS fixes. These predictions can be compared
    to held-out GPS data to validate the BBMM model accuracy

    Parameters:
    df: DataFrame with GPS data
    sigma_squared: movement variance parameter
    species_name: name of the species
    n_predictions_per_step: number of intermediate points to predict per step

    Returns:
    DataFrame with predicted locations
    """
    print(f"Predicting intermediate locations for {species_name}")
    print(f"Predictions per movement step: {n_predictions_per_step}")

    prediction_records = []

    for individual_id in df['individual_id'].unique():
        individual_data = df[df['individual_id'] == individual_id].copy()
        individual_data = individual_data.dropna(subset=['lat', 'lon', 'timestamp'])
        individual_data = individual_data.sort_values('timestamp')

        for i in range(len(individual_data) - 1):
            row1 = individual_data.iloc[i]
            row2 = individual_data.iloc[i + 1]

            x1, y1 = row1['lon'], row1['lat']
            x2, y2 = row2['lon'], row2['lat']
            t1 = row1['timestamp']
            t2 = row2['timestamp']

            if t2 <= t1:
                continue

            total_duration = t2 - t1

            for j in range(1, n_predictions_per_step + 1):
                time_proportion = j / (n_predictions_per_step + 1)
                t_pred = t1 + total_duration * time_proportion

                x_pred = x1 + (x2 - x1) * time_proportion
                y_pred = y1 + (y2 - y1) * time_proportion

                prediction_records.append({
                    'individual_id': individual_id,
                    'timestamp': t_pred,
                    'predicted_lon': x_pred,
                    'predicted_lat': y_pred,
                    'start_lon': x1,
                    'start_lat': y1,
                    'end_lon': x2,
                    'end_lat': y2,
                    'start_time': t1,
                    'end_time': t2,
                    'time_proportion': time_proportion
                })

    predictions_df = pd.DataFrame(prediction_records)

    print(f"Generated {len(predictions_df):,} intermediate location predictions")
    print(f"Predictions for {predictions_df['individual_id'].nunique()} individuals")
    print()

    return predictions_df

print("STEP 14: PREDICTING INTERMEDIATE LOCATIONS")
print()

if elephant_filtered is not None and elephant_variance is not None and len(elephant_filtered) > 0:
    elephant_predictions = predict_intermediate_locations(
        elephant_filtered, elephant_variance, 'Elephant', n_predictions_per_step=5
    )
    print()
else:
    elephant_predictions = None
    print("Elephant data not available for predictions")
    print()

if wildebeest_filtered is not None and wildebeest_variance is not None and len(wildebeest_filtered) > 0:
    wildebeest_predictions = predict_intermediate_locations(
        wildebeest_filtered, wildebeest_variance, 'Wildebeest', n_predictions_per_step=5
    )
    print()
else:
    wildebeest_predictions = None
    print("Wildebeest data not available for predictions")
    print()

print("STEP 15: LOADING HMM BEHAVIORAL PREDICTIONS")
print()

elephant_hmm = load_hmm_predictions(ELEPHANT_HMM_FILE, 'Elephant')
print()

wildebeest_hmm = load_hmm_predictions(WILDEBEEST_HMM_FILE, 'Wildebeest')
print()

def merge_hmm_predictions_with_gps(gps_df, hmm_df, species_name):
    """
    Merge simplified HMM results (no timestamps) with GPS data safely by assigning
    the dominant behavioral label per individual to each GPS record.

    - Detects the best behavior column automatically (behavior, state, validation_label, behavior_state).
    - Computes the most frequent behavior per individual (dominant behavior).
    - Casts individual_id to string on both DataFrames to avoid dtype mismatches.
    - Performs a left merge so all GPS rows are preserved.
    - Returns the merged DataFrame with a new column 'hmm_behavioral_state'.

    Parameters:
    gps_df : pandas.DataFrame
        GPS DataFrame (must contain `individual_id` column).
    hmm_df : pandas.DataFrame
        HMM results (contains `individual_id` and some behavior/state column).
    species_name : str
        Display name used in prints/logs.

    Returns:
    merged_df : pandas.DataFrame
        gps_df with an added 'hmm_behavioral_state' column (may be NaN where no HMM info exists).
    """
    print(f"Merging simplified HMM predictions with GPS data for {species_name}")

    # Basic sanity checks
    if hmm_df is None or len(hmm_df) == 0:
        print("No HMM predictions available for merging - returning original GPS dataframe.")
        return gps_df

    if 'individual_id' not in gps_df.columns:
        print("Warning: gps_df does not contain 'individual_id'. Cannot merge by individual - returning gps_df.")
        return gps_df

    if 'individual_id' not in hmm_df.columns:
        print("Warning: hmm_df does not contain 'individual_id'. Cannot merge - returning gps_df.")
        return gps_df

    # Detect the most suitable behavior/state column in the HMM results
    possible_behavior_cols = ['behavior', 'behavior_state', 'validation_label', 'state', 'predicted_state', 'hmm_state']
    behavior_col = None
    for col in possible_behavior_cols:
        if col in hmm_df.columns:
            behavior_col = col
            break

    if behavior_col is None:
        print("Could not find any behavior/state column in HMM data (checked: {}).".format(", ".join(possible_behavior_cols)))
        print("Returning gps_df unchanged.")
        return gps_df

    print(f"Using HMM column '{behavior_col}' as the behavioral label for merging.")

    # Cast individual ids to string on both frames to avoid dtype mismatch
    gps_df = gps_df.copy()
    hmm_df = hmm_df.copy()
    gps_df['individual_id'] = gps_df['individual_id'].astype(str)
    hmm_df['individual_id'] = hmm_df['individual_id'].astype(str)

    # If behavior_col is numeric (e.g., 'state'), convert to string for consistency
    if pd.api.types.is_numeric_dtype(hmm_df[behavior_col]):
        hmm_df[behavior_col] = hmm_df[behavior_col].astype(str)

    # Compute dominant behavior per individual (most frequent label)
    dominant_behavior = (
        hmm_df
        .dropna(subset=['individual_id', behavior_col])            # ignore missing values
        .groupby('individual_id')[behavior_col]
        .agg(lambda x: x.value_counts().idxmax())                  # most frequent label
        .reset_index()
        .rename(columns={behavior_col: 'hmm_behavioral_state'})
    )

    n_individuals_hmm = dominant_behavior['individual_id'].nunique()
    n_individuals_gps = gps_df['individual_id'].nunique()
    print(f"HMM behavioral summary computed for {n_individuals_hmm} unique individuals.")
    print(f"GPS data contains {n_individuals_gps} unique individuals.")

    # Merge the dominant behavior back onto gps_df (left join to keep GPS rows)
    merged_df = gps_df.merge(dominant_behavior, on='individual_id', how='left')

    n_tagged = merged_df['hmm_behavioral_state'].notna().sum()
    match_rate = n_tagged / len(merged_df) * 100
    print(f"Assigned dominant behavioral label to {n_tagged:,} GPS rows ({match_rate:.1f}% of GPS data).")

    # Optional: show distribution of assigned behaviors (small summary)
    if n_tagged > 0:
        print("Assigned behavior distribution (top 10):")
        print(merged_df['hmm_behavioral_state'].value_counts().head(10).to_string())

    print("Merge complete.\n")
    return merged_df

print("STEP 16: MERGING HMM PREDICTIONS WITH GPS DATA")
print()

if elephant_filtered is not None and elephant_hmm is not None:
    elephant_filtered = merge_hmm_predictions_with_gps(elephant_filtered, elephant_hmm, 'Elephant')
    print()

if wildebeest_filtered is not None and wildebeest_hmm is not None:
    wildebeest_filtered = merge_hmm_predictions_with_gps(wildebeest_filtered, wildebeest_hmm, 'Wildebeest')
    print()

def calculate_prediction_accuracy(predictions_df, actual_df, species_name):
    """
    Robust calculation of BBMM prediction accuracy against actual GPS observations.

    For each predicted intermediate location, find the closest actual observation
    (by timestamp) that falls inside the prediction's start_time..end_time window,
    compute haversine distance, and aggregate error statistics.

    This version:
    - Validates presence of required columns.
    - Converts timestamps to datetime and individual_id to string.
    - Uses per-individual numpy search for speed and stability.
    - Returns a dictionary of accuracy metrics or None if no matches found.
    """
    import numpy as np
    import pandas as pd

    print(f"Calculating prediction accuracy for {species_name}")

    # Required columns
    req_pred_cols = {'individual_id', 'timestamp', 'predicted_lon', 'predicted_lat', 'start_time', 'end_time'}
    req_act_cols = {'individual_id', 'timestamp', 'lon', 'lat'}

    if predictions_df is None or len(predictions_df) == 0:
        print("No predictions available for accuracy calculation")
        return None

    if actual_df is None or len(actual_df) == 0:
        print("No actual GPS observations provided for validation")
        return None

    missing_pred = req_pred_cols - set(predictions_df.columns)
    missing_act = req_act_cols - set(actual_df.columns)

    if missing_pred:
        print(f"Missing columns in predictions_df: {missing_pred}. Cannot compute accuracy.")
        return None
    if missing_act:
        print(f"Missing columns in actual_df: {missing_act}. Cannot compute accuracy.")
        return None

    # Work on copies
    preds = predictions_df.copy()
    acts = actual_df.copy()

    # Normalize types
    preds['individual_id'] = preds['individual_id'].astype(str)
    acts['individual_id'] = acts['individual_id'].astype(str)

    # Convert timestamps to datetime
    for col in ['timestamp', 'start_time', 'end_time']:
        preds[col] = pd.to_datetime(preds[col], errors='coerce')
    acts['timestamp'] = pd.to_datetime(acts['timestamp'], errors='coerce')

    # Drop any rows with invalid timestamps in preds or acts
    before_preds = len(preds)
    preds = preds.dropna(subset=['timestamp', 'start_time', 'end_time'])
    if len(preds) < before_preds:
        print(f"Dropped {before_preds - len(preds)} prediction rows due to invalid timestamps.")

    before_acts = len(acts)
    acts = acts.dropna(subset=['timestamp', 'lon', 'lat'])
    if len(acts) < before_acts:
        print(f"Dropped {before_acts - len(acts)} actual rows due to invalid timestamps/coords.")

    if len(preds) == 0 or len(acts) == 0:
        print("No usable prediction or actual rows after cleaning.")
        return None

    # Build lookup per individual for actual observations (sorted)
    actual_by_ind = {}
    for ind, group in acts.groupby('individual_id'):
        g = group.sort_values('timestamp').reset_index(drop=True)
        # store numeric timestamps (ns) for fast numpy operations, and lat/lon arrays
        times_ns = g['timestamp'].values.astype('datetime64[ns]').astype('int64')  # ns
        lons = g['lon'].values
        lats = g['lat'].values
        actual_by_ind[ind] = {
            'times_ns': times_ns,
            'lons': lons,
            'lats': lats
        }

    errors = []

    # Helper: safe haversine call (expects lat1, lon1, lat2, lon2)
    def _haversine(lat1, lon1, lat2, lon2):
        try:
            return haversine_distance(lat1, lon1, lat2, lon2)
        except Exception:
            # If haversine_distance raises for some values, fallback to np.nan
            return np.nan

    # Iterate predictions grouped by individual for efficiency
    preds_grouped = preds.groupby('individual_id')
    n_pred_total = len(preds)
    n_matched = 0

    for ind, pred_group in preds_grouped:
        if ind not in actual_by_ind:
            # No actual observations for this individual
            continue

        act_info = actual_by_ind[ind]
        times_ns = act_info['times_ns']
        lons = act_info['lons']
        lats = act_info['lats']

        # For each prediction row for this individual
        for _, pred_row in pred_group.iterrows():
            pred_time_ns = np.int64(pred_row['timestamp'].value)  # ns
            start_ns = np.int64(pred_row['start_time'].value)
            end_ns = np.int64(pred_row['end_time'].value)

            if end_ns < start_ns:
                # skip invalid window
                continue

            # find candidate indices within window using numpy boolean mask
            # Using searchsorted to speed up locating approximate range
            left_idx = np.searchsorted(times_ns, start_ns, side='left')
            right_idx = np.searchsorted(times_ns, end_ns, side='right')

            if left_idx >= right_idx:
                # no observations in the time window
                continue

            candidate_idx = np.arange(left_idx, right_idx)
            candidate_times = times_ns[candidate_idx]

            # find index of closest time to pred_time
            nearest_offset = np.argmin(np.abs(candidate_times - pred_time_ns))
            nearest_idx = candidate_idx[nearest_offset]

            actual_lon = lons[nearest_idx]
            actual_lat = lats[nearest_idx]

            pred_lon = pred_row['predicted_lon']
            pred_lat = pred_row['predicted_lat']

            # compute haversine distance (km)
            err_km = _haversine(pred_lat, pred_lon, actual_lat, actual_lon)
            if not np.isnan(err_km):
                errors.append(err_km)
                n_matched += 1

    if len(errors) == 0:
        print("Could not match predictions to observations for validation (no matches found in time windows).")
        return None

    errors = np.array(errors)

    mae = np.mean(errors)
    rmse = np.sqrt(np.mean(errors**2))
    median_error = np.median(errors)
    q25 = np.percentile(errors, 25)
    q75 = np.percentile(errors, 75)
    max_error = np.max(errors)

    print(f"Prediction Accuracy Metrics based on {len(errors):,} matched predictions:")
    print(f"  Matched predictions: {n_matched} out of {n_pred_total}")
    print(f"  Mean Absolute Error: {mae:.4f} km")
    print(f"  Root Mean Squared Error: {rmse:.4f} km")
    print(f"  Median Error: {median_error:.4f} km")
    print(f"  25th Percentile: {q25:.4f} km")
    print(f"  75th Percentile: {q75:.4f} km")
    print(f"  Maximum Error: {max_error:.4f} km\n")

    accuracy_metrics = {
        'mae': mae,
        'rmse': rmse,
        'median_error': median_error,
        'q25': q25,
        'q75': q75,
        'max_error': max_error,
        'n_predictions': len(errors),
        'n_matched': n_matched,
        'n_total_predictions': n_pred_total
    }

    return accuracy_metrics

print("STEP 17: CALCULATING PREDICTION ACCURACY")
print()

if elephant_predictions is not None and elephant_filtered is not None:
    elephant_accuracy = calculate_prediction_accuracy(
        elephant_predictions, elephant_filtered, 'Elephant'
    )
    print()
else:
    elephant_accuracy = None

if wildebeest_predictions is not None and wildebeest_filtered is not None:
    wildebeest_accuracy = calculate_prediction_accuracy(
        wildebeest_predictions, wildebeest_filtered, 'Wildebeest'
    )
    print()
else:
    wildebeest_accuracy = None

def calculate_step_length_error(df, predictions_df, species_name):
    """
    Robust calculation of step length prediction error for BBMM results.

    Compares actual step lengths (from GPS data) with step lengths implied by
    BBMM-predicted intermediate positions.

    Handles missing columns safely, drops invalid rows, and prints interpretable
    summary metrics.
    """

    print(f"Calculating step length prediction error for {species_name}")

    if predictions_df is None or len(predictions_df) == 0:
        print("No predictions available for step length error calculation")
        return None
    if df is None or len(df) == 0:
        print("No actual GPS data provided for validation")
        return None

    required_cols = ['start_lat', 'start_lon', 'predicted_lat', 'predicted_lon', 'end_lat', 'end_lon']
    missing = [c for c in required_cols if c not in predictions_df.columns]
    if missing:
        print(f"Missing columns in predictions_df: {missing}")
        print("Cannot compute step length error — returning None.\n")
        return None

    if 'step_length' not in df.columns:
        print("GPS dataframe missing 'step_length' column. Cannot compute error.\n")
        return None

    # Drop rows with NaN coordinates
    valid_mask = predictions_df[required_cols].notna().all(axis=1)
    n_invalid = (~valid_mask).sum()
    if n_invalid > 0:
        print(f"Warning: {n_invalid} prediction rows dropped due to NaN coordinates.")
    preds_valid = predictions_df[valid_mask].copy()

    if len(preds_valid) == 0:
        print("No valid prediction rows after cleaning.")
        return None

    # Compute distances (km)
    def safe_haversine(lat1, lon1, lat2, lon2):
        try:
            return haversine_distance(lat1, lon1, lat2, lon2)
        except Exception:
            return np.nan

    pred_step1 = np.array([
        safe_haversine(a, b, c, d)
        for a, b, c, d in zip(
            preds_valid['start_lat'], preds_valid['start_lon'],
            preds_valid['predicted_lat'], preds_valid['predicted_lon']
        )
    ])
    pred_step2 = np.array([
        safe_haversine(a, b, c, d)
        for a, b, c, d in zip(
            preds_valid['predicted_lat'], preds_valid['predicted_lon'],
            preds_valid['end_lat'], preds_valid['end_lon']
        )
    ])

    predicted_steps = np.concatenate([pred_step1, pred_step2])
    predicted_steps = predicted_steps[np.isfinite(predicted_steps)]

    if len(predicted_steps) == 0:
        print("No valid predicted step lengths after distance computation.")
        return None

    actual_steps = df['step_length'].dropna().values
    if len(actual_steps) == 0:
        print("No valid step_length values in GPS data.")
        return None

    pred_mean = np.mean(predicted_steps)
    actual_mean = np.mean(actual_steps)

    pred_median = np.median(predicted_steps)
    actual_median = np.median(actual_steps)

    mean_error = abs(pred_mean - actual_mean)
    median_error = abs(pred_median - actual_median)
    relative_mean_error = (mean_error / actual_mean * 100) if actual_mean > 0 else 0.0

    print("Step Length Comparison Summary:")
    print(f"  Actual mean step length: {actual_mean:.4f} km")
    print(f"  Predicted mean step length: {pred_mean:.4f} km")
    print(f"  Mean absolute error: {mean_error:.4f} km ({relative_mean_error:.2f}%)")
    print(f"  Actual median step length: {actual_median:.4f} km")
    print(f"  Predicted median step length: {pred_median:.4f} km")
    print(f"  Median error: {median_error:.4f} km\n")

    step_length_metrics = {
        'actual_mean': actual_mean,
        'predicted_mean': pred_mean,
        'mean_error': mean_error,
        'relative_mean_error': relative_mean_error,
        'actual_median': actual_median,
        'predicted_median': pred_median,
        'median_error': median_error,
        'n_predicted_steps': len(predicted_steps),
        'n_actual_steps': len(actual_steps)
    }

    return step_length_metrics

print("STEP 18: CALCULATING STEP LENGTH PREDICTION ERROR")
print()

if elephant_filtered is not None and elephant_predictions is not None:
    elephant_step_error = calculate_step_length_error(
        elephant_filtered, elephant_predictions, 'Elephant'
    )
    print()
else:
    elephant_step_error = None

if wildebeest_filtered is not None and wildebeest_predictions is not None:
    wildebeest_step_error = calculate_step_length_error(
        wildebeest_filtered, wildebeest_predictions, 'Wildebeest'
    )
    print()
else:
    wildebeest_step_error = None

def calculate_turning_angle_error(df, predictions_df, species_name):
    """
    Robust turning angle error calculation for BBMM predictions vs observed GPS data.

    Computes turning angles (change in movement direction) from predicted points,
    compares them to actual turning angles, and reports circular mean and
    directional concentration differences.

    Parameters
    ----------
    df : DataFrame
        Actual GPS data with 'turning_angle' column.
    predictions_df : DataFrame
        Predicted locations including 'predicted_lat', 'predicted_lon',
        'individual_id', and 'timestamp'.
    species_name : str
        Species name (for display only).

    Returns
    -------
    dict or None
        Dictionary of angle error metrics, or None if insufficient data.
    """
    import numpy as np
    import pandas as pd
    from scipy.stats import circmean

    print(f"Calculating turning angle prediction error for {species_name}")

    if predictions_df is None or len(predictions_df) == 0:
        print("No predictions available for turning angle error calculation.\n")
        return None
    if df is None or len(df) == 0:
        print("No actual GPS data provided for comparison.\n")
        return None

    # --- check required columns ---
    req_cols = ['individual_id', 'timestamp', 'predicted_lat', 'predicted_lon']
    missing = [c for c in req_cols if c not in predictions_df.columns]
    if missing:
        print(f"Missing columns in predictions_df: {missing}\nCannot compute turning angles.\n")
        return None
    if 'turning_angle' not in df.columns:
        print("Actual data missing 'turning_angle' column.\n")
        return None

    # --- clean data ---
    preds = predictions_df.dropna(subset=['predicted_lat', 'predicted_lon']).copy()
    preds['timestamp'] = pd.to_datetime(preds['timestamp'], errors='coerce')
    preds = preds.dropna(subset=['timestamp'])
    preds['individual_id'] = preds['individual_id'].astype(str)

    actual_angles = df['turning_angle'].dropna().values
    if len(actual_angles) == 0:
        print("No valid turning_angle values in actual data.\n")
        return None

    predicted_angles = []

    # --- compute turning angles per individual ---
    for ind, group in preds.groupby('individual_id'):
        if len(group) < 3:
            continue

        group = group.sort_values('timestamp')
        lats = np.radians(group['predicted_lat'].values)
        lons = np.radians(group['predicted_lon'].values)

        # calculate bearings for each segment
        dlon = np.diff(lons)
        lat1 = lats[:-1]
        lat2 = lats[1:]
        y = np.sin(dlon) * np.cos(lat2)
        x = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
        bearings = np.arctan2(y, x)

        # turning angles between consecutive bearings
        turn_angles = np.diff(bearings)
        # normalize between -pi and pi
        turn_angles = (turn_angles + np.pi) % (2 * np.pi) - np.pi

        predicted_angles.extend(turn_angles)

    if len(predicted_angles) == 0:
        print("Insufficient valid predicted angles for error calculation.\n")
        return None

    predicted_angles = np.array(predicted_angles)

    # --- circular statistics ---
    pred_mean_angle = circmean(predicted_angles, high=np.pi, low=-np.pi)
    actual_mean_angle = circmean(actual_angles, high=np.pi, low=-np.pi)

    angle_diff = pred_mean_angle - actual_mean_angle
    # normalize difference
    angle_diff = (angle_diff + np.pi) % (2 * np.pi) - np.pi
    mean_angular_error = abs(angle_diff)

    # directional concentration (measure of how clustered angles are)
    pred_concentration = np.abs(np.mean(np.exp(1j * predicted_angles)))
    actual_concentration = np.abs(np.mean(np.exp(1j * actual_angles)))

    print("Turning Angle Comparison Summary:")
    print(f"  Actual mean turning angle:    {actual_mean_angle:.4f} rad ({np.degrees(actual_mean_angle):.2f}°)")
    print(f"  Predicted mean turning angle: {pred_mean_angle:.4f} rad ({np.degrees(pred_mean_angle):.2f}°)")
    print(f"  Mean angular error:           {mean_angular_error:.4f} rad ({np.degrees(mean_angular_error):.2f}°)")
    print(f"  Actual concentration:         {actual_concentration:.4f}")
    print(f"  Predicted concentration:      {pred_concentration:.4f}\n")

    return {
        'actual_mean_angle': actual_mean_angle,
        'predicted_mean_angle': pred_mean_angle,
        'mean_angular_error': mean_angular_error,
        'mean_angular_error_degrees': np.degrees(mean_angular_error),
        'actual_concentration': actual_concentration,
        'predicted_concentration': pred_concentration,
        'n_predicted_angles': len(predicted_angles),
        'n_actual_angles': len(actual_angles)
    }

print("STEP 19: CALCULATING TURNING ANGLE PREDICTION ERROR")
print()

if elephant_filtered is not None and elephant_predictions is not None:
    elephant_angle_error = calculate_turning_angle_error(
        elephant_filtered, elephant_predictions, 'Elephant'
    )
    print()
else:
    elephant_angle_error = None

if wildebeest_filtered is not None and wildebeest_predictions is not None:
    wildebeest_angle_error = calculate_turning_angle_error(
        wildebeest_filtered, wildebeest_predictions, 'Wildebeest'
    )
    print()
else:
    wildebeest_angle_error = None

def compare_bbmm_with_hmm_states(df, species_name):
    """
    Robust comparison between BBMM movement metrics and HMM behavioral classifications.

    Validates that BBMM-estimated movement (step length, speed, turning angles)
    differs meaningfully across behavioral states assigned by the HMM.

    Handles missing or incomplete columns gracefully.
    """
    import numpy as np
    from scipy.stats import circmean

    print(f"Comparing BBMM movement patterns with HMM states for {species_name}")

    if df is None or len(df) == 0:
        print("Empty dataframe provided. Nothing to compare.\n")
        return None

    # --- Column presence checks ---
    if 'hmm_behavioral_state' not in df.columns:
        print("No 'hmm_behavioral_state' column available. Cannot compare HMM with BBMM.\n")
        return None
    if 'step_length' not in df.columns:
        print("No 'step_length' column found in dataframe. Add step length before running comparison.\n")
        return None

    # Optional columns
    has_speed = 'speed_kmh' in df.columns
    has_turning = 'turning_angle' in df.columns

    # --- Clean data ---
    valid_data = df.dropna(subset=['hmm_behavioral_state', 'step_length']).copy()
    if len(valid_data) == 0:
        print("No overlapping data between BBMM and HMM.\n")
        return None

    print(f"Analyzing {len(valid_data):,} records with both BBMM and HMM data.\n")

    comparison_stats = {}

    # --- Per-behavior calculations ---
    for state in sorted(valid_data['hmm_behavioral_state'].dropna().unique()):
        state_data = valid_data[valid_data['hmm_behavioral_state'] == state]

        if len(state_data) == 0:
            continue

        n_obs = len(state_data)
        mean_step = state_data['step_length'].mean()
        median_step = state_data['step_length'].median()
        std_step = state_data['step_length'].std()
        mean_speed = state_data['speed_kmh'].mean() if has_speed else np.nan

        # Handle turning angles safely
        if has_turning and state_data['turning_angle'].notna().any():
            angles = state_data['turning_angle'].dropna().values
            mean_angle = circmean(angles, high=np.pi, low=-np.pi)
            angle_concentration = np.abs(np.mean(np.exp(1j * angles)))
        else:
            mean_angle = np.nan
            angle_concentration = np.nan

        comparison_stats[state] = {
            'n_observations': n_obs,
            'percentage': (n_obs / len(valid_data)) * 100,
            'mean_step_length': mean_step,
            'median_step_length': median_step,
            'std_step_length': std_step,
            'mean_speed': mean_speed,
            'mean_turning_angle': mean_angle,
            'directional_concentration': angle_concentration
        }

        print(f"Behavioral State '{state}':")
        print(f"  Observations: {n_obs:,} ({n_obs/len(valid_data)*100:.1f}%)")
        print(f"  Mean step length: {mean_step:.4f} km")
        print(f"  Median step length: {median_step:.4f} km")
        print(f"  Std step length: {std_step:.4f} km")

        if not np.isnan(mean_speed):
            print(f"  Mean speed: {mean_speed:.4f} km/h")

        if not np.isnan(mean_angle):
            print(f"  Mean turning angle: {mean_angle:.4f} rad ({np.degrees(mean_angle):.2f}°)")
            print(f"  Directional concentration: {angle_concentration:.4f}")
        print()

    # --- Cross-state comparison ---
    if len(comparison_stats) > 1:
        mean_values = [s['mean_step_length'] for s in comparison_stats.values() if not np.isnan(s['mean_step_length'])]
        if len(mean_values) > 1:
            overall_mean = np.mean(mean_values)
            overall_std = np.std(mean_values)
            cv = (overall_std / overall_mean) * 100 if overall_mean > 0 else 0

            print("Movement Pattern Differences Across Behavioral States:")
            print(f"  Coefficient of variation in step length across states: {cv:.2f}%")

            if cv > 30:
                print("  Strong differentiation in movement patterns between behavioral states.")
            elif cv > 15:
                print("  Moderate differentiation in movement patterns between behavioral states.")
            else:
                print("  Similar movement patterns across behavioral states.")
        else:
            print("Not enough valid states for cross-state variation analysis.\n")

    print()
    return comparison_stats

print("STEP 20: COMPARING BBMM WITH HMM BEHAVIORAL STATES")
print()

if elephant_filtered is not None and 'hmm_behavioral_state' in elephant_filtered.columns:
    elephant_comparison = compare_bbmm_with_hmm_states(elephant_filtered, 'Elephant')
    print()
else:
    elephant_comparison = None
    print("Elephant HMM behavioral states not available for comparison")
    print()

if wildebeest_filtered is not None and 'hmm_behavioral_state' in wildebeest_filtered.columns:
    wildebeest_comparison = compare_bbmm_with_hmm_states(wildebeest_filtered, 'Wildebeest')
    print()
else:
    wildebeest_comparison = None
    print("Wildebeest HMM behavioral states not available for comparison")
    print()

def visualize_evaluation_results(accuracy_metrics, step_error, angle_error, species_name):
    """
    Create comprehensive visualization of BBMM evaluation metrics

    This visualization summarizes all validation results to provide an at a glance
    assessment of model performance

    Parameters:
    accuracy_metrics: dictionary with spatial accuracy results
    step_error: dictionary with step length error results
    angle_error: dictionary with turning angle error results
    species_name: name of the species
    """
    print(f"Creating evaluation visualization for {species_name}")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    ax1 = axes[0, 0]

    if accuracy_metrics is not None:
        metrics_names = ['MAE', 'RMSE', 'Median\nError', 'Q75']
        metrics_values = [
            accuracy_metrics['mae'],
            accuracy_metrics['rmse'],
            accuracy_metrics['median_error'],
            accuracy_metrics['q75']
        ]

        bars = ax1.bar(metrics_names, metrics_values, color=['steelblue', 'coral', 'mediumseagreen', 'gold'])
        ax1.set_ylabel('Error (km)', fontsize=11)
        ax1.set_title('Spatial Prediction Accuracy', fontsize=13, fontweight='bold')
        ax1.grid(True, alpha=0.3, axis='y')

        for bar, value in zip(bars, metrics_values):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height,
                    f'{value:.3f}',
                    ha='center', va='bottom', fontsize=10)
    else:
        ax1.text(0.5, 0.5, 'No accuracy data available',
                ha='center', va='center', transform=ax1.transAxes, fontsize=12)
        ax1.set_title('Spatial Prediction Accuracy', fontsize=13, fontweight='bold')

    ax2 = axes[0, 1]

    if step_error is not None:
        categories = ['Actual\nMean', 'Predicted\nMean', 'Actual\nMedian', 'Predicted\nMedian']
        values = [
            step_error['actual_mean'],
            step_error['predicted_mean'],
            step_error['actual_median'],
            step_error['predicted_median']
        ]
        colors = ['steelblue', 'coral', 'steelblue', 'coral']

        bars = ax2.bar(categories, values, color=colors, alpha=0.7)
        ax2.set_ylabel('Step Length (km)', fontsize=11)
        ax2.set_title('Step Length Comparison', fontsize=13, fontweight='bold')
        ax2.grid(True, alpha=0.3, axis='y')

        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{value:.3f}',
                    ha='center', va='bottom', fontsize=9)
    else:
        ax2.text(0.5, 0.5, 'No step length data available',
                ha='center', va='center', transform=ax2.transAxes, fontsize=12)
        ax2.set_title('Step Length Comparison', fontsize=13, fontweight='bold')

    ax3 = axes[1, 0]

    if angle_error is not None:
        categories = ['Actual\nMean Angle', 'Predicted\nMean Angle']
        values = [
            np.degrees(angle_error['actual_mean_angle']),
            np.degrees(angle_error['predicted_mean_angle'])
        ]

        bars = ax3.bar(categories, values, color=['mediumseagreen', 'gold'])
        ax3.set_ylabel('Turning Angle (degrees)', fontsize=11)
        ax3.set_title('Turning Angle Comparison', fontsize=13, fontweight='bold')
        ax3.axhline(y=0, color='red', linestyle='dashed', linewidth=1, alpha=0.5, label='Straight ahead')
        ax3.grid(True, alpha=0.3, axis='y')
        ax3.legend(fontsize=9)

        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height,
                    f'{value:.1f} deg',
                    ha='center', va='bottom' if value >= 0 else 'top', fontsize=10)
    else:
        ax3.text(0.5, 0.5, 'No turning angle data available',
                ha='center', va='center', transform=ax3.transAxes, fontsize=12)
        ax3.set_title('Turning Angle Comparison', fontsize=13, fontweight='bold')

    ax4 = axes[1, 1]
    ax4.axis('off')

    summary_text = f'{species_name} BBMM Evaluation Summary\n\n'

    if accuracy_metrics is not None:
        summary_text += f'Spatial Accuracy:\n'
        summary_text += f'  MAE: {accuracy_metrics["mae"]:.4f} km\n'
        summary_text += f'  RMSE: {accuracy_metrics["rmse"]:.4f} km\n'
        summary_text += f'  Predictions: {accuracy_metrics["n_predictions"]:,}\n\n'

    if step_error is not None:
        summary_text += f'Step Length Error:\n'
        summary_text += f'  Mean error: {step_error["mean_error"]:.4f} km\n'
        summary_text += f'  Relative error: {step_error["relative_mean_error"]:.2f}%\n\n'

    if angle_error is not None:
        summary_text += f'Turning Angle Error:\n'
        summary_text += f'  Angular error: {angle_error["mean_angular_error_degrees"]:.2f} deg\n'

    ax4.text(0.1, 0.9, summary_text,
            transform=ax4.transAxes,
            fontsize=11,
            verticalalignment='top',
            fontfamily='monospace',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))

    plt.tight_layout()

    output_file = f'{output_dir}/{species_name.lower()}_bbmm_evaluation.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Saved evaluation visualization to {output_file}")

    plt.show()
    plt.close()
    print()

print("STEP 21: VISUALIZING EVALUATION RESULTS")
print()

if elephant_accuracy is not None or elephant_step_error is not None or elephant_angle_error is not None:
    visualize_evaluation_results(
        elephant_accuracy, elephant_step_error, elephant_angle_error, 'Elephant'
    )
    print()

if wildebeest_accuracy is not None or wildebeest_step_error is not None or wildebeest_angle_error is not None:
    visualize_evaluation_results(
        wildebeest_accuracy, wildebeest_step_error, wildebeest_angle_error, 'Wildebeest'
    )
    print()

def save_bbmm_results(df, variance, species_name):
    """
    Save all BBMM results to CSV files

    Parameters:
    df: DataFrame with GPS data and BBMM calculations
    variance: movement variance parameter
    species_name: name of the species
    """
    print(f"Saving BBMM results for {species_name}")

    gps_output_file = f'{output_dir}/{species_name.lower()}_bbmm_gps_data.csv'
    df.to_csv(gps_output_file, index=False)
    print(f"Saved GPS data with movement metrics to {gps_output_file}")

    summary_file = f'{output_dir}/{species_name.lower()}_bbmm_summary.txt'

    with open(summary_file, 'w') as f:
        f.write(f'BBMM Analysis Summary for {species_name}\n')

        f.write(f'Movement Variance Parameter:\n')
        f.write(f'  Sigma squared: {variance:.6f} km squared per hour\n\n')

        f.write(f'Data Summary:\n')
        f.write(f'  Total GPS records: {len(df):,}\n')
        f.write(f'  Number of individuals: {df["individual_id"].nunique()}\n')
        f.write(f'  Time range: {df["timestamp"].min()} to {df["timestamp"].max()}\n')

    print(f"Saved summary statistics to {summary_file}")
    print()

print("STEP 22: SAVING BBMM RESULTS")
print()

if elephant_filtered is not None and elephant_variance is not None and len(elephant_filtered) > 0:
    save_bbmm_results(
        elephant_filtered, elephant_variance, 'Elephant'
    )
    print()

if wildebeest_filtered is not None and wildebeest_variance is not None and len(wildebeest_filtered) > 0:
    save_bbmm_results(
        wildebeest_filtered, wildebeest_variance, 'Wildebeest'
    )
    print()

print("BBMM ANALYSIS COMPLETE")
print()

print("Summary of Results:")
print()

if elephant_filtered is not None and len(elephant_filtered) > 0:
    print("ELEPHANT:")
    print(f"  Total GPS records processed: {len(elephant_filtered):,}")
    print(f"  Number of individuals: {elephant_filtered['individual_id'].nunique()}")
    if elephant_variance is not None:
        print(f"  Movement variance: {elephant_variance:.6f} km squared per hour")
    if elephant_accuracy is not None:
        print(f"  Prediction MAE: {elephant_accuracy['mae']:.4f} km")
        print(f"  Prediction RMSE: {elephant_accuracy['rmse']:.4f} km")
    if elephant_step_error is not None:
        print(f"  Step length error: {elephant_step_error['mean_error']:.4f} km ({elephant_step_error['relative_mean_error']:.2f}%)")
    if elephant_angle_error is not None:
        print(f"  Turning angle error: {elephant_angle_error['mean_angular_error_degrees']:.2f} degrees")
    print()

if wildebeest_filtered is not None and len(wildebeest_filtered) > 0:
    print("WILDEBEEST:")
    print(f"  Total GPS records processed: {len(wildebeest_filtered):,}")
    print(f"  Number of individuals: {wildebeest_filtered['individual_id'].nunique()}")
    if wildebeest_variance is not None:
        print(f"  Movement variance: {wildebeest_variance:.6f} km squared per hour")
    if wildebeest_accuracy is not None:
        print(f"  Prediction MAE: {wildebeest_accuracy['mae']:.4f} km")
        print(f"  Prediction RMSE: {wildebeest_accuracy['rmse']:.4f} km")
    if wildebeest_step_error is not None:
        print(f"  Step length error: {wildebeest_step_error['mean_error']:.4f} km ({wildebeest_step_error['relative_mean_error']:.2f}%)")
    if wildebeest_angle_error is not None:
        print(f"  Turning angle error: {wildebeest_angle_error['mean_angular_error_degrees']:.2f} degrees")
    print()

print("All results saved to:", output_dir)
print()
print("Analysis complete.")