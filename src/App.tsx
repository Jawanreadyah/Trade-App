import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import MyTrades from './pages/MyTrades';
import Chat from './pages/Chat';
import Login from './pages/Login';
import NewItem from './pages/NewItem';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-trades" element={<MyTrades />} />
              <Route path="/chat/:tradeId" element={<Chat />} />
              <Route path="/login" element={<Login />} />
              <Route path="/new-item" element={<NewItem />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;