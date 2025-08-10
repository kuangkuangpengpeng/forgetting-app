import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function StoryGenerator({ onStoryCreated }) {
  const [words, setWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('cards')
        .select('front')
        .eq('user_id', user.id);
      
      if (!error && data) {
        const uniqueWords = [...new Set(data.map(card => card.front))];
        setWords(uniqueWords);
      }
    };
    
    fetchWords();
  }, []);

  const toggleWordSelection = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const generateStory = async () => {
    if (selectedWords.length < 3) {
      setError('请至少选择3个单词');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ words: selectedWords })
      });
      
      if (!response.ok) {
        throw new Error('故事生成失败');
      }
      
      const story = await response.json();
      setSuccess(true);
      onStoryCreated(story);
      
      setTimeout(() => {
        setSelectedWords([]);
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || '故事生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">DeepSeek 故事生成器</h3>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <p className="text-green-700">故事生成成功！</p>
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          选择要包含在故事中的单词（至少3个）:
        </p>
        <div className="flex flex-wrap gap-2">
          {words.map((word, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleWordSelection(word)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedWords.includes(word)
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          已选: {selectedWords.length} 个单词
        </p>
        <button
          type="button"
          onClick={generateStory}
          disabled={isGenerating || selectedWords.length < 3}
          className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isGenerating || selectedWords.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              DeepSeek生成中...
            </span>
          ) : (
            '使用DeepSeek生成故事'
          )}
        </button>
      </div>
    </div>
  );
}
