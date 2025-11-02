import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
import os
import pickle
import json
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score
from scipy.spatial.distance import cdist
from scipy.interpolate import griddata
import rasterio
from rasterio.transform import rowcol

warnings.filterwarnings('ignore')
np.random.seed(42)

print("XGBoost Habitat Suitability Model")
print("Wildlife Corridor Conservation - Kenya/Tanzania Study Area")
print()

plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

"""Geographic configuration"""

KENYA_TANZANIA_BBOX = {
    'min_lon': 29.0,
    'max_lon': 42.0,
    'min_lat': -12.0,
    'max_lat': 5.5,
    'name': 'Kenya-Tanzania Wildlife Corridor'
}

output_dir = '/data/outputs'
os.makedirs(f'{output_dir}/models', exist_ok=True)
os.makedirs(f'{output_dir}/plots', exist_ok=True)
os.makedirs(f'{output_dir}/data', exist_ok=True)
os.makedirs(f'{output_dir}/evaluations', exist_ok=True)

# File paths
ELEPHANT_BBMM_FILE = '/elephant_bbmm_gps_data.csv'
WILDEBEEST_BBMM_FILE = '/wildebeest_bbmm_gps_data.csv'
ENV_DATA_DIR = '/data/environmental_data'

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lat = np.radians(lat2 - lat1)
    delta_lon = np.radians(lon2 - lon1)
    a = np.sin(delta_lat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    distance = R * c
    return distance

def calculate_bearing(lat1, lon1, lat2, lon2):
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lon = np.radians(lon2 - lon1)
    x = np.sin(delta_lon) * np.cos(lat2_rad)
    y = np.cos(lat1_rad) * np.sin(lat2_rad) - np.sin(lat1_rad) * np.cos(lat2_rad) * np.cos(delta_lon)
    bearing = np.degrees(np.arctan2(x, y))
    return (bearing + 360) % 360

def validate_geographic_bounds(df, bbox):
    print("VALIDATING GEOGRAPHIC BOUNDARIES")
    print(f"Study area: {bbox['name']}")
    print(f"Longitude: {bbox['min_lon']} to {bbox['max_lon']}")
    print(f"Latitude: {bbox['min_lat']} to {bbox['max_lat']}")

    if 'lon' not in df.columns or 'lat' not in df.columns:
        return None, 0, "ERROR: Missing lon or lat columns"

    outside_mask = (
        (df['lon'] < bbox['min_lon']) |
        (df['lon'] > bbox['max_lon']) |
        (df['lat'] < bbox['min_lat']) |
        (df['lat'] > bbox['max_lat'])
    )

    n_invalid = outside_mask.sum()
    n_total = len(df)

    if n_invalid > 0:
        pct_invalid = (n_invalid / n_total) * 100
        invalid_points = df[outside_mask]
        print(f"WARNING: Found {n_invalid:,} points outside boundaries")
        print(f"Removing points and continuing with {n_total - n_invalid:,} valid points")
        valid_df = df[~outside_mask].copy()
        return valid_df, n_invalid, None
    else:
        print(f"All {n_total:,} GPS points are within boundaries")
        return df, 0, None

def find_optimal_threshold(model, X_val, y_val):
    y_val_proba = model.predict_proba(X_val)[:, 1]

    best_score = 0
    best_threshold = 0.5

    for threshold in np.arange(0.2, 0.8, 0.05):
        y_pred = (y_val_proba >= threshold).astype(int)
        f1 = f1_score(y_val, y_pred, zero_division=0)
        cm = confusion_matrix(y_val, y_pred)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        else:
            specificity = 0
        balanced_score = (f1 + specificity) / 2
        if balanced_score > best_score:
            best_score = balanced_score
            best_threshold = threshold

    print(f"Optimal threshold: {best_threshold:.2f} (score: {best_score:.3f})")
    return best_threshold

def load_bbmm_results(elephant_path, wildebeest_path):
    print("STEP 1: LOADING BBMM OUTPUT DATA")
    try:
        elephant_bbmm = pd.read_csv(elephant_path)
        print(f"Loaded elephant BBMM data: {len(elephant_bbmm):,} records")
    except FileNotFoundError:
        print(f"ERROR: Elephant BBMM file not found at {elephant_path}")
        return None, None

    try:
        wildebeest_bbmm = pd.read_csv(wildebeest_path)
        print(f"Loaded wildebeest BBMM data: {len(wildebeest_bbmm):,} records")
    except FileNotFoundError:
        print(f"ERROR: Wildebeest BBMM file not found at {wildebeest_path}")
        return None, None

    elephant_bbmm['species'] = 'elephant'
    wildebeest_bbmm['species'] = 'wildebeest'
    elephant_bbmm['timestamp'] = pd.to_datetime(elephant_bbmm['timestamp'])
    wildebeest_bbmm['timestamp'] = pd.to_datetime(wildebeest_bbmm['timestamp'])

    print(f"Data loaded successfully")
    print(f"Total records: {len(elephant_bbmm) + len(wildebeest_bbmm):,}")
    print(f"Elephant individuals: {elephant_bbmm['individual_id'].nunique()}")
    print(f"Wildebeest individuals: {wildebeest_bbmm['individual_id'].nunique()}")

    return elephant_bbmm, wildebeest_bbmm

elephant_data, wildebeest_data = load_bbmm_results(ELEPHANT_BBMM_FILE, WILDEBEEST_BBMM_FILE)

if elephant_data is None or wildebeest_data is None:
    print("Cannot proceed without BBMM data.")
    exit(1)

print("STEP 2: GEOGRAPHIC VALIDATION")
elephant_data, n_invalid_elephant, error_elephant = validate_geographic_bounds(elephant_data, KENYA_TANZANIA_BBOX)
if elephant_data is None or len(elephant_data) == 0:
    print("FATAL ERROR: No valid elephant GPS data")
    exit(1)

wildebeest_data, n_invalid_wildebeest, error_wildebeest = validate_geographic_bounds(wildebeest_data, KENYA_TANZANIA_BBOX)
if wildebeest_data is None or len(wildebeest_data) == 0:
    print("FATAL ERROR: No valid wildebeest GPS data")
    exit(1)

if n_invalid_elephant > 0 or n_invalid_wildebeest > 0:
    print(f"GEOGRAPHIC FILTERING APPLIED:")
    print(f"Elephant: Removed {n_invalid_elephant:,} points")
    print(f"Wildebeest: Removed {n_invalid_wildebeest:,} points")
    print(f"Total removed: {n_invalid_elephant + n_invalid_wildebeest:,} points")
    print(f"Remaining data: {len(elephant_data) + len(wildebeest_data):,} points")

print("STEP 3: COMBINING SPECIES DATA")
combined_data = pd.concat([elephant_data, wildebeest_data], ignore_index=True)
print(f"Combined data shape: {combined_data.shape}")
print(f"Elephant records: {len(combined_data[combined_data['species'] == 'elephant']):,}")
print(f"Wildebeest records: {len(combined_data[combined_data['species'] == 'wildebeest']):,}")

def extract_environmental_data_from_rasters(gps_df, env_data_dir):
    """
    Extract environmental data from rasters.
    Supports both Cloudflare paths and local paths.
    """
    from pathlib import Path
    from ..core.cloudflare_loader import get_file_loader
    from ..config.settings import get_settings
    
    settings = get_settings()
    file_loader = get_file_loader(
        cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
    )
    
    print("STEP 4: EXTRACTING ENVIRONMENTAL DATA FROM RASTERS")
    lon_array = gps_df['lon'].values
    lat_array = gps_df['lat'].values
    print(f"Extracting environmental variables for {len(gps_df):,} GPS points")
    print(f"Geographic range: {lon_array.min():.4f} to {lon_array.max():.4f}, {lat_array.min():.4f} to {lat_array.max():.4f}")

    extraction_results = {}
    
    def resolve_raster_path(raster_name):
        """Resolve raster path from Cloudflare or local."""
        if settings.CLOUDFLARE_BASE_URL:
            cloudflare_path = f"ml-information/data/rasters/{raster_name}_raster_kenya_tanzania.tif"
            if file_loader.exists(cloudflare_path):
                resolved = file_loader.resolve_path(cloudflare_path)
                return str(resolved) if isinstance(resolved, Path) else resolved
        local_path = f'{env_data_dir}/{raster_name}_raster_kenya_tanzania.tif'
        if os.path.exists(local_path):
            return local_path
        return None

    print("1. NDVI")
    ndvi_path = resolve_raster_path('ndvi')
    if ndvi_path:


        with rasterio.open(ndvi_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['ndvi'] = values
        extraction_results['ndvi'] = True
        print(f"NDVI extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"NDVI file not found: {ndvi_path}")

    print("2. Land Cover")
    landcover_path = resolve_raster_path('landcover')
    if landcover_path:


        with rasterio.open(landcover_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), -1, dtype=np.int32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = -1
        gps_df['land_cover'] = values
        extraction_results['land_cover'] = True
        print(f"Land cover extracted: {(values != -1).sum()} valid values")
    else:
        print(f"Land cover file not found: {landcover_path}")

    print("3. Elevation")
    elevation_path = resolve_raster_path('elevation')
    if elevation_path:


        with rasterio.open(elevation_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['elevation'] = values
        extraction_results['elevation'] = True
        print(f"Elevation extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"Elevation file not found: {elevation_path}")

    print("4. Rainfall")
    rainfall_path = resolve_raster_path('rainfall')
    if rainfall_path:


        with rasterio.open(rainfall_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['rainfall_mm'] = values
        extraction_results['rainfall'] = True
        print(f"Rainfall extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"Rainfall file not found: {rainfall_path}")

    print("5. Distance to Water")
    water_path = resolve_raster_path('dist_water')
    if water_path:


        with rasterio.open(water_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['distance_to_water_km'] = values
        extraction_results['distance_to_water'] = True
        print(f"Distance to water extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"Distance to water file not found: {water_path}")
        if 'ndvi' in gps_df.columns:
            gps_df['distance_to_water_km'] = (1 - gps_df['ndvi']) * 10

    print("6. Distance to Settlement")
    settlement_path = resolve_raster_path('dist_settlement')
    if settlement_path:


        with rasterio.open(settlement_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['distance_to_settlement_km'] = values
        extraction_results['distance_to_settlement'] = True
        print(f"Distance to settlement extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"Distance to settlement file not found: {settlement_path}")
        if 'land_cover' in gps_df.columns:
            urban_mask = gps_df['land_cover'] == 13
            gps_df['distance_to_settlement_km'] = 10.0
            gps_df.loc[urban_mask, 'distance_to_settlement_km'] = 0.5

    print("7. Distance to Roads")
    roads_path = resolve_raster_path('dist_roads')
    if roads_path:


        with rasterio.open(roads_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['distance_to_roads_km'] = values
        extraction_results['distance_to_roads'] = True
        print(f"Distance to roads extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"Distance to roads file not found: {roads_path}")
        if 'ndvi' in gps_df.columns:
            gps_df['distance_to_roads_km'] = (1 - gps_df['ndvi']) * 10

    print("8. Distance to Protected Areas")
    protected_path = resolve_raster_path('dist_protected_areas')
    if protected_path:


        with rasterio.open(protected_path) as src:
            rows, cols = rowcol(src.transform, lon_array, lat_array)
            valid_mask = (rows >= 0) & (rows < src.height) & (cols >= 0) & (cols < src.width)
            values = np.full(len(lon_array), np.nan, dtype=np.float32)
            raster_data = src.read(1)
            values[valid_mask] = raster_data[rows[valid_mask], cols[valid_mask]]
            if src.nodata is not None:
                values[values == src.nodata] = np.nan
        gps_df['distance_to_protected_areas_km'] = values
        extraction_results['distance_to_protected_areas'] = True
        print(f"Distance to protected areas extracted: {(~np.isnan(values)).sum()} valid values")
    else:
        print(f"Distance to protected areas file not found: {protected_path}")
        if 'ndvi' in gps_df.columns:
            gps_df['distance_to_protected_areas_km'] = (1 - gps_df['ndvi']) * 10

    critical_vars = ['ndvi', 'land_cover', 'elevation', 'rainfall_mm']
    missing_critical = [var for var in critical_vars if not extraction_results.get(var.replace('_mm', ''), False)]

    if missing_critical:
        print("ERROR: MISSING CRITICAL ENVIRONMENTAL VARIABLES")
        for var in missing_critical:
            print(f"missing: {var}")
        return None

    print("ENVIRONMENTAL DATA EXTRACTION COMPLETE")
    print(f"Successfully extracted {sum(extraction_results.values())} / 8 variables")
    return gps_df

combined_data = extract_environmental_data_from_rasters(combined_data, ENV_DATA_DIR)
if combined_data is None:
    print("Cannot proceed without environmental data.")
    exit(1)

def add_temporal_features(df):
    print("STEP 5: ADDING TEMPORAL FEATURES")
    df['month'] = df['timestamp'].dt.month
    df['day_of_year'] = df['timestamp'].dt.dayofyear
    df['hour'] = df['timestamp'].dt.hour
    df['year'] = df['timestamp'].dt.year
    df['season'] = df['month'].map(lambda x: 'wet' if x in [3, 4, 5, 10, 11] else 'dry')
    df['is_wet_season'] = (df['season'] == 'wet').astype(int)
    df['time_of_day'] = pd.cut(df['hour'], bins=[0, 6, 12, 18, 24], labels=['night', 'morning', 'afternoon', 'evening'], include_lowest=True)
    print("Temporal features added")
    print(f"Months covered: {sorted(df['month'].unique())}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    return df

combined_data = add_temporal_features(combined_data)

def calculate_movement_features_vectorized(df):
    print("STEP 6: CALCULATING MOVEMENT FEATURES")
    has_step_length = 'step_length' in df.columns and df['step_length'].notna().sum() > 0
    has_speed = 'speed_kmh' in df.columns and df['speed_kmh'].notna().sum() > 0

    if has_step_length and has_speed:
        print("Movement features already present from BBMM")
    else:
        print("Calculating movement features...")
        df['lat_prev'] = df.groupby('individual_id')['lat'].shift(1)
        df['lon_prev'] = df.groupby('individual_id')['lon'].shift(1)
        df['time_prev'] = df.groupby('individual_id')['timestamp'].shift(1)
        mask = df['lat_prev'].notna()
        df.loc[mask, 'step_length'] = haversine_distance(df.loc[mask, 'lat_prev'], df.loc[mask, 'lon_prev'], df.loc[mask, 'lat'], df.loc[mask, 'lon'])
        df['time_diff_hours'] = (df['timestamp'] - df['time_prev']).dt.total_seconds() / 3600
        df['speed_kmh'] = np.where(df['time_diff_hours'] > 0, df['step_length'] / df['time_diff_hours'], np.nan)
        print(f"Calculated {df['step_length'].notna().sum():,} step lengths")

    if 'bearing' not in df.columns or df['bearing'].isna().all():
        print("Calculating bearings...")
        mask_bearing = (df['lat_prev'].notna()) & (df['lon_prev'].notna())
        df.loc[mask_bearing, 'bearing'] = calculate_bearing(df.loc[mask_bearing, 'lat_prev'].values, df.loc[mask_bearing, 'lon_prev'].values, df.loc[mask_bearing, 'lat'].values, df.loc[mask_bearing, 'lon'].values)
        print(f"Calculated {df['bearing'].notna().sum():,} bearings")

    if 'turning_angle' not in df.columns or df['turning_angle'].isna().all():
        print("Calculating turning angles...")
        df['bearing_prev'] = df.groupby('individual_id')['bearing'].shift(1)
        mask_angle = df['bearing_prev'].notna()
        df.loc[mask_angle, 'turning_angle'] = np.abs(df.loc[mask_angle, 'bearing'] - df.loc[mask_angle, 'bearing_prev'])
        df.loc[mask_angle, 'turning_angle'] = np.where(df.loc[mask_angle, 'turning_angle'] > 180, 360 - df.loc[mask_angle, 'turning_angle'], df.loc[mask_angle, 'turning_angle'])
        print(f"Calculated {df['turning_angle'].notna().sum():,} turning angles")

    before_filter = len(df)
    df = df[((df['species'] == 'elephant') & ((df['speed_kmh'] <= 25) | df['speed_kmh'].isna())) | ((df['species'] == 'wildebeest') & ((df['speed_kmh'] <= 40) | df['speed_kmh'].isna()))]
    print(f"Removed {before_filter - len(df):,} outliers with unrealistic speeds")
    return df

combined_data = calculate_movement_features_vectorized(combined_data)

def calculate_bbmm_features_vectorized(df):
    print("STEP 7: CALCULATING BBMM FEATURES")
    sigma1 = 100
    mask_variance = (df['step_length'].notna()) & (df['time_diff_hours'].notna()) & (df['time_diff_hours'] > 0)
    df['bbmm_variance'] = np.nan
    df.loc[mask_variance, 'bbmm_variance'] = ((df.loc[mask_variance, 'step_length'] * 1000) ** 2 / (2 * df.loc[mask_variance, 'time_diff_hours'] * 3600)) + (2 * sigma1 ** 2)
    df['movement_probability'] = np.nan
    mask_prob = (df['bbmm_variance'].notna()) & (df['bbmm_variance'] > 0)
    df.loc[mask_prob, 'movement_probability'] = (1 / np.sqrt(2 * np.pi * df.loc[mask_prob, 'bbmm_variance'])) * np.exp(-(df.loc[mask_prob, 'step_length'] * 1000) ** 2 / (2 * df.loc[mask_prob, 'bbmm_variance']))
    df['movement_probability'] = df['movement_probability'].clip(0, 1) * 1000
    df['movement_probability'] = df['movement_probability'].clip(0, 1)
    df['cumulative_distance'] = df.groupby('individual_id')['step_length'].cumsum()
    first_points = df.groupby('individual_id').first()[['lat', 'lon']].reset_index()
    first_points.columns = ['individual_id', 'start_lat', 'start_lon']
    df = df.merge(first_points, on='individual_id', how='left')
    df['straight_line_distance'] = haversine_distance(df['start_lat'], df['start_lon'], df['lat'], df['lon'])
    df['tortuosity'] = np.where(df['straight_line_distance'] > 0.01, df['cumulative_distance'] / df['straight_line_distance'], 1.0)
    df['tortuosity'] = df['tortuosity'].clip(1.0, 50.0)
    df['residence_time'] = df.groupby('individual_id')['time_diff_hours'].rolling(window=5, min_periods=1).mean().reset_index(level=0, drop=True)
    df['step_length_variance'] = df.groupby('individual_id')['step_length'].rolling(window=5, min_periods=1).var().reset_index(level=0, drop=True)
    print("BBMM features calculated")
    return df

combined_data = calculate_bbmm_features_vectorized(combined_data)

def create_habitat_suitability_target(df):
    print("STEP 8: CREATING HABITAT SUITABILITY TARGET (NO LEAKAGE VERSION)")

    if 'movement_probability' not in df.columns:
        print("ERROR: movement_probability not found")
        return None, None, None

    df = df.copy()

    threshold_75 = df['movement_probability'].quantile(0.75)
    df['habitat_suitable'] = (df['movement_probability'] >= threshold_75).astype(int)

    print(f"Habitat suitability: {df['habitat_suitable'].value_counts().to_dict()}")
    print(f"Suitable rate: {df['habitat_suitable'].mean()*100:.1f}%")

    le_species = LabelEncoder()
    df['species_encoded'] = le_species.fit_transform(df['species'])
    le_time_of_day = LabelEncoder()
    if 'time_of_day' in df.columns:
        df['time_of_day_encoded'] = le_time_of_day.fit_transform(df['time_of_day'].astype(str))
    else:
        df['time_of_day'] = 'morning'
        df['time_of_day_encoded'] = 0

    print("\nCreating ENVIRONMENTAL features only:")

    if all(col in df.columns for col in ['ndvi', 'rainfall_mm']):
        df['vegetation_productivity'] = df['ndvi'] * (df['rainfall_mm'] / 100)
        print("Created vegetation_productivity")

    if all(col in df.columns for col in ['elevation', 'ndvi']):
        df['elevation_vegetation_index'] = (df['elevation'] / 1000) * df['ndvi']
        print("Created elevation_vegetation_index")

    if all(col in df.columns for col in ['distance_to_water_km', 'ndvi']):
        df['water_access_quality'] = df['ndvi'] / (df['distance_to_water_km'] + 0.1)
        print("Created water_access_quality")

    if all(col in df.columns for col in ['rainfall_mm', 'is_wet_season']):
        df['seasonal_resource_index'] = df['rainfall_mm'] * df['is_wet_season']
        print("Created seasonal_resource_index")

    if 'land_cover' in df.columns:
        land_cover_dummies = pd.get_dummies(df['land_cover'], prefix='land_cover')
        df = pd.concat([df, land_cover_dummies], axis=1)
        print(f"Encoded {len(land_cover_dummies.columns)} land cover types")

    return df, le_species, le_time_of_day

combined_data, le_species, le_time_of_day = create_habitat_suitability_target(combined_data)
if combined_data is None:
    print("Cannot proceed without target variable.")
    exit(1)

def enhance_conflict_features(df):
    print("ENHANCING CONFLICT-SPECIFIC FEATURES (FIXED VERSION)")

    if all(col in df.columns for col in ['elevation', 'ndvi']):
        df['valley_vegetation_risk'] = (1 / (df['elevation'] + 100)) * df['ndvi']
        print("Created valley_vegetation_risk")

    if all(col in df.columns for col in ['speed_kmh', 'tortuosity']):
        df['stress_movement_index'] = df['speed_kmh'] * df['tortuosity']
        print("Created stress_movement_index")

    if 'hour' in df.columns:
        df['nocturnal_activity'] = ((df['hour'] >= 18) | (df['hour'] <= 6)).astype(int)
        print("Created nocturnal_activity")

    if all(col in df.columns for col in ['ndvi', 'distance_to_water_km']):
        df['water_vegetation_index'] = df['ndvi'] * (1 / (df['distance_to_water_km'] + 0.1))
        print("Created water_vegetation_index")

    if all(col in df.columns for col in ['month', 'speed_kmh']):
        monthly_speed = df.groupby('month')['speed_kmh'].transform('mean')
        df['seasonal_movement'] = df['speed_kmh'] / (monthly_speed + 0.1)
        print("Created seasonal_movement")

    return df

combined_data = enhance_conflict_features(combined_data)

def prepare_model_data(df):
    print("\nSTEP 9: PREPARING MODEL DATA - ENVIRONMENTAL FEATURES ONLY")

    environmental_features = [
        'ndvi', 'rainfall_mm', 'elevation',
        'distance_to_water_km', 'distance_to_protected_areas_km',
    ]

    temporal_features = [
        'month', 'hour', 'is_wet_season', 'time_of_day_encoded',
    ]

    if 'day_of_year' in df.columns:
        temporal_features.append('day_of_year')

    spatial_features = ['lat', 'lon', 'species_encoded']

    engineered_features = [
        'vegetation_productivity', 'elevation_vegetation_index',
        'water_access_quality', 'seasonal_resource_index',
    ]

    feature_columns = environmental_features + temporal_features + spatial_features + engineered_features

    print("\nEXCLUDING MOVEMENT FEATURES (prevent data leakage):")
    excluded = [
        'movement_probability', 'step_length', 'speed_kmh', 'turning_angle',
        'tortuosity', 'cumulative_distance', 'bbmm_variance', 'residence_time',
        'step_length_variance', 'straight_line_distance', 'bearing'
    ]
    for feat in excluded:
        if feat in df.columns:
            print(f"  EXCLUDED: {feat}")

    existing_land_cover = [col for col in df.columns if col.startswith('land_cover_')]
    if existing_land_cover:
        feature_columns.extend(existing_land_cover)
        print(f"\nIncluded {len(existing_land_cover)} land cover features")

    available_features = [col for col in feature_columns if col in df.columns]

    print(f"\nFinal features: {len(available_features)}")

    if 'habitat_suitable' not in df.columns:
        print("ERROR: habitat_suitable not found")
        return None, None, None

    model_data = df[available_features + ['habitat_suitable']].copy()
    model_data = model_data.dropna()

    X = model_data[available_features]
    y = model_data['habitat_suitable']

    print(f"Samples: {len(X):,}")
    print(f"Target: {y.value_counts().to_dict()}")

    return X, y, available_features

X, y, feature_columns = prepare_model_data(combined_data)

def split_and_scale_data(X, y, species_data=None):
    print("\nSTEP 10: TRAIN-VAL-TEST SPLIT")

    if species_data is not None:
        splits = {}
        for species in species_data.unique():
            species_mask = species_data == species
            X_species = X[species_mask]
            y_species = y[species_mask]

            if len(X_species) > 100:
                X_train_s, X_temp_s, y_train_s, y_temp_s = train_test_split(
                    X_species, y_species, test_size=0.4, random_state=42, stratify=y_species
                )
                X_val_s, X_test_s, y_val_s, y_test_s = train_test_split(
                    X_temp_s, y_temp_s, test_size=0.5, random_state=42, stratify=y_temp_s
                )
                splits[species] = (X_train_s, X_val_s, X_test_s, y_train_s, y_val_s, y_test_s)

        X_train = pd.concat([splits[s][0] for s in splits])
        X_val = pd.concat([splits[s][1] for s in splits])
        X_test = pd.concat([splits[s][2] for s in splits])
        y_train = pd.concat([splits[s][3] for s in splits])
        y_val = pd.concat([splits[s][4] for s in splits])
        y_test = pd.concat([splits[s][5] for s in splits])
    else:
        X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.4, random_state=42, stratify=y)
        X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X.columns, index=X_train.index)
    X_val_scaled = pd.DataFrame(scaler.transform(X_val), columns=X.columns, index=X_val.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X.columns, index=X_test.index)

    print(f"Train: {len(X_train_scaled):,}, Val: {len(X_val_scaled):,}, Test: {len(X_test_scaled):,}")

    return X_train_scaled, X_val_scaled, X_test_scaled, y_train, y_val, y_test, scaler

species_data = combined_data.loc[X.index, 'species']
X_train_scaled, X_val_scaled, X_test_scaled, y_train, y_val, y_test, scaler = split_and_scale_data(X, y, species_data)

def perform_cross_validation(X, y, n_folds=5):
    print("STEP 11: CROSS-VALIDATION")
    print(f"Performing {n_folds}-fold cross-validation...")
    class_counts = y.value_counts()
    if 1 in class_counts and 0 in class_counts:
        scale_pos_weight_value = class_counts[0] / class_counts[1]
    else:
        scale_pos_weight_value = 1.0

    temp_model = xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, scale_pos_weight=scale_pos_weight_value, random_state=42, n_jobs=-1, eval_metric='logloss')
    cv = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)
    cv_accuracy = cross_val_score(temp_model, X, y, cv=cv, scoring='accuracy', n_jobs=-1)
    cv_precision = cross_val_score(temp_model, X, y, cv=cv, scoring='precision', n_jobs=-1)
    cv_recall = cross_val_score(temp_model, X, y, cv=cv, scoring='recall', n_jobs=-1)
    cv_f1 = cross_val_score(temp_model, X, y, cv=cv, scoring='f1', n_jobs=-1)

    cv_results = {
        'accuracy_mean': cv_accuracy.mean(),
        'accuracy_std': cv_accuracy.std(),
        'precision_mean': cv_precision.mean(),
        'precision_std': cv_precision.std(),
        'recall_mean': cv_recall.mean(),
        'recall_std': cv_recall.std(),
        'f1_mean': cv_f1.mean(),
        'f1_std': cv_f1.std()
    }

    print(f"Cross-validation results ({n_folds}-fold):")
    print(f"Accuracy:  {cv_results['accuracy_mean']:.4f} ± {cv_results['accuracy_std']:.4f}")
    print(f"Precision: {cv_results['precision_mean']:.4f} ± {cv_results['precision_std']:.4f}")
    print(f"Recall:    {cv_results['recall_mean']:.4f} ± {cv_results['recall_std']:.4f}")
    print(f"F1-Score:  {cv_results['f1_mean']:.4f} ± {cv_results['f1_std']:.4f}")

    return cv_results

cv_results = perform_cross_validation(X_train_scaled, y_train)

def train_species_specific_models(X_train_scaled, X_val_scaled, X_test_scaled,
                                  y_train, y_val, y_test, species_data, scaler):
    print("\nSTEP 12: TRAINING HABITAT SUITABILITY MODELS")
    models = {}
    results = {}

    for species in ['elephant', 'wildebeest']:
        print(f"\nTRAINING {species.upper()}")

        train_idx = X_train_scaled.index.intersection(species_data[species_data == species].index)
        val_idx = X_val_scaled.index.intersection(species_data[species_data == species].index)
        test_idx = X_test_scaled.index.intersection(species_data[species_data == species].index)

        if len(train_idx) < 100:
            continue

        X_train_s = X_train_scaled.loc[train_idx]
        y_train_s = y_train.loc[train_idx]
        X_val_s = X_val_scaled.loc[val_idx]
        y_val_s = y_val.loc[val_idx]
        X_test_s = X_test_scaled.loc[test_idx]
        y_test_s = y_test.loc[test_idx]

        print(f"Train: {len(X_train_s):,}, Val: {len(X_val_s):,}, Test: {len(X_test_s):,}")

        counts = y_train_s.value_counts()
        if len(counts) < 2:
            continue

        scale_pos_weight = counts[0] / counts[1]
        print(f"scale_pos_weight: {scale_pos_weight:.3f}")

        params = {
            'n_estimators': 200,
            'max_depth': 4,
            'learning_rate': 0.05,
            'subsample': 0.7,
            'colsample_bytree': 0.7,
            'min_child_weight': 10,
            'gamma': 0.3,
            'reg_alpha': 0.5,
            'reg_lambda': 2.0,
            'scale_pos_weight': scale_pos_weight,
            'random_state': 42,
            'n_jobs': -1,
            'eval_metric': 'logloss',
            'early_stopping_rounds': 20,
        }

        model = xgb.XGBClassifier(**params)

        try:
            model.fit(X_train_s, y_train_s, eval_set=[(X_val_s, y_val_s)], verbose=False)

            best_iter = model.best_iteration if hasattr(model, 'best_iteration') else params['n_estimators']
            print(f"Best iteration: {best_iter}")

            threshold = find_optimal_threshold(model, X_val_s, y_val_s)

            y_pred_proba = model.predict_proba(X_test_s)[:, 1]
            y_pred = (y_pred_proba >= threshold).astype(int)

            acc = accuracy_score(y_test_s, y_pred)
            prec = precision_score(y_test_s, y_pred, zero_division=0)
            rec = recall_score(y_test_s, y_pred, zero_division=0)
            f1 = f1_score(y_test_s, y_pred, zero_division=0)
            auc = roc_auc_score(y_test_s, y_pred_proba) if len(y_test_s.value_counts()) >= 2 else 0

            cm = confusion_matrix(y_test_s, y_pred)
            if cm.shape == (2, 2):
                tn, fp, fn, tp = cm.ravel()
                specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
                sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
            else:
                spec = sens = 0

            print(f"\n{species.upper()} Results:")
            print(f"Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}")
            print(f"F1: {f1:.4f}, AUC: {auc:.4f}, Specificity: {specificity:.4f}, Sensitivity: {sensitivity:.4f}")

            models[species] = model
            results[species] = {
                'model': model, 'test_accuracy': acc, 'test_precision': prec,
                'test_recall': rec, 'test_f1': f1, 'test_auc': auc,
                'test_specificity': specificity, 'test_sensitivity': sensitivity,
                'scaler': scaler, 'feature_names': X_train_s.columns.tolist(),
                'best_iteration': best_iter, 'optimal_threshold': threshold
            }
        except Exception as e:
            print(f"ERROR: {e}")
            continue

    return models, results

species_models, species_results = train_species_specific_models(X_train_scaled, X_val_scaled, X_test_scaled, y_train, y_val, y_test, species_data, scaler)

def evaluate_species_models(species_models, species_results, X_test_scaled, y_test, species_data):
    print("\nSTEP 13: EVALUATION")
    overall_metrics = {}

    for species, result in species_results.items():
        test_idx = X_test_scaled.index.intersection(species_data[species_data == species].index)
        X_test_s = X_test_scaled.loc[test_idx]
        y_test_s = y_test.loc[test_idx]
        model = result['model']

        y_pred_proba = model.predict_proba(X_test_s)[:, 1]
        threshold = result.get('optimal_threshold', 0.5)
        y_pred = (y_pred_proba >= threshold).astype(int)

        acc = accuracy_score(y_test_s, y_pred)
        prec = precision_score(y_test_s, y_pred, zero_division=0)
        rec = recall_score(y_test_s, y_pred, zero_division=0)
        f1 = f1_score(y_test_s, y_pred, zero_division=0)
        auc = roc_auc_score(y_test_s, y_pred_proba)
        mae = mean_absolute_error(y_test_s, y_pred_proba)
        rmse = np.sqrt(mean_squared_error(y_test_s, y_pred_proba))
        r2 = r2_score(y_test_s, y_pred_proba)
        cm = confusion_matrix(y_test_s, y_pred)

        print(f"\n{species.upper()}:")
        print(f"Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}, F1: {f1:.4f}")
        print(f"AUC: {auc:.4f}, MAE: {mae:.4f}, RMSE: {rmse:.4f}, R²: {r2:.4f}")
        print(f"Confusion Matrix:\n{cm}")

        tn, fp, fn, tp = cm.ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0

        overall_metrics[species] = {
            'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1,
            'auc': auc, 'mae': mae, 'rmse': rmse, 'r2': r2,
            'confusion_matrix': cm, 'y_pred': y_pred, 'y_pred_proba': y_pred_proba,
            'n_samples': len(y_test_s), 'optimal_threshold': threshold,
            'specificity': specificity, 'sensitivity': sensitivity
        }

    return overall_metrics

print("Evaluating species-specific models...")
overall_metrics = evaluate_species_models(species_models, species_results, X_test_scaled, y_test, species_data)

def analyze_species_habitat_preferences(species_models, species_results, feature_columns):
    print("STEP 14: SPECIES HABITAT PREFERENCE ANALYSIS")
    species_preferences = {}

    for species, result in species_results.items():
        print(f"{species.upper()} HABITAT PREFERENCES")
        model = result['model']
        feature_importance = model.feature_importances_
        importance_df = pd.DataFrame({'feature': feature_columns, 'importance': feature_importance}).sort_values('importance', ascending=False)
        species_preferences[species] = importance_df

        print("Top Habitat Drivers:")
        top_features = importance_df.head(10)
        for _, row in top_features.iterrows():
            feature = row['feature']
            importance = row['importance']
            if 'ndvi' in feature:
                interpretation = "Vegetation quality"
            elif 'elevation' in feature:
                interpretation = "Terrain preference"
            elif 'distance_to_water' in feature:
                interpretation = "Water dependency"
            elif 'distance_to_roads' in feature:
                interpretation = "Human avoidance"
            elif 'distance_to_protected' in feature:
                interpretation = "Conservation importance"
            elif 'rainfall' in feature:
                interpretation = "Climate preference"
            elif 'land_cover' in feature:
                interpretation = "Habitat type"
            elif 'speed' in feature or 'tortuosity' in feature:
                interpretation = "Movement behavior"
            else:
                interpretation = ""
            print(f"{feature:<25} {importance:.4f} {interpretation}")

        print(f"Model Performance Summary:")
        print(f"Test AUC:  {result['test_auc']:.4f}")
        print(f"Test F1:   {result['test_f1']:.4f}")
        print(f"Test Accuracy: {result['test_accuracy']:.4f}")

    print("CROSS-SPECIES HABITAT PREFERENCE COMPARISON")
    comparison_data = []
    for species, importance_df in species_preferences.items():
        top_5 = importance_df.head(5)
        for rank, (_, row) in enumerate(top_5.iterrows(), 1):
            comparison_data.append({'species': species, 'rank': rank, 'feature': row['feature'], 'importance': row['importance']})

    comparison_df = pd.DataFrame(comparison_data)
    comparison_pivot = comparison_df.pivot_table(index='rank', columns='species', values='feature', aggfunc='first')
    print(comparison_pivot.to_string())

    return species_preferences

species_preferences = analyze_species_habitat_preferences(species_models, species_results, feature_columns)

def create_species_feature_importance_plots(species_preferences, output_dir):
    print("STEP 15: SPECIES-SPECIFIC FEATURE IMPORTANCE VISUALIZATION")
    fig, axes = plt.subplots(1, len(species_preferences), figsize=(6*len(species_preferences), 8))
    if len(species_preferences) == 1:
        axes = [axes]

    for idx, (species, importance_df) in enumerate(species_preferences.items()):
        ax = axes[idx]
        top_n = 12
        importance_df_top = importance_df.head(top_n)
        bars = ax.barh(range(len(importance_df_top)), importance_df_top['importance'])

        for i, feature in enumerate(importance_df_top['feature']):
            if any(env_word in feature for env_word in ['ndvi', 'elevation', 'rainfall']):
                bars[i].set_color('green')
            elif any(human_word in feature for human_word in ['distance_to', 'settlement', 'roads']):
                bars[i].set_color('red')
            elif any(move_word in feature for move_word in ['speed', 'tortuosity', 'movement']):
                bars[i].set_color('blue')
            else:
                bars[i].set_color('gray')

        ax.set_yticks(range(len(importance_df_top)))
        ax.set_yticklabels(importance_df_top['feature'])
        ax.set_xlabel('Importance Score', fontsize=11)
        ax.set_title(f'{species.capitalize()} Habitat Drivers', fontsize=14, fontweight='bold', pad=20)
        ax.invert_yaxis()
        ax.grid(axis='x', alpha=0.3)

        for i, v in enumerate(importance_df_top['importance']):
            ax.text(v + 0.01, i, f'{v:.3f}', va='center', fontsize=9)

    plt.tight_layout()
    comparison_save_path = f'{output_dir}/plots/species_feature_importance_comparison.png'
    plt.savefig(comparison_save_path, dpi=300, bbox_inches='tight')
    print(f"Species comparison plot saved to {comparison_save_path}")
    plt.show()
    plt.close()

    for species, importance_df in species_preferences.items():
        fig, ax = plt.subplots(figsize=(10, 6))
        top_n = 15
        importance_df_top = importance_df.head(top_n)
        bars = ax.barh(range(len(importance_df_top)), importance_df_top['importance'])

        for i, feature in enumerate(importance_df_top['feature']):
            if any(env_word in feature for env_word in ['ndvi', 'elevation', 'rainfall']):
                bars[i].set_color('green')
            elif any(human_word in feature for human_word in ['distance_to', 'settlement', 'roads']):
                bars[i].set_color('red')
            elif any(move_word in feature for move_word in ['speed', 'tortuosity', 'movement']):
                bars[i].set_color('blue')
            else:
                bars[i].set_color('gray')

        ax.set_yticks(range(len(importance_df_top)))
        ax.set_yticklabels(importance_df_top['feature'])
        ax.set_xlabel('Importance Score', fontsize=12)
        ax.set_title(f'Top {top_n} Features - {species.capitalize()} Habitat Model', fontsize=14, fontweight='bold')
        ax.invert_yaxis()
        ax.grid(axis='x', alpha=0.3)

        ecological_notes = []
        top_feature = importance_df_top.iloc[0]['feature']
        if 'ndvi' in top_feature:
            ecological_notes.append(f"{species.capitalize()} strongly depend on vegetation quality")
        elif 'distance_to_water' in top_feature:
            ecological_notes.append(f"{species.capitalize()} are highly water-dependent")
        elif 'distance_to_roads' in top_feature:
            ecological_notes.append(f"{species.capitalize()} avoid human infrastructure")

        if ecological_notes:
            ax.text(0.02, 0.98, '\n'.join(ecological_notes), transform=ax.transAxes, verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8), fontsize=10)

        plt.tight_layout()
        individual_save_path = f'{output_dir}/plots/feature_importance_{species}.png'
        plt.savefig(individual_save_path, dpi=300, bbox_inches='tight')
        print(f"Individual {species} plot saved to {individual_save_path}")
        plt.show()
        plt.close()

    print("Feature importance analysis complete!")

create_species_feature_importance_plots(species_preferences, output_dir)

def generate_conservation_insights(species_preferences, overall_metrics):
    print("STEP 16: CONSERVATION INSIGHTS AND RECOMMENDATIONS")
    print("KEY CONSERVATION INSIGHTS")

    for species, importance_df in species_preferences.items():
        top_features = importance_df.head(3)
        model_performance = overall_metrics[species]

        print(f"{species.upper()} CONSERVATION PRIORITIES:")
        print(f"Model Performance: AUC={model_performance['auc']:.3f}, F1={model_performance['f1']:.3f}")

        insights = []
        recommendations = []

        for _, row in top_features.iterrows():
            feature = row['feature']
            importance = row['importance']

            if 'ndvi' in feature and importance > 0.1:
                insights.append("Highly dependent on vegetation quality")
                recommendations.append("Protect areas with high NDVI during dry seasons")
            if 'distance_to_water' in feature and importance > 0.1:
                insights.append("Water source proximity is critical")
                recommendations.append("Maintain access to permanent water sources")
            if 'distance_to_roads' in feature and importance > 0.1:
                insights.append("Sensitive to human infrastructure")
                recommendations.append("Minimize road development in core habitats")
            if 'distance_to_protected' in feature and importance > 0.1:
                insights.append("Relies on protected areas")
                recommendations.append("Strengthen protection of existing reserves")
            if 'rainfall' in feature and importance > 0.1:
                insights.append("Climate-sensitive movement patterns")
                recommendations.append("Consider rainfall patterns in corridor planning")
            if 'elevation' in feature and importance > 0.1:
                insights.append("Specific terrain preferences")
                recommendations.append("Protect elevation-specific habitats")

        if insights:
            print("Key Habitat Requirements:")
            for insight in set(insights):
                print(f"  • {insight}")
        if recommendations:
            print("Conservation Recommendations:")
            for rec in set(recommendations):
                print(f"  • {rec}")

    print("CROSS-SPECIES CORRIDOR PLANNING")
    common_factors = set()
    for species in species_preferences.keys():
        top_5_features = set(species_preferences[species].head(5)['feature'])
        if not common_factors:
            common_factors = top_5_features
        else:
            common_factors = common_factors.intersection(top_5_features)

    if common_factors:
        print("Shared habitat requirements across species:")
        for factor in common_factors:
            print(f"  • {factor}")
        print("These shared factors indicate potential multi-species corridor areas")
    else:
        print("Species have distinct habitat requirements - consider separate conservation strategies")

    print("Conservation insight generation complete!")

generate_conservation_insights(species_preferences, overall_metrics)

def save_species_models_and_results(species_models, species_results, overall_metrics, species_preferences, combined_data, feature_columns, cv_results, output_dir):
    print("STEP 17: SAVING SPECIES-SPECIFIC MODELS AND RESULTS")
    for species, result in species_results.items():
        print(f"Saving {species} model...")
        model = result['model']
        scaler = result['scaler']
        model.save_model(f'{output_dir}/models/xgboost_habitat_model_{species}.bin')
        model.save_model(f'{output_dir}/models/xgboost_habitat_model_{species}.json')
        model_package = {'model': model, 'scaler': scaler, 'feature_names': feature_columns, 'species': species, 'performance': overall_metrics[species]}
        with open(f'{output_dir}/models/xgboost_habitat_model_{species}.pkl', 'wb') as f:
            pickle.dump(model_package, f)
        with open(f'{output_dir}/models/feature_scaler_{species}.pkl', 'wb') as f:
            pickle.dump(scaler, f)

    print("All species models saved in 3 formats each")
    with open(f'{output_dir}/models/species_encoder.pkl', 'wb') as f:
        pickle.dump(le_species, f)
    with open(f'{output_dir}/models/time_of_day_encoder.pkl', 'wb') as f:
        pickle.dump(le_time_of_day, f)

    combined_data.to_csv(f'{output_dir}/data/processed_wildlife_data_kenya_tanzania.csv', index=False)

    for species, importance_df in species_preferences.items():
        importance_df.to_csv(f'{output_dir}/data/feature_importance_{species}.csv', index=False)

    print("Saving test predictions...")
    for species, metrics in overall_metrics.items():
        species_mask = species_data == species
        test_indices = X_test_scaled.index.intersection(species_data[species_data == species].index)
        y_test_species = y_test.loc[test_indices]
        n_samples = len(metrics['y_pred'])
        test_predictions = pd.DataFrame({'true_label': y_test_species.values[:n_samples], 'predicted_label': metrics['y_pred'], 'predicted_probability': metrics['y_pred_proba'], 'species': species})
        test_predictions = test_predictions.dropna()
        test_predictions.to_csv(f'{output_dir}/data/test_predictions_{species}.csv', index=True)

    print("Data files saved")

    report_text = f"""
XGBOOST HABITAT SUITABILITY MODEL - EVALUATION REPORT
Kenya-Tanzania Wildlife Corridor Conservation

Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Geographic Region: Kenya-Tanzania ({KENYA_TANZANIA_BBOX['min_lon']}E to {KENYA_TANZANIA_BBOX['max_lon']}E, {KENYA_TANZANIA_BBOX['min_lat']} to {KENYA_TANZANIA_BBOX['max_lat']})

MODELING APPROACH:
Species-Specific Habitat Suitability Models

DATA SUMMARY:
Total GPS Records: {len(combined_data):,}
Elephant Individuals: {combined_data[combined_data['species'] == 'elephant']['individual_id'].nunique()}
Wildebeest Individuals: {combined_data[combined_data['species'] == 'wildebeest']['individual_id'].nunique()}
Number of Features: {len(feature_columns)}

CROSS-VALIDATION RESULTS (5-fold) - Combined Data:
Accuracy:     {cv_results['accuracy_mean']:.4f} ± {cv_results['accuracy_std']:.4f}
Precision:    {cv_results['precision_mean']:.4f} ± {cv_results['precision_std']:.4f}
Recall:       {cv_results['recall_mean']:.4f} ± {cv_results['recall_std']:.4f}
F1-Score:     {cv_results['f1_mean']:.4f} ± {cv_results['f1_std']:.4f}

SPECIES-SPECIFIC PERFORMANCE (Test Set):
"""

    for species, metrics in overall_metrics.items():
        cm = metrics['confusion_matrix']
        report_text += f"""
{species.upper()} (N = {metrics['n_samples']:,}):
  Accuracy:     {metrics['accuracy']:.4f}
  Precision:    {metrics['precision']:.4f}
  Recall:       {metrics['recall']:.4f}
  F1-Score:     {metrics['f1']:.4f}
  AUC-ROC:      {metrics['auc']:.4f}
  Specificity:  {metrics['specificity']:.4f}
  Sensitivity:  {metrics['sensitivity']:.4f}
  MAE:          {metrics['mae']:.4f}
  RMSE:         {metrics['rmse']:.4f}
  R²:           {metrics['r2']:.4f}

  Confusion Matrix:
                  Predicted
                  Not Suitable  |  Suitable
  Actual
  Not Suitable      {cm[0,0]:<14d}  |  {cm[0,1]}
  Suitable          {cm[1,0]:<14d}  |  {cm[1,1]}
"""

    report_text += f"""
TOP FEATURES BY SPECIES:
"""

    for species, importance_df in species_preferences.items():
        report_text += f"""
{species.upper()}:
{importance_df.head(10).to_string(index=False)}
"""

    with open(f'{output_dir}/evaluations/model_evaluation_report_kenya_tanzania.txt', 'w') as f:
        f.write(report_text)

    print("Comprehensive evaluation report saved")

    model_metadata = {
        'model_type': 'XGBoost Binary Classification - Species Specific',
        'purpose': 'Habitat Suitability Prediction - Kenya-Tanzania Wildlife Corridor',
        'geographic_region': KENYA_TANZANIA_BBOX,
        'n_features': len(feature_columns),
        'feature_names': feature_columns,
        'species_models': {},
        'training_date': datetime.now().isoformat(),
        'modeling_approach': 'species_specific_presence_background',
        'bbmm_integration': {'elephant_file': ELEPHANT_BBMM_FILE, 'wildebeest_file': WILDEBEEST_BBMM_FILE},
        'environmental_data_dir': ENV_DATA_DIR
    }

    for species, result in species_results.items():
        species_metrics = overall_metrics[species]
        model_metadata['species_models'][species] = {
            'performance': {
                'accuracy': float(species_metrics['accuracy']),
                'precision': float(species_metrics['precision']),
                'recall': float(species_metrics['recall']),
                'f1_score': float(species_metrics['f1']),
                'auc_roc': float(species_metrics['auc']),
                'specificity': float(species_metrics['specificity']),
                'sensitivity': float(species_metrics['sensitivity']),
                'n_samples': int(species_metrics['n_samples'])
            },
            'top_features': species_preferences[species].head(10).to_dict('records'),
            'best_iteration': result['model'].best_iteration if hasattr(result['model'], 'best_iteration') else result['model'].n_estimators
        }

    with open(f'{output_dir}/models/model_metadata_kenya_tanzania.json', 'w') as f:
        json.dump(model_metadata, f, indent=4)

    print("Model metadata saved")

    print()
    print("XGBOOST HABITAT SUITABILITY MODELING - COMPLETE")
    print("Kenya-Tanzania Wildlife Corridor Conservation")
    print()
    print("SUMMARY OF RESULTS:")
    print(f"GEOGRAPHIC REGION: Kenya-Tanzania Corridor")
    print(f"Longitude: {KENYA_TANZANIA_BBOX['min_lon']}E to {KENYA_TANZANIA_BBOX['max_lon']}E")
    print(f"Latitude: {KENYA_TANZANIA_BBOX['min_lat']} to {KENYA_TANZANIA_BBOX['max_lat']}")
    print(f"DATA PROCESSED: Total GPS records: {len(combined_data):,}")
    print(f"Elephant individuals: {combined_data[combined_data['species'] == 'elephant']['individual_id'].nunique()}")
    print(f"Wildebeest individuals: {combined_data[combined_data['species'] == 'wildebeest']['individual_id'].nunique()}")
    print()
    print(f"SPECIES-SPECIFIC PERFORMANCE:")
    for species, metrics in overall_metrics.items():
        print(f"{species.capitalize()}: AUC-ROC: {metrics['auc']:.4f}, F1-Score: {metrics['f1']:.4f}, Accuracy: {metrics['accuracy']:.4f}, Samples: {metrics['n_samples']:,}")
    print
    print(f"TOP HABITAT DRIVERS:")
    for species, importance_df in species_preferences.items():
        top_feature = importance_df.iloc[0]['feature']
        top_importance = importance_df.iloc[0]['importance']
        print(f"{species.capitalize()}: {top_feature} ({top_importance:.3f})")
    print(f"OUTPUT FILES SAVED TO: {output_dir}/")
    print("MODELS ARE READY FOR CONSERVATION APPLICATIONS:")
    print("1. Habitat suitability mapping")
    print("2. Wildlife corridor planning")
    print("3. Protected area management")
    print("4. Human-wildlife conflict mitigation")
    print("RESTRICTED to Kenya-Tanzania wildlife corridors only.")

save_species_models_and_results(species_models, species_results, overall_metrics, species_preferences, combined_data, feature_columns, cv_results, output_dir)



