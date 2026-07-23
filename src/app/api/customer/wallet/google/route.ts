import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customerAuth";
import { generateBarberGooglePass } from "@/lib/walletGenerator";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      include: {
        shop: { select: { id: true, name: true, slug: true, phone: true, logoUrl: true, googleReviewUrl: true } },
        primaryBarber: { select: { name: true } },
        visits: { select: { id: true }, orderBy: { visitedAt: "desc" } },
        appointments: {
          where: { scheduledAt: { gte: new Date() }, status: { not: "cancelled" } },
          orderBy: { scheduledAt: "asc" },
          take: 1,
          include: {
            barber: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
    });

    if (!customer || !customer.accessCode) {
      return NextResponse.json({ error: "Customer not found or no access code" }, { status: 404 });
    }

    const { saveUrl } = await generateBarberGooglePass({
      customerId: customer.id,
      customerName: customer.name ?? "Valued customer",
      accessCode: customer.accessCode,
      shopSlug: customer.shop.slug,
      shop: customer.shop,
      visitCount: customer.visits.length,
      preferredBarber: customer.primaryBarber,
      nextAppointment: customer.appointments[0] ?? null,
      loyaltyStamp: 10,
    });

    return NextResponse.json({ saveUrl });
  } catch (err) {
    console.error("[Wallet/Google]", err);
    return NextResponse.json({ error: "Failed to generate pass" }, { status: 500 });
  }
}
