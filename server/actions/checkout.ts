// server/actions/checkout.ts
'use server';

import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { checkoutSchema } from '@/lib/validators';
import { getCurrentUser } from '@/lib/roles';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCart, clearCart } from './cart';

export async function createCheckout(formData: FormData) {
  try {
    const checkoutData = {
      items: JSON.parse(formData.get('items') as string),
      shippingAddress: JSON.parse(formData.get('shippingAddress') as string),
      billingAddress: JSON.parse(
        (formData.get('billingAddress') as string) || 'null'
      ),
      customerInfo: JSON.parse(formData.get('customerInfo') as string),
      shippingMethod: formData.get('shippingMethod') as string,
      notes: (formData.get('notes') as string) || undefined,
    };

    const validatedData = checkoutSchema.parse(checkoutData);
    const user = await getCurrentUser();

    // Verify cart items and calculate total
    const cart = await getCart();
    if (cart.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Check inventory for all items
    const productsById = new Map<string, { name: string; sku: string | null }>();
    for (const item of validatedData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          inventory: true,
        },
      });

      if (!product || product.status !== 'PUBLISHED') {
        return {
          success: false,
          error: 'One or more products are unavailable',
        };
      }

      const totalAvailable = product.inventory.reduce(
        (sum, inv) => sum + inv.available,
        0
      );
      if (totalAvailable < item.quantity) {
        return {
          success: false,
          error: 'Insufficient inventory for one or more items',
        };
      }

      productsById.set(product.id, { name: product.name, sku: product.sku });
    }

    // Calculate shipping cost
    const shippingCost = await calculateShippingCost(
      validatedData.shippingMethod,
      validatedData.shippingAddress,
      cart.total
    );

    const subtotal = cart.total;
    const tax = await calculateTax(
      subtotal,
      validatedData.shippingAddress.state
    );
    const total = subtotal + shippingCost + tax;

    const confirmationToken = randomUUID();

    // Create pending order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId: user?.id,
        status: 'PENDING',
        confirmationToken,
        subtotal: Number(subtotal),
        shipping: Number(shippingCost),
        tax: Number(tax),
        total: Number(total),
        currency: 'USD',
        customerEmail: validatedData.customerInfo.email,
        shippingName: `${validatedData.customerInfo.firstName} ${validatedData.customerInfo.lastName}`,
        shippingAddress: validatedData.shippingAddress.line1,
        shippingCity: validatedData.shippingAddress.city,
        shippingState: validatedData.shippingAddress.state,
        shippingZip: validatedData.shippingAddress.postalCode,
        shippingCountry: validatedData.shippingAddress.country || 'US',
        customerPhone: validatedData.customerInfo.phone,
        billingName: validatedData.billingAddress?.line1
          ? `${validatedData.customerInfo.firstName} ${validatedData.customerInfo.lastName}`
          : undefined,
        billingAddress: validatedData.billingAddress?.line1,
        billingCity: validatedData.billingAddress?.city,
        billingState: validatedData.billingAddress?.state,
        billingZip: validatedData.billingAddress?.postalCode,
        billingCountry: validatedData.billingAddress?.country,
        shippingMethod: validatedData.shippingMethod,
        notes: validatedData.notes,
        orderItems: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            productName: productsById.get(item.productId)?.name ?? item.productId,
            productSku: productsById.get(item.productId)?.sku ?? undefined,
          })),
        },
      },
    });

    // Fake checkout: no payment provider. The order is finalized right away.
    await finalizeOrder(order.id);

    revalidateTag('orders', 'max');
    revalidateTag('products', 'max');

    return {
      success: true,
      orderId: order.id,
      url: `/orders/${order.id}/success?token=${confirmationToken}`,
    };
  } catch (error) {
    console.error('Create checkout error:', error);
    return { success: false, error: 'Failed to place order' };
  }
}

async function finalizeOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { orderItems: true },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PROCESSING', paidAt: new Date() },
  });

  // Update product inventory
  for (const item of order.orderItems) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: item.productId },
    });

    if (inventory) {
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: {
          available: Math.max(0, inventory.available - item.quantity),
          reserved: inventory.reserved + item.quantity,
        },
      });
    }
  }

  await clearCart();
}

export async function calculateShippingCost(
  method: string,
  address: any,
  orderValue: number
): Promise<number> {
  // Simple shipping calculation - customize based on your needs
  const shippingRates = {
    standard: 5.99,
    express: 12.99,
    overnight: 24.99,
    free: 0,
  };

  // Free shipping for orders over $75
  if (orderValue >= 75) {
    return 0;
  }

  return shippingRates[method as keyof typeof shippingRates] || 5.99;
}

export async function calculateTax(
  subtotal: number,
  state: string
): Promise<number> {
  // Simple tax calculation - customize based on your tax requirements
  const taxRates: Record<string, number> = {
    CA: 0.08,
    NY: 0.08,
    TX: 0.065,
    FL: 0.06,
    // Add more states as needed
  };

  const taxRate = taxRates[state] || 0;
  return subtotal * taxRate;
}

export async function cancelOrder(orderId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return { success: false, error: 'Order cannot be cancelled' };
    }

    // Restore inventory if order was already processed
    if (order.status === 'PROCESSING') {
      for (const item of order.orderItems) {
        const inventory = await prisma.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { productId: item.productId },
            data: {
              available: inventory.available + item.quantity,
              reserved: Math.max(0, inventory.reserved - item.quantity),
            },
          });
        }
      }
    }

    // Cancel order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    revalidateTag('orders', 'max');
    revalidateTag('products', 'max');

    return { success: true };
  } catch (error) {
    console.error('Cancel order error:', error);
    return { success: false, error: 'Failed to cancel order' };
  }
}

export async function getShippingMethods() {
  return [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 5.99,
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 12.99,
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      description: '1 business day',
      price: 24.99,
    },
  ];
}
