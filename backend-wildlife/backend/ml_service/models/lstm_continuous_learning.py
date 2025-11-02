import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import pickle
import json
import os
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.spatial.distance import euclidean
import warnings
from collections import deque
warnings.filterwarnings('ignore')

np.random.seed(42)
tf.random.set_seed(42)

def detect_column_name(data, provided_col, possible_names):
    if provided_col and provided_col in data.columns:
        return provided_col

    # First try exact matches (case insensitive)
    for col in data.columns:
        col_lower = col.lower()
        for possible_name in possible_names:
            if col_lower == possible_name.lower():
                return col

    # Then try partial matches
    for col in data.columns:
        col_lower = col.lower()
        for possible_name in possible_names:
            # Require at least 3 characters match
            if len(possible_name) >= 3 and possible_name.lower() in col_lower:
                return col

    return None

def load_csv_data(filepath, description):
    """Load CSV data with error handling"""
    print(f"Loading {description} from {filepath}")
    try:
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            return None
        df = pd.read_csv(filepath, low_memory=False)
        df.columns = df.columns.str.strip()
        print(f"Loaded {len(df)} records with {len(df.columns)} columns")
        return df
    except Exception as e:
        print(f"Error loading file: {str(e)}")
        return None

def load_pickle_model(filepath, description):
    """Load pickled models"""
    print(f"Loading {description} from {filepath}")
    try:
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            return None
        with open(filepath, 'rb') as f:
            model = pickle.load(f)

        if isinstance(model, dict):
            print(f"Loaded dictionary with keys: {list(model.keys())}")
            if 'model' in model:
                print(f"  - Contains model object: {type(model['model'])}")
            if 'species' in model:
                print(f"  - Species: {model['species']}")
        else:
            print(f"Loaded model object: {type(model)}")

        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None

print("Step 1: Loading HMM outputs")
hmm_files = ['/content/elephant_predictions.csv', '/content/wildebeest_predictions.csv']
hmm_dfs = []
for filepath in hmm_files:
    df = load_csv_data(filepath, f"HMM data")
    if df is not None:
        print(f"Columns in {filepath}: {list(df.columns)}")
        print(f"Sample data from {filepath}:")
        print(df.head(2))
    hmm_dfs.append(df)

print("Step 2: Loading BBMM outputs")
bbmm_files = ['/content/wildebeest_bbmm_gps_data.csv', '/content/elephant_bbmm_gps_data.csv']
bbmm_dfs = []
for filepath in bbmm_files:
    df = load_csv_data(filepath, f"BBMM data")
    if df is not None:
        print(f"Columns in {filepath}: {list(df.columns)}")
        print(f"Sample data from {filepath}:")
        print(df.head(2))
    bbmm_dfs.append(df)

print("Step 3: Loading XGBoost models")
xgb_files = ['/content/xgboost_habitat_model_elephant.pkl', '/content/xgboost_habitat_model_wildebeest.pkl']
xgb_models = []
for filepath in xgb_files:
    model = load_pickle_model(filepath, f"XGBoost model")
    xgb_models.append(model)

def preprocess_dataframe(df, data_type):
    print(f"Preprocessing {data_type} data")

    df = df.copy()

    lat_col = detect_column_name(df, None, ['latitude', 'Latitude', 'LAT', 'lat', 'location-lat', 'sinuosity'])
    lon_col = detect_column_name(df, None, ['longitude', 'Longitude', 'LONGITUDE', 'lon', 'long', 'location-long', 'expected_step_length'])
    timestamp_col = detect_column_name(df, None, ['timestamp', 'time', 'datetime', 'date_time', 'Timestamp', 'Time', 'date', 'Date'])
    individual_col = detect_column_name(df, None, ['individual_id', 'individual', 'animal_id', 'id', 'tag_id', 'ID'])

    if lat_col is None or lon_col is None:
        print(f"Could not find latitude or longitude columns in {data_type}")
        return None

    print(f"Detected columns: lat={lat_col}, lon={lon_col}, time={timestamp_col}, individual={individual_col}")

    df.rename(columns={
        lat_col: 'latitude',
        lon_col: 'longitude'
    }, inplace=True)

    # TIMESTAMP FIX
    if timestamp_col:
        df.rename(columns={timestamp_col: 'timestamp'}, inplace=True)
        try:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        except:
            print(f"Warning: Could not convert timestamp column to datetime")
    else:
        print("Warning: No timestamp column found - creating sequential timestamps")
        if 'HMM_0' in data_type:
            base_time = pd.Timestamp('2020-01-01')
        elif 'HMM_1' in data_type:
            base_time = pd.Timestamp('2021-01-01')
        elif 'BBMM_0' in data_type:
            base_time = pd.Timestamp('2022-01-01')
        elif 'BBMM_1' in data_type:
            base_time = pd.Timestamp('2023-01-01')
        else:
            base_time = pd.Timestamp('2020-01-01')

        df['timestamp'] = pd.date_range(start=base_time, periods=len(df), freq='H')
        print(f"Created {len(df)} sequential timestamps starting from {base_time}")

    if individual_col:
        df.rename(columns={individual_col: 'individual_id'}, inplace=True)
    else:
        df['individual_id'] = 'unknown'

    df = df.dropna(subset=['latitude', 'longitude'])

    invalid_lat = (~df['latitude'].between(-90, 90)).sum()
    invalid_lon = (~df['longitude'].between(-180, 180)).sum()

    if invalid_lat > 0 or invalid_lon > 0:
        print(f"Warning: Found {invalid_lat} invalid latitude and {invalid_lon} invalid longitude values")
        print(f"  Latitude range: [{df['latitude'].min():.2f}, {df['latitude'].max():.2f}]")
        print(f"  Longitude range: [{df['longitude'].min():.2f}, {df['longitude'].max():.2f}]")

    df = df[(df['latitude'].between(-90, 90)) & (df['longitude'].between(-180, 180))]

    if len(df) == 0:
        print(f"ERROR: All rows filtered out in {data_type} - likely wrong columns detected!")
        return None

    print(f"Preprocessed data shape: {df.shape}")

    return df

