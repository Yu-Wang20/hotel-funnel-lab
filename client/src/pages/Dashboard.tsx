import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Eye, MousePointer, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedExperiment, setSelectedExperiment] = useState<string>('all');

  const { data: funnelMetrics, isLoading: funnelLoading } = trpc.tracking.getFunnelMetrics.useQuery({
    experimentId: selectedExperiment !== 'all' ? selectedExperiment : undefined,
  });

  const { data: experiments } = trpc.experiments.getAll.useQuery();

  // Mock funnel data for visualization
  const funnelData = useMemo(() => {
    // Default demo data - in production this would come from aggregated metrics
    return [
      { name: '搜索页访问', value: 10000, fill: '#3b82f6' },
      { name: '搜索结果点击', value: 6500, fill: '#10b981' },
      { name: '酒店详情页', value: 4200, fill: '#f59e0b' },
      { name: '开始预订', value: 1800, fill: '#ef4444' },
      { name: '提交订单', value: 950, fill: '#8b5cf6' },
      { name: '支付成功', value: 720, fill: '#ec4899' },
    ];
  }, [funnelMetrics]);

  // Calculate conversion rates
  const conversionRates = useMemo(() => {
    return funnelData.map((stage, index) => {
      if (index === 0) return { ...stage, rate: 100, dropoff: 0 };
      const prevValue = funnelData[index - 1].value;
      const rate = ((stage.value / prevValue) * 100).toFixed(1);
      const dropoff = (100 - parseFloat(rate)).toFixed(1);
      return { ...stage, rate: parseFloat(rate), dropoff: parseFloat(dropoff) };
    });
  }, [funnelData]);

  // KPI cards data
  const kpiData = useMemo(() => {
    const totalVisits = funnelData[0]?.value || 0;
    const totalOrders = funnelData[5]?.value || 0;
    const overallCVR = totalVisits > 0 ? ((totalOrders / totalVisits) * 100).toFixed(2) : '0';
    
    return [
      {
        title: '总访问量',
        value: totalVisits.toLocaleString(),
        change: '+12.5%',
        trend: 'up',
        icon: Users,
      },
      {
        title: '详情页 UV',
        value: (funnelData[2]?.value || 0).toLocaleString(),
        change: '+8.3%',
        trend: 'up',
        icon: Eye,
      },
      {
        title: '订单数',
        value: totalOrders.toLocaleString(),
        change: '+15.2%',
        trend: 'up',
        icon: ShoppingCart,
      },
      {
        title: '支付转化率',
        value: `${overallCVR}%`,
        change: '+0.8%',
        trend: 'up',
        icon: CreditCard,
      },
    ];
  }, [funnelData]);

  // Daily trend data (mock)
  const dailyTrend = [
    { date: '12/24', visits: 1200, orders: 85, cvr: 7.1 },
    { date: '12/25', visits: 1450, orders: 102, cvr: 7.0 },
    { date: '12/26', visits: 1380, orders: 98, cvr: 7.1 },
    { date: '12/27', visits: 1520, orders: 115, cvr: 7.6 },
    { date: '12/28', visits: 1680, orders: 128, cvr: 7.6 },
    { date: '12/29', visits: 1590, orders: 118, cvr: 7.4 },
    { date: '12/30', visits: 1720, orders: 135, cvr: 7.8 },
  ];

  // Event distribution (mock)
  const eventDistribution = [
    { name: 'search_result_click', value: 35 },
    { name: 'hotel_detail_view', value: 25 },
    { name: 'policy_digest_expand', value: 15 },
    { name: 'room_select', value: 12 },
    { name: 'booking_submit', value: 8 },
    { name: 'other', value: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">数据看板</h1>
            <p className="text-slate-600">实时监控漏斗转化与关键指标</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">今日</SelectItem>
                <SelectItem value="7d">近7天</SelectItem>
                <SelectItem value="30d">近30天</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部实验" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部流量</SelectItem>
                {experiments?.map((exp) => (
                  <SelectItem key={exp.experimentId} value={exp.experimentId}>
                    {exp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{kpi.title}</span>
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <Badge 
                      variant="secondary" 
                      className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}
                    >
                      {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {kpi.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList>
            <TabsTrigger value="funnel">漏斗分析</TabsTrigger>
            <TabsTrigger value="trend">趋势分析</TabsTrigger>
            <TabsTrigger value="events">事件分布</TabsTrigger>
          </TabsList>

          {/* Funnel Analysis */}
          <TabsContent value="funnel" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Funnel Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>转化漏斗</CardTitle>
                  <CardDescription>用户从搜索到支付的完整路径</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={funnelData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip 
                          formatter={(value: number) => [value.toLocaleString(), '用户数']}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>环节转化率</CardTitle>
                  <CardDescription>各环节的转化与流失情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversionRates.map((stage, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{stage.name}</span>
                          <span className="text-sm text-slate-600">
                            {stage.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${(stage.value / funnelData[0].value) * 100}%`,
                                backgroundColor: stage.fill 
                              }}
                            />
                          </div>
                          {index > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-green-600">{stage.rate}%</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-red-500">-{stage.dropoff}%</span>
                            </div>
                          )}
                        </div>
                        {index < conversionRates.length - 1 && (
                          <div className="flex justify-center my-2">
                            <ArrowRight className="h-4 w-4 text-slate-300 rotate-90" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>关键洞察</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">最大流失环节</h4>
                    <p className="text-sm text-yellow-700">
                      搜索结果 → 详情页 流失率 35.4%
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      建议优化搜索结果卡片展示
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">转化最佳环节</h4>
                    <p className="text-sm text-green-700">
                      提交订单 → 支付成功 转化率 75.8%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      支付流程体验良好
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">AI 功能影响</h4>
                    <p className="text-sm text-blue-700">
                      政策摘要展开率 42.3%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      用户对 AI 功能有较高兴趣
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trend Analysis */}
          <TabsContent value="trend" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>访问量与订单趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="visits" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.2}
                          name="访问量"
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.2}
                          name="订单数"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>转化率趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[6, 9]} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '转化率']} />
                        <Line 
                          type="monotone" 
                          dataKey="cvr" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Event Distribution */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>事件分布</CardTitle>
                  <CardDescription>各类事件占比</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {eventDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>事件详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventDistribution.map((event, index) => (
                      <div key={event.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-mono">{event.name}</span>
                        </div>
                        <Badge variant="secondary">{event.value}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
