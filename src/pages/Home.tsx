import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';
import { Search, Filter, Loader2 } from 'lucide-react';

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
  };
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems();
    loadCategories();
    subscribeToItems();

    // Set up polling for new items every 2 seconds
    const interval = setInterval(() => {
      refreshItems();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  async function loadItems() {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profiles:user_id (
          username,
          reputation_score
        )
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading items:', error);
      return;
    }

    setItems(data || []);
    setLoading(false);
  }

  async function refreshItems() {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }

  function subscribeToItems() {
    const subscription = supabase
      .channel('items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        async () => {
          await loadItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from('items')
      .select('category')
      .eq('status', 'available');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    const uniqueCategories = [...new Set(data.map(item => item.category))];
    setCategories(uniqueCategories);
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Items for Trade</h1>
        <p className="mt-2 text-gray-600">Discover items you can trade for. No cash needed!</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="sm:w-64">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {refreshing && (
        <div className="flex items-center justify-center text-gray-500 mb-4">
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          <span>Refreshing...</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg"></div>
              <div className="bg-white p-4 rounded-b-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              condition={item.condition}
              estimatedValue={item.estimated_value}
              category={item.category}
              images={item.images}
              ownerName={item.profiles.username}
              ownerRating={item.profiles.reputation_score}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}