def calculate_movement_features(df):
    """Use existing movement features from HMM data when available"""
    print("Calculating movement features")

    df = df.copy()

    # Check if step_length and turning_angle already exist (from HMM data)
    if 'step_length' in df.columns and 'turning_angle' in df.columns:
        print("Using existing movement features from HMM data")
        # Just ensure they're clean
        df['step_length'] = df['step_length'].fillna(0)
        df['turning_angle'] = df['turning_angle'].fillna(0)
        return df

    # If not, calculate them from coordinates
    print("Calculating movement features from coordinates")
    df = df.reset_index(drop=True)
    df = df.sort_values(['individual_id', 'timestamp'])
    df = df.reset_index(drop=True)

    # Avoid groupby - use manual iteration instead
    df['prev_lat'] = np.nan
    df['prev_lon'] = np.nan
    df['prev_prev_lat'] = np.nan
    df['prev_prev_lon'] = np.nan

    for individual_id in df['individual_id'].unique():
        mask = df['individual_id'] == individual_id
        indices = df[mask].index

        if len(indices) > 0:
            df.loc[indices[1:], 'prev_lat'] = df.loc[indices[:-1], 'latitude'].values
            df.loc[indices[1:], 'prev_lon'] = df.loc[indices[:-1], 'longitude'].values

        if len(indices) > 1:
            df.loc[indices[2:], 'prev_prev_lat'] = df.loc[indices[:-2], 'latitude'].values
            df.loc[indices[2:], 'prev_prev_lon'] = df.loc[indices[:-2], 'longitude'].values

    def haversine_vectorized(lat1, lon1, lat2, lon2):
        R = 6371.0
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lat = np.radians(lat2 - lat1)
        delta_lon = np.radians(lon2 - lon1)
        a = np.sin(delta_lat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon / 2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return R * c

    df['step_length'] = haversine_vectorized(
        df['prev_lat'], df['prev_lon'], df['latitude'], df['longitude']
    )
    df['step_length'] = df['step_length'].fillna(0)

    def calculate_bearing(lat1, lon1, lat2, lon2):
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        delta_lon = np.radians(lon2 - lon1)
        x = np.sin(delta_lon) * np.cos(lat2_rad)
        y = np.cos(lat1_rad) * np.sin(lat2_rad) - np.sin(lat1_rad) * np.cos(lat2_rad) * np.cos(delta_lon)
        bearing = np.arctan2(x, y)
        return bearing

    bearing1 = calculate_bearing(df['prev_prev_lat'], df['prev_prev_lon'], df['prev_lat'], df['prev_lon'])
    bearing2 = calculate_bearing(df['prev_lat'], df['prev_lon'], df['latitude'], df['longitude'])

    df['turning_angle'] = bearing2 - bearing1
    df['turning_angle'] = np.arctan2(np.sin(df['turning_angle']), np.cos(df['turning_angle']))
    df['turning_angle'] = df['turning_angle'].fillna(0)

    df = df.drop(['prev_lat', 'prev_lon', 'prev_prev_lat', 'prev_prev_lon'], axis=1)

    print(f"Movement features calculated from coordinates")

    return df

def add_environmental_features(df):
    """Add environmental context features"""
    print("Adding environmental features")

    df = df.copy()

    if 'elevation' not in df.columns:
        df['elevation'] = np.random.uniform(100, 1500, len(df))

    if 'rainfall' not in df.columns:
        if 'timestamp' in df.columns:
            df['month'] = df['timestamp'].dt.month
            df['rainfall'] = df['month'].map({
                1: 30, 2: 30, 3: 80, 4: 80, 5: 120, 6: 150,
                7: 150, 8: 150, 9: 120, 10: 80, 11: 80, 12: 30
            })
        else:
            df['rainfall'] = 80

    if 'ndvi' not in df.columns:
        df['ndvi'] = np.random.uniform(0.2, 0.8, len(df))

    if 'landcover' not in df.columns:
        df['landcover'] = np.random.choice([1, 2, 3, 4, 5], len(df))

    if 'distance_to_water' not in df.columns:
        df['distance_to_water'] = np.random.uniform(0.1, 20, len(df))

    if 'distance_to_settlement' not in df.columns:
        df['distance_to_settlement'] = np.random.uniform(5, 50, len(df))

    print(f"Environmental features added")

    return df

def merge_model_outputs(hmm_dfs, bbmm_dfs, xgb_models):
    print("Merging outputs from HMM, BBMM, and XGBoost models")

    all_data = []

    for i, hmm_df in enumerate(hmm_dfs):
        if hmm_df is None:
            continue

        print(f"Processing HMM data {i}")
        df = preprocess_dataframe(hmm_df, f"HMM_{i}")
        if df is None:
            continue

        # Ensure timestamp exists for movement features
        if 'timestamp' not in df.columns:
            print(f"Creating timestamps for HMM_{i}")
            base_time = pd.Timestamp('2020-01-01') + pd.Timedelta(days=i*365)
            df['timestamp'] = pd.date_range(start=base_time, periods=len(df), freq='H')

        # Calculate movement features using your actual GPS data
        df = calculate_movement_features(df)

        # Add environmental features using your actual data
        df = add_environmental_features(df)

        # Extract BBMM-related features from your BBMM data
        if i < len(bbmm_dfs) and bbmm_dfs[i] is not None:
            bbmm_df = bbmm_dfs[i]
            bbmm_df = preprocess_dataframe(bbmm_df, f"BBMM_{i}")

            if bbmm_df is not None:
                print(f"Processing BBMM data {i}")

                # Handle duplicate column names in BBMM data
                bbmm_df = bbmm_df.loc[:, ~bbmm_df.columns.duplicated()]
                print(f"BBMM columns after deduplication: {list(bbmm_df.columns)}")

                # Convert individual_id to string in both dataframes to avoid type conflicts
                df['individual_id'] = df['individual_id'].astype(str)
                bbmm_df['individual_id'] = bbmm_df['individual_id'].astype(str)

                # Look for ACTUAL utilization density columns in BBMM data
                # Skip common coordinate and identifier columns
                skip_cols = ['longitude', 'latitude', 'lat', 'lon', 'location-lat', 'location-long',
                           'individual_id', 'timestamp', 'study-name', 'tag-local-identifier',
                           'individual-local-identifier', 'collar', 'CollarID']

                util_cols = [col for col in bbmm_df.columns
                           if ('utilization' in col.lower() and 'density' in col.lower())
                           or ('ud' in col.lower() and col.lower() != 'study-name')
                           and col not in skip_cols]

                if not util_cols:
                    # Look for probability or intensity columns (but skip coordinates)
                    util_cols = [col for col in bbmm_df.columns
                               if any(word in col.lower() for word in ['probability', 'intensity', 'density', 'usage'])
                               and col not in skip_cols]

                if util_cols:
                    print(f"Found potential utilization density columns: {util_cols}")
                    # Use the first utilization density column found
                    util_col = util_cols[0]

                    # Try to merge based on common columns
                    merge_cols = []
                    if 'timestamp' in df.columns and 'timestamp' in bbmm_df.columns:
                        merge_cols.append('timestamp')
                    if 'individual_id' in df.columns and 'individual_id' in bbmm_df.columns:
                        merge_cols.append('individual_id')

                    if merge_cols:
                        print(f"Merging on columns: {merge_cols}")
                        # Ensure no duplicates in BBMM data
                        bbmm_subset = bbmm_df[merge_cols + [util_col]].drop_duplicates(subset=merge_cols)

                        # Merge with indicator to see what matches
                        merged_temp = df.merge(bbmm_subset, on=merge_cols, how='left', indicator=True)
                        print(f"Merge result: {len(merged_temp[merged_temp['_merge'] == 'left_only'])} left-only, {len(merged_temp[merged_temp['_merge'] == 'both'])} matched")

                        # Rename to standard name and drop merge indicator
                        if util_col in merged_temp.columns:
                            df['utilization_density'] = merged_temp[util_col]
                            df = df.drop(columns=['_merge'] if '_merge' in df.columns else [])
                            print(f"Successfully merged utilization density from BBMM data")

                            # Fill NaN values with mean
                            if df['utilization_density'].isna().any():
                                mean_util = df['utilization_density'].mean()
                                df['utilization_density'] = df['utilization_density'].fillna(mean_util)
                                print(f"Filled {df['utilization_density'].isna().sum()} NaN values with mean {mean_util:.3f}")
                        else:
                            df['utilization_density'] = 0.5
                    else:
                        print("No common columns for merge, using default utilization density")
                        df['utilization_density'] = 0.5
                else:
                    print(f"No utilization density column found in BBMM data.")
                    # Since no utilization density found, use movement intensity as proxy
                    movement_proxy_cols = [col for col in bbmm_df.columns
                                         if any(word in col.lower() for word in ['speed', 'velocity', 'step_length', 'movement'])
                                         and col not in skip_cols]

                    if movement_proxy_cols:
                        proxy_col = movement_proxy_cols[0]
                        print(f"Using {proxy_col} as proxy for utilization density")

                        # Try to merge movement data
                        merge_cols = []
                        if 'timestamp' in df.columns and 'timestamp' in bbmm_df.columns:
                            merge_cols.append('timestamp')
                        if 'individual_id' in df.columns and 'individual_id' in bbmm_df.columns:
                            merge_cols.append('individual_id')

                        if merge_cols:
                            bbmm_subset = bbmm_df[merge_cols + [proxy_col]].drop_duplicates(subset=merge_cols)
                            merged_temp = df.merge(bbmm_subset, on=merge_cols, how='left')

                            if proxy_col in merged_temp.columns:
                                # Normalize the proxy to 0-1 range for utilization density
                                max_val = merged_temp[proxy_col].max()
                                min_val = merged_temp[proxy_col].min()

                                if max_val > min_val and not np.isnan(max_val) and not np.isnan(min_val):
                                    df['utilization_density'] = (merged_temp[proxy_col] - min_val) / (max_val - min_val)
                                else:
                                    df['utilization_density'] = 0.5

                                print(f"Used {proxy_col} as proxy for utilization density (range: {min_val:.3f}-{max_val:.3f})")
                            else:
                                df['utilization_density'] = 0.5
                        else:
                            df['utilization_density'] = 0.5
                    else:
                        print("No suitable proxy found for utilization density, using default")
                        df['utilization_density'] = 0.5
            else:
                df['utilization_density'] = 0.5
        else:
            df['utilization_density'] = 0.5

        # Use your actual XGBoost model predictions - handle dictionary case
        if i < len(xgb_models) and xgb_models[i] is not None:
            xgb_model_dict = xgb_models[i]

            # Extract the actual model from the dictionary
            if isinstance(xgb_model_dict, dict) and 'model' in xgb_model_dict:
                xgb_model = xgb_model_dict['model']
                print(f"Extracted XGBoost model from dictionary for species {i}")

                # Use the feature names from the dictionary if available
                if 'feature_names' in xgb_model_dict:
                    feature_cols = xgb_model_dict['feature_names']
                    print(f"Using model-specific features: {feature_cols}")
                else:
                    # Fallback to default features
                    feature_cols = ['elevation', 'rainfall', 'ndvi', 'landcover',
                                  'distance_to_water', 'distance_to_settlement']

                available_cols = [col for col in feature_cols if col in df.columns]

                print(f"Available features for XGBoost prediction: {available_cols}")

                if available_cols:
                    try:
                        X_xgb = df[available_cols].fillna(0)
                        df['suitability_score'] = xgb_model.predict(X_xgb)
                        print(f"Successfully predicted suitability scores using XGBoost")
                    except Exception as e:
                        print(f"Error predicting suitability score for HMM_{i}: {e}")
                        df['suitability_score'] = 0.5
                else:
                    print(f"Warning: No features available for XGBoost prediction in HMM_{i}")
                    df['suitability_score'] = 0.5
            else:
                print(f"XGBoost model {i} is not in expected format, using default suitability score")
                df['suitability_score'] = 0.5
        else:
            df['suitability_score'] = 0.5

        # Extract HMM states from your actual HMM data
        # Look for state columns in your HMM output
        state_columns = [col for col in df.columns if 'state' in col.lower() and 'behavioral' not in col.lower()]
        if state_columns:
            df['state'] = df[state_columns[0]]  # Use the first state column found
            print(f"Using HMM state column: {state_columns[0]}")
        else:
            # Look for behavioral state columns
            behavior_cols = [col for col in df.columns if 'behavior' in col.lower()]
            if behavior_cols:
                # Convert behavior to numeric state
                behavior_mapping = {'Resting': 1, 'Foraging': 2, 'Traveling': 3, 'Exploring': 4}
                df['state'] = df[behavior_cols[0]].map(behavior_mapping).fillna(1)
                print(f"Using behavior column: {behavior_cols[0]} mapped to states")
            else:
                print(f"Warning: No state or behavior column found in HMM_{i} data")
                # Check if we have hmm_behavioral_state from BBMM merge
                if 'hmm_behavioral_state' in df.columns:
                    behavior_mapping = {'Resting': 1, 'Foraging': 2, 'Traveling': 3, 'Exploring': 4}
                    df['state'] = df['hmm_behavioral_state'].map(behavior_mapping).fillna(1)
                    print("Using hmm_behavioral_state from BBMM data for states")
                else:
                    df['state'] = 1  # Default state

        # Ensure all required columns exist
        required_columns = ['latitude', 'longitude', 'individual_id', 'timestamp',
                           'step_length', 'turning_angle', 'utilization_density',
                           'suitability_score', 'state']

        for col in required_columns:
            if col not in df.columns:
                print(f"Warning: Required column '{col}' missing, creating with default")
                if col in ['step_length', 'turning_angle', 'utilization_density', 'suitability_score']:
                    df[col] = 0.5
                elif col == 'state':
                    df[col] = 1
                elif col == 'individual_id':
                    df[col] = f'individual_{i}'
                elif col == 'timestamp':
                    base_time = pd.Timestamp('2020-01-01')
                    df[col] = pd.date_range(start=base_time, periods=len(df), freq='H')

        all_data.append(df)

    if not all_data:
        print("No valid data to merge")
        return None

    # Concatenate all dataframes
    merged_df = pd.concat(all_data, ignore_index=True)

    # Sort by individual_id and timestamp
    if 'individual_id' in merged_df.columns and 'timestamp' in merged_df.columns:
        merged_df = merged_df.sort_values(['individual_id', 'timestamp']).reset_index(drop=True)

    print(f"Merged data shape: {merged_df.shape}")
    print(f"Total individuals: {merged_df['individual_id'].nunique()}")
    print(f"Merged data columns: {list(merged_df.columns)}")

    # Show sample of the actual data being used
    print("Sample of merged data (first 3 rows):")
    sample_cols = ['individual_id', 'timestamp', 'latitude', 'longitude', 'state', 'step_length', 'utilization_density', 'suitability_score']
    available_sample_cols = [col for col in sample_cols if col in merged_df.columns]
    print(merged_df[available_sample_cols].head(3))

    return merged_df

def find_nearest_utilization(df, bbmm_df):
    """Simple spatial matching - you might want to implement proper spatial join"""
    utilizations = []
    for idx, row in df.iterrows():
        lat, lon = row['latitude'], row['longitude']
        distances = np.sqrt((bbmm_df['latitude'] - lat)**2 + (bbmm_df['longitude'] - lon)**2)
        closest_idx = distances.idxmin()
        utilizations.append(bbmm_df.loc[closest_idx, 'utilization_density'])
    return utilizations

print("Step 4: Merging all model outputs")
merged_data = merge_model_outputs(hmm_dfs, bbmm_dfs, xgb_models)

def prepare_sequences_for_lstm(df, sequence_length, feature_columns, target_columns):
    """Prepare sequences for LSTM training using only available data - OPTIMIZED VERSION"""
    print(f"Preparing sequences with length {sequence_length}")

    # Use only columns that actually exist in the data
    available_features = [col for col in feature_columns if col in df.columns]
    available_targets = [col for col in target_columns if col in df.columns]

    print(f"Available features: {available_features}")
    print(f"Available targets: {available_targets}")

    # Check if we have the minimum required data
    if len(available_features) == 0 or len(available_targets) == 0:
        print("ERROR: No features or targets available!")
        return np.array([]), np.array([])

    if len(df) < sequence_length + 1:
        print(f"ERROR: Not enough data. Have {len(df)} rows but need at least {sequence_length + 1}")
        return np.array([]), np.array([])

    X_sequences = []
    y_sequences = []

    # Group by individual if available, otherwise treat as one individual
    if 'individual_id' in df.columns:
        groups = df.groupby('individual_id')
        print(f"Processing {len(groups)} individuals")

        # Limit the number of individuals to process to avoid memory issues
        max_individuals = 20  # Adjust this based on your memory capacity
        individual_count = 0

        for individual_id, individual_df in groups:
            individual_count += 1
            if individual_count > max_individuals:
                print(f"  Limiting to first {max_individuals} individuals to avoid memory issues")
                break

            print(f"  Processing individual {individual_count}: {individual_id}")
            individual_df = individual_df.sort_values('timestamp' if 'timestamp' in individual_df.columns else individual_df.index).reset_index(drop=True)

            if len(individual_df) <= sequence_length:
                print(f"    Individual {individual_id} has only {len(individual_df)} records, skipping")
                continue

            # Sample sequences more efficiently - don't create every possible sequence
            max_sequences_per_individual = 100  # Limit sequences per individual
            step_size = max(1, len(individual_df) // max_sequences_per_individual)

            sequences_created = 0
            for i in range(0, len(individual_df) - sequence_length, step_size):
                X_seq = individual_df[available_features].iloc[i:i+sequence_length].values
                y_seq = individual_df[available_targets].iloc[i+sequence_length].values

                # Check for valid data
                if (not np.any(np.isnan(X_seq)) and
                    not np.any(np.isnan(y_seq)) and
                    np.all(np.isfinite(X_seq)) and
                    np.all(np.isfinite(y_seq))):
                    X_sequences.append(X_seq)
                    y_sequences.append(y_seq)
                    sequences_created += 1

                    if sequences_created >= max_sequences_per_individual:
                        break

            print(f"    Created {sequences_created} sequences for individual {individual_id}")
    else:
        print("No individual_id found, processing as single individual")
        individual_df = df.sort_values('timestamp' if 'timestamp' in df.columns else df.index).reset_index(drop=True)

        if len(individual_df) <= sequence_length:
            print(f"  Data has only {len(individual_df)} records, skipping")
        else:
            # Limit total sequences for single individual case
            max_total_sequences = 1000
            step_size = max(1, len(individual_df) // max_total_sequences)

            sequences_created = 0
            for i in range(0, len(individual_df) - sequence_length, step_size):
                X_seq = individual_df[available_features].iloc[i:i+sequence_length].values
                y_seq = individual_df[available_targets].iloc[i+sequence_length].values

                # Check for valid data
                if (not np.any(np.isnan(X_seq)) and
                    not np.any(np.isnan(y_seq)) and
                    np.all(np.isfinite(X_seq)) and
                    np.all(np.isfinite(y_seq))):
                    X_sequences.append(X_seq)
                    y_sequences.append(y_seq)
                    sequences_created += 1

                    if sequences_created >= max_total_sequences:
                        break

            print(f"  Created {sequences_created} sequences")

    if len(X_sequences) == 0:
        print("ERROR: No valid sequences created!")
        print("This could be due to:")
        print("  - Not enough data per individual")
        print("  - Missing values in the data")
        print("  - Incorrect column names")
        return np.array([]), np.array([])

    X = np.array(X_sequences)
    y = np.array(y_sequences)

    print(f"Successfully created {len(X)} sequences")
    print(f"X shape: {X.shape}, y shape: {y.shape}")

    return X, y

if merged_data is not None:
    print("Step 5: Preparing sequences for LSTM")
    sequence_length = 10

    # Use the features that actually exist in your HMM data
    feature_columns = [
        'latitude', 'longitude', 'step_length', 'turning_angle',
        'elevation', 'rainfall', 'ndvi', 'landcover',
        'distance_to_water', 'distance_to_settlement',
        'state', 'utilization_density', 'suitability_score'
    ]

    target_columns = ['latitude', 'longitude', 'suitability_score']

    X, y = prepare_sequences_for_lstm(
        merged_data, sequence_length, feature_columns, target_columns
    )

    available_features = [col for col in feature_columns if col in merged_data.columns]
    available_targets = [col for col in target_columns if col in merged_data.columns]

    print(f"Final available features: {available_features}")
    print(f"Final available targets: {available_targets}")

    if len(X) == 0:
        print("CRITICAL: No sequences were created. Cannot continue.")
        print("Please check your input data files and column names.")
        exit()

if merged_data is not None and len(X) > 0:
    print("Step 6: Splitting data into train/val/test")

    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.2, random_state=42
    )

    train_df, test_df = train_test_split(merged_data, test_size=0.2, random_state=42)

    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

if merged_data is not None and len(X) > 0:
    print("Step 7: Scaling features and targets")

    scaler_x = StandardScaler()
    scaler_y = StandardScaler()

    X_train_flat = X_train.reshape(X_train.shape[0], -1)
    X_val_flat = X_val.reshape(X_val.shape[0], -1)
    X_test_flat = X_test.reshape(X_test.shape[0], -1)

    X_train_scaled_flat = scaler_x.fit_transform(X_train_flat)
    X_val_scaled_flat = scaler_x.transform(X_val_flat)
    X_test_scaled_flat = scaler_x.transform(X_test_flat)

    X_train_scaled = X_train_scaled_flat.reshape(X_train.shape)
    X_val_scaled = X_val_scaled_flat.reshape(X_val.shape)
    X_test_scaled = X_test_scaled_flat.reshape(X_test.shape)

    y_train_scaled = scaler_y.fit_transform(y_train)
    y_val_scaled = scaler_y.transform(y_val)
    y_test_scaled = scaler_y.transform(y_test)

    print(f"X_train_scaled range: [{X_train_scaled.min():.2f}, {X_train_scaled.max():.2f}]")
    print(f"y_train_scaled range: [{y_train_scaled.min():.2f}, {y_train_scaled.max():.2f}]")

experience_replay_buffer = deque(maxlen=10000)

def add_to_replay_buffer(X, y):
    print(f"Adding {len(X)} samples to replay buffer")
    for i in range(len(X)):
        experience_replay_buffer.append((X[i], y[i]))
    print(f"Replay buffer now has {len(experience_replay_buffer)} samples")

def sample_from_replay_buffer(batch_size):
    if len(experience_replay_buffer) < batch_size:
        batch_size = len(experience_replay_buffer)

    indices = np.random.choice(len(experience_replay_buffer), batch_size, replace=False)
    batch = [experience_replay_buffer[i] for i in indices]

    X_batch = np.array([item[0] for item in batch])
    y_batch = np.array([item[1] for item in batch])

    return X_batch, y_batch

def build_prototypical_network(embedding_dim=128, input_dim=130):
    print("Building prototypical network for animal re-identification")

    inputs = keras.Input(shape=(input_dim,))
    x = layers.Dense(256, activation='relu')(inputs)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(embedding_dim, activation=None)(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name='prototypical_network')
    print("Prototypical network built")

    return model

def compute_prototypes(embeddings, labels):
    unique_labels = np.unique(labels)
    prototypes = []

    for label in unique_labels:
        mask = labels == label
        class_embeddings = embeddings[mask]
        prototype = np.mean(class_embeddings, axis=0)
        prototypes.append(prototype)

    return np.array(prototypes)

def predict_with_prototypes(query_embeddings, prototypes):
    distances = []
    for query in query_embeddings:
        dists = [np.linalg.norm(query - prototype) for prototype in prototypes]
        distances.append(dists)

    distances = np.array(distances)
    predictions = np.argmin(distances, axis=1)

    return predictions

def train_prototypical_network(proto_model, support_X, support_labels, query_X, query_labels, epochs=20):
    print("Training prototypical network")

    optimizer = keras.optimizers.Adam(learning_rate=0.001)

    # Create loss function
    cross_entropy = keras.losses.SparseCategoricalCrossentropy(from_logits=False)

    for epoch in range(epochs):
        with tf.GradientTape() as tape:
            support_embeddings = proto_model(support_X, training=True)
            query_embeddings = proto_model(query_X, training=True)

            prototypes = compute_prototypes(support_embeddings.numpy(), support_labels)
            prototypes_tensor = tf.constant(prototypes, dtype=tf.float32)

            distances = tf.norm(
                tf.expand_dims(query_embeddings, 1) - tf.expand_dims(prototypes_tensor, 0),
                axis=2
            )

            logits = -distances
            loss = cross_entropy(query_labels, tf.nn.softmax(logits))

        gradients = tape.gradient(loss, proto_model.trainable_weights)
        optimizer.apply_gradients(zip(gradients, proto_model.trainable_weights))

        if epoch % 5 == 0:
            print(f"  Epoch {epoch}: Loss = {loss.numpy():.6f}")

    print("Prototypical network training complete")

def build_metric_learning_network(embedding_dim=64, input_dim=130):
    print("Building metric learning network")

    inputs = keras.Input(shape=(input_dim,))
    x = layers.Dense(128, activation='relu')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(embedding_dim, activation=None)(x)
    outputs = tf.nn.l2_normalize(x, axis=1)

    model = keras.Model(inputs=inputs, outputs=outputs, name='metric_learning_network')
    print("Metric learning network built")

    return model

def create_lstm_model(sequence_length, n_features, n_targets):
    print(f"Creating LSTM model with sequence_length={sequence_length}, features={n_features}, targets={n_targets}")

    inputs = keras.Input(shape=(sequence_length, n_features))

    x = layers.LSTM(128, return_sequences=True)(inputs)
    x = layers.Dropout(0.3)(x)
    x = layers.LSTM(64, return_sequences=True)(x)
    x = layers.Dropout(0.3)(x)
    x = layers.LSTM(32, return_sequences=False)(x)
    x = layers.Dropout(0.2)(x)

    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation='relu')(x)

    outputs = layers.Dense(n_targets, activation='linear')(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name='lstm_model')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )

    print("LSTM model created and compiled")
    model.summary()

    return model

