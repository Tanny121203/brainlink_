import { useState } from 'react'
import { Modal } from './Modal'
import { Icons } from './icons'
import { addReview } from '../state/reviews'
import { toast } from './Toast'

type Props = {
  open: boolean
  tutorId: string
  tutorName: string
  authorName: string
  authorEmail: string
  onClose: () => void
  onSubmitted?: () => void
}

export function ReviewModal({
  open,
  tutorId,
  tutorName,
  authorName,
  authorEmail,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState<number>(0)
  const [text, setText] = useState('')

  function reset() {
    setRating(0)
    setText('')
  }

  function handleSubmit() {
    if (rating < 1) {
      toast.error('Please pick a rating before submitting.')
      return
    }
    addReview({
      tutorId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      text: text.trim(),
      authorName,
      authorEmail,
    })
    toast.success(`Thanks! Your review of ${tutorName} has been saved.`)
    reset()
    onSubmitted?.()
    onClose()
  }

  function handleClose() {
    reset()
    onClose()
  }

  const hint =
    rating === 0
      ? 'Pick a star'
      : rating <= 2
        ? 'Room to improve'
        : rating === 3
          ? 'Solid'
          : rating === 4
            ? 'Great'
            : 'Excellent'

  return (
    <Modal
      open={open}
      title={`Rate ${tutorName}`}
      onClose={handleClose}
      footer={
        <>
          <button className="btn" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-student" onClick={handleSubmit}>
            {Icons.Send({ size: 16 })}
            Submit review
          </button>
        </>
      }
    >
      <div className="grid" style={{ gap: 12 }}>
        <div className="field">
          <div className="label">Your rating</div>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`star-btn${n <= rating ? ' is-on' : ''}`}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onClick={() => setRating(n)}
              >
                {Icons.Star({ size: 16 })}
              </button>
            ))}
            <span className="review-hint">{hint}</span>
          </div>
        </div>

        <div className="field">
          <div className="label">Your feedback (optional)</div>
          <textarea
            className="input"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What stood out? Where could they improve?"
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>
    </Modal>
  )
}
