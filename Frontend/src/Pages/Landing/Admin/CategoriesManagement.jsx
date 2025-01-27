import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const CategoriesManagement = ({ isDarkMode }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const componentClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      setError(null);
      const response = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategory,
          description: newDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const createdCategory = await response.json();
      setCategories([...categories, createdCategory]);
      setNewCategory('');
      setNewDescription('');
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setError(null);
      const response = await fetch(`/api/v1/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(categories.filter(category => category._id !== categoryId));
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message);
    }
  };

  const startEditing = (category) => {
    setEditingCategory(category._id);
    setEditName(category.name);
    setEditDescription(category.description || '');
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditName('');
    setEditDescription('');
  };

  const handleUpdateCategory = async (categoryId) => {
    try {
      setError(null);
      const response = await fetch(`/api/v1/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const updatedCategory = await response.json();
      setCategories(categories.map(cat => 
        cat._id === categoryId ? updatedCategory : cat
      ));
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-lg">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className={`p-4 border-l-4 rounded-md ${isDarkMode ? 'bg-red-900/20 border-red-500 text-red-300' : 'bg-red-100 border-red-500 text-red-700'}`}>
          <p>Error: {error}</p>
        </div>
      )}

      <div className={`${componentClass} border rounded-xl`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Categories Management</h3>
              <p className="text-sm opacity-60">Manage event categories</p>
            </div>
            <Tag className="w-6 h-6 text-indigo-500" />
          </div>

          {/* Add Category Form */}
          <div className="mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  className={`flex-1 px-4 py-2 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-gray-700/30 border-gray-700 focus:border-indigo-500' 
                      : 'bg-gray-100 border-gray-200 focus:border-indigo-500'
                  } focus:outline-none`}
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter category description (optional)"
                className={`w-full px-4 py-2 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-700 focus:border-indigo-500' 
                    : 'bg-gray-100 border-gray-200 focus:border-indigo-500'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-left font-medium opacity-60">Name</th>
                  <th className="pb-3 text-left font-medium opacity-60">Description</th>
                  <th className="pb-3 text-right font-medium opacity-60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-b border-gray-700">
                    <td className="py-4">
                      {editingCategory === category._id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`w-full px-3 py-1 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700/30 border-gray-700' 
                              : 'bg-gray-100 border-gray-200'
                          }`}
                        />
                      ) : (
                        category.name
                      )}
                    </td>
                    <td className="py-4">
                      {editingCategory === category._id ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className={`w-full px-3 py-1 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700/30 border-gray-700' 
                              : 'bg-gray-100 border-gray-200'
                          }`}
                        />
                      ) : (
                        category.description || '-'
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        {editingCategory === category._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateCategory(category._id)}
                              className="p-2 text-green-400 rounded-lg hover:bg-gray-700/30 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 text-red-400 rounded-lg hover:bg-gray-700/30 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(category)}
                              className="p-2 text-blue-400 rounded-lg hover:bg-gray-700/30 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="p-2 text-red-400 rounded-lg hover:bg-gray-700/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesManagement;