import { Product, CartItem, CustomerOrder, mockProducts } from "@/mocks/data";

const CART_STORAGE_KEY = "lyhu_cart_v1";
const ORDERS_STORAGE_KEY = "lyhu_customer_orders_v1";

export function getProducts(): Product[] {
    return mockProducts;
}

export function getCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function saveCart(cart: CartItem[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function addToCart(product: Product, quantity: number) {
    const cart = getCart();
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id, // Simple ID mapping
            product,
            quantity,
        });
    }
    saveCart(cart);
    return cart;
}

export function updateCartQuantity(productId: string, quantity: number) {
    let cart = getCart();
    if (quantity <= 0) {
        cart = cart.filter((item) => item.product.id !== productId);
    } else {
        const item = cart.find((item) => item.product.id === productId);
        if (item) {
            item.quantity = quantity;
        }
    }
    saveCart(cart);
    return cart;
}

export function removeFromCart(productId: string) {
    const cart = getCart();
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCart(updated);
    return updated;
}

export function clearCart() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function getOrders(): CustomerOrder[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function saveOrders(orders: CustomerOrder[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function createOrder(customerDetails: { id: string; name: string }) {
    const cart = getCart();
    if (cart.length === 0) return null;

    const orders = getOrders();
    const totalAmount = cart.reduce((sum, item) => sum + item.product.wholesalePrice * item.quantity, 0);

    const newOrder: CustomerOrder = {
        id: Date.now().toString(),
        orderNumber: `ORD-${new Date().getFullYear()}-${(orders.length + 1).toString().padStart(3, "0")}`,
        customerId: customerDetails.id,
        customerName: customerDetails.name,
        items: cart.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.wholesalePrice,
        })),
        totalAmount,
        status: "pending",
        createdAt: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);
    clearCart();
    return newOrder;
}

export function getAllOrders(): CustomerOrder[] {
    return getOrders();
}
