import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const Guestbook: React.FC = () => {
  const { messages, addMessage } = useData();
  const { showToast } = useToast();
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [publicConsent, setPublicConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show approved and non-spam messages
  const approvedMessages = messages.filter(m => m.isApproved && !m.isSpam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !message.trim()) {
      showToast("請填寫暱稱與留言內容", "error");
      return;
    }
    if (!publicConsent) {
      showToast("請勾選同意公開分享", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const isNotSpam = await addMessage({
        nickname: nickname.trim(),
        message: message.trim(),
        publicConsent
      });

      if (isNotSpam) {
        showToast("留言已送出，將由管理員審核後發佈", "success");
        setNickname('');
        setMessage('');
        setPublicConsent(false);
      } else {
        showToast("留言內容疑似包含不當資訊，請重新確認", "error");
      }
    } catch (error) {
      showToast("留言送出失敗，請稍後再試", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-60 px-6 md:px-20 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="mb-20 text-center">
          <h1 className="text-3xl md:text-5xl font-light text-white tracking-[0.2em] mb-6 font-serif">
            Willwi 留言板
          </h1>
          <p className="text-sm text-slate-400 font-light tracking-widest leading-relaxed max-w-xl mx-auto">
            這裡不是比較或評分的地方。<br/>
            只是一個角落，讓記憶裡的那個人能好好站著。
          </p>
        </div>

        <div className="bg-slate-950/50 border border-white/10 p-8 md:p-12 rounded-sm mb-20">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">Nickname (暱稱)</label>
              <input 
                type="text" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold transition-all font-light"
                placeholder="你希望我們怎麼稱呼你？"
                maxLength={50}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">Message (內容)</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold transition-all resize-none custom-scrollbar font-light"
                placeholder="寫下心裡的話吧"
                maxLength={1000}
              />
            </div>

            <div className="flex items-start gap-4 pt-2">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  id="consent"
                  checked={publicConsent}
                  onChange={(e) => setPublicConsent(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border border-white/20 bg-black checked:bg-brand-gold checked:border-brand-gold cursor-pointer transition-all"
                />
                <svg className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-black" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <label htmlFor="consent" className="text-sm text-slate-400 cursor-pointer select-none leading-relaxed">
                我同意公開分享這段話在 Willwi 的轉角
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-6 bg-white text-black font-black uppercase text-xs tracking-[0.4em] hover:bg-brand-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? '正在留下痕跡...' : '留 下 一 盞 燈'}
            </button>
          </form>
        </div>

        <div className="space-y-12">
          <h2 className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] text-center mb-12">
            留下來的聲音
          </h2>
          
          {approvedMessages.length === 0 ? (
            <div className="text-center text-slate-600 text-sm font-light italic py-10">
              目前還沒有人留下聲音。
            </div>
          ) : (
            <div className="grid gap-8">
              {approvedMessages.map((msg) => (
                <div key={msg.id} className="border-l-2 border-white/10 pl-6 py-2 hover:border-brand-gold transition-colors">
                  <p className="text-white text-lg font-light leading-relaxed mb-4 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest">
                    <span className="font-bold text-slate-300">{msg.nickname}</span>
                    <span>/</span>
                    <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guestbook;
