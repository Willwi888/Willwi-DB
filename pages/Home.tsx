
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import PaymentModal from '../components/PaymentModal';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payMode, setPayMode] = useState<'production' | 'support' | 'cinema'>('support');

  const handleAction = (target: string, mode?: any) => {
    if (target === 'pay') {
        setPayMode(mode);
        setIsPayOpen(true);
    } else {
        navigate(target);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-transparent pt-10">
      
      {/* 方案選擇區域 - 極簡主義重構 */}
      <section className="relative z-10 w-full flex flex-col items-center px-6 md:px-10 pb-40 mt-32">
        <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-3 border-y border-white/10 animate-fade-in-up">
            {[
                { 
                  label: '親手對時 · 歌詞影片', 
                  price: '320', 
                  desc: '邀請您完成共同參與並獲得專屬歌詞影片。',
                  target: '/interactive',
                },
                { 
                  label: '完整代製 · 雲端交付', 
                  price: '2800', 
                  desc: '由 Willwi 工作室完成，提供高品質檔案下載。',
                  target: '/database', 
                },
                { 
                  label: '純粹支持 · 心意延續', 
                  price: '100', 
                  desc: '單純的支持，讓獨立音樂繼續存在。',
                  target: 'pay',
                  mode: 'support'
                }
            ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleAction(item.target, item.mode)}
                  className={`group relative p-16 md:p-24 flex flex-col border-b md:border-b-0 md:border-r border-white/10 last:border-r-0 transition-all duration-700 cursor-pointer overflow-hidden hover:bg-white/[0.02] min-h-[600px]`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    
                    <div className="relative z-10 h-full flex flex-col">
                        {/* 頂部標籤區 */}
                        <div className="mb-24">
                            <h3 className="text-white/80 font-light text-[13px] tracking-[0.8em] ml-[0.8em]">{item.label}</h3>
                        </div>
                        
                        {/* 價格區 - 字體放大並改進層次 */}
                        <div className="mb-auto">
                            <div className="flex flex-col gap-6">
                                <span className="text-[10px] font-medium text-slate-500 tracking-[0.5em] ml-[0.5em]">NTD</span>
                                <span className="text-7xl md:text-[100px] font-light text-white tracking-tight leading-none transition-all duration-700 group-hover:text-brand-gold/90 font-serif">
                                    {item.price}
                                </span>
                            </div>
                        </div>

                        {/* 底部描述區 */}
                        <div className="pt-20">
                            <div className="h-[1px] w-12 bg-white/10 mb-10 group-hover:w-24 group-hover:bg-brand-gold/30 transition-all duration-700"></div>
                            <p className="text-[12px] text-slate-400 font-light tracking-[0.3em] leading-loose opacity-60 group-hover:opacity-100 transition-opacity duration-700 max-w-[280px]">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-[11px] text-slate-500 font-light tracking-[0.4em]">
                以上請先加入 <a href="https://lin.ee/y96nuSM" target="_blank" rel="noreferrer" className="text-brand-gold hover:underline">官方LINE@</a> 或 <a href="mailto:willchean@gmail.com" className="text-brand-gold hover:underline">E-Mail</a>
            </p>
        </div>
      </section>

      <PaymentModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} initialMode={payMode} />
    </div>
  );
};
export default Home;
