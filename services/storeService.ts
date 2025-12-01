
import { AppTier, Product } from "../types";

// This service mocks the Native Bridge (StoreKit/BillingClient)
// In a real Cordova/Capacitor app, this would call native plugins.

export const SUBSCRIPTION_PRODUCT: Product = {
  id: 'com.colorcrate.pro.monthly',
  title: 'ColorCrate Pro',
  price: '$4.99',
  description: 'Unlimited access to all features',
  currency: 'USD'
};

export const purchaseSubscription = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    console.log("[StoreKit] Initiating Purchase Flow...");
    
    // Simulate Network/Native Delay
    setTimeout(() => {
      // Randomly simulate user cancellation (for testing) or success
      // For this demo, we always succeed.
      const isSuccess = true;
      
      if (isSuccess) {
        console.log("[StoreKit] Transaction Verified.");
        resolve(true);
      } else {
        console.warn("[StoreKit] User Cancelled.");
        reject(new Error("User cancelled transaction"));
      }
    }, 2500);
  });
};

export const restorePurchases = async (): Promise<AppTier> => {
  return new Promise((resolve) => {
    console.log("[StoreKit] Restoring Receipts...");
    
    setTimeout(() => {
      // Check local storage or remote DB for active sub
      // Simulating a successful restore for demo purposes if they previously bought
      const hasPreviousPurchase = localStorage.getItem('cc_has_purchased') === 'true';
      
      console.log(`[StoreKit] Restore Complete. Found: ${hasPreviousPurchase}`);
      resolve(hasPreviousPurchase ? AppTier.PRO : AppTier.FREE);
    }, 2000);
  });
};

export const setPurchaseFlag = () => {
  localStorage.setItem('cc_has_purchased', 'true');
};
