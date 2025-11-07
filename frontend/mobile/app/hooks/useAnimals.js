import { useState, useEffect } from 'react';
import { animals } from '../services';

/**
 * Custom hook for fetching animals
 * Usage:
 *   const { animals: animalsList, loading, error, refresh } = useAnimals();
 */
export const useAnimals = (filters = {}) => {
  const [animalsList, setAnimalsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersKey = JSON.stringify(filters);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await animals.getAll(filters);
      setAnimalsList(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching animals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return {
    animals: animalsList,
    loading,
    error,
    refresh: fetchAnimals,
  };
};

/**
 * Custom hook for fetching live animal status
 * Usage:
 *   const { liveStatus, loading, error, refresh } = useLiveStatus();
 */
export const useLiveStatus = () => {
  const [liveStatus, setLiveStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const fetchLiveStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await animals.getLiveStatus();
      setLiveStatus(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching live status:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    liveStatus,
    loading,
    error,
    refresh: fetchLiveStatus,
  };
};

export default useAnimals;

