import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Star, MapPin, Wifi, Car, Utensils, Dumbbell, Check, X, AlertCircle, 
  ChevronRight, Sparkles, FileText, DollarSign, CreditCard, Clock,
  Shield, Info, ExternalLink, Map as MapIcon
} from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import { usePriceMode } from '@/contexts/PriceModeContext';
import Header from '@/components/Header';
import { MapView } from '@/components/Map';

interface PolicyAnalysis {
  cancellation: {
    type: 'free_cancel' | 'penalty' | 'no_refund';
    freeCancelUntil: string | null;
    penaltyRules: { condition: string; amount: string }[];
    confidence: number;
  };
  tax: {
    payMode: 'online' | 'at_property' | 'mixed';
    estimatedRange: string | null;
    includedItems: string[];
    excludedItems: string[];
    confidence: number;
  };
  idRequirements: {
    docType: 'passport' | 'id_card' | 'either' | null;
    minValidMonths: number | null;
    specialNotes: string | null;
    confidence: number;
  };
  evidence: {
    field: string;
    start: number;
    end: number;
    text: string;
  }[];
  analysisMethod?: string;
  latencyMs?: number;
  fromCache?: boolean;
}

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  
  const { trackEvent, sessionId, variantId } = useTracking();
  const { priceMode, formatPrice } = usePriceMode();
  
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [policyAnalysis, setPolicyAnalysis] = useState<PolicyAnalysis | null>(null);
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = params.get('guests') || '2';

  const { data: hotel, isLoading: hotelLoading } = trpc.hotels.getById.useQuery({ id: parseInt(id!) });
  const { data: rooms, isLoading: roomsLoading } = trpc.hotels.getRooms.useQuery({ hotelId: parseInt(id!) });
  
  const analyzePolicyMutation = trpc.policy.analyze.useMutation({
    onSuccess: (data) => {
      setPolicyAnalysis(data as PolicyAnalysis);
      trackEvent('policy_digest_impression', {
        hotel_id: parseInt(id!),
        analysis_method: data.analysisMethod,
        latency_ms: data.latencyMs,
        from_cache: data.fromCache,
        confidence_bucket: getConfidenceBucket(data as PolicyAnalysis),
      });
    },
  });

  useEffect(() => {
    if (hotel) {
      trackEvent('hotel_detail_view', {
        hotel_id: hotel.id,
        hotel_name: hotel.name,
        city: hotel.city,
        star_rating: hotel.starRating,
        price_mode: priceMode,
      });

      // Analyze policy if available
      if (hotel.policyTextEn || hotel.policyText) {
        analyzePolicyMutation.mutate({
          hotelId: hotel.id,
          policyText: hotel.policyTextEn || hotel.policyText || '',
        });
      }
    }
  }, [hotel?.id]);

  const getConfidenceBucket = (analysis: PolicyAnalysis): string => {
    const avgConfidence = (
      analysis.cancellation.confidence + 
      analysis.tax.confidence + 
      analysis.idRequirements.confidence
    ) / 3;
    if (avgConfidence >= 0.8) return 'high';
    if (avgConfidence >= 0.5) return 'medium';
    return 'low';
  };

  const handlePolicyExpand = (cardType: string) => {
    setPolicyExpanded(true);
    trackEvent('policy_digest_expand', {
      hotel_id: parseInt(id!),
      card_type: cardType,
      confidence_bucket: policyAnalysis ? getConfidenceBucket(policyAnalysis) : 'unknown',
    });
  };

  const handleEvidenceClick = (field: string, evidence: { start: number; end: number; text: string }) => {
    setShowFullPolicy(true);
    trackEvent('policy_evidence_click', {
      hotel_id: parseInt(id!),
      field,
      evidence_text: evidence.text.substring(0, 100),
    });
  };

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoom(roomId);
    trackEvent('room_select', {
      hotel_id: parseInt(id!),
      room_id: roomId,
      price_mode: priceMode,
    });
  };

  const handleBooking = (room: any) => {
    trackEvent('booking_start', {
      hotel_id: parseInt(id!),
      room_id: room.id,
      base_price: parseFloat(room.basePrice),
      total_price: parseFloat(room.basePrice) + parseFloat(room.taxAmount) + parseFloat(room.feeAmount),
      price_mode: priceMode,
    });
    navigate(`/booking/${id}/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
    
    if (hotel?.latitude && hotel?.longitude) {
      const position = { 
        lat: parseFloat(hotel.latitude), 
        lng: parseFloat(hotel.longitude) 
      };
      map.setCenter(position);
      map.setZoom(15);
      
      new google.maps.Marker({
        position,
        map,
        title: hotel.name,
      });

      trackEvent('map_view', {
        hotel_id: hotel.id,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCancellationBadge = (type: string) => {
    switch (type) {
      case 'free_cancel':
        return <Badge className="bg-green-100 text-green-800">免费取消</Badge>;
      case 'penalty':
        return <Badge className="bg-yellow-100 text-yellow-800">有条件取消</Badge>;
      case 'no_refund':
        return <Badge className="bg-red-100 text-red-800">不可退款</Badge>;
      default:
        return null;
    }
  };

  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container py-6">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">酒店未找到</h1>
          <Button onClick={() => navigate('/search')}>返回搜索</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Hero Image */}
      <div className="relative h-64 md:h-96">
        <img
          src={hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920'}
          alt={hotel.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 container">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{hotel.name}</h1>
          <p className="text-white/80 text-lg">{hotel.nameEn}</p>
          <div className="flex items-center gap-2 text-white/90 mt-2">
            <MapPin className="h-4 w-4" />
            {hotel.address}
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Policy Summary - Core Feature */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI 政策智能摘要</CardTitle>
                      <CardDescription>
                        {policyAnalysis?.analysisMethod === 'llm' ? 'AI 智能解析' : '规则模板解析'}
                        {policyAnalysis?.latencyMs && ` · ${policyAnalysis.latencyMs}ms`}
                      </CardDescription>
                    </div>
                  </div>
                  {policyAnalysis && (
                    <Badge variant="outline" className={getConfidenceColor(
                      (policyAnalysis.cancellation.confidence + policyAnalysis.tax.confidence + policyAnalysis.idRequirements.confidence) / 3
                    )}>
                      置信度: {getConfidenceBucket(policyAnalysis)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {analyzePolicyMutation.isPending ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : policyAnalysis ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Cancellation Card */}
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePolicyExpand('cancellation')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">退改政策</span>
                        </div>
                        {getCancellationBadge(policyAnalysis.cancellation.type)}
                        {policyAnalysis.cancellation.freeCancelUntil && (
                          <p className="text-sm text-slate-600 mt-2">
                            {policyAnalysis.cancellation.freeCancelUntil}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                          <span className={getConfidenceColor(policyAnalysis.cancellation.confidence)}>
                            ●
                          </span>
                          置信度 {(policyAnalysis.cancellation.confidence * 100).toFixed(0)}%
                        </div>
                        {policyAnalysis.evidence.filter(e => e.field === 'cancellation').length > 0 && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto mt-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              const evidence = policyAnalysis.evidence.find(e => e.field === 'cancellation');
                              if (evidence) handleEvidenceClick('cancellation', evidence);
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            查看依据
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tax Card */}
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePolicyExpand('tax')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-medium">税费说明</span>
                        </div>
                        <Badge className={
                          policyAnalysis.tax.payMode === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : policyAnalysis.tax.payMode === 'at_property'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }>
                          {policyAnalysis.tax.payMode === 'online' ? '在线支付' : 
                           policyAnalysis.tax.payMode === 'at_property' ? '到店支付' : '混合支付'}
                        </Badge>
                        {policyAnalysis.tax.estimatedRange && (
                          <p className="text-sm text-slate-600 mt-2">
                            预估: {policyAnalysis.tax.estimatedRange}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                          <span className={getConfidenceColor(policyAnalysis.tax.confidence)}>
                            ●
                          </span>
                          置信度 {(policyAnalysis.tax.confidence * 100).toFixed(0)}%
                        </div>
                      </CardContent>
                    </Card>

                    {/* ID Requirements Card */}
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePolicyExpand('id')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">证件要求</span>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {policyAnalysis.idRequirements.docType === 'passport' ? '护照' :
                           policyAnalysis.idRequirements.docType === 'id_card' ? '身份证' :
                           policyAnalysis.idRequirements.docType === 'either' ? '护照/身份证' : '未指定'}
                        </Badge>
                        {policyAnalysis.idRequirements.minValidMonths && (
                          <p className="text-sm text-slate-600 mt-2">
                            有效期 ≥ {policyAnalysis.idRequirements.minValidMonths} 个月
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                          <span className={getConfidenceColor(policyAnalysis.idRequirements.confidence)}>
                            ●
                          </span>
                          置信度 {(policyAnalysis.idRequirements.confidence * 100).toFixed(0)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>暂无政策信息</p>
                  </div>
                )}

                {/* View Full Policy Button */}
                <Dialog open={showFullPolicy} onOpenChange={setShowFullPolicy}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => trackEvent('policy_fulltext_view', { hotel_id: hotel.id })}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      查看完整政策原文
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>完整政策原文</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg">
                        {hotel.policyTextEn || hotel.policyText || '暂无政策信息'}
                      </pre>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Room Selection */}
            <Card>
              <CardHeader>
                <CardTitle>选择房型</CardTitle>
                <CardDescription>
                  {checkIn && checkOut && `${new Date(checkIn).toLocaleDateString()} - ${new Date(checkOut).toLocaleDateString()}`}
                  {guests && ` · ${guests} 位客人`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roomsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))
                ) : rooms && rooms.length > 0 ? (
                  rooms.map((room) => {
                    const { displayPrice, label, breakdown } = formatPrice(
                      parseFloat(room.basePrice),
                      parseFloat(room.taxAmount),
                      parseFloat(room.feeAmount)
                    );
                    const isSelected = selectedRoom === room.id;

                    return (
                      <Card 
                        key={room.id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-blue-600' : 'hover:shadow-md'
                        }`}
                        onClick={() => handleRoomSelect(room.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <img
                              src={room.imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300'}
                              alt={room.name}
                              className="w-full md:w-40 h-32 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{room.name}</h3>
                                  <p className="text-sm text-slate-500">{room.nameEn}</p>
                                </div>
                                {room.freeCancellation && (
                                  <Badge className="bg-green-100 text-green-800">免费取消</Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-600">
                                <span>{room.bedType} 床</span>
                                <span>·</span>
                                <span>{room.roomSize} m²</span>
                                <span>·</span>
                                <span>最多 {room.maxGuests} 人</span>
                              </div>
                              {room.amenities && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(room.amenities as string[]).slice(0, 4).map((amenity) => (
                                    <Badge key={amenity} variant="secondary" className="text-xs">
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right md:min-w-[140px]">
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="text-2xl font-bold text-blue-600">
                                ${displayPrice.toFixed(0)}
                              </p>
                              <p className="text-xs text-slate-500 mb-2">每晚</p>
                              
                              {/* Price Breakdown */}
                              <div className="text-xs text-slate-500 space-y-1 mb-3">
                                <div className="flex justify-between">
                                  <span>房费</span>
                                  <span>${breakdown.base.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>税费</span>
                                  <span>${breakdown.tax.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>服务费</span>
                                  <span>${breakdown.fee.toFixed(0)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-medium">
                                  <span>总计</span>
                                  <span>${breakdown.total.toFixed(0)}</span>
                                </div>
                              </div>

                              <Button 
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBooking(room);
                                }}
                              >
                                预订
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    暂无可用房型
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  酒店位置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-lg overflow-hidden mb-4">
                  <MapView onMapReady={handleMapReady} />
                </div>
                
                {/* Nearby Landmarks */}
                {hotel.nearbyLandmarks && (hotel.nearbyLandmarks as any[]).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">周边地标</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(hotel.nearbyLandmarks as any[]).map((landmark, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm cursor-pointer hover:bg-slate-100"
                          onClick={() => trackEvent('map_landmark_click', { 
                            hotel_id: hotel.id, 
                            landmark_name: landmark.name 
                          })}
                        >
                          <span>{landmark.name}</span>
                          <Badge variant="secondary">{landmark.distance}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold bg-blue-600 text-white px-3 py-2 rounded-lg">
                    {hotel.reviewScore || 'N/A'}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {hotel.reviewScore && parseFloat(hotel.reviewScore) >= 9 ? '卓越' : 
                       hotel.reviewScore && parseFloat(hotel.reviewScore) >= 8 ? '很好' : '不错'}
                    </p>
                    <p className="text-sm text-slate-500">{hotel.reviewCount} 条评价</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">酒店设施</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {hotel.amenities && (hotel.amenities as string[]).map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">酒店简介</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  {hotel.description || hotel.descriptionEn || '暂无简介'}
                </p>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardContent className="p-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => trackEvent('contact_click', { hotel_id: hotel.id })}
                >
                  <Info className="h-4 w-4 mr-2" />
                  联系客服
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
