import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Camera, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Sports', 'Home', 'Games', 'Other'];

export default function NewItem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (user) {
      checkProfile();
    } else {
      // Clear loading state if no user
      setProfileLoading(false);
    }
  }, [user, retryCount]);

  async function checkProfile() {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking profile:', error);
        
        // Only try to create profile if not found
        if (error.code === 'PGRST116') {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: `user_${user.id.substring(0, 8)}`,
                reputation_score: 0,
                trades_completed: 0,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
              
            if (createError) {
              throw createError;
            }
            
            setProfileChecked(true);
            setProfileLoading(false);
            return;
          } catch (createErr) {
            console.error('Error creating profile:', createErr);
            setError('Error creating profile. Please try again.');
            setProfileLoading(false);
            return;
          }
        } else {
          setError('Failed to load your profile. Please try again.');
          setProfileLoading(false);
          return;
        }
      }

      if (!data) {
        setError('Profile not found. Please try again or visit your profile page.');
        setProfileLoading(false);
        return;
      }

      setProfileChecked(true);
      setProfileLoading(false);
    } catch (err) {
      console.error('Profile check error:', err);
      setError('Error loading profile. Please try again.');
      setProfileLoading(false);
    }
  }

  function handleRetry() {
    setRetryCount((prevCount: number) => prevCount + 1);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !user) return;

    setLoading(true);
    setUploadProgress(0);
    setError('');
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        setUploadProgress(Math.round((i / files.length) * 100));

        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('items')
          .getPublicUrl(filePath);

        newImageUrls.push(data.publicUrl);
      }

      setImageUrls([...imageUrls, ...newImageUrls]);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profileChecked) return;

    if (imageUrls.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          condition,
          category,
          estimated_value: parseFloat(estimatedValue),
          images: imageUrls,
          status: 'available'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Emit a custom event to notify about the new item
        const channel = supabase.channel('items');
        await channel.send({
          type: 'broadcast',
          event: 'new_item',
          payload: data
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please try again.');
      setLoading(false);
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (error && !profileChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">List New Item for Trade</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {imageUrls.map((url: string, index: number) => (
              <div 
                key={index} 
                className="relative rounded-lg overflow-hidden h-24 bg-gray-100 border border-gray-200"
              >
                <img 
                  src={url} 
                  alt={`Item image ${index + 1}`} 
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedUrls = [...imageUrls];
                    updatedUrls.splice(index, 1);
                    setImageUrls(updatedUrls);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            
            <label className="relative block border-2 border-dashed border-gray-300 rounded-lg h-24 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="sr-only"
              />
              <div className="flex items-center justify-center h-full">
                <Camera className="h-6 w-6 text-gray-400" />
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </label>
          </div>
          
          <p className="mt-1 text-sm text-gray-500">
            Add up to 5 images of your item
          </p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="What are you trading?"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Describe your item's features, history, and condition..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Value ($)
          </label>
          <input
            id="value"
            type="number"
            min="0"
            step="0.01"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0.00"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
            ${loading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'}
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Creating...
            </span>
          ) : (
            'List Item for Trade'
          )}
        </button>
      </form>
    </div>
  );
}