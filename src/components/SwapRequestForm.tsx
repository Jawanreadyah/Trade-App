import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Send, X } from 'lucide-react';

interface SwapRequestFormProps {
  receiverId: string;
  receiverItems: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SwapRequestForm({
  receiverId,
  receiverItems,
  onClose,
  onSuccess,
}: SwapRequestFormProps) {
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) {
      loadUserItems();
    }
  }, [user]);

  async function loadUserItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'available');

    if (error) {
      setError('Failed to load your items');
      return;
    }

    setUserItems(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    const { error } = await supabase
      .from('trade_requests')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        requester_items: selectedItems,
        receiver_items: receiverItems,
        status: 'pending'
      });

    setLoading(false);

    if (error) {
      setError('Failed to send trade request');
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create Trade Request</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select your items to trade
          </label>
          <div className="grid grid-cols-2 gap-3">
            {userItems.map((item) => (
              <label
                key={item.id}
                className={`
                  border rounded-md p-3 flex items-center cursor-pointer
                  ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems([...selectedItems, item.id]);
                    } else {
                      setSelectedItems(selectedItems.filter(id => id !== item.id));
                    }
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">${item.estimated_value}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || selectedItems.length === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-white
              ${loading || selectedItems.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            <Send className="h-4 w-4" />
            <span>Send Trade Request</span>
          </button>
        </div>
      </form>
    </div>
  );
}