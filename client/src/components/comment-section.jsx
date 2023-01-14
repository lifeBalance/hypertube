import React from 'react'

import { useSelector } from 'react-redux'

// homemade translation system
import t from '../i18n/i18n'

import {
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

function CommentSection(props) {
  const { imdbId } = props
  const [comments, setComments] = React.useState(null)
  const [newComment, setNewComment] = React.useState('')
  const activeLanguage = useSelector(slices => slices.language.activeLanguage)

  React.useEffect(() => {
    async function fetchComments() {
      const response = await fetch(
        '/api/comments?' +
          new URLSearchParams({
            imdb_id: imdbId,
          }),
      )
      const data = await response.json()
      setComments(data.comments)
    }

    fetchComments()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()

    async function postComment() {
      console.log(newComment)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imdb_id: imdbId,
          comment: newComment,
          created_at: +new Date(),
        }),
      })
      const data = await response.json()
      setComments(prev => [data.comment, ...prev])
    }

    postComment()
    // Clear text area
    setNewComment('')
  }

  return (
    <div className='min-w-4xl pb-6'>
      <form className='flex flex-col'>
        <label className='text-xl text-white'>{t(activeLanguage, 'moviePage.commentSection.addComment')}</label>
        <textarea
          className='rounded-sm p-2 mb-2 w-full text-slate-700'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className='flex justify-between'>
          <button
            className='w-20 border rounded-lg text-white p-2 hover:bg-white hover:bg-opacity-20'
            onClick={(e) => handleSubmit(e)}
          >
            {t(activeLanguage, 'moviePage.commentSection.submit')}
          </button>
          <p className='text-sm text-white mb-4 ml-2'>
            <ExclamationTriangleIcon className='inline w-4 text-white -mt-1 mr-1' />
            {255 - newComment.length} {t(activeLanguage, 'moviePage.commentSection.charactersLeft')}
          </p>
        </div>
      </form>

      <h2 className='text-2xl text-white text-center mb-4 pt-6'>{t(activeLanguage, 'moviePage.commentSection.comments')}</h2>
      <hr />
      <ul className='flex flex-col space-y-6 py-6 max-h-96 overflow-y-scroll'>
        {comments && comments.length > 0 &&
          comments.map(comment => (
            <li
              key={comment.id}
              className='break-all'
              >
              <p className='text-white'>
                <span className='font-bold'>{comment.username}</span>{t(activeLanguage, 'moviePage.commentSection.wroteOn')}{' '}
                <span>
                  <CalendarIcon className='inline w-4 text-white -mt-1 mr-1'/>
                  {new Date(+comment.created_at).toLocaleDateString('fi-FI')} at{' '}
                  <ClockIcon className='inline w-4 text-white -mt-1 mr-1'/>
                  {new Date(+comment.created_at).toLocaleTimeString('fi-FI', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
              <p className='text-xl bg-slate-300 text-slate-700 rounded-md p-2 w-full'>{comment.comment}</p>
            </li>
          ))}

          {comments && comments.length === 0 &&
            <li className='text-center py-20'>
              {t(activeLanguage, 'moviePage.commentSection.noComments')}
          </li>}
      </ul>
      <hr />
    </div>
  )
}

export default CommentSection
