/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminService } from './admin-service';

export interface SearchResult {
  id: string;
  type: 'page' | 'user' | 'order' | 'gift_order' | 'product' | 'gift' | 'transaction' | 'custom_request';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: Record<string, any>;
}

export interface SearchCategory {
  name: string;
  results: SearchResult[];
}

class GlobalSearchService {
  private pages = [
    { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: '📊', description: 'Overview and analytics' },
    { id: 'users', title: 'Users Management', url: '/users', icon: '👥', description: 'Manage user accounts' },
    { id: 'orders', title: 'Orders Management', url: '/orders', icon: '📦', description: 'Manage product orders' },
    { id: 'gifts', title: 'Gifts Management', url: '/gifts', icon: '🎁', description: 'Manage gift orders and catalog' },
    { id: 'products', title: 'Products Management', url: '/products', icon: '🛍️', description: 'Manage product listings' },
    { id: 'transactions', title: 'Transactions', url: '/transactions', icon: '💳', description: 'View financial transactions' },
    { id: 'reports', title: 'Reports & Analytics', url: '/reports', icon: '📈', description: 'View reports and analytics' },
    { id: 'settings', title: 'Settings', url: '/settings', icon: '⚙️', description: 'System settings' },
    { id: 'profile', title: 'Admin Profile', url: '/profile', icon: '👤', description: 'Manage admin profile' }
  ];

  async search(query: string): Promise<SearchCategory[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results: SearchCategory[] = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search pages/navigation
      const pageResults = this.pages
        .filter(page => 
          page.title.toLowerCase().includes(lowerQuery) ||
          page.description.toLowerCase().includes(lowerQuery)
        )
        .map(page => ({
          id: page.id,
          type: 'page' as const,
          title: page.title,
          description: page.description,
          url: page.url,
          icon: page.icon
        }));

      if (pageResults.length > 0) {
        results.push({ name: 'Pages', results: pageResults });
      }

      // Search users
      const users = await adminService.getAllUsers(50);
      const userResults = users
        .filter(user => 
          user.email?.toLowerCase().includes(lowerQuery) ||
          user.displayName?.toLowerCase().includes(lowerQuery) ||
          user.id.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(user => ({
          id: user.id,
          type: 'user' as const,
          title: user.displayName || user.email || 'Unknown User',
          subtitle: user.email,
          description: `Balance: $${user.balance || 0} • ${user.suspended ? 'Suspended' : 'Active'}`,
          url: `/users?search=${user.id}`,
          icon: '👤',
          metadata: { balance: user.balance, suspended: user.suspended }
        }));

      if (userResults.length > 0) {
        results.push({ name: 'Users', results: userResults });
      }

      // Search orders
      const orders = await adminService.getAllOrders(50);
      const orderResults = orders
        .filter(order => 
          order.id.toLowerCase().includes(lowerQuery) ||
          order.userEmail?.toLowerCase().includes(lowerQuery) ||
          order.productName?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          type: 'order' as const,
          title: `Order #${order.id.slice(-8)}`,
          subtitle: order.userEmail,
          description: `${order.productName} • $${order.amount || order.price || 0} • ${order.status}`,
          url: `/orders?search=${order.id}`,
          icon: '📦',
          metadata: { amount: order.amount || order.price, status: order.status }
        }));

      if (orderResults.length > 0) {
        results.push({ name: 'Orders', results: orderResults });
      }

