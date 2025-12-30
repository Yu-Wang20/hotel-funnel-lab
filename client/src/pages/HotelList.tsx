import { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, Wifi, Car, Utensils, Dumbbell, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import { usePriceMode } from '@/contexts/PriceModeContext';
import Header from '@/components/Header';

export default function HotelList() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  
  const { trackEvent } = useTracking();
  const { priceMode, setPriceMode, formatPrice } = usePriceMode();
  
  const [sortBy, setSortBy] = useState<'recommendation' | 'price_asc' | 'price_desc' | 'rating'>('recommendation');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minStars, setMinStars] = useState<number | null>(null);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const city = params.get('city') || '';
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = params.get('guests') || '2';

  const { data: hotels, isLoading } = trpc.hotels.search.useQuery({
    city,
    checkIn,
    checkOut,
    guests: parseInt(guests),
    sortBy,
    minStars: minStars || undefined,
    freeCancellation: freeCancellation || undefined,
  });

  useEffect(() => {
    trackEvent('search_result_view', {
      city,
      check_in: checkIn,
      check_out: checkOut,
      guests: parseInt(guests),
      result_count: hotels?.length || 0,
      sort_by: sortBy,
      price_mode: priceMode,
    });
  }, [hotels?.length]);

  const handleHotelClick = (hotelId: number, rank: number) => {
    trackEvent('search_result_click', {
      hotel_id: hotelId,
      rank,
      price_mode: priceMode,
      sort_by: sortBy,
    });
    navigate(`/hotel/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    return hotels.filter(hotel => {
      // Price filter would apply to rooms, but we show hotel-level for now
      if (minStars && hotel.starRating < minStars) return false;
      return true;
    });
  }, [hotels, minStars, priceRange]);

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, any> = {
      'WiFi': Wifi,
      'Parking': Car,
      'Restaurant': Utensils,
      'Gym': Dumbbell,
    };
    return icons[amenity] || null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-6">
        {/* Search Summary & Price Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{city} 酒店</h1>
            <p className="text-slate-600">
              {checkIn && checkOut && `${new Date(checkIn).toLocaleDateString()} - ${new Date(checkOut).toLocaleDateString()}`}
              {guests && ` · ${guests} 位客人`}
              {hotels && ` · ${hotels.length} 家酒店`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Price Mode Toggle */}
            <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm border">
              <span className={`text-sm ${priceMode === 'net' ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                净价
              </span>
              <Switch
                checked={priceMode === 'total'}
                onCheckedChange={(checked) => setPriceMode(checked ? 'total' : 'net')}
              />
              <span className={`text-sm ${priceMode === 'total' ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                全价含税
              </span>
            </div>
            
            <Button 
              variant="outline" 
              className="gap-2 sm:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              筛选
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className={`
            ${showFilters ? 'fixed inset-0 z-50 bg-white p-6' : 'hidden'} 
            sm:block sm:relative sm:w-64 sm:flex-shrink-0
          `}>
            {showFilters && (
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <h2 className="font-semibold">筛选条件</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <Card className="sticky top-24">
              <CardContent className="p-4 space-y-6">
                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">排序方式</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommendation">推荐排序</SelectItem>
                      <SelectItem value="price_asc">价格从低到高</SelectItem>
                      <SelectItem value="price_desc">价格从高到低</SelectItem>
                      <SelectItem value="rating">评分最高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="text-sm font-medium mb-3 block">星级</label>
                  <div className="flex flex-wrap gap-2">
                    {[3, 4, 5].map((stars) => (
                      <Button
                        key={stars}
                        variant={minStars === stars ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMinStars(minStars === stars ? null : stars)}
                        className="gap-1"
                      >
                        {stars} <Star className="h-3 w-3 fill-current" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    价格范围: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={1000}
                    step={50}
                    className="mt-2"
                  />
                </div>

                {/* Free Cancellation */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="freeCancellation"
                    checked={freeCancellation}
                    onCheckedChange={(checked) => setFreeCancellation(checked as boolean)}
                  />
                  <label htmlFor="freeCancellation" className="text-sm cursor-pointer">
                    免费取消
                  </label>
                </div>

                {showFilters && (
                  <Button className="w-full sm:hidden" onClick={() => setShowFilters(false)}>
                    应用筛选
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Hotel List */}
          <main className="flex-1 space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <Skeleton className="w-full sm:w-64 h-48" />
                    <div className="flex-1 p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredHotels.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">没有找到符合条件的酒店</p>
                <Button variant="link" onClick={() => navigate('/search')}>
                  修改搜索条件
                </Button>
              </Card>
            ) : (
              filteredHotels.map((hotel, index) => {
                // Mock room price for display
                const basePrice = 200 + hotel.starRating * 50 + Math.random() * 100;
                const taxAmount = basePrice * 0.15;
                const feeAmount = 25;
                const { displayPrice, label } = formatPrice(basePrice, taxAmount, feeAmount);
                
                return (
                  <Card 
                    key={hotel.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleHotelClick(hotel.id, index + 1)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="relative w-full sm:w-64 h-48 flex-shrink-0">
                        <img
                          src={hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                          alt={hotel.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {hotel.reviewScore && parseFloat(hotel.reviewScore) >= 9 && (
                          <Badge className="absolute top-3 left-3 bg-green-600">
                            超赞
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-lg">{hotel.name}</h3>
                              <p className="text-sm text-slate-500">{hotel.nameEn}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: hotel.starRating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-sm text-slate-600 mt-2">
                            <MapPin className="h-4 w-4" />
                            {hotel.city}, {hotel.country}
                          </div>

                          {/* Amenities */}
                          {hotel.amenities && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(hotel.amenities as string[]).slice(0, 4).map((amenity) => {
                                const Icon = getAmenityIcon(amenity);
                                return (
                                  <Badge key={amenity} variant="secondary" className="text-xs gap-1">
                                    {Icon && <Icon className="h-3 w-3" />}
                                    {amenity}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Price & Rating */}
                        <div className="flex items-end justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            {hotel.reviewScore && (
                              <>
                                <div className="bg-blue-600 text-white px-2 py-1 rounded font-semibold">
                                  {hotel.reviewScore}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {parseFloat(hotel.reviewScore) >= 9 ? '卓越' : 
                                     parseFloat(hotel.reviewScore) >= 8 ? '很好' : '不错'}
                                  </span>
                                  <span className="text-slate-500 ml-1">
                                    ({hotel.reviewCount} 条评价)
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ${displayPrice.toFixed(0)}
                            </p>
                            <p className="text-xs text-slate-500">每晚</p>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="hidden sm:flex items-center px-4 bg-slate-50">
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
