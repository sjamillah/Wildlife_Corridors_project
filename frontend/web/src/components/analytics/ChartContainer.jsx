import React from 'react';
import Card from '../shared/Card';

const ChartContainer = ({ title, children, actions }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      <div className="h-80">
        {children}
      </div>
    </Card>
  );
};

export default ChartContainer;