import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, GitBranch, Target, BarChart3, FlaskConical, 
  CheckCircle, Clock, AlertCircle, ArrowRight, Layers
} from 'lucide-react';
import Header from '@/components/Header';

// Event tracking dictionary
const trackingEvents = [
  { name: 'search_page_view', description: '搜索页曝光', category: 'page_view', attributes: ['session_id', 'variant_id'] },
  { name: 'search_submit', description: '搜索提交', category: 'action', attributes: ['destination', 'check_in', 'check_out', 'guests', 'price_mode'] },
  { name: 'search_result_click', description: '搜索结果点击', category: 'action', attributes: ['hotel_id', 'position', 'price', 'variant_id'] },
  { name: 'hotel_detail_view', description: '酒店详情页曝光', category: 'page_view', attributes: ['hotel_id', 'session_id', 'variant_id'] },
  { name: 'policy_digest_expand', description: 'AI政策摘要展开', category: 'ai_interact', attributes: ['hotel_id', 'digest_type', 'confidence_bucket'] },
  { name: 'policy_evidence_click', description: '政策证据点击', category: 'ai_interact', attributes: ['hotel_id', 'evidence_type', 'section'] },
  { name: 'room_select', description: '房型选择', category: 'action', attributes: ['hotel_id', 'room_id', 'price', 'variant_id'] },
  { name: 'booking_page_view', description: '预订页曝光', category: 'page_view', attributes: ['hotel_id', 'room_id', 'session_id'] },
  { name: 'booking_form_interact', description: '预订表单交互', category: 'action', attributes: ['hotel_id', 'first_field'] },
  { name: 'booking_submit', description: '预订提交', category: 'action', attributes: ['hotel_id', 'room_id', 'guest_country', 'variant_id'] },
  { name: 'pay_initiated', description: '支付发起', category: 'action', attributes: ['hotel_id', 'payment_method'] },
  { name: 'pay_success', description: '支付成功', category: 'conversion', attributes: ['order_number', 'total_price', 'variant_id'] },
  { name: 'pay_failed', description: '支付失败', category: 'error', attributes: ['error_code', 'error_message'] },
  { name: 'price_mode_toggle', description: '价格模式切换', category: 'action', attributes: ['from_mode', 'to_mode', 'page'] },
  { name: 'ai_latency_record', description: 'AI响应时间记录', category: 'performance', attributes: ['latency_ms', 'confidence_bucket', 'fallback_used'] },
];

// KPI tree structure
const kpiTree = {
  north_star: {
    name: '支付转化率 (Pay CVR)',
    formula: '支付成功数 / 搜索页UV',
    target: '7.5%',
  },
  level1: [
    {
      name: '搜索→详情转化率',
      formula: '详情页UV / 搜索页UV',
      target: '42%',
      children: [
        { name: '搜索结果CTR', target: '65%' },
        { name: '列表页停留时长', target: '>30s' },
      ],
    },
    {
      name: '详情→预订转化率',
      formula: '预订页UV / 详情页UV',
      target: '43%',
      children: [
        { name: 'AI摘要展开率', target: '40%' },
        { name: '房型选择率', target: '55%' },
      ],
    },
    {
      name: '预订→支付转化率',
      formula: '支付成功数 / 预订页UV',
      target: '42%',
      children: [
        { name: '表单完成率', target: '85%' },
        { name: '支付成功率', target: '95%' },
      ],
    },
  ],
};