      // Search gift orders
      const giftOrders = await adminService.getAllGiftOrders(50);
      const giftOrderResults = giftOrders
        .filter(order => 
          order.orderNumber?.toLowerCase().includes(lowerQuery) ||
          order.senderEmail?.toLowerCase().includes(lowerQuery) ||
          order.recipientName?.toLowerCase().includes(lowerQuery) ||
          order.giftTitle?.toLowerCase().includes(lowerQuery) ||
          order.trackingNumber?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          type: 'gift_order' as const,
          title: order.orderNumber || `Gift Order #${order.id.slice(-8)}`,
          subtitle: `From: ${order.senderName} → To: ${order.recipientName}`,
          description: `${order.giftTitle} • $${order.totalAmount || 0} • ${order.status}`,
          url: `/gifts?search=${order.orderNumber || order.id}`,
          icon: '🎁',
          metadata: { amount: order.totalAmount, status: order.status, tracking: order.trackingNumber }
        }));

      if (giftOrderResults.length > 0) {
        results.push({ name: 'Gift Orders', results: giftOrderResults });
      }

      // Search products
      const products = await adminService.getAllProducts();
      const productResults = products
        .filter(product => 
          product.name?.toLowerCase().includes(lowerQuery) ||
          product.provider?.toLowerCase().includes(lowerQuery) ||
          product.category?.toLowerCase().includes(lowerQuery) ||
          product.id.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(product => ({
          id: product.id,
          type: 'product' as const,
          title: product.name,
          subtitle: product.provider,
          description: `${product.category?.toUpperCase()} • $${product.price || 0} • ${product.isActive ? 'Active' : 'Inactive'}`,
          url: `/products?search=${product.id}`,
          icon: '🛍️',
          metadata: { price: product.price, category: product.category, active: product.isActive }
        }));

      if (productResults.length > 0) {
        results.push({ name: 'Products', results: productResults });
      }

      // Search gifts catalog
      const gifts = await adminService.getAllGifts();
      const giftResults = gifts
        .filter(gift => 
          gift.title?.toLowerCase().includes(lowerQuery) ||
          gift.description?.toLowerCase().includes(lowerQuery) ||
          gift.categoryId?.toLowerCase().includes(lowerQuery) ||
          gift.id.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(gift => ({
          id: gift.id,
          type: 'gift' as const,
          title: gift.title,
          subtitle: gift.categoryId || 'Gift',
          description: `$${gift.basePrice || 0} • ${gift.isActive ? 'Active' : 'Inactive'}`,
          url: `/gifts?tab=catalog&search=${gift.id}`,
          icon: '🎁',
          metadata: { price: gift.basePrice, active: gift.isActive }
        }));

      if (giftResults.length > 0) {
        results.push({ name: 'Gift Catalog', results: giftResults });
      }

      // Search transactions
      const transactions = await adminService.getAllTransactions(50);
      const transactionResults = transactions
        .filter(transaction => 
          transaction.id.toLowerCase().includes(lowerQuery) ||
          transaction.userId?.toLowerCase().includes(lowerQuery) ||
          transaction.type?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(transaction => ({
          id: transaction.id,
          type: 'transaction' as const,
          title: `Transaction #${transaction.id.slice(-8)}`,
          subtitle: transaction.type?.toUpperCase(),
          description: `$${transaction.amount || 0} • ${transaction.userId}`,
          url: `/transactions?search=${transaction.id}`,
          icon: '💳',
          metadata: { amount: transaction.amount, type: transaction.type }
        }));

      if (transactionResults.length > 0) {
        results.push({ name: 'Transactions', results: transactionResults });
      }

      // Search custom gift requests
      const customRequests = await adminService.getAllCustomGiftRequests();
      const customRequestResults = customRequests
        .filter(request => 
          request.title?.toLowerCase().includes(lowerQuery) ||
          request.description?.toLowerCase().includes(lowerQuery) ||
          request.id.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map(request => ({
          id: request.id,
          type: 'custom_request' as const,
          title: request.title,
          subtitle: 'Custom Gift Request',
          description: `$${request.budgetMin || 0}-$${request.budgetMax || 0} • ${request.status}`,
          url: `/gifts?tab=requests&search=${request.id}`,
          icon: '🎨',
          metadata: { budgetMin: request.budgetMin, budgetMax: request.budgetMax, status: request.status }
        }));

      if (customRequestResults.length > 0) {
        results.push({ name: 'Custom Requests', results: customRequestResults });
      }

    } catch (error) {
      console.error('Search error:', error);
    }

    return results;
  }

  async quickSearch(query: string): Promise<SearchResult[]> {
    const categories = await this.search(query);
    return categories.flatMap(category => category.results).slice(0, 10);
  }
}

export const globalSearchService = new GlobalSearchService();