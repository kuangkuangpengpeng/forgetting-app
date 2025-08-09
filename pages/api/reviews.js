import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  const { user } = await supabase.auth.api.getUserByCookie(req);
  
  if (!user) {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  }
  
  if (req.method === 'POST') {
    const { cardId, quality } = req.body;
    
    if (!cardId || quality === undefined) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .single();
    
    if (reviewError && reviewError.code !== 'PGRST116') {
      return res.status(500).json({ error: reviewError.message });
    }
    
    let easeFactor = existingReview?.ease_factor || 2.5;
    let interval = existingReview?.interval || 1;
    let repetitions = existingReview?.repetitions || 0;
    
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
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data[0]);
  }
  
  return res.status(405).json({ error: '方法不允许' });
}
