import React from 'react';
import Card from '../shared/Card';

const SettingsSection = ({ title, children }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </Card>
  );
};

export default SettingsSection;