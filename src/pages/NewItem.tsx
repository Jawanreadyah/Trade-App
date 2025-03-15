import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Sports', 'Home', 'Games', 'Other'];

export default function NewItem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileChecked, setProfileChecked] = useState(false);
  
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
    }
  }, [user]);

  async function checkProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error checking profile:', error);
        
        // Try to create profile if not found
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user?.id,
              username: `user_${user?.id?.substring(0, 8)}`,
              reputation_score: 0,
              trades_completed: 0,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
            setError('Error creating profile. Please try again or visit your profile page.');
            navigate('/profile');
            return;
          }
          
          setProfileChecked(true);
          return;
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('Profile not found');
      }

      setProfileChecked(true);
    } catch (err) {
      console.error('Profile check error:', err);
      setError('Please complete your profile before listing items');
      navigate('/profile');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !user) return;

    setLoading(true);
    setUploadProgress(0);
    const newImageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      try {
        setUploadProgress(Math.round((i / files.length) * 100));

        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('items')
          .getPublicUrl(filePath);

        newImageUrls.push(data.publicUrl);
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Failed to upload image. Please try again.');
        setLoading(false);
        return;
      }
    }

    setImageUrls([...imageUrls, ...newImageUrls]);
    setLoading(false);
    setUploadProgress(0);
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

  if (!profileChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Photos
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Item preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            {imageUrls.length < 4 && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                <div className="text-center p-4">
                  {loading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-indigo-500 mx-auto mb-2 animate-spin" />
                      <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Add Photo</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            )}
          </div>
          <p className="text-sm text-gray-500">Add up to 4 photos of your item</p>
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