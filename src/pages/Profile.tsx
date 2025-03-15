import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Camera, Star, Package, RefreshCw } from 'lucide-react';

interface Profile {
  username: string;
  avatar_url: string | null;
  reputation_score: number;
  trades_completed: number;
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function loadProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setLoading(false);

    if (error) {
      setError('Failed to load profile');
      return;
    }

    setProfile(data);
    setUsername(data.username);
    setAvatarUrl(data.avatar_url);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      setError('Failed to update profile');
      return;
    }

    setEditing(false);
    loadProfile();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      setError('Failed to upload avatar');
      return;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <div className="space-y-4 max-w-md mx-auto">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
        
        <div className="px-6 py-8">
          <div className="flex flex-col items-center -mt-20 mb-6">
            <div className="relative">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}
                alt={profile.username}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
              {editing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            
            {editing ? (
              <form onSubmit={handleUpdateProfile} className="mt-4 w-full max-w-md">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {error && (
                  <div className="mb-4 text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mt-4">{profile.username}</h1>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 text-yellow-400 mr-2" />
                <span className="text-2xl font-bold">{profile.reputation_score.toFixed(1)}</span>
              </div>
              <p className="text-gray-600">Reputation Score</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{profile.trades_completed}</span>
              </div>
              <p className="text-gray-600">Completed Trades</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <RefreshCw className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-2xl font-bold">Active</span>
              </div>
              <p className="text-gray-600">Account Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}