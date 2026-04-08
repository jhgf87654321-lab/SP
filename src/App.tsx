import React, { useEffect, useState } from 'react';
import { Upload, Video, Play, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { imageUrlToResizedJpegBase64 } from './imageUtils';
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

export default function App() {
  const [images, setImages] = useState({ front: null, back: null, side: null });
  const [selectedModel, setSelectedModel] = useState(PRESET_MODELS[0].id);
  const [customModelImg, setCustomModelImg] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState(SCRIPTS[0].id);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const isGenerating = isGeneratingStoryboard || isGeneratingVideo;
  const [generationProgress, setGenerationProgress] = useState(0);
  /** AI 分镜文案（Gemini） */
  const [storyboardText, setStoryboardText] = useState<string | null>(null);
  /** Veo 生成视频的本地 blob URL */
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** Veo 失败但分镜成功时的提示 */
  const [videoError, setVideoError] = useState<string | null>(null);
  const [geminiModelLabel, setGeminiModelLabel] = useState<string | null>(null);
  const [veoModelLabel, setVeoModelLabel] = useState<string | null>(null);
  /** 使用 Fast 时服务端会去掉参考图 */
  const [veoRefSkippedNote, setVeoRefSkippedNote] = useState<string | null>(null);

  const enableVeo = import.meta.env.VITE_ENABLE_VEO !== 'false';
  /** 与 VEO_MODEL 一致时：含 fast 则不要求参考图 */
  const veoClientIsFast = String(import.meta.env.VITE_VEO_MODEL || '')
    .toLowerCase()
    .includes('fast');

  const modelPreviewUrl = (): string | null => {
    if (selectedModel === 'custom') return customModelImg;
    return PRESET_MODELS.find((m) => m.id === selectedModel)?.img ?? null;
  };

  /** 商品多角度 + 模特图，供 Gemini 视觉理解 */
  const collectImagesForGemini = async (): Promise<{ mimeType: string; data: string }[]> => {
    const out: { mimeType: string; data: string }[] = [];
    for (const angle of ['front', 'back', 'side'] as const) {
      const u = images[angle];
      if (u) {
        const p = await imageUrlToResizedJpegBase64(u, 1280, 0.82);
        if (p) out.push(p);
      }
    }
    const m = modelPreviewUrl();
    if (m) {
      const p = await imageUrlToResizedJpegBase64(m, 1024, 0.82);
      if (p) out.push(p);
    }
    return out;
  };

  /** Veo 最多 3 张：商品主视图、模特、另一角度（仅 veo-3.1-generate-preview 等会提交） */
  const collectReferenceImagesForVeo = async (): Promise<
    { mimeType: string; data: string; referenceType: string }[]
  > => {
    const refs: { mimeType: string; data: string; referenceType: string }[] = [];
    const productUrls = (['front', 'back', 'side'] as const)
      .map((k) => images[k])
      .filter((u): u is string => !!u);
    const push = async (src: string) => {
      if (refs.length >= 3) return;
      const p = await imageUrlToResizedJpegBase64(src, 1024, 0.85);
      if (p) refs.push({ ...p, referenceType: 'asset' });
    };
    if (productUrls[0]) await push(productUrls[0]);
    const m = modelPreviewUrl();
    if (m) await push(m);
    for (let i = 1; i < productUrls.length && refs.length < 3; i++) {
      await push(productUrls[i]);
    }
    return refs;
  };

  useEffect(() => {
    return () => {
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, [videoBlobUrl]);

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

  const handleGenerate = async () => {
    if (!images.front && !images.back && !images.side) {
      alert("请至少上传一张产品角度图片 (正面、背面或侧面)。");
      return;
    }

    setIsGeneratingStoryboard(true);
    setGenerationProgress(0);
    setStoryboardText(null);
    setVideoError(null);
    if (videoBlobUrl) {
      URL.revokeObjectURL(videoBlobUrl);
      setVideoBlobUrl(null);
    }
    setError(null);
    setGeminiModelLabel(null);
    setVeoModelLabel(null);
    setVeoRefSkippedNote(null);
    setLoadingHint('正在分析上传的图片并编写分镜…');

    const selectedScriptData = SCRIPTS.find(s => s.id === selectedScript);
    const selectedModelData =
      selectedModel === 'custom'
        ? { name: 'Custom Model', img: customModelImg }
        : PRESET_MODELS.find(m => m.id === selectedModel);

    const inlineImages = await collectImagesForGemini();
    if (inlineImages.length === 0) {
      setError('无法读取图片数据，请重新上传或换一张图重试。');
      setIsGeneratingStoryboard(false);
      return;
    }

    const ctx =
      selectedScriptData && 'context' in selectedScriptData ? selectedScriptData.context : undefined;
    const isScript3 = selectedScriptData?.id === 's3';

    const promptParts: string[] = [
      'You are given images in this order: first the product garment photos (front/back/side as uploaded), then if present a model reference photo.',
      '',
      'TASK:',
      "1) First paragraph: describe ONLY what you actually see in the images — garment colors, fabric texture, silhouette, notable details; and the model's visible appearance (or state if no model image).",
      '2) Then write a detailed shot-by-shot video plan (8–15 seconds total) for an e-commerce fashion video that MUST feature THIS exact garment and THIS model look (if model image exists).',
      '3) For EVERY single shot, you MUST explicitly include all of the following dimensions:',
      '   - Environment (where the person is, e.g., street, studio, rooftop, corridor, meadow, etc.)',
      '   - Background (visual elements behind the person)',
      '   - Lighting (direction, hardness/softness, color temperature, contrast)',
      '   - Camera focal length (explicit mm value, e.g., 24mm / 35mm / 50mm / 85mm)',
      '   - Camera movement (e.g., push-in, dolly, pan, orbit, handheld sway, static)',
      '   - Filter / color grading (e.g., film grain, low saturation warm tone, high-contrast cyberpunk)',
      '4) IMPORTANT: the environment/background design does NOT need to follow the original product photo background. You should creatively design scene atmosphere, while still keeping the garment and model appearance faithful to the references.',
      '',
      `Script theme: ${selectedScriptData?.name ?? ''}`,
      `Script notes: ${selectedScriptData?.desc ?? ''}`,
    ];

    if (ctx) {
      promptParts.push(
        '',
        'STYLE BASELINE (must follow):',
        `- Scene baseline: ${ctx.scene}`,
        `- Lighting baseline: ${ctx.lighting}`,
        `- Props / UI baseline: ${ctx.props}`,
        `- Post / grading baseline: ${ctx.post}`,
        `- Director note baseline: ${ctx.director}`,
        'Apply the baseline consistently across the whole shot list unless a shot explicitly requires a contrast for storytelling.',
      );
    }

    if (isScript3) {
      promptParts.push(
        '',
        'SCRIPT 3 SPECIAL RULES (must follow):',
        '- This is a standard e-commerce hero video: clean studio / minimal background, high clarity, accurate color.',
        '- MUST include: a full-body entry/walk-in shot, a lower-body detail close-up, a back-view reveal, and an ending brand reveal.',
        '- If you mention selling-point callouts, describe them as overlay UI / leader lines aligned to the correct garment area (do not change the garment).',
      );
    }

    promptParts.push(
      '',
      `Model preset name (for context only, visuals beat text): ${selectedModelData?.name ?? ''}`,
      '',
      'Output requirements:',
      '- Use Chinese for the shot list.',
      '- Use numbered shots (01, 02, 03...).',
      '- Each shot should be one compact paragraph or line, but must contain all six dimensions above.',
      '- Be specific so a video generator can follow without inventing different clothes or people.',
    );

    const prompt = promptParts.join('\n');

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => (prev >= 92 ? 92 : prev + 6));
    }, 350);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, images: inlineImages }),
      });
      const data = (await res.json()) as { text?: string; error?: string; model?: string };

      if (!res.ok) {
        const msg = data.error || res.statusText || '请求失败';
        if (msg.includes('User location is not supported')) {
          setError('地区限制：请确认 Gemini 请求走服务端（Vercel 已配置 GEMINI_API_KEY）。');
        } else if (res.status === 500 && msg.includes('GEMINI_API_KEY')) {
          setError('服务端未配置 GEMINI_API_KEY。请在 Vercel 环境变量中添加后重新部署。');
        } else {
          setError(msg);
        }
        return;
      }

      const text = (data.text ?? '').trim();
      if (!text) {
        setError('模型未返回有效文案，请重试。');
        return;
      }
      setStoryboardText(text);
      setGeminiModelLabel(data.model ?? null);
      setGenerationProgress(100);
      setLoadingHint('');
    } catch (err) {
      console.error('[Generate]', err);
      setError(err instanceof Error ? err.message : '生成过程中发生错误');
    } finally {
      clearInterval(progressInterval);
      setIsGeneratingStoryboard(false);
    }
  };

  /** 用户确认分镜后，再调用 Veo 生成视频 */
  const handleConfirmVideo = async () => {
    if (!storyboardText?.trim()) return;
    if (!enableVeo) return;

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVeoRefSkippedNote(null);
    if (videoBlobUrl) {
      URL.revokeObjectURL(videoBlobUrl);
      setVideoBlobUrl(null);
    }
    setGenerationProgress(0);
    setLoadingHint('已提交 Google Veo，正在渲染视频（通常 1–6 分钟）…');

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => (prev >= 92 ? 92 : prev + 2));
    }, 2000);

    const text = storyboardText;

    try {
      const referenceImages = await collectReferenceImagesForVeo();

      if (!veoClientIsFast && referenceImages.length === 0) {
        setVideoError(
          'veo-3.1-generate-preview 需要至少一张参考图（商品或模特）。请先上传图片，或设置 VITE_VEO_MODEL / VEO_MODEL 为含 fast 的型号以仅文案生成。',
        );
        setGenerationProgress(100);
        setLoadingHint('');
        return;
      }

      const veoPrompt = `Vertical 9:16 e-commerce fashion video, 8 seconds, cinematic lighting, smooth camera moves, no on-screen text.

CRITICAL: Match the reference images — same garment (colors, cut, fabric) and the same person/model look when a model reference is included.

Shot plan and mood (follow closely):
${text.slice(0, 5500)}`;

      const startRes = await fetch('/api/video-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: veoPrompt,
          aspectRatio: '9:16',
          referenceImages,
        }),
      });
      const startData = (await startRes.json()) as {
        operationName?: string;
        error?: string;
        model?: string;
        referenceImagesSkipped?: boolean;
      };

      if (!startRes.ok || !startData.operationName) {
        setVideoError(startData.error || startRes.statusText || '无法启动视频生成');
        setGenerationProgress(100);
        setLoadingHint('');
        return;
      }

      setVeoModelLabel(startData.model ?? null);
      if (startData.referenceImagesSkipped) {
        setVeoRefSkippedNote(
          '当前为 Veo Fast，参考图未传入视频 API（仅分镜文案驱动）。标准版+参考图请使用 veo-3.1-generate-preview。',
        );
      } else {
        setVeoRefSkippedNote(null);
      }

      const maxPolls = 90;
      let videoUri: string | null = null;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, 8000));
        setGenerationProgress(5 + Math.min(85, Math.floor((i / maxPolls) * 85)));

        const stRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: startData.operationName }),
        });
        const st = (await stRes.json()) as {
          done?: boolean;
          error?: string;
          videoUri?: string;
        };

        if (!stRes.ok) {
          setVideoError(st.error || '轮询任务状态失败');
          setGenerationProgress(100);
          setLoadingHint('');
          return;
        }
        if (st.done && st.error) {
          setVideoError(st.error);
          setGenerationProgress(100);
          setLoadingHint('');
          return;
        }
        if (st.done && st.videoUri) {
          videoUri = st.videoUri;
          break;
        }
      }

      if (!videoUri) {
        setVideoError('视频生成超时，请稍后重试');
        setGenerationProgress(100);
        setLoadingHint('');
        return;
      }

      setLoadingHint('正在下载成片…');
      setGenerationProgress(95);
      const proxyRes = await fetch('/api/video-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUri }),
      });

      if (!proxyRes.ok) {
        const errText = await proxyRes.text();
        let msg = errText;
        try {
          msg = JSON.parse(errText).error || errText;
        } catch {
          /* keep */
        }
        setVideoError(msg || '下载视频失败');
        setGenerationProgress(100);
        setLoadingHint('');
        return;
      }

      const blob = await proxyRes.blob();
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
      setGenerationProgress(100);
      setLoadingHint('');
    } catch (err) {
      console.error('[Veo]', err);
      setVideoError(err instanceof Error ? err.message : '视频生成失败');
      setGenerationProgress(100);
      setLoadingHint('');
    } finally {
      clearInterval(progressInterval);
      setIsGeneratingVideo(false);
    }
  };

  const reset = () => {
    setImages({ front: null, back: null, side: null });
    setStoryboardText(null);
    setVideoError(null);
    setGeminiModelLabel(null);
    setVeoModelLabel(null);
    setVeoRefSkippedNote(null);
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    setVideoBlobUrl(null);
    setGenerationProgress(0);
    setError(null);
    setLoadingHint('');
  };

  /** 底部「生成分镜」：已有分镜则禁用（需「重新生成」清空后再试） */
  const storyboardButtonDisabled =
    isGenerating || !!storyboardText;

  const storyboardFlowDone =
    !!storyboardText && (!enableVeo || !!videoBlobUrl) && !videoError;

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
                {error && !isGenerating ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center p-8"
                  >
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(239,68,68,0.1)]">
                      <Video className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-red-700 mb-2">Generation Failed</h3>
                    <p className="text-sm text-red-600 max-w-[250px] mb-4">
                      {error}
                    </p>
                    <button 
                      onClick={() => setError(null)}
                      className="px-4 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : !isGenerating && !storyboardText ? (
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 animate-pulse">
                      {loadingHint ||
                        (isGeneratingVideo
                          ? '正在生成视频…'
                          : '正在生成分镜方案…')}
                    </h3>
                    <div className="space-y-2 w-full max-w-[200px]">
                      {!isGeneratingVideo ? (
                        <>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3 h-3 text-teal-500" /> 分析脚本与商品信息
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {generationProgress > 30 ? <CheckCircle2 className="w-3 h-3 text-teal-500" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                            编写分镜与描述
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3 h-3 text-teal-500" /> Veo 任务已提交
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" /> 云端渲染中，请耐心等待
                          </div>
                          {veoRefSkippedNote && (
                            <p className="text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1.5 leading-snug mt-1">
                              {veoRefSkippedNote}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-grow flex flex-col min-h-0 p-4"
                  >
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-purple-800">生成结果</h3>
                        <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                          {enableVeo && !videoBlobUrl && !videoError
                            ? '请确认分镜后点击下方生成视频'
                            : '已接入视觉：Gemini 看图写分镜 · Veo 3.1 标准版可传参考图'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {geminiModelLabel && (
                          <span>分镜模型：<code className="bg-purple-50 px-1 rounded">{geminiModelLabel}</code></span>
                        )}
                        {geminiModelLabel && veoModelLabel && <span className="mx-1">·</span>}
                        {veoModelLabel && (
                          <span>视频模型：<code className="bg-teal-50 px-1 rounded">{veoModelLabel}</code>（Veo 3.1 系列）</span>
                        )}
                        {!geminiModelLabel && !veoModelLabel && (
                          <span>
                            视频默认 <code className="bg-gray-100 px-1 rounded">veo-3.1-generate-preview</code>
                            （文案+参考图）；仅文案可设 <code className="bg-gray-100 px-1">VEO_MODEL=veo-3.1-fast-generate-preview</code>
                          </span>
                        )}
                      </p>
                    </div>
                    {videoBlobUrl && (
                      <div className="relative rounded-[1.25rem] overflow-hidden bg-black shadow-inner mb-3 aspect-[9/16] max-h-[320px] mx-auto w-full max-w-[200px]">
                        <video
                          src={videoBlobUrl}
                          className="w-full h-full object-contain"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    )}
                    {videoError && (
                      <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                        <strong>视频未生成：</strong>
                        {videoError}
                      </div>
                    )}
                    {veoRefSkippedNote && (
                      <div className="mb-3 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-900 leading-relaxed">
                        {veoRefSkippedNote}
                      </div>
                    )}
                    <div className="relative flex-grow rounded-[1.25rem] overflow-y-auto bg-white/70 border border-purple-100/80 shadow-inner min-h-[200px] max-h-[320px]">
                      <p className="text-xs font-semibold text-purple-700 px-4 pt-3">分镜 / 描述文案</p>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 p-4 pt-1 font-sans leading-relaxed">
                        {storyboardText}
                      </pre>
                    </div>
                    {enableVeo && !isGeneratingVideo && !videoBlobUrl && (
                      <button
                        type="button"
                        onClick={() => void handleConfirmVideo()}
                        className="mt-3 w-full py-3.5 rounded-full liquid-btn-purple text-base font-semibold flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        {videoError ? '重新生成视频' : '确认生成视频'}
                      </button>
                    )}
                    <div className="p-2 pt-4 flex flex-wrap justify-between items-center gap-2">
                      <button
                        type="button"
                        onClick={() => storyboardText && navigator.clipboard.writeText(storyboardText)}
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        复制全文
                      </button>
                      <button 
                        onClick={reset}
                        className="liquid-btn-teal px-6 py-2 text-sm"
                      >
                        清空并重来
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generate Button */}
            <div className="mt-6 space-y-3">
              <button 
                type="button"
                onClick={() => void handleGenerate()}
                disabled={storyboardButtonDisabled}
                className={`w-full py-4 text-lg flex items-center justify-center gap-2 ${
                  storyboardButtonDisabled 
                    ? 'bg-gray-200 text-gray-400 rounded-full cursor-not-allowed' 
                    : 'liquid-btn-purple'
                }`}
              >
                {isGeneratingStoryboard ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    正在生成分镜…
                  </>
                ) : isGeneratingVideo ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    正在生成视频…
                  </>
                ) : storyboardFlowDone ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    已完成
                  </>
                ) : storyboardText && enableVeo && !videoBlobUrl ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    请在右侧确认视频
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    生成分镜文案
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
