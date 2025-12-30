import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Calendar, MapPin, User, Mail, Phone, Download, Share2 } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import Header from '@/components/Header';
import confetti from 'canvas-confetti';

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [, navigate] = useLocation();
  const { trackEvent } = useTracking();

  const { data: order, isLoading } = trpc.orders.getByNumber.useQuery({ 
    orderNumber: orderNumber! 
  });

  useEffect(() => {
    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (order) {
      trackEvent('order_confirmation_view', {
        order_number: orderNumber,
        hotel_id: order.hotelId,
        room_id: order.roomId,
        total_price: parseFloat(order.totalPrice),
      });
    }
  }, [order?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container py-12">
          <Skeleton className="h-64 max-w-2xl mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">订单未找到</h1>
          <Button onClick={() => navigate('/search')}>返回搜索</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">预订成功！</h1>
            <p className="text-slate-600">
              确认邮件已发送至 {order.guestEmail}
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>订单详情</CardTitle>
                  <CardDescription>订单号: {order.orderNumber}</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {order.status === 'confirmed' ? '已确认' : order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hotel Info */}
              <div>
                <h3 className="font-medium mb-2">酒店信息</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-semibold">酒店 ID: {order.hotelId}</p>
                  <p className="text-sm text-slate-600">房型 ID: {order.roomId}</p>
                </div>
              </div>

              <Separator />

              {/* Stay Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    入住日期
                  </div>
                  <p className="font-medium">
                    {new Date(order.checkIn).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    退房日期
                  </div>
                  <p className="font-medium">
                    {new Date(order.checkOut).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Guest Info */}
              <div>
                <h3 className="font-medium mb-3">入住人信息</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{order.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{order.guestEmail}</span>
                  </div>
                  {order.guestPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{order.guestPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Price Summary */}
              <div>
                <h3 className="font-medium mb-3">费用明细</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">房费</span>
                    <span>${parseFloat(order.basePrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">税费</span>
                    <span>${parseFloat(order.taxAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">服务费</span>
                    <span>${parseFloat(order.feeAmount).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>已支付</span>
                    <span className="text-green-600">
                      ${parseFloat(order.totalPrice).toFixed(2)} {order.currency}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                trackEvent('order_share', { order_number: orderNumber });
                // Mock share
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              分享订单
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                trackEvent('order_download', { order_number: orderNumber });
                // Mock download
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              下载确认函
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate(`/order/${orderNumber}`)}
            >
              查看订单详情
            </Button>
          </div>

          {/* Continue Shopping */}
          <div className="text-center mt-8">
            <Button variant="link" onClick={() => navigate('/search')}>
              继续预订其他酒店
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
