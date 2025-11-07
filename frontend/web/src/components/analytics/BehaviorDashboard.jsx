import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Eye, Brain } from '@/components/shared/Icons';
import { COLORS } from '@/constants/Colors';
import { behavior as behaviorService } from '@/services';

const BehaviorDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await behaviorService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch behavior summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: COLORS.textSecondary }}>
        <Activity style={{ width: 48, height: 48, margin: '0 auto 16px' }} className="animate-pulse" />
        <div>Loading behavior analysis...</div>
      </div>
    );
  }

  if (!summary || summary.total_animals === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: COLORS.textSecondary }}>
        <Brain style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
        <div>No behavior data available</div>
      </div>
    );
  }

  const getBehaviorColor = (behavior) => {
    const colors = {
      resting: COLORS.info,
      foraging: COLORS.success,
      traveling: COLORS.burntOrange,
      migrating: COLORS.ochre
    };
    return colors[behavior?.toLowerCase()] || COLORS.textSecondary;
  };

  const getBehaviorIcon = (behavior) => {
    return '●';
  };

  return (
    <div style={{ background: COLORS.whiteCard, borderRadius: '12px', border: `1px solid ${COLORS.borderLight}`, padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain style={{ width: 20, height: 20 }} color={COLORS.forestGreen} />
          Animal Behavior Analysis
        </h2>
        <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>
          HMM-based behavioral state detection • {summary.model_used} model
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: COLORS.tintRangers, padding: '16px', borderRadius: '8px', border: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, marginBottom: '8px' }}>
            Total Animals
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen }}>
            {summary.total_animals}
          </div>
        </div>

        {Object.entries(summary.distribution || {}).map(([behavior, animalList]) => (
          <div
            key={behavior}
            style={{
              background: `${getBehaviorColor(behavior)}15`,
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${getBehaviorColor(behavior)}40`
            }}
          >
            <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, marginBottom: '8px', textTransform: 'capitalize' }}>
              {behavior}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: getBehaviorColor(behavior) }}>
              {animalList.length}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '12px' }}>
          Current Behavior States
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {summary.animals && summary.animals.map((animal) => (
            <div
              key={animal.animal_id}
              style={{
                background: COLORS.secondaryBg,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '4px' }}>
                  {animal.name}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                  {animal.species} • {animal.speed_kmh} km/h
                </div>
              </div>
              
              <div style={{
                padding: '6px 12px',
                background: `${getBehaviorColor(animal.current_behavior)}20`,
                border: `1px solid ${getBehaviorColor(animal.current_behavior)}`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ color: getBehaviorColor(animal.current_behavior), fontSize: '14px' }}>
                  {getBehaviorIcon(animal.current_behavior)}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: getBehaviorColor(animal.current_behavior),
                  textTransform: 'capitalize'
                }}>
                  {animal.current_behavior}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {summary.distribution && Object.keys(summary.distribution).length > 0 && (
        <div style={{
          background: COLORS.tintInfo,
          padding: '12px',
          borderRadius: '8px',
          fontSize: '11px',
          color: COLORS.textSecondary
        }}>
          <strong>Behavior Distribution:</strong>
          {Object.entries(summary.distribution).map(([behavior, animals]) => (
            <div key={behavior} style={{ marginTop: '4px' }}>
              • <span style={{ textTransform: 'capitalize' }}>{behavior}</span>: {animals.join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BehaviorDashboard;

