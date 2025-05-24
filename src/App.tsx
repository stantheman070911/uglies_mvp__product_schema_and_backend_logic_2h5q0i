import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ProductCard } from "./components/ProductCard";
import { UserProfile } from "./components/UserProfile";
import { Cart } from "./components/Cart";
import { GroupBuying } from "./components/GroupBuying";
import { ImpactDashboard } from "./components/ImpactDashboard";
import { AddProductForm } from "./AddProductForm";
import { AdminSetup } from "./components/AdminSetup";
import { useState } from "react";

function ProductList() {
  const [filters, setFilters] = useState({
    category: "",
    uglinessGrade: "",
    neighborhood: "",
  });
  
  const products = useQuery(api.products.listActiveProducts, filters) || [];
  const categories = useQuery(api.products.getCategories) || [];
  const uglinessGrades = useQuery(api.products.getUglinessGrades) || [];
  const neighborhoods = useQuery(api.users.getNeighborhoods) || [];

  if (products === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Filter Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ugliness Grade</label>
            <select
              value={filters.uglinessGrade}
              onChange={(e) => setFilters(prev => ({ ...prev, uglinessGrade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Grades</option>
              {uglinessGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Location</label>
            <select
              value={filters.neighborhood}
              onChange={(e) => setFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Locations</option>
              {neighborhoods.map(neighborhood => (
                <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
              ))}
            </select>
          </div>
        </div>
        
        {(filters.category || filters.uglinessGrade || filters.neighborhood) && (
          <button
            onClick={() => setFilters({ category: "", uglinessGrade: "", neighborhood: "" })}
            className="mt-3 text-sm text-primary hover:text-primary-hover"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🥕</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {Object.values(filters).some(f => f) 
              ? "Try adjusting your filters to see more products."
              : "Admins can add products after setting up sample farmers."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            product ? <ProductCard key={product._id} product={product} /> : null
          ))}
        </div>
      )}
    </div>
  );
}

function MainContent() {
  const [activeTab, setActiveTab] = useState<"products" | "profile" | "cart" | "group-buying" | "impact" | "admin" | "setup">("products");
  const isAdmin = useQuery(api.users.isAdmin);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  // Show profile setup if user hasn't completed their profile
  if (!userProfile) {
    return <UserProfile />;
  }

  const tabs = [
    { id: "products", label: "Products", icon: "🛒" },
    { id: "cart", label: "Cart", icon: "🛍️" },
    { id: "group-buying", label: "Group Buying", icon: "👥" },
    { id: "impact", label: "Impact", icon: "🌍" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "setup", label: "Setup", icon: "⚡" },
  ];

  if (isAdmin) {
    tabs.push({ id: "admin", label: "Admin", icon: "⚙️" });
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-2">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "products" && (
        <div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Our "Imperfectly" Perfect Produce
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover delicious, nutritious produce that's been rescued from waste. 
              Every purchase supports local farmers and helps save our planet.
            </p>
          </div>
          <ProductList />
        </div>
      )}

      {activeTab === "profile" && <UserProfile />}

      {activeTab === "cart" && (
        <Cart onCheckout={() => alert("Checkout functionality coming soon!")} />
      )}

      {activeTab === "group-buying" && <GroupBuying />}

      {activeTab === "impact" && <ImpactDashboard />}

      {activeTab === "setup" && <AdminSetup />}

      {activeTab === "admin" && isAdmin && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>
          <AddProductForm />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <img src="/uglies_logo.svg" alt="UGLIES Logo" className="h-8 w-auto mr-2" />
          <div>
            <h2 className="text-2xl font-bold text-primary">UGLIES</h2>
            <p className="text-xs text-gray-500">Fighting food waste together</p>
          </div>
        </div>
        <SignOutButton />
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Authenticated>
          <MainContent />
        </Authenticated>
        
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="text-center mb-8 max-w-2xl">
              <img src="/uglies_logo.svg" alt="UGLIES Logo" className="h-20 w-auto mx-auto mb-6" />
              <h1 className="text-5xl font-bold text-primary mb-4">Welcome to UGLIES</h1>
              <p className="text-xl text-gray-600 mb-2">Fighting food waste, one ugly fruit at a time.</p>
              <p className="text-lg text-gray-500 mb-6">
                Join our community to rescue imperfect produce, support local farmers, and make a real environmental impact.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-4">
                  <div className="text-4xl mb-2">🌍</div>
                  <h3 className="font-semibold text-gray-800">Save the Planet</h3>
                  <p className="text-sm text-gray-600">Prevent food waste and reduce CO₂ emissions</p>
                </div>
                <div className="p-4">
                  <div className="text-4xl mb-2">👨‍🌾</div>
                  <h3 className="font-semibold text-gray-800">Support Farmers</h3>
                  <p className="text-sm text-gray-600">Help local farmers get fair prices for all their harvest</p>
                </div>
                <div className="p-4">
                  <div className="text-4xl mb-2">💰</div>
                  <h3 className="font-semibold text-gray-800">Save Money</h3>
                  <p className="text-sm text-gray-600">Get fresh, nutritious produce at 30-40% off retail prices</p>
                </div>
              </div>
            </div>
            
            <div className="w-full max-w-sm">
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-500 border-t bg-white">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} UGLIES Taiwan. Saving food, supporting farmers, building community.</p>
          <p className="mt-1">Together, we're transforming Taiwan's food system. 🌱</p>
        </div>
      </footer>
      
      <Toaster richColors position="top-right" />
    </div>
  );
}