if merged_data is not None and len(X) > 0:
    print("Step 8: Creating LSTM model")
    lstm_model = create_lstm_model(
        sequence_length=sequence_length,
        n_features=len(available_features),
        n_targets=len(available_targets)
    )

def train_lstm_model(model, X_train, y_train, X_val, y_val, epochs=30, batch_size=32):
    print(f"Training LSTM model for {epochs} epochs with batch size {batch_size}")

    early_stopping = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )

    reduce_lr = keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=0.00001,
        verbose=1
    )

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[early_stopping, reduce_lr],
        verbose=1
    )

    print("Training complete")

    return history

if merged_data is not None and len(X) > 0:
    print("Step 9: Training LSTM model")
    history = train_lstm_model(
        lstm_model, X_train_scaled, y_train_scaled,
        X_val_scaled, y_val_scaled, epochs=30, batch_size=32
    )

    print("Step 9b: Adding training data to replay buffer")
    add_to_replay_buffer(X_train_scaled, y_train_scaled)

def evaluate_model(model, X_test, y_test, scaler_y):
    print("Evaluating model on test data")

    y_pred_scaled = model.predict(X_test, verbose=0)

    y_test_original = scaler_y.inverse_transform(y_test)
    y_pred_original = scaler_y.inverse_transform(y_pred_scaled)

    mse = mean_squared_error(y_test_original, y_pred_original)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test_original, y_pred_original)
    r2 = r2_score(y_test_original, y_pred_original)

    if y_test_original.shape[1] >= 2:
        distances = []
        for i in range(len(y_test_original)):
            dist = euclidean(y_test_original[i, :2], y_pred_original[i, :2])
            distances.append(dist)
        mean_distance_error = np.mean(distances)
    else:
        mean_distance_error = None

    metrics = {
        'mse': mse,
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
        'mean_distance_error': mean_distance_error
    }

    print(f"Mean Squared Error: {mse:.6f}")
    print(f"Root Mean Squared Error: {rmse:.6f}")
    print(f"Mean Absolute Error: {mae:.6f}")
    print(f"R2 Score: {r2:.6f}")
    if mean_distance_error:
        print(f"Mean Distance Error: {mean_distance_error:.6f} units")

    return metrics, y_test_original, y_pred_original

