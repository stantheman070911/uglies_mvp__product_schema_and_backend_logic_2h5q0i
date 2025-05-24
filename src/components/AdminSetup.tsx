import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdminSetup() {
  const setupSampleData = useMutation(api.sampleData.setupSampleData);
  const makeFirstUserAdmin = useMutation(api.sampleData.makeFirstUserAdmin);
  const currentUser = useQuery(api.auth.loggedInUser);

  const handleSetupSampleData = async () => {
    try {
      const result = await setupSampleData();
      toast.success(result);
    } catch (error) {
      toast.error("Failed to setup sample data");
    }
  };

  const handleMakeAdmin = async () => {
    if (!currentUser) return;
    try {
      const result = await makeFirstUserAdmin({ userId: currentUser._id });
      toast.success(result);
    } catch (error) {
      toast.error("Failed to make user admin");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary mb-4">Setup & Administration</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Sample Data</h3>
          <p className="text-gray-600 mb-3">
            Add sample farmers to get started with the platform.
          </p>
          <button
            onClick={handleSetupSampleData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Setup Sample Farmers
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Admin Access</h3>
          <p className="text-gray-600 mb-3">
            Make yourself an admin to access product management features.
          </p>
          <button
            onClick={handleMakeAdmin}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Make Me Admin
          </button>
        </div>
      </div>
    </div>
  );
}
