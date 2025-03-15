import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Star } from 'lucide-react';

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  condition: string;
  estimatedValue: number;
  category: string;
  images: string[];
  ownerName: string;
  ownerRating: number;
}

export default function ProductCard({
  id,
  title,
  description,
  condition,
  estimatedValue,
  category,
  images,
  ownerName,
  ownerRating,
}: ProductCardProps) {
  return (
    <Link to={`/product/${id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 group-hover:shadow-lg group-hover:-translate-y-1">
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={images[0] || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
            alt={title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full shadow-sm">
            <span className="text-sm font-medium text-gray-900">${estimatedValue}</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {condition}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{category}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-600">{ownerRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">· {ownerName}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}