import { useState } from 'react';
import { generateBlog, reviewBlog, checkContent, saveBlog, updateBlog } from '../services/groqAPI';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { 
  Wand2, 
  Loader2, 
  Eye, 
  Save, 
  Send,
  CheckCircle,
  AlertTriangle,
  X,
  Tag,
  Copy,
  RefreshCw,
  FileText
} from 'lucide-react';

const TONES = [
  'formal', 'casual', 'academic', 'professional', 'friendly', 
  'persuasive', 'informative', 'entertaining', 'poetic'
];

const AUDIENCES = [
  'general readers', 'students', 'professionals', 'beginners',
  'experts', 'business', 'technical', 'creative'
];

export default function BlogGenerator() {
  const [step, setStep] = useState(1); // 1: input, 2: preview, 3: review
  const [loading, setLoading] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState(null);
  const [blogId, setBlogId] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [contentCheck, setContentCheck] = useState(null);
  
  // Form inputs
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [audience, setAudience] = useState('general readers');
  const [length, setLength] = useState(500);
  const [tone, setTone] = useState('informational');
  
  // For manual editing
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editMode, setEditMode] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await generateBlog({
        topic,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        audience,
        length,
        tone
      });

      setGeneratedBlog(response.blog);
      setBlogId(response.blogId);
      setEditedTitle(response.blog.title);
      setEditedContent(response.blog.content);
      setContentCheck(response.contentAnalysis);
      setStep(2);
      toast.success('Blog generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate blog');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    setLoading(true);
    try {
      const response = await reviewBlog(editedContent, blogId);
      setReviewResult(response.review);
      setContentCheck(response.contentAnalysis);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to review blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckContent = async () => {
    setLoading(true);
    try {
      const response = await checkContent(editedContent);
      setContentCheck(response.analysis);
      toast.success('Content analyzed!');
    } catch (error) {
      toast.error('Failed to check content');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      if (blogId) {
        await updateBlog(blogId, {
          title: editedTitle,
          content: editedContent,
          status: 'draft'
        });
      } else {
        const response = await saveBlog({
          title: editedTitle,
          content: editedContent,
          tags: keywords.split(',').map(k => k.trim()).filter(k => k),
          status: 'draft'
        });
        setBlogId(response.blog._id);
      }
      toast.success('Draft saved!');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      if (blogId) {
        await updateBlog(blogId, {
          title: editedTitle,
          content: editedContent,
          tags: generatedBlog?.tags || keywords.split(',').map(k => k.trim()).filter(k => k),
          seoMeta: generatedBlog?.seoMeta,
          status: 'published'
        });
      } else {
        await saveBlog({
          title: editedTitle,
          content: editedContent,
          tags: keywords.split(',').map(k => k.trim()).filter(k => k),
          status: 'published'
        });
      }
      toast.success('Blog published!');
      // Reset form
      setStep(1);
      setTopic('');
      setKeywords('');
      setGeneratedBlog(null);
      setBlogId(null);
      setReviewResult(null);
      setContentCheck(null);
    } catch (error) {
      toast.error('Failed to publish blog');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const applyImproved = () => {
    if (reviewResult?.improvedVersion) {
      setEditedContent(reviewResult.improvedVersion);
      toast.success('Improved version applied!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog & Essay Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Create AI-powered content with SEO optimization</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= s 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${
                step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topic */}
            <div className="md:col-span-2">
              <label className="label">Topic Title *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input"
                placeholder="e.g., The Future of Artificial Intelligence in Education"
              />
            </div>

            {/* Keywords */}
            <div className="md:col-span-2">
              <label className="label">Keywords (comma separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="input"
                placeholder="e.g., AI, education, technology, learning"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="label">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="input"
              >
                {AUDIENCES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div>
              <label className="label">Length (words): {length}</label>
              <input
                type="range"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                min={200}
                max={2000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>200</span>
                <span>1000</span>
                <span>2000</span>
              </div>
            </div>

            {/* Tone */}
            <div className="md:col-span-2">
              <label className="label">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      tone === t
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Blog
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Preview & Edit */}
      {step === 2 && generatedBlog && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">
              <RefreshCw className="w-4 h-4 mr-2" /> Start Over
            </button>
            <button onClick={() => setEditMode(!editMode)} className="btn-secondary">
              <FileText className="w-4 h-4 mr-2" /> {editMode ? 'Preview' : 'Edit'}
            </button>
            <button onClick={handleCheckContent} disabled={loading} className="btn-secondary">
              <AlertTriangle className="w-4 h-4 mr-2" /> Check Content
            </button>
            <button onClick={handleSaveDraft} disabled={loading} className="btn-secondary">
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </button>
            <button onClick={handleReview} disabled={loading} className="btn-accent">
              <Eye className="w-4 h-4 mr-2" /> AI Review
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div className="card p-4">
                <label className="label">Title</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="input text-xl font-bold"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editedTitle}</h1>
                )}
              </div>

              {/* Content */}
              <div className="card p-6">
                {editMode ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="input min-h-[500px] font-mono text-sm"
                  />
                ) : (
                  <div className="prose-custom">
                    <ReactMarkdown>{editedContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* SEO Meta */}
              {generatedBlog.seoMeta && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">SEO Meta</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta Title</p>
                      <p className="text-sm text-gray-900 dark:text-white">{generatedBlog.seoMeta.metaTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta Description</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{generatedBlog.seoMeta.metaDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {generatedBlog.tags?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedBlog.tags.map((tag, i) => (
                      <span key={i} className="badge-primary">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Word Count</span>
                    <span className="text-gray-900 dark:text-white">{generatedBlog.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Readability</span>
                    <span className="text-gray-900 dark:text-white">{generatedBlog.readabilityGrade}</span>
                  </div>
                </div>
              </div>

              {/* Content Analysis */}
              {contentCheck && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Content Analysis</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400">AI Detection</span>
                        <span className={`font-medium ${
                          parseFloat(contentCheck.aiDetection?.likelihood) > 50 ? 'text-red-500' : 'text-green-500'
                        }`}>{contentCheck.aiDetection?.likelihood}%</span>
                      </div>
                      <p className="text-xs text-gray-500">{contentCheck.aiDetection?.assessment}</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Plagiarism Risk</span>
                        <span className={`font-medium ${
                          contentCheck.plagiarism?.risk === 'Low' ? 'text-green-500' :
                          contentCheck.plagiarism?.risk === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                        }`}>{contentCheck.plagiarism?.risk}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Publish */}
              <button
                onClick={handlePublish}
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Publish Blog
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review Results */}
      {step === 3 && reviewResult && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back to Edit
            </button>
            {reviewResult.improvedVersion && (
              <button onClick={applyImproved} className="btn-accent">
                <RefreshCw className="w-4 h-4 mr-2" /> Apply Improved Version
              </button>
            )}
          </div>

          {/* Review Score */}
          <div className="card p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className={`text-5xl font-bold ${
                parseFloat(reviewResult.rating) >= 7 ? 'text-green-500' :
                parseFloat(reviewResult.rating) >= 5 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {reviewResult.rating}/10
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI Review Score</h3>
                <p className="text-gray-600 dark:text-gray-400">{reviewResult.feedback}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              {reviewResult.strengths?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {reviewResult.strengths.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {reviewResult.weaknesses?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Areas to Improve
                  </h4>
                  <ul className="space-y-2">
                    {reviewResult.weaknesses.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Improved Version */}
          {reviewResult.improvedVersion && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Improved Version</h3>
                <button onClick={() => copyToClipboard(reviewResult.improvedVersion)} className="btn-ghost text-sm">
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </button>
              </div>
              <div className="prose-custom bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <ReactMarkdown>{reviewResult.improvedVersion}</ReactMarkdown>
              </div>
            </div>
          )}

          <button onClick={handlePublish} disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Send className="w-5 h-5 mr-2" /> Publish Blog
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
