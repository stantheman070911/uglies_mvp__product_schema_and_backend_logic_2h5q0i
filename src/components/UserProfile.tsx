import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function UserProfile() {
  const profile = useQuery(api.users.getCurrentUserProfile);
  const impactMetrics = useQuery(api.users.getUserImpactMetrics);
  const createOrUpdateProfile = useMutation(api.users.createOrUpdateProfile);
  
  const [name, setName] = useState(profile?.name || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || "");
  const [isEditing, setIsEditing] = useState(!profile);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setNeighborhood(profile.neighborhood || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighborhood.trim()) {
      toast.error("Please enter your neighborhood");
      return;
    }
    
    try {
      await createOrUpdateProfile({
        name,
        address: address || undefined,
        phone: phone || undefined,
        neighborhood,
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const getSustainabilityLevel = (score: number) => {
    if (score >= 1000) return { level: "Eco Champion", color: "text-green-600", emoji: "🌟" };
    if (score >= 500) return { level: "Green Hero", color: "text-green-500", emoji: "🌱" };
    if (score >= 100) return { level: "Earth Friend", color: "text-blue-500", emoji: "🌍" };
    return { level: "Getting Started", color: "text-gray-500", emoji: "🌿" };
  };

  if (!isEditing && profile) {
    const sustainabilityInfo = getSustainabilityLevel(profile.sustainabilityScore || 0);
    
    return (
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2">Your Profile</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{sustainabilityInfo.emoji}</span>
                <span className={`font-semibold ${sustainabilityInfo.color}`}>
                  {sustainabilityInfo.level}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              Edit Profile
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Name</span>
                <p className="text-lg">{profile.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Role</span>
                <p className="text-lg capitalize">{profile.role}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Neighborhood</span>
                <p className="text-lg">{profile.neighborhood}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {profile.address && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Address</span>
                  <p className="text-lg">{profile.address}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <p className="text-lg">{profile.phone}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Member Since</span>
                <p className="text-lg">
                  {new Date(profile.joinDate).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Metrics */}
        {impactMetrics && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-primary mb-4">Your Impact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🌍</div>
                <div className="text-2xl font-bold text-green-600">
                  {(impactMetrics.totalMetrics.wastePrevented || 0).toFixed(1)}kg
                </div>
                <div className="text-sm text-gray-600">Food Waste Prevented</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🌱</div>
                <div className="text-2xl font-bold text-blue-600">
                  {(impactMetrics.totalMetrics.carbonSaved || 0).toFixed(1)}kg
                </div>
                <div className="text-sm text-gray-600">CO₂ Saved</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-yellow-600">
                  NT${(impactMetrics.totalMetrics.moneySaved || 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Money Saved</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-2xl font-bold text-purple-600">
                  {impactMetrics.totalMetrics.ordersCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">Orders Completed</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary to-green-500 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">Sustainability Score</h4>
                  <p className="text-sm opacity-90">Keep making a difference!</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{profile.sustainabilityScore || 0}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>
              </div>
            </div>

            {impactMetrics.totalMetrics.groupOrdersParticipated > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h4 className="font-semibold text-orange-800">Community Champion</h4>
                    <p className="text-sm text-orange-600">
                      Participated in {impactMetrics.totalMetrics.groupOrdersParticipated} group buying campaigns
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-primary mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(profile.sustainabilityScore || 0) >= 100 && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl mb-1">🌱</div>
                <div className="text-xs font-medium">First Steps</div>
              </div>
            )}
            {(impactMetrics?.totalMetrics.wastePrevented || 0) >= 10 && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-1">🌍</div>
                <div className="text-xs font-medium">Waste Warrior</div>
              </div>
            )}
            {(impactMetrics?.totalMetrics.ordersCompleted || 0) >= 5 && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-1">📦</div>
                <div className="text-xs font-medium">Regular Rescuer</div>
              </div>
            )}
            {(impactMetrics?.totalMetrics.groupOrdersParticipated || 0) >= 1 && (
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-1">👥</div>
                <div className="text-xs font-medium">Community Builder</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-primary mb-4">
        {profile ? "Edit Profile" : "Complete Your Profile"}
      </h2>
      <p className="text-gray-600 mb-6">
        {profile 
          ? "Update your information to keep your profile current."
          : "Please complete your profile to start using UGLIES and join the fight against food waste!"
        }
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neighborhood *
          </label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., Da'an District, Xinyi District, Shilin District"
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps us connect you with nearby group buying opportunities
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Your delivery address (optional)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Your phone number (optional)"
          />
        </div>
        
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {profile ? "Update Profile" : "Complete Profile"}
          </button>
          {profile && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
