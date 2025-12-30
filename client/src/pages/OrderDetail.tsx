import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Calendar, MapPin, User, Mail, Phone, ArrowLeft, XCircle, Clock, CreditCard } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import Header from '@/components/Header';

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [, navigate] = useLocation();
  const { trackEvent } = useTracking();

  const { data: order, isLoading, refetch } = trpc.orders.getByNumber.useQuery({ 
    orderNumber: orderNumber! 
  });

  const cancelMutation = trpc.orders.cancel.useMutation({
    onSuccess: () => {
      trackEvent('order_cancel', {
        order_number: orderNumber || '',
        hotel_id: order?.hotelId,
      });
      toast.success('订单已取消');
      refetch();
    },
    onError: () => {
      toast.error('取消失败，请重试');
    },
  });

  useEffect(() => {
    if (order) {
      trackEvent('order_view', {
        order_number: orderNumber,
        hotel_id: order.hotelId,
        status: order.status,
      });
    }
  }, [order?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">已确认</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">待确认</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">已取消</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">已完成</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96" />
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

  const canCancel = order.status === 'confirmed' || order.status === 'pending';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/search')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">订单详情</CardTitle>
                  <CardDescription className="mt-1">
                    订单号: {order.orderNumber}
                  </CardDescription>
                </div>
                {getStatusBadge(order.status || 'pending')}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span>创建时间: {new Date(order.createdAt).toLocaleString('zh-CN')}</span>
              </div>

              <Separator />

              {/* Hotel Info */}
              <div>
                <h3 className="font-medium mb-3">酒店信息</h3>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold">酒店 ID: {order.hotelId}</p>
                        <p className="text-sm text-slate-600">房型 ID: {order.roomId}</p>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm"
                          onClick={() => navigate(`/hotel/${order.hotelId}`)}
                        >
                          查看酒店详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Stay Details */}
              <div>
                <h3 className="font-medium mb-3">入住信息</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      入住
                    </div>
                    <p className="font-medium">
                      {new Date(order.checkIn).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      退房
                    </div>
                    <p className="font-medium">
                      {new Date(order.checkOut).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <User className="h-4 w-4" />
                      入住人数
                    </div>
                    <p className="font-medium">{order.guestCount} 位</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Guest Info */}
              <div>
                <h3 className="font-medium mb-3">入住人信息</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{order.guestName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{order.guestEmail}</span>
                  </div>
                  {order.guestPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{order.guestPhone}</span>
                    </div>
                  )}
                  {order.guestCountry && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>国籍: {order.guestCountry}</span>
                    </div>
                  )}
                </div>
                {order.specialRequests && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">特殊要求:</p>
                    <p className="text-sm">{order.specialRequests}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Info */}
              <div>
                <h3 className="font-medium mb-3">支付信息</h3>
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
                    <span>总计</span>
                    <span className="text-blue-600">
                      ${parseFloat(order.totalPrice).toFixed(2)} {order.currency}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                  <CreditCard className="h-4 w-4" />
                  <span>
                    支付状态: {order.paymentStatus === 'paid' ? '已支付' : order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canCancel && (
                <>
                  <Separator />
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          取消订单
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认取消订单？</AlertDialogTitle>
                          <AlertDialogDescription>
                            取消后将根据酒店退改政策处理退款。此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>返回</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelMutation.mutate({ orderNumber: order.orderNumber })}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            确认取消
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
