import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function GroupBuying() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const userProfile = useQuery(api.users.getCurrentUserProfile);
  const neighborhoods = useQuery(api.users.getNeighborhoods) || [];
  const campaigns = useQuery(api.groupBuying.getActiveGroupBuying, 
    selectedNeighborhood ? { neighborhood: selectedNeighborhood } : {}
  ) || [];
  const userCampaigns = useQuery(api.groupBuying.getUserGroupBuyingCampaigns) || [];
  
  const joinCampaign = useMutation(api.groupBuying.joinGroupBuying);

  const handleJoinCampaign = async (campaignId: string, orderAmount: number) => {
    try {
      const result = await joinCampaign({
        groupBuyingId: campaignId as any,
        orderAmount,
      });
      
      if (result.targetReached) {
        toast.success("🎉 Congratulations! The group buying target has been reached!");
      } else {
        toast.success("Successfully joined the group buying campaign!");
      }
    } catch (error) {
      toast.error("Failed to join campaign");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getHubLevelBadge = (level: string) => {
    const badges = {
      bronze: { emoji: "🥉", color: "bg-amber-100 text-amber-800" },
      silver: { emoji: "🥈", color: "bg-gray-100 text-gray-800" },
      gold: { emoji: "🥇", color: "bg-yellow-100 text-yellow-800" },
      platinum: { emoji: "💎", color: "bg-purple-100 text-purple-800" }
    };
    const badge = badges[level as keyof typeof badges] || badges.bronze;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.emoji} {level.charAt(0).toUpperCase() + level.slice(1)} Hub
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Neighborhood Group Buying</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join your neighbors to buy in bulk and save money while supporting local farmers! 
          Create or join group orders to unlock special discounts and build community connections.
        </p>
      </div>

      {/* Neighborhood Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="font-medium text-gray-700">Filter by neighborhood:</label>
          <select
            value={selectedNeighborhood}
            onChange={(e) => setSelectedNeighborhood(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All neighborhoods</option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood} value={neighborhood}>
                {neighborhood}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="ml-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            {showCreateForm ? "Cancel" : "Start New Group"}
          </button>
        </div>
      </div>

      {/* User's Campaigns */}
      {userCampaigns.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-primary mb-4">Your Group Buying Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCampaigns.map((campaign) => (
              <div key={campaign._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{campaign.title}</h4>
                  {getHubLevelBadge(campaign.hubLevel)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{campaign.neighborhood}</p>
                <div className="flex justify-between text-sm">
                  <span>Progress: NT${campaign.currentAmount} / NT${campaign.targetAmount}</span>
                  <span className="font-semibold text-primary">{campaign.participantCount} participants</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Invite Code: <span className="font-mono bg-gray-100 px-1 rounded">{campaign.inviteCode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Campaigns */}
      {campaigns.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Group Buying Campaigns</h3>
            <p className="text-gray-500 mb-4">
              Be the first to start a group buying campaign in your neighborhood!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold"
            >
              Start Your First Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-primary flex-1">{campaign.title}</h3>
                  {getHubLevelBadge(campaign.hubLevel)}
                </div>
                
                <p className="text-gray-600 mb-4 text-sm">{campaign.description}</p>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">📍 Neighborhood:</span>
                    <span className="font-medium">{campaign.neighborhood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">👤 Organizer:</span>
                    <span className="font-medium">{campaign.organizer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">⏰ Deadline:</span>
                    <span className="font-medium">{formatDate(campaign.deadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">🚚 Delivery:</span>
                    <span className="font-medium">{formatDate(campaign.deliveryDate)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Progress:</span>
                    <span className="font-bold text-primary">
                      NT${campaign.currentAmount.toLocaleString()} / NT${campaign.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{campaign.participantCount} participants</span>
                    <span>{Math.round(getProgressPercentage(campaign.currentAmount, campaign.targetAmount))}% complete</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Featured Products:</h4>
                  <div className="space-y-1">
                    {campaign.products.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">{item.product?.name}</span>
                        <span className="text-green-600 font-semibold">
                          {item.discountPercentage}% off
                        </span>
                      </div>
                    ))}
                    {campaign.products.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{campaign.products.length - 3} more products
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleJoinCampaign(campaign._id, 500)}
                    className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Join Campaign (NT$500)
                  </button>
                  <div className="text-xs text-gray-500 text-center">
                    📍 Pickup: {campaign.deliveryLocation}
                  </div>
                  <div className="text-xs text-center">
                    <span className="text-gray-500">Invite Code: </span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-primary">
                      {campaign.inviteCode}
                    </span>
                  </div>
                </div>

                {campaign.status === "target_reached" && (
                  <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg text-center text-sm font-semibold">
                    🎉 Target Reached! Orders will be processed soon.
                  </div>
                )}

                {campaign.impactMetrics && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-800 space-y-1">
                      <div>🌍 {campaign.impactMetrics.totalWastePrevented}kg waste prevented</div>
                      <div>💰 NT${campaign.impactMetrics.participantSavings} total savings</div>
                      <div>🌱 {campaign.impactMetrics.carbonSaved}kg CO₂ saved</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Placeholder */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-primary mb-4">Create New Group Buying Campaign</h3>
          <div className="text-center py-8 text-gray-500">
            <p>Group buying campaign creation form will be implemented in the next phase.</p>
            <p className="text-sm mt-2">This feature allows users to create their own neighborhood group orders.</p>
          </div>
        </div>
      )}
    </div>
  );
}
