import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import TradeHistory from '../components/TradeHistory';

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

export default function Chat() {
  const { tradeId } = useParams();
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [traderId, setTraderId] = useState<string>('');
  const [traderName, setTraderName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && tradeId) {
      loadTradeDetails();
    }
  }, [user, tradeId]);

  async function loadTradeDetails() {
    if (!user || !tradeId) return;

    const { data, error } = await supabase
      .from('trade_requests')
      .select(`
        *,
        requester:requester_id (username),
        receiver:receiver_id (username),
        requester_items (title, estimated_value),
        receiver_items (title, estimated_value)
      `)
      .eq('id', tradeId)
      .single();

    setLoading(false);

    if (error) {
      setError('Failed to load trade details');
      return;
    }

    const formattedTrade = {
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      requester: {
        username: data.requester.username,
        items: data.requester_items,
      },
      receiver: {
        username: data.receiver.username,
        items: data.receiver_items,
      },
    };

    setTrade(formattedTrade);

    // Set the other trader's details
    if (user.id === data.requester_id) {
      setTraderId(data.receiver_id);
      setTraderName(data.receiver.username);
    } else {
      setTraderId(data.requester_id);
      setTraderName(data.requester.username);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error || 'Trade not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trade Discussion</h1>
        <TradeHistory trades={[trade]} />
      </div>

      <ChatBox
        tradeId={tradeId!}
        traderId={traderId}
        traderName={traderName}
      />
    </div>
  );
}