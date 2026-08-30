import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const updateProfile = (data) => api.put('/auth/update-profile', data);
export const changePassword = (data) => api.put('/auth/change-password', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);

// Home
export const fetchHome = (userId = 0) => api.get(`/home/${userId}`);

// Products
export const fetchAllProducts = () => api.get('/products/all');
export const fetchProductsByCategory = (id) => api.get(`/products/category/${id}`);
export const fetchProductsByBrand = (id) => api.get(`/products/brand/${id}`);
export const searchProducts = (query) => api.get(`/products/search/products/${encodeURIComponent(query)}`);
export const logActivity = (data) => api.post('/log-activity', data);

// Categories
export const fetchAllCategories = () => api.get('/categories/all');

// Brands
export const fetchAllBrands = () => api.get('/brands/all');

// Cart
export const addToCart = (data) => api.post('/carts/add', data);
export const fetchCart = (userId) => api.get(`/carts/${userId}`);

// Wishlist
export const addToWishlist = (data) => api.post('/wishlists/add', data);
export const fetchWishlist = (userId) => api.get(`/wishlists/${userId}`);
export const removeFromWishlist = (wishlistId) => api.delete(`/wishlists/${wishlistId}`);

// Orders
export const placeOrder = (data) => api.post('/orders/place', data);
export const placeCartOrder = (data) => api.post('/orders/from-cart/all', data);
export const placeSelectedCartOrder = (data) => api.post('/orders/from-cart', data);
export const fetchUserOrders = (userId) => api.get(`/orders/user/${userId}`);
export const fetchAllOrders = () => api.get('/orders/all');

// Reviews
export const addReview = (data) => api.post('/reviews/add', data);
export const fetchReviews = (productId) => api.get(`/reviews/list?product_id=${productId}`);
