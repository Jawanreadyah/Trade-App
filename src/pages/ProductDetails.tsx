import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import SwapRequestForm from '../components/SwapRequestForm';
import { Star, Tag, AlertCircle } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  description: string;
  condition: string;
  estimated_value: number;
  category: string;
  images: string[];
  user_id: string;
  profiles: {
    username: string;
    reputation_score: number;
    trades_completed: number;
  };
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    if (!id) return;

    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profiles:user_id (
          username,
          reputation_score,
          trades_completed
        )
      `)
      .eq('id', id)
      .single();

    setLoading(false);

    if (error) {
      setError('Failed to load item details');
      return;
    }

    setItem(data);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Item</h2>
        <p className="text-gray-600">{error || 'Item not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-w-1 aspect-h-1 mb-4">
            <img
              src={item.images[selectedImage] || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
              alt={item.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          
          {item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-w-1 aspect-h-1 ${selectedImage === index ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <img
                    src={image}
                    alt={`${item.title} - Image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
          
          <div className="flex items-center space-x-4 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {item.condition}
            </span>
            <div className="flex items-center text-gray-600">
              <Tag className="h-5 w-5 mr-1" />
              {item.category}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ${item.estimated_value}
            </div>
            <p className="text-sm text-gray-600">Estimated Value</p>
          </div>

          <div className="prose prose-sm text-gray-600 mb-6">
            {item.description}
          </div>

          <div className="border-t border-b py-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Listed by</p>
                <p className="font-medium text-gray-900">{item.profiles.username}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium">{item.profiles.reputation_score.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-600">{item.profiles.trades_completed} trades</p>
              </div>
            </div>
          </div>

          {user && user.id !== item.user_id ? (
            <button
              onClick={() => setShowTradeForm(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Propose Trade
            </button>
          ) : user && user.id === item.user_id ? (
            <div className="text-center py-3 px-6 bg-gray-100 rounded-lg text-gray-600">
              This is your item
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors"
            >
              Sign in to Trade
            </button>
          )}
        </div>
      </div>

      {showTradeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <SwapRequestForm
              receiverId={item.user_id}
              receiverItems={[item.id]}
              onClose={() => setShowTradeForm(false)}
              onSuccess={() => {
                setShowTradeForm(false);
                navigate('/my-trades');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}