if merged_data is not None and len(X) > 0:
    print("Step 10: Evaluating model")
    evaluation_metrics, y_test_true, y_test_pred = evaluate_model(
        lstm_model, X_test_scaled, y_test_scaled, scaler_y
    )

def continuous_learning_update(model, new_X, new_y, replay_ratio=0.5, epochs=5):
    print("Performing continuous learning update")
    print(f"New data: {len(new_X)} samples, Replay ratio: {replay_ratio}")

    add_to_replay_buffer(new_X, new_y)

    new_batch_size = int(len(new_X) * (1 - replay_ratio))
    replay_batch_size = int(len(new_X) * replay_ratio)

    for epoch in range(epochs):
        if len(experience_replay_buffer) > 0:
            X_replay, y_replay = sample_from_replay_buffer(replay_batch_size)
            X_combined = np.concatenate([new_X, X_replay], axis=0)
            y_combined = np.concatenate([new_y, y_replay], axis=0)
        else:
            X_combined = new_X
            y_combined = new_y

        history = model.fit(
            X_combined, y_combined,
            epochs=1,
            batch_size=32,
            verbose=0
        )

        if epoch % 2 == 0:
            print(f"  Epoch {epoch+1}/{epochs}: Loss = {history.history['loss'][0]:.6f}")

    print("Continuous learning update complete")

