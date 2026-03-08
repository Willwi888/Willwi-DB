
import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { useUser } from '../context/UserContext';

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '哎呀，我是威威的代班阿嬤。\n有什麼關於作品庫或後台操作的問題，儘管問我喔。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const MAX_MESSAGES = 10;
  const [msgCount, setMsgCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || msgCount >= MAX_MESSAGES) return;
    const historyForApi = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setMsgCount(prev => prev + 1);
    try {
      const { text, sources } = await getChatResponse(userMessage, historyForApi);
      setMessages(prev => [...prev, { role: 'model', text, sources }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '連線暫時不穩定，阿嬤去拿個老花眼鏡...再試一次好嗎？' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-32 right-12 z-[1000] flex flex-col items-end">
      
      {isOpen && (
        <div className="mb-6 w-[360px] max-w-[90vw] h-[520px] max-h-[75vh] flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-xl bg-slate-950/95 backdrop-blur-3xl">
          <div className="px-8 py-6 flex justify-between items-center bg-white/[0.03] border-b border-white/5">
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center border border-brand-gold/40 p-1">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xs">W</div>
                 </div>
                 <div>
                     <span className="block text-[11px] font-black text-white tracking-widest uppercase">Studio Guide</span>
                     <span className="block text-[9px] text-brand-gold font-bold">阿嬤線上助理</span>
                 </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors text-xs p-2">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-5 custom-scrollbar py-6">
             {messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade`}>
                     <div className={`max-w-[85%] px-5 py-4 text-[12px] leading-loose rounded-2xl ${msg.role === 'user' ? 'bg-white text-black font-bold rounded-tr-none' : 'bg-white/[0.05] text-slate-200 border border-white/5 rounded-tl-none'}`}>
                         {msg.text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                         {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-[9px] text-slate-500 font-black mb-2 uppercase">Sources:</p>
                                <div className="space-y-1.5">
                                    {msg.sources.map((source, sIdx) => (
                                        <a key={sIdx} href={source.uri} target="_blank" rel="noreferrer" className="text-[9px] text-brand-gold hover:underline truncate block">
                                            {source.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                         )}
                     </div>
                 </div>
             ))}
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="bg-white/[0.05] px-6 py-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce [animation-delay:0.4s]"></div>
                     </div>
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-black border-t border-white/5">
              <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden focus-within:border-brand-gold transition-all">
                  <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="問阿嬤問題..."
                      className="flex-grow bg-transparent px-5 py-4 text-sm text-white focus:outline-none placeholder-slate-700"
                      disabled={isLoading}
                      autoFocus
                  />
                  <button onClick={handleSend} disabled={!input.trim() || isLoading} className="px-6 text-[10px] font-black text-brand-gold hover:text-white transition-all">
                      SEND
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* 依照截圖設計的懸浮 W 按鈕 */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_40px_rgba(251,191,36,0.2)] bg-slate-900 border border-white/20 hover:border-brand-gold hover:scale-110 active:scale-95 group"
      >
        {/* 發光外圈 */}
        <div className="absolute inset-[-1px] rounded-full border border-brand-gold/30 opacity-60 group-hover:opacity-100 group-hover:inset-[-4px] transition-all"></div>
        
        {/* 中心 W 標誌 */}
        <div className="w-full h-full flex items-center justify-center relative">
            <span className="text-xl font-black text-white tracking-tighter">W</span>
            {/* 黃點指示器 */}
            <div className="absolute top-[18px] right-[16px] w-[6px] h-[6px] bg-brand-gold rounded-full shadow-[0_0_8px_#fbbf24] animate-pulse"></div>
        </div>
      </button>

    </div>
  );
};

export default ChatWidget;
