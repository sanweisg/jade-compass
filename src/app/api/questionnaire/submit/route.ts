import { NextRequest, NextResponse } from "next/server";
import { saveOrder, createOrder, getOrders, getOrderByOrderId } from "../../../../lib/data-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, plan, formData } = body;

    if (!orderId || !plan || !formData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = createOrder(orderId, plan, formData.price || 0, formData);
    await saveOrder(order);

    return NextResponse.json({ status: "ok", orderId: order.id });
  } catch (error) {
    console.error("Questionnaire submit error:", error);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    const orders = await getOrders();

    if (orderId) {
      const order = await getOrderByOrderId(orderId);
      return NextResponse.json(order || { error: "Not found" });
    }

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "No orders found" }, { status: 404 });
  }
}