def fine_tune_model(model, X_finetune, y_finetune, epochs=10, lr=0.0001):
    print("Fine-tuning model")
    print(f"Fine-tune data: {len(X_finetune)} samples, Learning rate: {lr}")

    try:
        # Method 1: Direct assignment
        model.optimizer.learning_rate.assign(lr)
        print(f"Learning rate set to {lr}")
    except Exception as e:
        print(f"Method 1 failed: {e}")
        try:
            # Method 2: Recompile with new learning rate
            from tensorflow.keras.optimizers import Adam
            model.compile(
                optimizer=Adam(learning_rate=lr),
                loss=model.loss,
                metrics=model.metrics_names
            )
            print(f"Model recompiled with learning rate {lr}")
        except Exception as e2:
            print(f"Method 2 failed: {e2}")
            # Method 3: Use learning rate scheduler
            print("Using ReduceLROnPlateau callback instead")
            reduce_lr = keras.callbacks.ReduceLROnPlateau(
                monitor='loss',
                factor=0.5,
                patience=2,
                min_lr=lr,
                verbose=1
            )
            callbacks = [reduce_lr]
    else:
        callbacks = []

    history = model.fit(
        X_finetune, y_finetune,
        epochs=epochs,
        batch_size=16,
        verbose=1,
        callbacks=callbacks
    )

    print("Fine-tuning complete")
    return history

