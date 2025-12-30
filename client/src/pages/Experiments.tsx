import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  FlaskConical, Plus, Play, Pause, CheckCircle, AlertTriangle, 
  TrendingUp, TrendingDown, Users, Target, Calculator, BarChart3
} from 'lucide-react';
import Header from '@/components/Header';

export default function Experiments() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    hypothesis: '',
    primaryMetric: 'pay_cvr',
    mdePercent: '1.5',
    confidenceLevel: '95',
  });

  const { data: experiments, refetch } = trpc.experiments.getAll.useQuery();
  
  const createMutation = trpc.experiments.create.useMutation({
    onSuccess: () => {
      toast.success('实验创建成功');
      setIsCreateOpen(false);
      refetch();
    },
    onError: () => {
      toast.error('创建失败');
    },
  });

  const updateStatusMutation = trpc.experiments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('状态更新成功');
      refetch();
    },
  });

  const handleCreateExperiment = () => {
    createMutation.mutate({
      name: newExperiment.name,
      description: newExperiment.description,
      hypothesis: newExperiment.hypothesis,
      primaryMetric: newExperiment.primaryMetric,
      mdePercent: newExperiment.mdePercent,
      confidenceLevel: newExperiment.confidenceLevel,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-100 text-green-800">运行中</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">已暂停</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">已完成</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Sample size calculator
  const calculateSampleSize = (mde: number, confidence: number, power: number = 0.8) => {
    // Simplified sample size calculation for two-sample proportion test
    // Using approximation: n = 2 * (Z_α/2 + Z_β)² * p(1-p) / MDE²
    const zAlpha = confidence === 95 ? 1.96 : confidence === 99 ? 2.576 : 1.645;
    const zBeta = power === 0.8 ? 0.84 : 1.28;
    const p = 0.07; // baseline conversion rate
    const n = Math.ceil(2 * Math.pow(zAlpha + zBeta, 2) * p * (1 - p) / Math.pow(mde / 100, 2));
    return n;
  };

  // Mock experiment results for demo
  const mockResults = {
    control: { users: 5234, conversions: 367, rate: 7.01 },
    treatment: { users: 5189, conversions: 402, rate: 7.75 },
    lift: 10.56,
    pValue: 0.032,
    confidence: 96.8,
    srm: { chi2: 0.19, pValue: 0.66, passed: true },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">A/B 实验管理</h1>
            <p className="text-slate-600">设计、运行和分析实验</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建实验
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>创建新实验</DialogTitle>
                <DialogDescription>
                  设计一个新的 A/B 测试实验
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>实验名称</Label>
                  <Input
                    placeholder="例如：AI 政策摘要优化"
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>实验假设</Label>
                  <Textarea
                    placeholder="例如：展示 AI 政策摘要将提升详情页到预订的转化率"
                    value={newExperiment.hypothesis}
                    onChange={(e) => setNewExperiment({ ...newExperiment, hypothesis: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>实验描述</Label>
                  <Textarea
                    placeholder="详细描述实验内容和预期效果"
                    value={newExperiment.description}
                    onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>主要指标</Label>
                    <Select 
                      value={newExperiment.primaryMetric}
                      onValueChange={(v) => setNewExperiment({ ...newExperiment, primaryMetric: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pay_cvr">支付转化率</SelectItem>
                        <SelectItem value="order_cvr">下单转化率</SelectItem>
                        <SelectItem value="detail_ctr">详情页点击率</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>MDE (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newExperiment.mdePercent}
                      onChange={(e) => setNewExperiment({ ...newExperiment, mdePercent: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>置信度 (%)</Label>
                    <Select 
                      value={newExperiment.confidenceLevel}
                      onValueChange={(v) => setNewExperiment({ ...newExperiment, confidenceLevel: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Sample Size Preview */}
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-slate-600" />
                      <span className="font-medium">样本量估算</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      基于 MDE={newExperiment.mdePercent}%，置信度={newExperiment.confidenceLevel}%，
                      每组需要约 <span className="font-bold text-blue-600">
                        {calculateSampleSize(
                          parseFloat(newExperiment.mdePercent),
                          parseInt(newExperiment.confidenceLevel)
                        ).toLocaleString()}
                      </span> 个样本
                    </p>
                  </CardContent>
                </Card>

                <Button onClick={handleCreateExperiment} className="w-full">
                  创建实验
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">实验列表</TabsTrigger>
            <TabsTrigger value="results">结果分析</TabsTrigger>
            <TabsTrigger value="calculator">样本计算器</TabsTrigger>
          </TabsList>

          {/* Experiment List */}
          <TabsContent value="list" className="space-y-4 mt-6">
            {/* Demo Experiment */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FlaskConical className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI 政策摘要优化实验</CardTitle>
                      <CardDescription>exp_ai_policy_v1</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">运行中</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">实验假设</p>
                    <p className="text-sm text-slate-600">
                      在酒店详情页展示 AI 智能政策摘要（退改/税费/证件三卡片），
                      将减少用户决策时间，提升详情页到预订的转化率 1.5%+
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">50%</p>
                      <p className="text-xs text-slate-500">流量分配</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">10,423</p>
                      <p className="text-xs text-slate-500">总样本</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">+10.6%</p>
                      <p className="text-xs text-slate-500">相对提升</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">96.8%</p>
                      <p className="text-xs text-slate-500">置信度</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      暂停
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Experiments */}
            {experiments?.map((exp) => (
              <Card key={exp.experimentId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FlaskConical className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{exp.name}</CardTitle>
                        <CardDescription>{exp.experimentId}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(exp.status || 'draft')}
                  </div>
                </CardHeader>
                <CardContent>
                  {exp.hypothesis && (
                    <p className="text-sm text-slate-600 mb-4">{exp.hypothesis}</p>
                  )}
                  <div className="flex gap-2">
                    {(exp.status === 'draft' || !exp.status) && (
                      <Button 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ 
                          experimentId: exp.experimentId, 
                          status: 'running' 
                        })}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        启动
                      </Button>
                    )}
                    {(exp.status === 'running') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ 
                          experimentId: exp.experimentId, 
                          status: 'paused' 
                        })}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        暂停
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!experiments || experiments.length === 0) && (
              <Card className="p-8 text-center">
                <FlaskConical className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">暂无实验，点击上方按钮创建</p>
              </Card>
            )}
          </TabsContent>

          {/* Results Analysis */}
          <TabsContent value="results" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI 政策摘要实验结果</CardTitle>
                <CardDescription>exp_ai_policy_v1 · 运行 7 天</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variant Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">对照组 (Control)</span>
                        <Badge variant="secondary">原始版本</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">用户数</span>
                          <span>{mockResults.control.users.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">转化数</span>
                          <span>{mockResults.control.conversions}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>转化率</span>
                          <span>{mockResults.control.rate}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">实验组 (Treatment)</span>
                        <Badge className="bg-blue-100 text-blue-800">AI 摘要</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">用户数</span>
                          <span>{mockResults.treatment.users.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">转化数</span>
                          <span>{mockResults.treatment.conversions}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>转化率</span>
                          <span className="text-blue-600">{mockResults.treatment.rate}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Statistical Results */}
                <div>
                  <h4 className="font-medium mb-4">统计分析</h4>
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold text-green-600">+{mockResults.lift}%</p>
                        <p className="text-xs text-slate-500">相对提升</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Target className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold">{mockResults.pValue}</p>
                        <p className="text-xs text-slate-500">P-Value</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold">{mockResults.confidence}%</p>
                        <p className="text-xs text-slate-500">置信度</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className={`p-4 text-center ${mockResults.srm.passed ? '' : 'bg-red-50'}`}>
                        {mockResults.srm.passed ? (
                          <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 mx-auto text-red-600 mb-2" />
                        )}
                        <p className="text-2xl font-bold">
                          {mockResults.srm.passed ? 'Pass' : 'Fail'}
                        </p>
                        <p className="text-xs text-slate-500">SRM 检验</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Confidence Interval */}
                <div>
                  <h4 className="font-medium mb-3">置信区间</h4>
                  <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 bg-green-200"
                      style={{ left: '35%', right: '15%' }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-green-600"
                      style={{ left: '52%' }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                      style={{ left: '30%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>-5%</span>
                    <span>0%</span>
                    <span>+5%</span>
                    <span>+10%</span>
                    <span>+15%</span>
                    <span>+20%</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    95% CI: [+3.2%, +17.9%] · 点估计: +10.6%
                  </p>
                </div>

                {/* Recommendation */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">建议：全量发布</p>
                        <p className="text-sm text-green-700 mt-1">
                          实验组转化率显著优于对照组 (p=0.032 &lt; 0.05)，
                          置信区间不包含 0，SRM 检验通过。建议将 AI 政策摘要功能全量上线。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sample Size Calculator */}
          <TabsContent value="calculator" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>样本量计算器</CardTitle>
                <CardDescription>
                  基于统计功效分析计算所需样本量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label>基线转化率 (%)</Label>
                      <Input type="number" defaultValue="7" step="0.1" />
                    </div>
                    <div>
                      <Label>最小可检测提升 MDE (%)</Label>
                      <Input type="number" defaultValue="1.5" step="0.1" />
                    </div>
                    <div>
                      <Label>显著性水平 (α)</Label>
                      <Select defaultValue="0.05">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.01">0.01 (99% 置信度)</SelectItem>
                          <SelectItem value="0.05">0.05 (95% 置信度)</SelectItem>
                          <SelectItem value="0.1">0.10 (90% 置信度)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>统计功效 (1-β)</Label>
                      <Select defaultValue="0.8">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.8">80%</SelectItem>
                          <SelectItem value="0.9">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="bg-blue-50">
                    <CardContent className="p-6">
                      <h4 className="font-medium mb-4">计算结果</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-600">每组所需样本量</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {calculateSampleSize(1.5, 95).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">总样本量</p>
                          <p className="text-2xl font-bold">
                            {(calculateSampleSize(1.5, 95) * 2).toLocaleString()}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm text-slate-600">预估实验时长</p>
                          <p className="text-lg font-medium">
                            约 {Math.ceil(calculateSampleSize(1.5, 95) * 2 / 1500)} 天
                          </p>
                          <p className="text-xs text-slate-500">
                            (基于日均 1,500 UV)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
