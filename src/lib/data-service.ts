import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Types
export interface OrderFormData {
  businessName: string;
  industry: string;
  yearsInOperation?: string;
  revenue?: string;
  challenges: string;
  targetCustomers?: string;
  mainQuestion: string;
  email: string;
  name: string;
  price?: number;
  additionalInfo?: string;
}

export interface Order {
  id: string;
  orderId: string;
  plan: string;
  status: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  formData: OrderFormData;
  createdAt: string;
}

// Storage implementation
const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// ─── KV (Vercel) storage ────────────────────────────────────────────
let kvClient: any = null;

async function getKv(): Promise<any | null> {
  if (kvClient) return kvClient;
  try {
    const { kv } = await import("@vercel/kv");
    // Test connection with a simple ping
    await kv.ping();
    kvClient = kv;
    return kvClient;
  } catch (e) {
    console.log("Vercel KV not available, using file storage:", e);
    kvClient = null;
    return null;
  }
}

// ─── Generic set/get with KV + file fallback ────────────────────────
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function setValue(key: string, value: any): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(key, value);
    return;
  }
  // Fall back to file storage
  await ensureDataDir();
  await fs.writeFile(path.join(DATA_DIR, `${key}.json`), JSON.stringify(value, null, 2));
}

async function getValue(key: string): Promise<any | null> {
  const kv = await getKv();
  if (kv) {
    try {
      const val = await kv.get(key);
      return val ?? null;
    } catch {
      return null;
    }
  }
  // Fall back to file storage
  try {
    const data = await fs.readFile(path.join(DATA_DIR, `${key}.json`), "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ─── Order CRUD ──────────────────────────────────────────────────────
export async function getOrders(): Promise<Order[]> {
  const val = await getValue("orders");
  return val || [];
}

export async function saveOrder(order: Order): Promise<void> {
  const orders = await getOrders();
  orders.push(order);
  await setValue("orders", orders);
}

export async function getOrderByOrderId(orderId: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o: Order) => o.orderId === orderId) || null;
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
  const orders = await getOrders();
  const idx = orders.findIndex((o: Order) => o.orderId === orderId);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...updates };
  await setValue("orders", orders);
  return orders[idx];
}

// ─── Report CRUD ─────────────────────────────────────────────────────
export async function saveReport(orderId: string, content: string): Promise<void> {
  await setValue(`report:${orderId}`, content);
}

export async function getReport(orderId: string): Promise<string | null> {
  const val = await getValue(`report:${orderId}`);
  return val || null;
}

// ─── Factory ─────────────────────────────────────────────────────────
export function createOrder(
  orderId: string,
  plan: string,
  amount: number,
  formData: OrderFormData
): Order {
  return {
    id: uuidv4(),
    orderId,
    plan,
    status: "paid",
    amount,
    customerEmail: formData.email,
    customerName: formData.name,
    formData,
    createdAt: new Date().toISOString(),
  };
}
