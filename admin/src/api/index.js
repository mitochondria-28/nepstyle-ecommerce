import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Admin auth
export const adminLogin = (data) => api.post('/admin/login', data);

// Products
export const fetchAllProducts = () => api.get('/products/all');
export const addProduct = (data) => api.post('/products/add', data);
export const deleteProduct = (id) => api.delete(`/products/delete/${id}`);

// Categories
export const fetchAllCategories = () => api.get('/categories/all');
export const addCategory = (data) => api.post('/categories/add', data);
export const deleteCategory = (id) => api.delete(`/categories/delete/${id}`);

// Brands
export const fetchAllBrands = () => api.get('/brands/all');
export const addBrand = (data) => api.post('/brands/add', data);
export const deleteBrand = (id) => api.delete(`/brands/delete/${id}`);

// Flash Sales
export const fetchAllFlashSales = () => api.get('/flash-sale-products/all');
export const addFlashSale = (data) => api.post('/flash-sale-products/add', data);
export const deleteFlashSale = (id) => api.delete(`/flash-sale-products/delete/${id}`);

// Orders
export const fetchAllOrders = () => api.get('/orders/all');

// Reviews
export const fetchReviews = (productId) =>
  productId
    ? api.get(`/reviews/list?product_id=${productId}`)
    : api.get('/reviews/list');
