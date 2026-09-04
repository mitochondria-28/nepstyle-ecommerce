import axios from 'axios';

const AI_BASE_URL =
  import.meta.env.VITE_AI_SERVICE_URL ||
  'https://ai-service-production-7d9f.up.railway.app';

const AI_KEY = import.meta.env.VITE_AI_API_KEY || '';

const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(AI_KEY ? { 'X-AI-Key': AI_KEY } : {}),
  },
  timeout: 20000,
});

export const aiSearch = (query, filters = {}, page = 1, pageSize = 20) =>
  aiApi.post('/ai/search', {
    query,
    filters,
    page,
    page_size: pageSize,
  });

export const getAIHealth = () => aiApi.get('/health');

export const getSimilarProducts = (productId) =>
  aiApi.get(`/ai/products/${productId}/similar`);

export const getReviewSummary = (productId) =>
  aiApi.get(`/ai/products/${productId}/reviews/summary`);

export const aiChat = (messages, userId = null) => {
  const message = messages[messages.length - 1]?.content ?? '';
  const history = messages.slice(0, -1);
  return aiApi.post('/ai/chat', { message, history, user_id: userId });
};

export const aiSupport = (message, userId = null) =>
  aiApi.post('/ai/support', { message, user_id: userId });

export const getPersonalizedFeed = (userId, topK = 12) =>
  aiApi.get(`/ai/personalized/${userId}`, { params: { top_k: topK } });

export const getTrending = (limit = 12) =>
  aiApi.get('/ai/trending', { params: { limit } });

export const getRecentlyViewed = (userId, limit = 8) =>
  aiApi.get(`/ai/recently-viewed/${userId}`, { params: { limit } });

export const aiOrderAssistant = (message, userId, history = []) =>
  aiApi.post('/ai/order-assistant', { message, user_id: userId, history });

export const aiSupportChat = (message, userId = null, history = []) =>
  aiApi.post('/ai/support', { message, user_id: userId, history });

export const aiAgent = (message, userId = null, history = []) =>
  aiApi.post('/ai/agent', { message, user_id: userId, history });

export const getCompleteLook = (productId) =>
  aiApi.get(`/ai/products/${productId}/complete-look`);

export const getCartRecommendations = (productNames, excludeIds = []) =>
  aiApi.post('/ai/cart-recommendations', { product_names: productNames, exclude_ids: excludeIds });

export const getWishlistInsights = (items, userId = null) =>
  aiApi.post('/ai/wishlist-insights', { items, user_id: userId });

export const getSearchSuggestions = (query) =>
  aiApi.post('/ai/search-suggest', { query });
