import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Video, Play, CheckCircle2, Loader2, Sparkles, User, Settings2, ChevronRight, FileText, LayoutTemplate, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock data for presets
const PRESET_MODELS = [
  { id: 'm1', name: 'Emma (Casual)', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { id: 'm2', name: 'James (Street)', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80' },
  { id: 'm3', name: 'Sophia (Elegant)', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80' },
];

const SCRIPTS = [
  { 
    id: 's1', 
    name: '电商主页头图 (都市极简)', 
    desc: '10-15秒高频剪辑与多角度切换，快速建立廓形与质感认知。',
    shots: [
      '01 全景: 模特全套Look走向镜头 (推镜头 2s)',
      '02 中景: 侧身45°展示层次感 (固定 1.5s)',
      '03 背景: 背对镜头微微回头 (拉镜头 1.5s)',
      '04 特写: 领口/胸前展现质感 (平移 1s)',
      '05 特写: 腰部/下摆体现比例 (快速切镜 1s)',
      '06 特写: 鞋裤/配饰点缀 (俯拍 1s)',
      '07 全景: 转身行走自然褶皱 (环绕 2s)',
      '08 中近景: 自信微笑预留文案位 (定格 2s)'
    ],
    context: {
      scene: '纯色无影墙或极简建筑风（水泥灰/暖白）',
      lighting: '采用侧逆光来勾勒服装的轮廓线，特写使用柔光纸',
      props: '极简几何道具或无道具',
      post: '还原真实色彩，增加一点胶片锐度或对比度',
      director: '动作匹配转场要流畅，后期剪辑严格踩在120BPM的BGM重拍上。'
    }
  },
  { 
    id: 's2', 
    name: '影调故事风 (穿过时间的褶皱)', 
    desc: '胶片颗粒感、暖调光影、柔焦美学，赋予服装情绪价值与电影感。',
    shots: [
      '01 远景: 逆光草地/复古建筑，衣摆飘动 (缓缓推入 3s)',
      '02 中景: 侧头斜后方，阳光勾勒轮廓 (固定 2s)',
      '03 特写: 领口/袖口，虚焦到清晰 (呼吸式平移 2s)',
      '04 全景: 背对漫步，轻微转头 (跟随拍摄 2.5s)',
      '05 中特写: 整理衣襟/拉链，动作慢 (快速切镜 2s)',
      '06 特写: 阳光穿过缝隙产生光晕 (晃动模拟 1.5s)',
      '07 全景: 自然光影下站定，舒缓表情 (极慢缩放 3s)'
    ],
    context: {
      scene: '野外荒原地 (同色系) 或 复古欧式室内 (斑驳光影)',
      lighting: '黄金时刻 (下午4-6点) 侧逆光，明暗交替',
      props: '复古道具 (枯花/书/胶片机) + 微风',
      post: '低饱和暖影，动态胶片噪点',
      director: '追求“呼吸感”，允许对焦延迟与过曝，分享一个关于“穿这件衣服的午后”的故事。'
    }
  },
  { 
    id: 's3', 
    name: '常规电商展示 (ACNC 牛仔裤)', 
    desc: '标准电商主图视频，包含模特走位、细节特写与卖点划线标注，结尾品牌露出。',
    shots: [
      '01 全景: 模特从画外走入画面中心，单手插兜，保持放松姿势 (固定镜头 3s)',
      '02 特写: 镜头切至下装，画面静止，出现三条引线标注卖点：“100%棉”、“裤裆提高”、“微喇裤脚” (细节特写 3s)',
      '03 全景: 镜头拉回全身，模特原地放松后转身，展示服装背后效果 (拉镜头 4s)',
      '04 远景: 模特向画面深处走去，背景逐渐景深模糊，浮现品牌名 ACNC (推移柔焦 3s)'
    ],
    context: {
      scene: '干净明亮的电商无影棚或极简纯色背景',
      lighting: '均匀的棚拍平光，保证裤型和面料细节清晰可见',
      props: '无多余道具，后期需加入卖点划线UI动画',
      post: '高清晰度，色彩还原准确，结尾加入景深模糊与 ACNC Logo 动效',
      director: '动作要自然利落，特写时的卖点划线要与裤子实际部位精准对齐。'
    }
  },
];

type GeneratedStoryboard = {
  title: string;
  modelName: string;
  environment: {
    scene: string;
    lighting: string;
    props: string;
  };
  directorNote: string;
  shots: string[];
};

export default function App() {
  const [images, setImages] = useState({ front: null, back: null, side: null });
  const [selectedModel, setSelectedModel] = useState(PRESET_MODELS[0].id);
  const [customModelImg, setCustomModelImg] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState(SCRIPTS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [storyboard, setStoryboard] = useState<GeneratedStoryboard | null>(null);

  const handleImageUpload = (angle: 'front' | 'back' | 'side', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImages(prev => ({ ...prev, [angle]: url }));
    }
  };

  const handleCustomModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomModelImg(url);
      setSelectedModel('custom');
    }
  };

  const handleGenerate = () => {
    if (!images.front && !images.back && !images.side) {
      alert("请至少上传一张产品角度图片 (正面、背面或侧面)。");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setStoryboard(null);

    // Simulate AI generation process for the storyboard
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          
          // Generate mock storyboard based on selections
          const scriptDef = SCRIPTS.find(s => s.id === selectedScript)!;
          const modelName = selectedModel === 'custom' ? '自定义模特' : PRESET_MODELS.find(m => m.id === selectedModel)?.name || '模特';
          
          setStoryboard({
            title: scriptDef.name,
            modelName: modelName,
            environment: {
              scene: scriptDef.context?.scene || '默认影棚',
              lighting: scriptDef.context?.lighting || '均匀平光',
              props: scriptDef.context?.props || '无',
            },
            directorNote: scriptDef.context?.director || '按标准流程拍摄',
            shots: scriptDef.shots
          });
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  };

  const reset = () => {
    setImages({ front: null, back: null, side: null });
    setStoryboard(null);
    setGenerationProgress(0);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      
      {/* Decorative background blur elements */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-6xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/30 flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-teal-500 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              Lumina Storyboard Gen
            </h1>
            <p className="text-gray-500 mt-1 font-medium">AI 驱动的服装场景与分镜脚本设计</p>
          </div>
          <div className="glass-pill px-4 py-2 flex items-center gap-2 text-sm font-medium text-purple-700">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            System Ready
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Step 1: Product Images */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-sm">1</div>
                <h2 className="text-xl font-semibold text-gray-800">产品图解析</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">上传服装图片，AI将提取材质、廓形与细节特征。</p>
              
              <div className="grid grid-cols-3 gap-4">
                {(['front', 'back', 'side'] as const).map((angle) => (
                  <div key={angle} className="relative group">
                    <input 
                      type="file" 
                      id={`upload-${angle}`} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(angle, e)}
                    />
                    <label 
                      htmlFor={`upload-${angle}`}
                      className={`glass-panel-inner aspect-[3/4] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${images[angle] ? 'border-purple-300' : 'hover:border-purple-400/50 hover:bg-white/50'}`}
                    >
                      {images[angle] ? (
                        <img src={images[angle]} alt={angle} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center mb-2 shadow-sm text-gray-400 group-hover:text-purple-500 transition-colors">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-gray-600 capitalize">{angle === 'front' ? '正面' : angle === 'back' ? '背面' : '侧面'}</span>
                        </>
                      )}
                    </label>
                    {images[angle] && (
                      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-teal-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Step 2: Model Selection */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold shadow-sm">2</div>
                <h2 className="text-xl font-semibold text-gray-800">模特设定</h2>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2">
                {PRESET_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`relative flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ${selectedModel === m.id ? 'transform scale-105' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <div className={`w-16 h-16 rounded-full p-1 ${selectedModel === m.id ? 'bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg' : 'bg-transparent'}`}>
                      <img src={m.img} alt={m.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
                    </div>
                    <span className={`text-[10px] font-medium ${selectedModel === m.id ? 'text-gray-900' : 'text-gray-500'}`}>{m.name}</span>
                  </button>
                ))}
                
                <input 
                  type="file" 
                  id="upload-custom-model" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleCustomModelUpload}
                />
                <label 
                  htmlFor="upload-custom-model"
                  className={`relative flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${selectedModel === 'custom' ? 'transform scale-105' : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 ${selectedModel === 'custom' ? 'border-transparent bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg p-1' : 'border-dashed border-gray-300 bg-white/30 text-gray-400'}`}>
                    {customModelImg ? (
                      <img src={customModelImg} alt="Custom" className="w-full h-full rounded-full object-cover border-2 border-white" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${selectedModel === 'custom' ? 'text-gray-900' : 'text-gray-500'}`}>自定义</span>
                </label>
              </div>
            </section>

            {/* Step 3: Script & Style */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold shadow-sm">3</div>
                <h2 className="text-xl font-semibold text-gray-800">视觉风格基调</h2>
              </div>
              
              <div className="space-y-3">
                {SCRIPTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScript(s.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex flex-col gap-2 ${
                      selectedScript === s.id 
                        ? 'bg-white/60 border-2 border-purple-400 shadow-[0_4px_15px_rgba(168,85,247,0.15)]' 
                        : 'glass-panel-inner hover:bg-white/50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <h3 className={`font-semibold ${selectedScript === s.id ? 'text-purple-700' : 'text-gray-700'}`}>{s.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 ${selectedScript === s.id ? 'border-purple-500' : 'border-gray-300'}`}>
                        {selectedScript === s.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Preview & Action */}
          <div className="lg:col-span-7 flex flex-col h-full">
            
            <div className="glass-panel-inner flex-grow rounded-[2rem] p-4 md:p-6 flex flex-col relative overflow-hidden min-h-[500px]">
              {/* Decorative gradient inside preview area */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 to-teal-100/40 -z-10"></div>

              <AnimatePresence mode="wait">
                {!isGenerating && !storyboard ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                      <LayoutTemplate className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">等待生成分镜脚本</h3>
                    <p className="text-sm text-gray-500 max-w-[280px]">
                      完成左侧配置后，AI 将为您量身定制包含背景环境、光影设计与详细运镜的专业拍摄脚本。
                    </p>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div 
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center p-8"
                  >
                    <div className="relative w-32 h-32 mb-8">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          className="text-gray-200 stroke-current" 
                          strokeWidth="4" 
                          cx="50" cy="50" r="40" 
                          fill="transparent"
                        ></circle>
                        <circle 
                          className="text-purple-500 progress-ring__circle stroke-current" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          strokeDasharray="251.2" 
                          strokeDashoffset={251.2 - (251.2 * generationProgress) / 100}
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          transform="rotate(-90 50 50)"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-bold text-purple-600">{generationProgress}%</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 animate-pulse">正在构思场景与脚本...</h3>
                    <div className="space-y-2 w-full max-w-[220px]">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-teal-500" /> 分析服装材质与廓形
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {generationProgress > 30 ? <CheckCircle2 className="w-3 h-3 text-teal-500" /> : <Loader2 className="w-3 h-3 animate-spin" />} 
                        匹配模特气质与场景
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {generationProgress > 70 ? <CheckCircle2 className="w-3 h-3 text-teal-500" /> : <Loader2 className="w-3 h-3 animate-spin" />} 
                        生成运镜与导演指令
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-grow flex flex-col h-full overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        定制分镜脚本
                      </h3>
                      <button className="text-sm font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-full transition-colors">
                        <Download className="w-4 h-4" /> 导出 PDF
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-4">
                      
                      {/* Environment & Context Design */}
                      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 to-teal-400"></div>
                        <h4 className="text-sm font-bold text-purple-800 mb-3 uppercase tracking-wider">背景与环境设计 (Context Design)</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[11px] text-gray-500 font-medium">场景设定 (Scene)</span>
                            <p className="text-sm text-gray-800 font-medium">{storyboard?.environment.scene}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] text-gray-500 font-medium">光影运用 (Lighting)</span>
                            <p className="text-sm text-gray-800 font-medium">{storyboard?.environment.lighting}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] text-gray-500 font-medium">道具辅助 (Props)</span>
                            <p className="text-sm text-gray-800 font-medium">{storyboard?.environment.props}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] text-gray-500 font-medium">出镜模特 (Model)</span>
                            <p className="text-sm text-gray-800 font-medium">{storyboard?.modelName}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                          <span className="text-[11px] text-gray-500 font-medium block mb-1">导演指令 (Director's Note)</span>
                          <p className="text-sm text-purple-700 italic font-medium leading-relaxed">
                            "{storyboard?.directorNote}"
                          </p>
                        </div>
                      </div>

                      {/* Shot List */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <Video className="w-4 h-4 text-teal-600" />
                          分镜详情表 (Shot List)
                        </h4>
                        <div className="space-y-3">
                          {storyboard?.shots.map((shot, idx) => {
                            // Simple parsing to make it look nice: "01 全景: 动作 (运镜 时间)"
                            const match = shot.match(/^(\d+)\s([^:]+):\s([^(]+)\s\(([^)]+)\)$/);
                            
                            if (match) {
                              const [_, num, type, action, camera] = match;
                              return (
                                <div key={idx} className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm flex gap-4 hover:bg-white/60 transition-colors">
                                  <div className="flex flex-col items-center justify-center bg-purple-100 text-purple-700 rounded-lg w-12 h-12 flex-shrink-0 font-bold">
                                    {num}
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{type}</span>
                                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                        <Video className="w-3 h-3" /> {camera}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-800 mt-1.5">{action}</p>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Fallback if regex doesn't match perfectly
                            return (
                              <div key={idx} className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-sm flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                                <p className="text-sm text-gray-700">{shot}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generate Button */}
            <div className="mt-6 flex gap-4">
              {storyboard && (
                <button 
                  onClick={reset}
                  className="px-6 py-4 rounded-full font-medium text-gray-600 bg-white/50 hover:bg-white/80 border border-white/60 transition-colors shadow-sm"
                >
                  重新配置
                </button>
              )}
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex-grow py-4 text-lg flex items-center justify-center gap-2 ${
                  isGenerating 
                    ? 'bg-gray-200 text-gray-400 rounded-full cursor-not-allowed' 
                    : 'liquid-btn-purple'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    正在生成脚本...
                  </>
                ) : storyboard ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    重新生成脚本
                  </>
                ) : (
                  <>
                    <LayoutTemplate className="w-5 h-5" />
                    生成分镜脚本
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
      
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}} />
    </div>
  );
}
