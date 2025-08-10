import { useState } from 'react';

export default function ReviewCard({ card, onReview, stories }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showStoryOption, setShowStoryOption] = useState(false);
  const [storiesWithWord, setStoriesWithWord] = useState([]);
  
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };
  
  const handleReview = async (quality) => {
    setIsReviewing(true);
    try {
      await onReview(card.id, quality);
      setShowAnswer(false);
    } catch (error) {
      console.error('复习记录保存失败:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-medium text-gray-900">{card.front}</h3>
            {card.tags && card.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {card.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {showAnswer ? (
          <div className="mt-6">
            <p className="text-gray-700 text-lg">{card.back}</p>
            
            {/* 只在有可用故事时显示 */}
            {stories.length > 0 && (
              <>
                {showStoryOption ? (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      包含此单词的故事:
                    </p>
                    <div className="prose prose-sm max-w-none">
                      {storiesWithWord.map(story => (
                        <div key={story.id} className="mb-3">
                          <p className="text-gray-700">{story.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(story.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowStoryOption(false)}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      关闭故事
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const storiesWithWord = stories.filter(s => 
                        s.words.includes(card.front)
                      );
                      if (storiesWithWord.length > 0) {
                        setStoriesWithWord(storiesWithWord);
                        setShowStoryOption(true);
                      }
                    }}
                    className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    查看包含此单词的故事
                  </button>
                )}
              </>
            )}
            
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-500 mb-2">复习反馈</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleReview(0)}
                  disabled={isReviewing}
                  className="py-2 px-3 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
                >
                  忘记
                </button>
                <button
                  onClick={() => handleReview(3)}
                  disabled={isReviewing}
                  className="py-2 px-3 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
                >
                  困难
                </button>
                <button
                  onClick={() => handleReview(4)}
                  disabled={isReviewing}
                  className="py-2 px-3 text-xs font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                >
                  良好
                </button>
                <button
                  onClick={() => handleReview(5)}
                  disabled={isReviewing}
                  className="py-2 px-3 text-xs font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                >
                  简单
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <button
              onClick={handleShowAnswer}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              显示答案
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
