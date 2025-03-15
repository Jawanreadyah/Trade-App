import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Trade {
  id: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  requester: {
    username: string;
    items: Array<{
      title: string;
      estimated_value: number;
    }>;
  };
  receiver: {
    username: string;
    items: Array<{
      title: string;
      estimated_value: number;
    }>;
  };
}

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const getStatusIcon = (status: Trade['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: Trade['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <div key={trade.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">Trade #{trade.id.slice(0, 8)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(trade.status)}`}>
                {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(trade.created_at), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">{trade.requester.username}'s Offer:</h4>
              <ul className="space-y-1">
                {trade.requester.items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{item.title}</span>
                    <span className="text-gray-600">${item.estimated_value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">{trade.receiver.username}'s Offer:</h4>
              <ul className="space-y-1">
                {trade.receiver.items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{item.title}</span>
                    <span className="text-gray-600">${item.estimated_value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {getStatusIcon(trade.status)}
              <span className="text-sm text-gray-600">
                {trade.status === 'completed'
                  ? 'Trade completed successfully'
                  : trade.status === 'rejected'
                  ? 'Trade was rejected'
                  : 'Waiting for response'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}