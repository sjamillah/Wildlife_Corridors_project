import React from 'react';
import { Download, Eye, FileText, Calendar, Clock, BarChart } from '@/components/shared/Icons';
import Card from '../shared/Card';

const ReportCard = ({ report, onDownload, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-brand-primary/10 text-brand-primary';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'monthly': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <Clock className="w-4 h-4" />;
      case 'quarterly': return <BarChart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">{report.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
              {report.status}
            </span>
            <div className="flex items-center space-x-1 text-gray-500">
              {getTypeIcon(report.type)}
              <span className="text-xs">{report.type}</span>
            </div>
          </div>
          <p className="text-gray-600 mb-3">{report.description}</p>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>By {report.author}</span>
            <span>{report.date}</span>
            <span>{report.fileSize}</span>
            <span>{report.downloads} downloads</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          {onView && (
            <button 
              onClick={() => onView(report)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {onDownload && (
            <button 
              onClick={() => onDownload(report)}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ReportCard;