// Roadmap items
const roadmapItems = [
  { phase: 'Phase 1', title: 'MVP 核心链路', status: 'completed', items: ['搜索功能', '列表页', '详情页', '预订流程'] },
  { phase: 'Phase 2', title: 'AI 功能集成', status: 'completed', items: ['政策智能摘要', '证据引用', '降级策略'] },
  { phase: 'Phase 3', title: '数据体系', status: 'completed', items: ['埋点系统', '漏斗看板', 'A/B测试框架'] },
  { phase: 'Phase 4', title: '高级分析', status: 'in_progress', items: ['队列分析', '归因模型', '预测模型'] },
];

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('prd');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">产品文档中心</h1>
          <p className="text-slate-600">PRD、埋点字典、指标体系与项目路线图</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="prd">
              <FileText className="h-4 w-4 mr-2" />
              PRD 文档
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <GitBranch className="h-4 w-4 mr-2" />
              埋点字典
            </TabsTrigger>
            <TabsTrigger value="kpi">
              <Target className="h-4 w-4 mr-2" />
              KPI 指标树
            </TabsTrigger>
            <TabsTrigger value="roadmap">
              <Layers className="h-4 w-4 mr-2" />
              项目路线图
            </TabsTrigger>
          </TabsList>

          {/* PRD Document */}
          <TabsContent value="prd">
            <Card>
              <CardHeader>
                <CardTitle>国际酒店预订全链路漏斗优化 PRD</CardTitle>
                <CardDescription>v1.0 · 最后更新: 2024-12-30</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-8">
                    {/* Background */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">1. 项目背景</h3>
                      <p className="text-slate-600 leading-relaxed">
                        国际酒店预订场景存在以下核心痛点：
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                        <li>税费不透明：境外酒店普遍存在"净价"展示，用户到支付时才发现总价远超预期</li>
                        <li>政策难理解：退改政策通常为2000+字英文长文，用户难以快速获取关键信息</li>
                        <li>决策成本高：缺乏结构化信息导致用户在详情页流失严重</li>
                      </ul>
                    </section>

                    <Separator />

                    {/* Goals */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">2. 项目目标</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Card className="bg-blue-50">
                          <CardContent className="p-4">
                            <p className="font-medium text-blue-800">核心目标</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">+1.5%</p>
                            <p className="text-sm text-blue-700">支付转化率提升</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50">
                          <CardContent className="p-4">
                            <p className="font-medium text-green-800">体验目标</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">-30%</p>
                            <p className="text-sm text-green-700">详情页跳出率降低</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50">
                          <CardContent className="p-4">
                            <p className="font-medium text-purple-800">效率目标</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">&lt;2s</p>
                            <p className="text-sm text-purple-700">AI响应时间P95</p>
                          </CardContent>
                        </Card>
                      </div>
                    </section>

                    <Separator />

                    {/* Core Features */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">3. 核心功能</h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">3.1 全价模式切换</h4>
                          <p className="text-sm text-slate-600 mb-2">
                            在搜索和列表页提供"全价/净价"切换开关，让用户选择价格展示方式。
                          </p>
                          <div className="flex gap-2">
                            <Badge>搜索页</Badge>
                            <Badge>列表页</Badge>
                            <Badge variant="outline">默认: 全价</Badge>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">3.2 AI 政策智能摘要</h4>
                          <p className="text-sm text-slate-600 mb-2">
                            使用 LLM 将2000+字政策文本压缩为3张结构化卡片：
                          </p>
                          <div className="grid md:grid-cols-3 gap-2 mt-3">
                            <Card className="bg-slate-50">
                              <CardContent className="p-3">
                                <p className="font-medium text-sm">退改政策</p>
                                <p className="text-xs text-slate-500">免费取消截止日期、退款比例</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-slate-50">
                              <CardContent className="p-3">
                                <p className="font-medium text-sm">税费估算</p>
                                <p className="text-xs text-slate-500">税费类型、金额、支付时机</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-slate-50">
                              <CardContent className="p-3">
                                <p className="font-medium text-sm">证件要求</p>
                                <p className="text-xs text-slate-500">所需证件、押金要求</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">3.3 价格透明拆解</h4>
                          <p className="text-sm text-slate-600">
                            在详情页和预订页清晰展示价格构成：Base Price + Tax + Service Fee = Total
                          </p>
                        </div>
                      </div>
                    </section>

                    <Separator />

                    {/* Exception Handling */}
                    <section>
                      <h3 className="text-lg font-semibold mb-3">4. 异常流程处理</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">AI 接口超时</p>
                            <p className="text-sm text-yellow-700">
                              降级策略：使用规则模板生成基础摘要，标记为"基础版"
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">低置信度结果</p>
                            <p className="text-sm text-yellow-700">
                              当 AI 置信度 &lt; 0.7 时，显示"仅供参考"提示，并提供原文链接
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Dictionary */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>埋点事件字典</CardTitle>
                <CardDescription>共 {trackingEvents.length} 个核心事件</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingEvents.map((event) => (
                    <div 
                      key={event.name}
                      className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {event.name}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              {event.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.attributes.map((attr) => (
                          <Badge key={attr} variant="secondary" className="text-xs">
                            {attr}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI Tree */}
          <TabsContent value="kpi">
            <Card>
              <CardHeader>
                <CardTitle>KPI 指标树</CardTitle>
                <CardDescription>北极星指标与分解</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* North Star */}
                  <div className="text-center">
                    <Card className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <CardContent className="p-6">
                        <Target className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-bold text-lg">{kpiTree.north_star.name}</p>
                        <p className="text-sm opacity-90">{kpiTree.north_star.formula}</p>
                        <p className="text-2xl font-bold mt-2">目标: {kpiTree.north_star.target}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Level 1 Metrics */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {kpiTree.level1.map((metric, index) => (
                      <div key={index}>
                        <Card className="bg-slate-50">
                          <CardContent className="p-4">
                            <p className="font-medium">{metric.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{metric.formula}</p>
                            <p className="text-lg font-bold text-blue-600 mt-2">
                              目标: {metric.target}
                            </p>
                          </CardContent>
                        </Card>
                        <div className="flex justify-center my-2">
                          <ArrowRight className="h-4 w-4 text-slate-300 rotate-90" />
                        </div>
                        <div className="space-y-2">
                          {metric.children.map((child, childIndex) => (
                            <Card key={childIndex} className="bg-white">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">{child.name}</span>
                                  <Badge variant="outline">{child.target}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roadmap */}
          <TabsContent value="roadmap">
            <Card>
              <CardHeader>
                <CardTitle>项目路线图</CardTitle>
                <CardDescription>从 MVP 到完整产品的迭代计划</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {roadmapItems.map((phase, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          phase.status === 'completed' 
                            ? 'bg-green-100 text-green-600'
                            : phase.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {phase.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : phase.status === 'in_progress' ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        {index < roadmapItems.length - 1 && (
                          <div className={`w-0.5 h-full mt-2 ${
                            phase.status === 'completed' ? 'bg-green-200' : 'bg-slate-200'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            phase.status === 'completed' ? 'default' :
                            phase.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {phase.phase}
                          </Badge>
                          <h4 className="font-medium">{phase.title}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {phase.items.map((item, itemIndex) => (
                            <Badge 
                              key={itemIndex} 
                              variant="outline"
                              className={phase.status === 'completed' ? 'line-through text-slate-400' : ''}
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
