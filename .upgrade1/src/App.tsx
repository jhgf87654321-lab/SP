import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Video, Play, CheckCircle2, Loader2, Sparkles, User, Settings2, ChevronRight } from 'lucide-react';
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
    ]
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
    name: '淑女风质感慢放', 
    desc: '更多慢动作和平滑推拉，凸显优雅与高级感。',
    shots: []
  },
];

export default function App() {
  const [images, setImages] = useState({ front: null, back: null, side: null });
  const [selectedModel, setSelectedModel] = useState(PRESET_MODELS[0].id);
  const [customModelImg, setCustomModelImg] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState(SCRIPTS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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
    setVideoUrl(null);

    // Simulate generation process
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          // Mock video URL (using a placeholder video or gif)
          setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const reset = () => {
    setImages({ front: null, back: null, side: null });
    setVideoUrl(null);
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
        className="glass-panel w-full max-w-5xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/30 flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-teal-500 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              Lumina Video Gen
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Apparel AI Storyboard & Video Creation</p>
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
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Product Images */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-sm">1</div>
                <h2 className="text-xl font-semibold text-gray-800">Product Angles</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Upload high-quality images of the garment. We'll extract details for close-ups.</p>
              
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
                          <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center mb-2 shadow-sm text-gray-400 group-hover:text-purple-500 transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-600 capitalize">{angle}</span>
                        </>
                      )}
                    </label>
                    {images[angle] && (
                      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" />
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
                <h2 className="text-xl font-semibold text-gray-800">Select Model</h2>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2">
                {PRESET_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`relative flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ${selectedModel === m.id ? 'transform scale-105' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <div className={`w-20 h-20 rounded-full p-1 ${selectedModel === m.id ? 'bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg' : 'bg-transparent'}`}>
                      <img src={m.img} alt={m.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
                    </div>
                    <span className={`text-xs font-medium ${selectedModel === m.id ? 'text-gray-900' : 'text-gray-500'}`}>{m.name}</span>
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
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 ${selectedModel === 'custom' ? 'border-transparent bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg p-1' : 'border-dashed border-gray-300 bg-white/30 text-gray-400'}`}>
                    {customModelImg ? (
                      <img src={customModelImg} alt="Custom" className="w-full h-full rounded-full object-cover border-2 border-white" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${selectedModel === 'custom' ? 'text-gray-900' : 'text-gray-500'}`}>自定义模特</span>
                </label>
              </div>
            </section>

            {/* Step 3: Script & Style */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold shadow-sm">3</div>
                <h2 className="text-xl font-semibold text-gray-800">Storyboard Script</h2>
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
                        <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 ${selectedScript === s.id ? 'border-purple-500' : 'border-gray-300'}`}>
                        {selectedScript === s.id && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                      </div>
                    </div>
                    
                    {/* Expanded Script Details */}
                    {selectedScript === s.id && s.shots && s.shots.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-purple-200/50"
                      >
                        <p className="text-xs font-semibold text-purple-800 mb-2">分镜详情:</p>
                        <ul className={`space-y-1.5 ${'context' in s ? 'mb-3' : ''}`}>
                          {s.shots.map((shot, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span>{shot}</span>
                            </li>
                          ))}
                        </ul>
                        {'context' in s && s.context && (
                          <div className="bg-white/40 rounded-lg p-3 space-y-2 border border-white/50">
                            <p className="text-xs font-semibold text-teal-700 mb-1">场景与导演指令:</p>
                            <div className="text-[11px] text-gray-600 grid grid-cols-1 gap-1.5">
                              <p><span className="font-medium text-gray-700">场景:</span> {s.context.scene}</p>
                              <p><span className="font-medium text-gray-700">光影:</span> {s.context.lighting}</p>
                              <p><span className="font-medium text-gray-700">道具:</span> {s.context.props}</p>
                              <p><span className="font-medium text-gray-700">后期:</span> {s.context.post}</p>
                              <p className="mt-1.5 italic text-purple-700 border-l-2 border-purple-300 pl-2">"{s.context.director}"</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Preview & Action */}
          <div className="lg:col-span-5 flex flex-col h-full">
            
            <div className="glass-panel-inner flex-grow rounded-[2rem] p-2 flex flex-col relative overflow-hidden min-h-[400px]">
              {/* Decorative gradient inside preview area */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-teal-100/30 -z-10"></div>

              <AnimatePresence mode="wait">
                {!isGenerating && !videoUrl ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                      <Video className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Generate</h3>
                    <p className="text-sm text-gray-500 max-w-[250px]">
                      Complete the steps on the left to generate a professional product video.
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 animate-pulse">Synthesizing Video...</h3>
                    <div className="space-y-2 w-full max-w-[200px]">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-teal-500" /> Extracting details
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-teal-500" /> Applying model rigging
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {generationProgress > 50 ? <CheckCircle2 className="w-3 h-3 text-teal-500" /> : <Loader2 className="w-3 h-3 animate-spin" />} 
                        Rendering storyboard
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-grow flex flex-col"
                  >
                    <div className="relative flex-grow rounded-[1.5rem] overflow-hidden bg-black shadow-inner">
                      <video 
                        src={videoUrl!} 
                        className="w-full h-full object-cover"
                        autoPlay 
                        loop 
                        muted 
                        controls
                      />
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <button className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1">
                        <Settings2 className="w-4 h-4" /> Tweak Settings
                      </button>
                      <button 
                        onClick={reset}
                        className="liquid-btn-teal px-6 py-2 text-sm"
                      >
                        Create Another
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generate Button */}
            <div className="mt-6">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !!videoUrl}
                className={`w-full py-4 text-lg flex items-center justify-center gap-2 ${
                  isGenerating || videoUrl 
                    ? 'bg-gray-200 text-gray-400 rounded-full cursor-not-allowed' 
                    : 'liquid-btn-purple'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : videoUrl ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    Completed
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Generate Video
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
