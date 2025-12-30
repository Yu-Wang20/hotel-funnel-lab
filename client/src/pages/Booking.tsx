import { useState, useEffect } from 'react';
import { useParams, useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Shield, Clock, Check, Loader2 } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import { usePriceMode } from '@/contexts/PriceModeContext';
import Header from '@/components/Header';

const countries = [
  { code: 'CN', name: '中国' },
  { code: 'US', name: '美国' },
  { code: 'JP', name: '日本' },
  { code: 'SG', name: '新加坡' },
  { code: 'UK', name: '英国' },
  { code: 'FR', name: '法国' },
  { code: 'DE', name: '德国' },
  { code: 'AU', name: '澳大利亚' },
];

export default function Booking() {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  
  const { trackEvent, sessionId, variantId, experimentId } = useTracking();
  const { formatPrice } = usePriceMode();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCountry: 'CN',
    specialRequests: '',
  });
  const [formInteracted, setFormInteracted] = useState(false);

  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = params.get('guests') || '2';

  const { data: hotel, isLoading: hotelLoading } = trpc.hotels.getById.useQuery({ 
    id: parseInt(hotelId!) 
  });
  const { data: rooms } = trpc.hotels.getRooms.useQuery({ 
    hotelId: parseInt(hotelId!) 
  });
  
  const room = rooms?.find(r => r.id === parseInt(roomId!));

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      trackEvent('pay_success', {
        hotel_id: parseInt(hotelId!),
        room_id: parseInt(roomId!),
        order_number: data.orderNumber,
        total_price: room ? parseFloat(room.basePrice) + parseFloat(room.taxAmount) + parseFloat(room.feeAmount) : 0,
      });
      navigate(`/order/confirmation/${data.orderNumber}`);
    },
    onError: (error) => {
      trackEvent('pay_failed', {
        hotel_id: parseInt(hotelId!),
        room_id: parseInt(roomId!),
        error: error.message,
      });
      toast.error('预订失败，请重试');
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (hotel && room) {
      trackEvent('booking_page_view', {
        hotel_id: hotel.id,
        room_id: room.id,
        base_price: parseFloat(room.basePrice),
        total_price: parseFloat(room.basePrice) + parseFloat(room.taxAmount) + parseFloat(room.feeAmount),
      });
    }
  }, [hotel?.id, room?.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (!formInteracted) {
      setFormInteracted(true);
      trackEvent('booking_form_interact', {
        hotel_id: parseInt(hotelId!),
        room_id: parseInt(roomId!),
        first_field: field,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.guestEmail) {
      toast.error('请填写必填信息');
      return;
    }

    if (!room) return;

    setIsSubmitting(true);

    trackEvent('booking_submit', {
      hotel_id: parseInt(hotelId!),
      room_id: parseInt(roomId!),
      guest_country: formData.guestCountry,
    });

    // Simulate payment processing
    trackEvent('pay_initiated', {
      hotel_id: parseInt(hotelId!),
      room_id: parseInt(roomId!),
      payment_method: 'mock_card',
    });

    // Mock payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    createOrderMutation.mutate({
      hotelId: parseInt(hotelId!),
      roomId: parseInt(roomId!),
      checkIn,
      checkOut,
      guestCount: parseInt(guests),
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      guestPhone: formData.guestPhone || undefined,
      guestCountry: formData.guestCountry,
      specialRequests: formData.specialRequests || undefined,
      basePrice: room.basePrice,
      taxAmount: room.taxAmount,
      feeAmount: room.feeAmount,
      totalPrice: String(parseFloat(room.basePrice) + parseFloat(room.taxAmount) + parseFloat(room.feeAmount)),
      currency: room.currency || 'USD',
      variantId: variantId || undefined,
      experimentId: experimentId || undefined,
      sessionId,
    });
  };

  if (hotelLoading || !room) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const { displayPrice, breakdown } = formatPrice(
    parseFloat(room.basePrice),
    parseFloat(room.taxAmount),
    parseFloat(room.feeAmount)
  );

  // Calculate nights
  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(`/hotel/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回酒店详情
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>填写预订信息</CardTitle>
                <CardDescription>请确保信息准确，以便酒店联系您</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium">入住人信息</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guestName">姓名 *</Label>
                        <Input
                          id="guestName"
                          placeholder="请输入姓名（与证件一致）"
                          value={formData.guestName}
                          onChange={(e) => handleInputChange('guestName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestCountry">国籍</Label>
                        <Select 
                          value={formData.guestCountry} 
                          onValueChange={(v) => handleInputChange('guestCountry', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guestEmail">邮箱 *</Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          placeholder="用于接收确认邮件"
                          value={formData.guestEmail}
                          onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestPhone">手机号</Label>
                        <Input
                          id="guestPhone"
                          type="tel"
                          placeholder="方便酒店联系您"
                          value={formData.guestPhone}
                          onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="specialRequests">特殊要求（可选）</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="如：高楼层、无烟房、婴儿床等"
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      特殊要求视酒店情况而定，不保证满足
                    </p>
                  </div>

                  <Separator />

                  {/* Payment Section (Mock) */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      支付方式
                    </h3>
                    
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                          </div>
                          <div>
                            <p className="font-medium">模拟支付</p>
                            <p className="text-sm text-slate-500">**** **** **** 4242</p>
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            演示模式
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>您的支付信息已加密保护</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        确认并支付 ${(breakdown.total * nights).toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">预订摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hotel Info */}
                <div className="flex gap-3">
                  <img
                    src={hotel?.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'}
                    alt={hotel?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium">{hotel?.name}</h3>
                    <p className="text-sm text-slate-500">{room.name}</p>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">入住</span>
                    <span className="font-medium">
                      {checkIn && new Date(checkIn).toLocaleDateString('zh-CN', { 
                        month: 'long', day: 'numeric', weekday: 'short' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">退房</span>
                    <span className="font-medium">
                      {checkOut && new Date(checkOut).toLocaleDateString('zh-CN', { 
                        month: 'long', day: 'numeric', weekday: 'short' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">入住人数</span>
                    <span className="font-medium">{guests} 位成人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">入住晚数</span>
                    <span className="font-medium">{nights} 晚</span>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">房费 (${breakdown.base.toFixed(0)} × {nights}晚)</span>
                    <span>${(breakdown.base * nights).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">税费</span>
                    <span>${(breakdown.tax * nights).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">服务费</span>
                    <span>${(breakdown.fee * nights).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>总计</span>
                    <span className="text-blue-600">${(breakdown.total * nights).toFixed(2)}</span>
                  </div>
                </div>

                {/* Cancellation Policy */}
                {room.freeCancellation && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">免费取消</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {room.freeCancelUntil || '入住前可免费取消'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>即时确认</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>无隐藏费用</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>安全支付</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
