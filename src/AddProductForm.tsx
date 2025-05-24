import React, { useState, useRef, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

export function AddProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [category, setCategory] = useState("Vegetable");
  const [uglinessGrade, setUglinessGrade] = useState("Slightly Quirky");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const farmers = useQuery(api.farmers.listFarmers) || [];
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const addProductMutation = useMutation(api.products.addProduct);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedImage) {
      toast.error("Please select an image for the product.");
      return;
    }

    if (!farmerId) {
      toast.error("Please select a farmer.");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });
      const json = await result.json();

      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }
      const { storageId } = json as { storageId: Id<"_storage"> };

      // Step 3: Save the product with the storage ID
      await addProductMutation({
        name,
        description,
        price: parsedPrice,
        imageId: storageId,
        farmerId: farmerId as Id<"farmers">,
        category,
        uglinessGrade,
        quantity: parsedQuantity,
        unit,
        harvestDate: Date.now(),
      });

      toast.success("Product added successfully!");
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setFarmerId("");
      setCategory("Vegetable");
      setUglinessGrade("Slightly Quirky");
      setQuantity("");
      setUnit("kg");
      setSelectedImage(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add product."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-primary">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (NT$)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            step="1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="kg">kg</option>
            <option value="pieces">pieces</option>
            <option value="bunches">bunches</option>
            <option value="boxes">boxes</option>
          </select>
        </div>
        <div>
          <label htmlFor="farmerId" className="block text-sm font-medium text-gray-700">Farmer</label>
          <select
            id="farmerId"
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">Select a farmer</option>
            {farmers.map((farmer) => (
              <option key={farmer._id} value={farmer._id}>
                {farmer.name} - {farmer.location}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="Vegetable">Vegetable</option>
            <option value="Fruit">Fruit</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="uglinessGrade" className="block text-sm font-medium text-gray-700">Ugliness Grade</label>
          <select
            id="uglinessGrade"
            value={uglinessGrade}
            onChange={(e) => setUglinessGrade(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="Slightly Quirky">Slightly Quirky</option>
            <option value="Beautifully Imperfect">Beautifully Imperfect</option>
            <option value="Uniquely Shaped">Uniquely Shaped</option>
          </select>
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Product Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            ref={imageInputRef}
            onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary-hover"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          disabled={!name || !description || !price || !farmerId || !quantity || !selectedImage || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
