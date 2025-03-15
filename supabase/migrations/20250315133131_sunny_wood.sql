/*
  # Initial Trade Marketplace Schema

  1. New Tables
    - `profiles`
      - User profiles with reputation and preferences
    - `items`
      - Products available for trade
    - `trade_requests`
      - Trade proposals between users
    - `messages`
      - Chat messages between users
    - `ratings`
      - User ratings and reviews

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  reputation_score float DEFAULT 0,
  trades_completed int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  description text,
  condition text NOT NULL,
  estimated_value decimal(10,2),
  category text NOT NULL,
  images text[] DEFAULT '{}',
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trade requests table
CREATE TABLE IF NOT EXISTS trade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id) NOT NULL,
  requester_items uuid[] NOT NULL,
  receiver_items uuid[] NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_request_id uuid REFERENCES trade_requests(id) NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES trade_requests(id) NOT NULL,
  rater_id uuid REFERENCES profiles(id) NOT NULL,
  rated_user_id uuid REFERENCES profiles(id) NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Items policies
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id);

-- Trade requests policies
CREATE POLICY "Users can view trades they're involved in"
  ON trade_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create trade requests"
  ON trade_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users involved can update trade requests"
  ON trade_requests FOR UPDATE
  USING (auth.uid() IN (requester_id, receiver_id));

-- Messages policies
CREATE POLICY "Users can view messages in their trades"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trade_requests
      WHERE id = messages.trade_request_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their trades"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trade_requests
      WHERE id = trade_request_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for completed trades"
  ON ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trade_requests
      WHERE id = trade_id
      AND status = 'completed'
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );