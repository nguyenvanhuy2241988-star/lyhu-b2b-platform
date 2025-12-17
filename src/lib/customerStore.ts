import { Product, CartItem, CustomerOrder } from "@/mocks/data";
import { loadProducts } from "@/lib/supabase/products";
import { addOrder } from "@/lib/ordersStore"; // Use central order creation
import { loadOrders as loadAllOrders } from "@/lib/ordersStore";
// Note: CustomerOrder interface in mocks/data might differ from ordersStore Order. 
// We should arguably standardize. But for now, we'll map returns.

const CART_STORAGE_KEY = "lyhu_cart_v1";

// ASYNC NOW
export async function getProducts(): Promise<Product[]> {
    return await loadProducts();
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
            id: product.id,
            product,
            quantity,
        });
    }
    saveCart(cart);
    window.dispatchEvent(new Event("cart-updated"));
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
    window.dispatchEvent(new Event("cart-updated"));
    return cart;
}

export function removeFromCart(productId: string) {
    const cart = getCart();
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
    return updated;
}

export function clearCart() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event("cart-updated"));
}

export async function getOrders(): Promise<CustomerOrder[]> {
    // This function assumes "Current User" context. 
    // loadOrders from ordersStore loads items based on RLS (so presumably own orders).
    // We map generic Order to CustomerOrder
    const orders = await loadAllOrders();
    // Assuming loadOrders returns relevant orders for logged in user
    return orders.map((o: any) => ({
        id: o.id,
        orderNumber: `ORD-${o.readableId}`,
        customerId: o.customerId || "",
        customerName: o.customerName,
        items: o.items || [],
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
    }));
}

export async function createOrder(customerDetails: { id: string; name: string }) {
    const cart = getCart();
    if (cart.length === 0) return null;

    const totalAmount = cart.reduce((sum, item) => sum + (item.product.wholesalePrice || item.product.price) * item.quantity, 0);

    // Prepare for Supabase
    const orderData = {
        customerId: customerDetails.id,
        status: 'pending',
        totalAmount,
        items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.wholesalePrice || item.product.price // Fallback
        }))
    };

    const newOrder = await addOrder(orderData);

    if (newOrder) {
        clearCart();
    }
    return newOrder;
}

// Deprecated alias
export async function getAllOrders() {
    return await getOrders();
}
