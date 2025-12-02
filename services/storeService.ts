import { useState, useEffect } from 'react';
import { AppTier, Product, PurchaseStatus } from "../types";

// --- Types ---

export interface Transaction {
    id: string;
    date: number;
    productId: string;
    amount: string;
    status: 'completed' | 'refunded';
}

// --- Mock Data ---

export const SUBSCRIPTION_PRODUCTS = {
    MONTHLY: {
        id: 'com.colorcrate.pro.monthly',
        title: 'ColorCrate Pro Monthly',
        price: '$4.99',
        description: 'Unlimited access',
        currency: 'USD',
        interval: 'month'
    },
    YEARLY: {
        id: 'com.colorcrate.pro.yearly',
        title: 'ColorCrate Pro Yearly',
        price: '$39.99',
        description: 'Best Value',
        currency: 'USD',
        interval: 'year'
    }
};

// --- Service Functions (Mocking Native Layer) ---

const MOCK_DELAY = 1500;

const mockPurchase = async (productId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[StoreKit] Purchased ${productId}`);
            resolve(true);
        }, MOCK_DELAY);
    });
};

const mockRestore = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const hasPurchased = localStorage.getItem('cc_has_purchased') === 'true';
            console.log(`[StoreKit] Restore found: ${hasPurchased}`);
            resolve(hasPurchased);
        }, MOCK_DELAY);
    });
};

// --- Hook ---

export const useStore = () => {
    const [tier, setTier] = useState<AppTier>(AppTier.FREE);
    const [status, setStatus] = useState<PurchaseStatus>('idle');
    const [history, setHistory] = useState<Transaction[]>([]);

    useEffect(() => {
        // Initial check
        const hasPurchased = localStorage.getItem('cc_has_purchased') === 'true';
        if (hasPurchased) setTier(AppTier.PRO);
        loadHistory();
    }, []);

    const loadHistory = () => {
        try {
            const hist = localStorage.getItem('cc_purchase_history');
            if (hist) setHistory(JSON.parse(hist));
        } catch (e) { console.error("Failed to load history"); }
    };

    const saveTransaction = (productId: string, price: string) => {
        const newTx: Transaction = {
            id: 'tx_' + Date.now(),
            date: Date.now(),
            productId,
            amount: price,
            status: 'completed'
        };
        const newHistory = [newTx, ...history];
        setHistory(newHistory);
        localStorage.setItem('cc_purchase_history', JSON.stringify(newHistory));
    };

    const purchase = async (product: typeof SUBSCRIPTION_PRODUCTS.MONTHLY) => {
        setStatus('loading');
        try {
            const success = await mockPurchase(product.id);
            if (success) {
                localStorage.setItem('cc_has_purchased', 'true');
                saveTransaction(product.id, product.price);
                setTier(AppTier.PRO);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (e) {
            setStatus('error');
        } finally {
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const restore = async () => {
        setStatus('loading');
        try {
            const success = await mockRestore();
            if (success) {
                setTier(AppTier.PRO);
                setStatus('success'); // or idle immediately?
                alert("Purchases restored!");
            } else {
                alert("No active subscription found.");
                setStatus('idle');
            }
        } catch (e) {
            setStatus('error');
        } finally {
             // Reset status after a moment if success
             if (status === 'success') setTimeout(() => setStatus('idle'), 2000);
             else setStatus('idle');
        }
    };

    return {
        tier,
        status,
        history,
        purchase,
        restore,
        products: SUBSCRIPTION_PRODUCTS
    };
};
