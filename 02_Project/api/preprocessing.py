"""
Data Preprocessing Pipeline
Replicates the R preprocessing from Milestone 2 (Task 3 & Task 4)
Transforms raw DHS survey data into model-ready features
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any


class SurveyDataPreprocessor:
    """
    Preprocessing pipeline matching R implementation from:
    - Task_03: Data cleaning and imputation
    - Task_04: Feature engineering and scaling
    """

    def __init__(self):
        self.keep_fields = [
            'value', 'data_id', 'by_variable_id', 'precision',
            'characteristic_order', 'indicator_order', 'indicator',
            'indicator_type', 'characteristic_category',
            'denominator_unweighted', 'is_preferred'
        ]

        self.rare_category_threshold = 0.05
        self.sample_size_small = 1000
        self.sample_size_large = 10000

        self.scalers = {}
        self.categorical_mappings = {}

    def clean_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Task 03: Data cleaning pipeline
        - Drop first row (header duplication)
        - Keep only curated fields
        - Handle missing values with median/mode imputation
        - Cap outliers at 1st and 99th percentiles
        """

        df = df.copy()

        if len(df) > 0:
            df = df.iloc[1:]

        df.columns = df.columns.str.lower().str.replace(' ', '_')

        available_fields = [f for f in self.keep_fields if f in df.columns]
        df = df[available_fields]

        df = df.dropna(how='all', axis=1)

        df = df.drop_duplicates()

        for col in df.select_dtypes(include=[np.number]).columns:
            q01 = df[col].quantile(0.01)
            q99 = df[col].quantile(0.99)
            df[col] = df[col].clip(lower=q01, upper=q99)

        for col in df.columns:
            if df[col].dtype == 'object':
                mode_val = df[col].mode()[0] if not df[col].mode().empty else None
                df[col] = df[col].fillna(mode_val)
            elif df[col].dtype in [np.float64, np.int64]:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)

        return df

    def engineer_features(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Task 04: Feature engineering pipeline
        - Categorical encoding (indicator, survey_cohort, dataset_source)
        - Create dummy variables (by_variable_id, indicator_type, characteristic_category)
        - Engineered features (high_precision, char_order_quintile, indicator_importance, sample_size_tier)
        - Target transformation (log scaling for skewed distributions)
        - Numeric scaling (z-score normalization)
        """

        df = df.copy()

        if 'dataset_source' not in df.columns:
            df['dataset_source'] = 'uploaded_data'

        if fit:
            df['indicator_encoded'] = pd.Categorical(df['indicator']).codes
            df['survey_cohort'] = pd.Categorical(df['denominator_unweighted'].astype(str)).codes
            df['dataset_source_encoded'] = pd.Categorical(df['dataset_source']).codes

            self.categorical_mappings['indicator'] = dict(zip(
                df['indicator'].unique(),
                pd.Categorical(df['indicator']).codes.unique()
            ))
            self.categorical_mappings['survey_cohort'] = dict(zip(
                df['denominator_unweighted'].astype(str).unique(),
                pd.Categorical(df['denominator_unweighted'].astype(str)).codes.unique()
            ))
            self.categorical_mappings['dataset_source'] = dict(zip(
                df['dataset_source'].unique(),
                pd.Categorical(df['dataset_source']).codes.unique()
            ))
        else:
            df['indicator_encoded'] = df['indicator'].map(
                self.categorical_mappings.get('indicator', {})
            ).fillna(-1).astype(int)

            df['survey_cohort'] = df['denominator_unweighted'].astype(str).map(
                self.categorical_mappings.get('survey_cohort', {})
            ).fillna(-1).astype(int)

            df['dataset_source_encoded'] = df['dataset_source'].map(
                self.categorical_mappings.get('dataset_source', {})
            ).fillna(-1).astype(int)

        by_var_counts = df['by_variable_id'].value_counts()
        rare_threshold = self.rare_category_threshold * len(df)
        rare_categories = by_var_counts[by_var_counts < rare_threshold].index
        df['by_variable_id_grouped'] = df['by_variable_id'].apply(
            lambda x: 'Other' if x in rare_categories else x
        )

        by_var_dummies = pd.get_dummies(df['by_variable_id_grouped'], prefix='by_var')
        type_dummies = pd.get_dummies(df['indicator_type'], prefix='type')
        char_dummies = pd.get_dummies(df['characteristic_category'], prefix='char')

        if fit:
            self.categorical_mappings['by_var_columns'] = by_var_dummies.columns.tolist()
            self.categorical_mappings['type_columns'] = type_dummies.columns.tolist()
            self.categorical_mappings['char_columns'] = char_dummies.columns.tolist()
        else:
            for col in self.categorical_mappings.get('by_var_columns', []):
                if col not in by_var_dummies.columns:
                    by_var_dummies[col] = 0
            by_var_dummies = by_var_dummies[self.categorical_mappings['by_var_columns']]

            for col in self.categorical_mappings.get('type_columns', []):
                if col not in type_dummies.columns:
                    type_dummies[col] = 0
            type_dummies = type_dummies[self.categorical_mappings['type_columns']]

            for col in self.categorical_mappings.get('char_columns', []):
                if col not in char_dummies.columns:
                    char_dummies[col] = 0
            char_dummies = char_dummies[self.categorical_mappings['char_columns']]

        df['high_precision'] = (df['precision'] <= 1).astype(int)

        if df['characteristic_order'].max() > 10:
            df['char_order_quintile'] = pd.qcut(
                df['characteristic_order'],
                q=5,
                labels=False,
                duplicates='drop'
            ) + 1
        else:
            df['char_order_quintile'] = df['characteristic_order']

        df['indicator_importance'] = pd.cut(
            df['indicator_order'],
            bins=[0, 3, 6, float('inf')],
            labels=['High', 'Medium', 'Low']
        )

        from scipy.stats import skew
        value_skewness = skew(df['value'].dropna())
        if abs(value_skewness) > 2:
            df['value_log'] = np.log1p(np.abs(df['value']))
        else:
            df['value_log'] = df['value']

        df['sample_size_tier'] = pd.cut(
            df['denominator_unweighted'],
            bins=[0, self.sample_size_small, self.sample_size_large, float('inf')],
            labels=['Small', 'Medium', 'Large']
        )

        df['data_quality_score'] = (df['high_precision'] * 0.6) + (df['is_preferred'] * 0.4)

        numeric_vars = ['value_log', 'precision', 'characteristic_order', 'indicator_order', 'data_quality_score']

        if fit:
            for var in numeric_vars:
                scaler = StandardScaler()
                df[f'{var}_scaled'] = scaler.fit_transform(df[[var]])
                self.scalers[var] = scaler
        else:
            for var in numeric_vars:
                if var in self.scalers:
                    df[f'{var}_scaled'] = self.scalers[var].transform(df[[var]])
                else:
                    df[f'{var}_scaled'] = 0

        final_features = pd.concat([
            df[['value_log', 'value_log_scaled', 'precision_scaled', 'characteristic_order_scaled',
                'indicator_order_scaled', 'data_quality_score_scaled', 'is_preferred', 'high_precision',
                'indicator_encoded', 'survey_cohort', 'dataset_source_encoded', 'char_order_quintile',
                'indicator_importance', 'sample_size_tier']],
            by_var_dummies,
            type_dummies,
            char_dummies
        ], axis=1)

        return final_features

    def preprocess(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Complete preprocessing pipeline

        Args:
            df: Raw DHS survey data
            fit: If True, fit scalers and encoders. If False, use existing.

        Returns:
            Model-ready features with same structure as training data
        """
        df_cleaned = self.clean_dataset(df)

        df_features = self.engineer_features(df_cleaned, fit=fit)

        return df_features

    def get_state(self) -> Dict[str, Any]:
        """Export preprocessor state for persistence"""
        return {
            'scalers': {k: {
                'mean': v.mean_.tolist(),
                'scale': v.scale_.tolist()
            } for k, v in self.scalers.items()},
            'categorical_mappings': self.categorical_mappings
        }

    def set_state(self, state: Dict[str, Any]):
        """Import preprocessor state from persistence"""
        if 'scalers' in state:
            for var, params in state['scalers'].items():
                scaler = StandardScaler()
                scaler.mean_ = np.array(params['mean'])
                scaler.scale_ = np.array(params['scale'])
                self.scalers[var] = scaler

        if 'categorical_mappings' in state:
            self.categorical_mappings = state['categorical_mappings']
