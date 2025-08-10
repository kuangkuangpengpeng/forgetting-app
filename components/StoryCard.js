import { useState } from 'react';

export default function StoryCard({ story, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 使用原生JavaScript格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(story.id);
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white mb-4">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{story.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(story.created_at)}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={toggleExpand}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {isExpanded ? '收起' : '展开'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
            >
              {isDeleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {story.words.map((word, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {word}
            </span>
          ))}
        </div>
        {isExpanded && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="prose prose-sm max-w-none">
              {story.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="text-gray-700 mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