def maml_inner_loop(model, support_X, support_y, inner_lr=0.01, num_steps=5):
    print("Performing MAML inner loop adaptation")

    original_weights = [w.numpy() for w in model.trainable_weights]

    # Create loss function
    mse_loss = keras.losses.MeanSquaredError()

    for step in range(num_steps):
        with tf.GradientTape() as tape:
            predictions = model(support_X, training=True)
            loss = mse_loss(support_y, predictions)
            loss = tf.reduce_mean(loss)

        gradients = tape.gradient(loss, model.trainable_weights)

        for grad, weight in zip(gradients, model.trainable_weights):
            if grad is not None:
                weight.assign(weight - inner_lr * grad)

        if step % 2 == 0:
            print(f"  Inner step {step}: Loss = {loss.numpy():.6f}")

    print("MAML inner loop complete")
    return original_weights

def adapt_to_new_species(model, support_X, support_y, num_steps=10):
    print(f"Adapting to new species with {len(support_X)} examples")

    # Save original learning rate
    original_lr = model.optimizer.learning_rate.numpy()

    # Set higher learning rate for adaptation
    model.optimizer.learning_rate.assign(0.01)

    # Create loss function
    mse_loss = keras.losses.MeanSquaredError()

    for step in range(num_steps):
        with tf.GradientTape() as tape:
            predictions = model(support_X, training=True)
            loss = mse_loss(support_y, predictions)
            loss = tf.reduce_mean(loss)

        gradients = tape.gradient(loss, model.trainable_weights)

        for grad, weight in zip(gradients, model.trainable_weights):
            if grad is not None:
                weight.assign(weight - 0.01 * grad)

        if step % 3 == 0:
            print(f"  Adaptation step {step}: Loss = {loss.numpy():.6f}")

    # Restore original learning rate
    model.optimizer.learning_rate.assign(original_lr)

    print("Adaptation to new species complete")

