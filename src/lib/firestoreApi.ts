import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const firestoreApi = {
  // ===== ORDERS =====
  async getOrdersByUser(userId: string) {
    try {
      const colRef = collection(db, "orders");
      const q = query(colRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },

  async createOrder(orderData: any) {
    try {
      const colRef = collection(db, "orders");
      const docRef = await addDoc(colRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async updateOrder(orderId: string, data: any) {
    try {
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  // ===== USERS =====
  async getUserById(userId: string) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },

  async updateUser(userId: string, data: any) {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
};

export default firestoreApi;