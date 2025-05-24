import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ImpactDashboard() {
  const userImpact = useQuery(api.users.getUserImpactMetrics);
  const isAdmin = useQuery(api.users.isAdmin);
  const platformMetrics = useQuery(
    api.orders.getPlatformImpactMetrics,
    isAdmin ? {} : "skip"
  );

  if (!userImpact) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Impact Dashboard</h2>
        <p className="text-gray-600">
          See the difference you're making in the fight against food waste
        </p>
      </div>

      {/* Personal Impact */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-primary mb-4">Your Personal Impact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🌍</div>
            <div className="text-3xl font-bold text-green-600">
              {(userImpact.totalMetrics.wastePrevented || 0).toFixed(1)}kg
            </div>
            <div className="text-sm text-gray-600">Food Waste Prevented</div>
            <div className="text-xs text-gray-500 mt-1">
              Equivalent to {Math.round((userImpact.totalMetrics.wastePrevented || 0) * 2.5)} meals saved
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🌱</div>
            <div className="text-3xl font-bold text-blue-600">
              {(userImpact.totalMetrics.carbonSaved || 0).toFixed(1)}kg
            </div>
            <div className="text-sm text-gray-600">CO₂ Emissions Prevented</div>
            <div className="text-xs text-gray-500 mt-1">
              Like driving {Math.round((userImpact.totalMetrics.carbonSaved || 0) * 0.4)}km less
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-yellow-600">
              NT${(userImpact.totalMetrics.moneySaved || 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Money Saved</div>
            <div className="text-xs text-gray-500 mt-1">
              Compared to retail prices
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold text-purple-600">
              {userImpact.totalMetrics.groupOrdersParticipated || 0}
            </div>
            <div className="text-sm text-gray-600">Group Orders Joined</div>
            <div className="text-xs text-gray-500 mt-1">
              Building community connections
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-primary to-green-500 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-semibold">Sustainability Score</h4>
              <p className="text-sm opacity-90">Your contribution to a better planet</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{userImpact.profile.sustainabilityScore || 0}</div>
              <div className="text-sm opacity-90">points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Impact (Admin Only) */}
      {isAdmin && platformMetrics && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-primary mb-4">Platform-Wide Impact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-4xl mb-2">🌍</div>
              <div className="text-3xl font-bold text-green-600">
                {(platformMetrics.totalMetrics.wastePrevented || 0).toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-600">Total Waste Prevented</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold text-blue-600">
                {platformMetrics.totalUsers}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-3xl font-bold text-yellow-600">
                {platformMetrics.totalOrders}
              </div>
              <div className="text-sm text-gray-600">Orders Completed</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-3xl font-bold text-purple-600">
                NT${platformMetrics.averageOrderValue.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Average Order Value</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Environmental Impact</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div>🌱 {(platformMetrics.totalMetrics.carbonSaved || 0).toFixed(1)}kg CO₂ saved</div>
                <div>💧 ~{Math.round((platformMetrics.totalMetrics.wastePrevented || 0) * 1000)}L water saved</div>
                <div>🚗 Equivalent to {Math.round((platformMetrics.totalMetrics.carbonSaved || 0) * 0.4)}km less driving</div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Community Impact</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div>👥 {platformMetrics.totalMetrics.groupOrdersParticipated || 0} group orders</div>
                <div>💰 NT${(platformMetrics.totalMetrics.moneySaved || 0).toFixed(0)} total savings</div>
                <div>🤝 Building stronger neighborhoods</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impact Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-primary mb-4">Your Impact Journey</h3>
        
        <div className="space-y-4">
          {userImpact.recentMetrics.slice(0, 5).map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <div className="font-medium">
                    {new Date(metric.date).toLocaleDateString('zh-TW')}
                  </div>
                  <div className="text-sm text-gray-600">
                    Order completed
                  </div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-green-600 font-medium">
                  +{metric.wastePrevented.toFixed(1)}kg waste prevented
                </div>
                <div className="text-blue-600">
                  +{metric.carbonSaved.toFixed(1)}kg CO₂ saved
                </div>
              </div>
            </div>
          ))}
          
          {userImpact.recentMetrics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🌱</div>
              <p>Start your impact journey by placing your first order!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
