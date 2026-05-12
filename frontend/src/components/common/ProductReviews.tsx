import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';
import { productAPI } from '../../services/api';
import { useAppSelector } from '../../store';
import { timeAgo, getAvatarFallback } from '../../utils';
import toast from 'react-hot-toast';

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readOnly?: boolean }> = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button" disabled={readOnly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readOnly && setHovered(s)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
          <Star className={`w-4 h-4 transition-colors ${s <= display ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
        </button>
      ))}
    </div>
  );
};

const ProductReviews: React.FC<{ productId: string }> = ({ productId }) => {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => productAPI.getProductReviews(productId).then((r) => r.data.data),
    enabled: !!productId,
  });

  const submit = useMutation({
    mutationFn: () => productAPI.createReview(productId, { rating, comment, title }),
    onSuccess: () => { qc.invalidateQueries(['reviews', productId]); setComment(''); setTitle(''); setRating(5); toast.success('Review submitted'); },
    onError: () => toast.error('Failed to submit review'),
  });

  const reviews = data?.data || data || [];

  return (
    <div>
      {isAuthenticated && (
        <div className="card p-5 mb-6">
          <h4 className="font-semibold text-slate-800 mb-4">Write a Review</h4>
          <div className="space-y-3">
            <div>
              <label className="label">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="label">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" className="input" />
            </div>
            <div>
              <label className="label">Review</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                placeholder="Share your experience…" className="input resize-none" />
            </div>
            <button onClick={() => submit.mutate()} disabled={!comment || submit.isLoading} className="btn-primary py-2.5">
              {submit.isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">No reviews yet. Be the first!</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                  {getAvatarFallback(`${r.user?.firstName || 'A'} ${r.user?.lastName || ''}`)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{r.user?.firstName} {r.user?.lastName}</span>
                    <StarRating value={r.rating} readOnly />
                    <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="text-sm font-medium text-slate-700 mt-1">{r.title}</p>}
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{r.comment}</p>
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-green-600 transition-colors mt-2">
                    <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.helpfulVotes || 0})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
