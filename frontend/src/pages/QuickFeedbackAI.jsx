import { useState, useRef, useEffect } from 'react';
import { getQuickFeedback, sendChatMessage, getChatHistory, getChatSession, exportChat } from '../services/groqAPI';
import toast from 'react-hot-toast';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  History, 
  Plus, 
  Download,
  X,
  Star,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Copy,
  RefreshCw
} from 'lucide-react';

export default function QuickFeedbackAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState('instant'); // 'instant' or 'chat'
  const [instantResult, setInstantResult] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInstantFeedback = async () => {
    if (!input.trim() || input.length < 10) {
      toast.error('Please enter at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await getQuickFeedback(input);
      setInstantResult(response.feedback);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to get feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(input, sessionId);
      
      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        structuredFeedback: response.structuredFeedback,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to get response');
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await getChatHistory(1, 20);
      setChatHistory(response.chats || []);
    } catch (error) {
      toast.error('Failed to load history');
    }
  };

  const loadSession = async (id) => {
    try {
      const response = await getChatSession(id);
      setMessages(response.chat.messages || []);
      setSessionId(id);
      setShowHistory(false);
      setMode('chat');
    } catch (error) {
      toast.error('Failed to load session');
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInstantResult(null);
  };

  const handleExport = async () => {
    if (!sessionId) {
      toast.error('No chat session to export');
      return;
    }

    try {
      const response = await exportChat(sessionId, 'json');
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${sessionId}.json`;
      a.click();
      toast.success('Chat exported!');
    } catch (error) {
      toast.error('Failed to export chat');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'instant') {
        handleInstantFeedback();
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quick AI Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400">Get instant writing assistance and feedback</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { loadHistory(); setShowHistory(true); }} className="btn-secondary">
            <History className="w-4 h-4 mr-2" />
            History
          </button>
          <button onClick={startNewChat} className="btn-secondary">
            <Plus className="w-4 h-4 mr-2" />
            New
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="card p-1 inline-flex">
        <button
          onClick={() => { setMode('instant'); setMessages([]); }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode === 'instant' 
              ? 'bg-primary-600 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Instant Feedback
        </button>
        <button
          onClick={() => { setMode('chat'); setInstantResult(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode === 'chat' 
              ? 'bg-primary-600 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Chat Mode
        </button>
      </div>

      {/* Instant Mode */}
      {mode === 'instant' && (
        <div className="space-y-6">
          <div className="card p-6">
            <label className="label">Paste your text, notes, or assignment snippet</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your text here for instant feedback..."
              className="input min-h-[150px] resize-y"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {input.length} characters {input.length < 10 && '(minimum 10)'}
              </span>
              <button
                onClick={handleInstantFeedback}
                disabled={loading || input.length < 10}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Get Feedback
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instant Results */}
          {instantResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Score */}
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-4xl font-bold ${
                    parseFloat(instantResult.rating) >= 7 ? 'text-green-500' :
                    parseFloat(instantResult.rating) >= 5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {instantResult.rating}/10
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">Overall Score</h3>
                    <p className="text-gray-600 dark:text-gray-400">{instantResult.feedback}</p>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {instantResult.strengths?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {instantResult.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <Star className="w-4 h-4 text-green-500 mt-1" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {instantResult.weaknesses?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" /> Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {instantResult.weaknesses.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-1" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {instantResult.suggestions?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" /> Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {instantResult.suggestions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-1" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improved Version */}
              {instantResult.improvedVersion && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-primary-500" /> Improved Version
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(instantResult.improvedVersion)}
                      className="btn-ghost text-sm"
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {instantResult.improvedVersion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat Mode */}
      {mode === 'chat' && (
        <div className="card h-[600px] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm">Ask for writing help, grammar checks, or feedback</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div className={`max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-2xl rounded-br-sm px-4 py-2' 
                    : 'bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-2'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.structuredFeedback && (
                    <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-600 space-y-2">
                      {msg.structuredFeedback.rating && (
                        <p className="text-sm font-medium">Score: {msg.structuredFeedback.rating}/10</p>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="input flex-1 resize-none max-h-32"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="btn-primary px-4"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {sessionId && (
              <div className="flex justify-end mt-2">
                <button onClick={handleExport} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1">
                  <Download className="w-4 h-4" /> Export Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {chatHistory.length > 0 ? (
                <div className="space-y-2">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.sessionId}
                      onClick={() => loadSession(chat.sessionId)}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">{chat.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(chat.updatedAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No chat history</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
