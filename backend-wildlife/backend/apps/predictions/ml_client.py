import httpx
import logging
from typing import Dict, Optional, Any
from django.conf import settings

logger = logging.getLogger(__name__)

class MLServiceClient:
    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL
        self.timeout = 60.0
        self.api_key = getattr(settings, 'ML_SERVICE_API_KEY', None)
        
        logger.info(f"ML Service Client initialized: {self.base_url}")
    
    def _get_headers(self) -> Dict[str, str]:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if self.api_key:
            headers['X-API-Key'] = self.api_key
        
        return headers
    
    async def predict_movement(
        self,
        animal_id: int,
        species: str,
        prediction_days: int = 7
    ) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/ml/movement/predict"
            
            payload = {
                'animal_id': animal_id,
                'species': species,
                'prediction_days': prediction_days
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(f"ML service error (movement prediction): {e}")
            raise Exception(f"ML service unavailable: {str(e)}")
    
    async def predict_habitat(
        self,
        lat: float,
        lon: float,
        species: str,
        radius_km: float = 10.0
    ) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/ml/habitat/predict"
            
            payload = {
                'lat': lat,
                'lon': lon,
                'species': species,
                'radius_km': radius_km
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(f"ML service error (habitat prediction): {e}")
            raise Exception(f"ML service unavailable: {str(e)}")
    
    async def predict_corridor(
        self,
        species: str,
        start_lat: float,
        start_lon: float,
        steps: int = 50,
        algorithm: str = 'ppo',
        **kwargs
    ) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/ml/corridor/predict"
            
            payload = {
                'species': species,
                'start_lat': start_lat,
                'start_lon': start_lon,
                'steps': steps,
                'algorithm': algorithm
            }
            
            optional_params = [
                'time', 'predicted_state', 'risk_score', 'temporal_score',
                'connectivity_score', 'corridor_quality'
            ]
            for param in optional_params:
                if param in kwargs:
                    payload[param] = kwargs[param]
            
            logger.info(f"Calling corridor prediction: {species}, {algorithm}, {steps} steps")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"Corridor prediction successful: {len(result.get('predictions', []))} points")
                return result
                
        except httpx.HTTPError as e:
            logger.error(f"ML service error (corridor prediction): {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            raise Exception(f"ML service unavailable: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in corridor prediction: {e}")
            raise
    
    async def get_model_status(self) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/ml/corridor/models/status"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(f"ML service error (model status): {e}")
            raise Exception(f"ML service unavailable: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/health"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(f"ML service health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }

_ml_client = None

def get_ml_client() -> MLServiceClient:
    global _ml_client
    if _ml_client is None:
        _ml_client = MLServiceClient()
    return _ml_client

