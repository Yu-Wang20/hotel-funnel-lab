import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { CalendarIcon, MapPin, Users, Search as SearchIcon, Building2, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import { usePriceMode } from '@/contexts/PriceModeContext';
import Header from '@/components/Header';

const popularDestinations = [
  { city: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' },
  { city: 'Singapore', country: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400' },
  { city: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
  { city: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400' },
  { city: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
  { city: 'Hong Kong', country: 'China', image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400' },
];

export default function Search() {
  const [, navigate] = useLocation();
  const { trackEvent } = useTracking();
  const { priceMode, setPriceMode } = usePriceMode();
  
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 9));
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    trackEvent('search_page_view');
  }, []);

  const handleSearch = () => {
    if (!destination) return;
    
    trackEvent('search_initiated', {
      destination,
      check_in: checkIn?.toISOString(),
      check_out: checkOut?.toISOString(),
      guests: parseInt(guests),
      price_mode: priceMode,
    });

    const params = new URLSearchParams({
      city: destination,
      checkIn: checkIn?.toISOString() || '',
      checkOut: checkOut?.toISOString() || '',
      guests,
      priceMode,
    });

    navigate(`/hotels?${params.toString()}`);
  };

  const handleDestinationClick = (city: string) => {
    setDestination(city);
    trackEvent('popular_destination_click', { city });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920')] bg-cover bg-center opacity-30" />
        
        <div className="relative container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              国际酒店预订实验平台
            </h1>
            <p className="text-xl text-blue-100">
              Hotel Funnel Lab - 探索全链路漏斗优化与 AI 赋能
            </p>
          </div>

          {/* Search Card */}
          <Card className="max-w-4xl mx-auto shadow-2xl border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">搜索酒店</CardTitle>
                  <CardDescription>输入目的地开始您的旅程</CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-4 py-2">
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Destination */}
                <div className="md:col-span-1">
                  <Label htmlFor="destination" className="text-sm font-medium mb-2 block">
                    目的地
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="destination"
                      placeholder="城市或酒店名称"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Check-in Date */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">入住日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, 'MM/dd') : '选择日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Check-out Date */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">退房日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, 'MM/dd') : '选择日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => date < (checkIn || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">入住人数</Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger>
                      <Users className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 位成人</SelectItem>
                      <SelectItem value="2">2 位成人</SelectItem>
                      <SelectItem value="3">3 位成人</SelectItem>
                      <SelectItem value="4">4 位成人</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                className="w-full mt-6 h-12 text-lg bg-blue-600 hover:bg-blue-700"
                disabled={!destination}
              >
                <SearchIcon className="mr-2 h-5 w-5" />
                搜索酒店
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="container py-16">
        <h2 className="text-2xl font-bold mb-8">热门目的地</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularDestinations.map((dest) => (
            <Card 
              key={dest.city}
              className="cursor-pointer overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => handleDestinationClick(dest.city)}
            >
              <div className="aspect-[4/3] relative">
                <img 
                  src={dest.image} 
                  alt={dest.city}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-semibold">{dest.city}</p>
                  <p className="text-sm text-white/80">{dest.country}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8 text-center">平台特色功能</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">AI 政策助手</h3>
              <p className="text-sm text-slate-600">
                智能解析 2000+ 字政策文档，提取关键信息
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">全价透明</h3>
              <p className="text-sm text-slate-600">
                一键切换全价/净价模式，消除税费冲击
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">A/B 实验</h3>
              <p className="text-sm text-slate-600">
                科学的实验设计与统计分析框架
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">漏斗看板</h3>
              <p className="text-sm text-slate-600">
                实时追踪转化漏斗，定位流失环节
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
