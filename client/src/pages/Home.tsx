import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, BarChart3, FlaskConical, FileText, 
  ArrowRight, Sparkles, Globe, Shield, TrendingUp,
  Hotel, CreditCard, Users, Target
} from 'lucide-react';
import Header from '@/components/Header';

export default function Home() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: Search,
      title: '酒店搜索与列表',
      description: '支持目的地、日期选择，全价/净价模式切换',
      link: '/search',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Sparkles,
      title: 'AI 政策助手',
      description: '智能压缩2000+字政策为3条结构化标签',
      link: '/hotels',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: BarChart3,
      title: '数据看板',
      description: '实时漏斗分析、转化率监控、关键指标追踪',
      link: '/dashboard',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: FlaskConical,
      title: 'A/B 实验',
      description: '完整实验框架：假设设计、样本计算、统计分析',
      link: '/experiments',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: FileText,
      title: '产品文档',
      description: 'PRD、埋点字典、KPI指标树、项目路线图',
      link: '/docs',
      color: 'bg-pink-100 text-pink-600',
    },
  ];

  const stats = [
    { label: '核心事件', value: '15+', icon: Target },
    { label: '漏斗环节', value: '6', icon: TrendingUp },
    { label: '实验维度', value: '3', icon: FlaskConical },
    { label: '文档页面', value: '4', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            产品经理作品集项目
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            国际酒店预订
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              全链路漏斗优化
            </span>
            <br />与 AI 赋能实验平台
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            基于 Trip.com 国际酒店业务场景，构建从搜索到支付的完整交易链路，
            集成 AI 智能政策摘要、全价透明展示、数据埋点体系与 A/B 实验框架
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate('/search')}
            >
              开始体验
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => navigate('/dashboard')}
            >
              查看数据看板
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="p-4">
                  <Icon className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16">
        <h2 className="text-2xl font-bold text-center mb-12">核心功能模块</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => navigate(feature.link)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {feature.title}
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Business Flow */}
      <section className="container py-16">
        <h2 className="text-2xl font-bold text-center mb-4">业务链路</h2>
        <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          完整的酒店预订转化漏斗，从搜索到支付的每个环节都有数据追踪
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-4xl mx-auto">
          {[
            { icon: Search, label: '搜索', desc: '目的地/日期' },
            { icon: Hotel, label: '列表', desc: '筛选/排序' },
            { icon: Sparkles, label: '详情', desc: 'AI政策摘要' },
            { icon: Users, label: '预订', desc: '填写信息' },
            { icon: CreditCard, label: '支付', desc: '完成交易' },
          ].map((step, index, arr) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-2">
                  <step.icon className="h-7 w-7 text-blue-600" />
                </div>
                <p className="font-medium text-sm">{step.label}</p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
              {index < arr.length - 1 && (
                <ArrowRight className="h-5 w-5 text-slate-300 mx-4" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Key Highlights */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <Globe className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">全价透明</h3>
              <p className="text-blue-100">
                解决境外酒店税费不透明痛点，支持全价/净价模式切换，
                清晰展示 Base Price + Tax + Fees
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <Sparkles className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">AI 赋能</h3>
              <p className="text-purple-100">
                LLM 智能压缩2000+字政策文本为结构化标签，
                支持证据引用、置信度展示、降级策略
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <Shield className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">数据驱动</h3>
              <p className="text-green-100">
                15+ 核心埋点事件，完整漏斗分析，
                严谨的 A/B 实验框架与统计分析
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <Card className="max-w-3xl mx-auto bg-slate-900 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">准备好开始了吗？</h2>
            <p className="text-slate-300 mb-6">
              体验完整的酒店预订流程，探索数据看板和实验系统
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/search')}
              >
                立即搜索酒店
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white hover:bg-white hover:text-slate-900"
                onClick={() => navigate('/docs')}
              >
                查看产品文档
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="text-center text-sm text-slate-500">
          <p>Hotel Funnel Lab - 国际酒店预订漏斗优化实验平台</p>
          <p className="mt-1">产品经理作品集项目 · 端到端负责：调研 → 设计 → 实验 → 数据复盘</p>
        </div>
      </footer>
    </div>
  );
}
