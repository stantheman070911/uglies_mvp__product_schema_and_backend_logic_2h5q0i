import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function FarmerProfile({ farmerId }: { farmerId: string }) {
  const farmer = useQuery(api.farmers.getFarmerById, { farmerId: farmerId as any });
  const products = useQuery(api.products.getProductsByFarmer, { farmerId: farmerId as any });

  if (!farmer) {
    return <div>Loading farmer profile...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-6">
          {farmer.imageUrl && (
            <img
              src={farmer.imageUrl}
              alt={farmer.name}
              className="w-32 h-32 object-cover rounded-full"
            />
          )}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-primary mb-2">{farmer.name}</h2>
            <p className="text-gray-600 mb-2">{farmer.location}</p>
            {farmer.farmSize && (
              <p className="text-sm text-gray-500 mb-2">Farm Size: {farmer.farmSize}</p>
            )}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-1">Specialties:</h3>
              <div className="flex flex-wrap gap-2">
                {farmer.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-light text-primary rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">About {farmer.name}</h3>
          <p className="text-gray-700 mb-4">{farmer.bio}</p>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Farmer's Story</h3>
          <p className="text-gray-700 leading-relaxed">{farmer.story}</p>
        </div>

        {farmer.contactInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
            <p className="text-gray-600">{farmer.contactInfo}</p>
          </div>
        )}
      </div>

      {products && products.length > 0 && (
        <div className="border-t p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Products from {farmer.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product._id} className="border rounded-lg p-4">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <h4 className="font-semibold text-primary">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                <p className="font-bold text-green-600">
                  NT${product.price} / {product.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
