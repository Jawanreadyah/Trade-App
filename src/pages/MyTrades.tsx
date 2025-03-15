import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import TradeHistory from '../components/TradeHistory';
import { Inbox, Send } from 'lucide-react';

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

export default function MyTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (user) {
      loadTrades();
    }
  }, [user, activeTab]);

  async function loadTrades() {
    if (!user) return;

    const query = supabase
      .from('trade_requests')
      .select(`
        *,
        requester:requester_id (username),
        receiver:receiver_id (username),
        requester_items (title, estimated_value),
        receiver_items (title, estimated_value)
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await (activeTab === 'received'
      ? query.eq('receiver_id', user.id)
      : query.eq('requester_id', user.id));

    setLoading(false);

    if (error) {
      console.error('Error loading trades:', error);
      return;
    }

    const formattedTrades = data.map(trade => ({
      id: trade.id,
      status: trade.status,
      created_at: trade.created_at,
      requester: {
        username: trade.requester.username,
        items: trade.requester_items,
      },
      receiver: {
        username: trade.receiver.username,
        items: trade.receiver_items,
      },
    }));

    setTrades(formattedTrades);
  }

  async function handleTradeAction(tradeId: string, action: 'accept' | 'reject') {
    if (!user) return;

    const { error } = await supabase
      .from('trade_requests')
      .update({
        status: action === 'accept' ? 'completed' : 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId)
      .eq('receiver_id', user.id);

    if (error) {
      console.error('Error updating trade:', error);
      return;
    }

    loadTrades();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Trades</h1>
        <p className="mt-2 text-gray-600">Manage your trade requests and history</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('received')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Inbox className="h-5 w-5 inline-block mr-2" />
              Received Trades
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Send className="h-5 w-5 inline-block mr-2" />
              Sent Trades
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : trades.length > 0 ? (
        <TradeHistory trades={trades} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No {activeTab} trades found.
          </p>
        </div>
      )}
    </div>
  );
}