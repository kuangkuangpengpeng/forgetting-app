import { useState } from 'react';

export default function CardForm({ onSubmit }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!front.trim() || !back.trim()) {
      setError('请填写知识点内容');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await onSubmit(front, back, tags);
      if (result) {
        setFront('');
        setBack('');
        setTags('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('添加失败，请重试');
      }
    } catch (err) {
      setError('添加失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">知识点添加成功！</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="front" className="block text-sm font-medium text-gray-700">
          知识点/问题
        </label>
        <input
          type="text"
          id="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="例如: abandon"
        />
      </div>
      
      <div>
        <label htmlFor="back" className="block text-sm font-medium text-gray-700">
          释义/答案
        </label>
        <textarea
          id="back"
          rows="3"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="例如: 放弃，抛弃，离弃"
        ></textarea>
      </div>
      
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          标签 (用逗号分隔)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="例如: 考研词汇, 英语四级"
        />
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? '添加中...' : '添加知识点'}
        </button>
      </div>
    </form>
  );
}
