import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Repeat, User, MessageSquare, LogOut, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Repeat className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">TradeInstead</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/new-item"
                  className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>New Item</span>
                </Link>
                <Link
                  to="/my-trades"
                  className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <Repeat className="h-5 w-5" />
                  <span>My Trades</span>
                </Link>
                <Link
                  to="/chat"
                  className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Messages</span>
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}