if merged_data is not None and len(X) > 0:
    print("Step 11: Demonstrating continuous learning")
    new_data_indices = np.random.choice(len(X_test_scaled), 50, replace=False)
    continuous_learning_update(
        lstm_model,
        X_test_scaled[new_data_indices],
        y_test_scaled[new_data_indices],
        replay_ratio=0.5,
        epochs=5
    )

if merged_data is not None and len(X) > 0:
    print("Step 12: Demonstrating fine-tuning")
    finetune_indices = np.random.choice(len(X_test_scaled), 100, replace=False)
    fine_tune_history = fine_tune_model(
        lstm_model,
        X_test_scaled[finetune_indices],
        y_test_scaled[finetune_indices],
        epochs=5,
        lr=0.0001
    )

if merged_data is not None and len(X) > 0:
    print("Step 13: Building and training prototypical network")
    proto_model = build_prototypical_network(embedding_dim=128, input_dim=X_train_scaled.shape[1] * X_train_scaled.shape[2])

    support_indices = np.random.choice(len(X_train_scaled), 50, replace=False)
    support_X_flat = X_train_scaled[support_indices].reshape(50, -1)
    support_labels = np.random.randint(0, 5, 50)

    query_indices = np.random.choice(len(X_train_scaled), 30, replace=False)
    query_X_flat = X_train_scaled[query_indices].reshape(30, -1)
    query_labels = np.random.randint(0, 5, 30)

    train_prototypical_network(
        proto_model, support_X_flat, support_labels,
        query_X_flat, query_labels, epochs=20
    )

if merged_data is not None and len(X) > 0:
    print("Step 14: Demonstrating MAML adaptation")
    new_species_indices = np.random.choice(len(X_test_scaled), 10, replace=False)
    adapt_to_new_species(
        lstm_model,
        X_test_scaled[new_species_indices],
        y_test_scaled[new_species_indices],
        num_steps=10
    )

def save_model_and_scalers(model, scaler_x, scaler_y, metrics, output_dir):
    print(f"Saving model and scalers to {output_dir}")

    os.makedirs(output_dir, exist_ok=True)

    model_path = os.path.join(output_dir, 'lstm_final_model.h5')
    model.save(model_path)
    print(f"Saved Keras model to {model_path}")

    # Save as .pkl (Pickle format)
    model_path_pkl = os.path.join(output_dir, 'lstm_final_model.pkl')
    with open(model_path_pkl, 'wb') as f:
        pickle.dump(model, f)
    print(f"Saved model as pickle to {model_path_pkl}")

    # Also save model architecture as JSON
    model_arch_path = os.path.join(output_dir, 'model_architecture.json')
    model_json = model.to_json()
    with open(model_arch_path, 'w') as f:
        f.write(model_json)
    print(f"Saved model architecture to {model_arch_path}")

    scaler_x_path = os.path.join(output_dir, 'scaler_x.pkl')
    with open(scaler_x_path, 'wb') as f:
        pickle.dump(scaler_x, f)
    print(f"Saved X scaler to {scaler_x_path}")

    scaler_y_path = os.path.join(output_dir, 'scaler_y.pkl')
    with open(scaler_y_path, 'wb') as f:
        pickle.dump(scaler_y, f)
    print(f"Saved Y scaler to {scaler_y_path}")

    buffer_path = os.path.join(output_dir, 'replay_buffer.pkl')
    with open(buffer_path, 'wb') as f:
        pickle.dump(list(experience_replay_buffer), f)
    print(f"Saved replay buffer to {buffer_path}")

    metrics_path = os.path.join(output_dir, 'evaluation_metrics.csv')
    metrics_df = pd.DataFrame([metrics])
    metrics_df.to_csv(metrics_path, index=False)
    print(f"Saved evaluation metrics to {metrics_path}")

    return model_path, scaler_x_path, scaler_y_path, metrics_path

if merged_data is not None and len(X) > 0:
    print("Step 15: Saving model and results")
    output_directory = '/data/outputs'
    model_path, scaler_x_path, scaler_y_path, metrics_path = save_model_and_scalers(
        lstm_model, scaler_x, scaler_y, evaluation_metrics, output_directory
    )

def plot_training_history(history, output_dir):
    print("Plotting training history")

    plt.figure(figsize=(12, 4))

    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    plt.grid(True, alpha=0.3)

    plt.subplot(1, 2, 2)
    plt.plot(history.history['mae'], label='Train MAE')
    plt.plot(history.history['val_mae'], label='Val MAE')
    plt.xlabel('Epoch')
    plt.ylabel('MAE')
    plt.title('Training and Validation MAE')
    plt.legend()
    plt.grid(True, alpha=0.3)

    plt.tight_layout()

    plot_path = os.path.join(output_dir, 'training_history.png')
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Saved training history plot to {plot_path}")
    plt.close()

def plot_predictions_comparison(y_true, y_pred, output_dir, n_samples=100):
    print("Plotting predictions comparison")

    n_samples = min(n_samples, len(y_true))
    indices = np.random.choice(len(y_true), n_samples, replace=False)

    plt.figure(figsize=(14, 5))

    for i in range(min(2, y_true.shape[1])):
        plt.subplot(1, 2, i+1)
        plt.scatter(y_true[indices, i], y_pred[indices, i], alpha=0.5)
        plt.plot([y_true[:, i].min(), y_true[:, i].max()],
                [y_true[:, i].min(), y_true[:, i].max()],
                'r--', lw=2, label='Perfect Prediction')
        plt.xlabel('Actual')
        plt.ylabel('Predicted')
        plt.title(f'Target Variable {i+1}')
        plt.legend()
        plt.grid(True, alpha=0.3)

    plt.tight_layout()

    plot_path = os.path.join(output_dir, 'predictions_comparison.png')
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Saved predictions comparison plot to {plot_path}")
    plt.close()

if merged_data is not None and len(X) > 0:
    print("Step 16: Creating visualizations")
    plot_training_history(history, output_directory)
    plot_predictions_comparison(y_test_true, y_test_pred, output_directory)

def predict_on_new_data(model, scaler_x, scaler_y, new_df, sequence_length, feature_columns, target_columns):
    print("Making predictions on new unseen data")

    new_df = preprocess_dataframe(new_df, "new_data")
    if new_df is None:
        return None

    new_df = calculate_movement_features(new_df)
    new_df = add_environmental_features(new_df)

    if 'utilization_density' not in new_df.columns:
        new_df['utilization_density'] = 0.5
    if 'suitability_score' not in new_df.columns:
        new_df['suitability_score'] = 0.5

    X_new, y_new = prepare_sequences_for_lstm(
        new_df, sequence_length, feature_columns, target_columns
    )

    if len(X_new) == 0:
        print("No valid sequences created from new data")
        return None

    X_new_flat = X_new.reshape(X_new.shape[0], -1)
    X_new_scaled_flat = scaler_x.transform(X_new_flat)
    X_new_scaled = X_new_scaled_flat.reshape(X_new.shape)

    y_pred_scaled = model.predict(X_new_scaled, verbose=0)
    y_pred_original = scaler_y.inverse_transform(y_pred_scaled)

    print(f"Made {len(y_pred_original)} predictions on new data")

    return y_pred_original

if merged_data is not None and len(X) > 0:
    print("Step 17: Testing prediction on sample of test data")
    sample_test_df = test_df.sample(min(100, len(test_df)))
    new_predictions = predict_on_new_data(
        lstm_model, scaler_x, scaler_y, sample_test_df,
        sequence_length, available_features, available_targets
    )

    if new_predictions is not None:
        print(f"Sample predictions shape: {new_predictions.shape}")
        print("First 5 predictions:")
        print(new_predictions[:5])

if merged_data is not None and len(X) > 0:
    print("Pipeline execution complete")
    print(f"Final MSE: {evaluation_metrics['mse']:.6f}")
    print(f"Final RMSE: {evaluation_metrics['rmse']:.6f}")
    print(f"Final MAE: {evaluation_metrics['mae']:.6f}")
    print(f"Final R2: {evaluation_metrics['r2']:.6f}")
    if evaluation_metrics['mean_distance_error']:
        print(f"Final Distance Error: {evaluation_metrics['mean_distance_error']:.6f}")

    print("\nEnhanced features available:")
    print("  - Prototypical Networks for animal re-identification")
    print("  - Metric Learning for behavior classification")
    print("  - MAML for quick adaptation to new species")
    print(f"  - Experience Replay Buffer with {len(experience_replay_buffer)} samples")
    print("  - Continuous learning capabilities")
    print("  - Fine-tuning capabilities")
else:
    print("Failed to merge data or create sequences, pipeline stopped")

