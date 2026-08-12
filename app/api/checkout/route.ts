import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get('variant');
  const user = searchParams.get('user');

  if (!variant || !user) {
    return NextResponse.redirect(new URL('/dashboard/billing', request.url));
  }

  const shopId = process.env.LEMON_SQUEEZY_SHOP_ID || 'futrdesk.lemonsqueezy.com';
  const checkoutUrl = `https://${shopId}/checkout/buy/${variant}?checkout[custom][user_id]=${user}`;
  
  return NextResponse.redirect(checkoutUrl);
}
