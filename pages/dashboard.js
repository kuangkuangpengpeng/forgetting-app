import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import CardForm from '../components/CardForm';
import ReviewCard from '../components/ReviewCard';
import ProgressChart from '../components/ProgressChart';
import StoryGenerator from '../components/StoryGenerator';
import StoryCard from '../components/StoryCard';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stories, setStories] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review');
  const [showStories, setShowStories] = useState(false);

  useEffect(() => {
    const session = supabase.auth.session();
    if (!session) {
      router.push('/');
    } else {
      setUser(session.user);
      fetchCards(session.user.id);
      fetchReviews(session.user.id);
      fetchStories(session.user.id);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const fetchCards = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);
    
    if (!error) setCards(data);
    setLoading(false);
  };

  const fetchReviews = async (userId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId);
    
    if (!error) {
      setReviews(data);
      // 找出需要复习的卡片
      const due = cards.filter(card => {
        const review = data.find(r => r.card_id === card.id);
        return !review || new Date(review.next_review) <= new Date();
      });
      setDueCards(due);
    }
  };

  const fetchStories = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error) setStories(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAddCard = async (front, back, tags) => {
    const { data, error } = await supabase
      .from('cards')
      .insert([
        { 
          user_id: user.id, 
          front, 
          back, 
          tags: tags.split(',').map(tag => tag.trim()) 
        }
      ]);
    
    if (!error) {
      setCards([...cards, ...data]);
      fetchReviews(user.id);
      return true;
    }
    return false;
  };

  const handleReview = async (cardId, quality) => {
    // 基于SM-2算法更新复习数据
    let cardReview = reviews.find(r => r.card_id === cardId);
    let easeFactor = cardReview?.ease_factor || 2.5;
    let interval = cardReview?.interval || 1;
    let repetitions = cardReview?.repetitions || 0;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const { data, error } = await supabase
      .from('reviews')
      .upsert({
        card_id: cardId,
        user_id: user.id,
        ease_factor: easeFactor,
        interval: interval,
        repetitions: repetitions,
        review_date: new Date().toISOString(),
        next_review: nextReview.toISOString(),
        quality: quality
      }, { onConflict: 'card_id, user_id' });
    
    if (!error) {
      fetchReviews(user.id);
      return true;
    }
    return false;
  };

  const handleStoryCreated = (newStory) => {
    setStories([newStory, ...stories]);
  };

  const handleDeleteStory = async (storyId) => {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);
    
    if (!error) {
      setStories(stories.filter(story => story.id !== storyId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">抗遗忘复习助手</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <button
                  onClick={() => setActiveTab('review')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'review'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  复习
                </button>
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'cards'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  知识点管理
                </button>
                <button
                  onClick={() => setActiveTab('stories')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'stories'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  故事复习
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'stats'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  学习统计
                </button>
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'review' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">今日复习</h2>
            
            {dueCards.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-indigo-600 text-5xl mb-4">🎉</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">太棒了！没有需要复习的内容</h3>
                <p className="text-gray-500">休息一下，或者添加新的知识点</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dueCards.map(card => (
                  <ReviewCard 
                    key={card.id} 
                    card={card} 
                    onReview={handleReview} 
                    stories={stories}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">知识点管理</h2>
              <span className="text-gray-500">{cards.length} 个知识点</span>
            </div>
            
            <CardForm onSubmit={handleAddCard} />
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">我的知识点</h3>
              <div className="grid grid-cols-1 gap-4">
                {cards.map(card => (
                  <div key={card.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">{card.front}</h4>
                      <div className="flex space-x-2">
                        {card.tags && card.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600">{card.back}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI故事复习</h2>
              <button
                onClick={() => setShowStories(!showStories)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                {showStories ? '隐藏故事' : '查看故事'}
              </button>
            </div>
            
            <StoryGenerator onStoryCreated={handleStoryCreated} />
            
            {showStories && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">我的故事</h3>
                {stories.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">您还没有生成故事</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stories.map(story => (
                      <StoryCard 
                        key={story.id} 
                        story={story} 
                        onDelete={handleDeleteStory} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">学习统计</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-700">知识点总数</p>
                <p className="text-3xl font-bold text-indigo-900">{cards.length}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700">已掌握知识点</p>
                <p className="text-3xl font-bold text-green-900">
                  {reviews.filter(r => r.repetitions >= 3).length}
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-700">需要复习</p>
                <p className="text-3xl font-bold text-yellow-900">{dueCards.length}</p>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">记忆曲线分析</h3>
              <ProgressChart reviews={reviews} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
