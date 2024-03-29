import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '../components/input'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { showNotif } from '../store/notificationsSlice'

// homemade i18n
import t from '../i18n/i18n'

export default function ForgotPasswordPage() {
  const { activeLanguage } = useSelector(slices => slices.language)
  const validationSchema = z.object({
    email: z
      .string()
      .min(1, { message: t(activeLanguage, 'forgotPasswordPage.emailInput.minWarning') })
      .email({ message: t(activeLanguage, 'forgotPasswordPage.emailInput.validEmailWarning') }),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'all',
    resolver: zodResolver(validationSchema),
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()

  async function submitHandler(data) {
    console.log(data) // testing
    dispatch(
      showNotif({
        status: 'loading',
        message:
        t(activeLanguage, 'forgotPasswordPage.messages.loading')
      }),
    )

    const response = await fetch(`/api/forgot-password?email=${data.email}`)
    const parsed = await response.json()
    if (parsed.error) {
      // console.log(`password request failed: ${JSON.stringify(parsed.error)}`) // testing!!!
      dispatch(
        showNotif({
          status: 'error',
          message: t(activeLanguage, 'forgotPasswordPage.messages.error')
        })
      )
    } else {
      // console.log(`password request OK: ${JSON.stringify(parsed.message)}`) // testing!!!

      dispatch(
        showNotif({
          status: 'success',
          message: t(activeLanguage, 'forgotPasswordPage.messages.success')
        })
      )
      // and redirect
      navigate('/', { replace: true })
    }
  }

  return (
    <div className='text-white max-w-3xl mx-auto pt-10 pb-20 px-2'>
      <h1 className='text-2xl text-center pb-8'>
        {t(activeLanguage, 'forgotPasswordPage.title')}
      </h1>

      <form
        onSubmit={handleSubmit(submitHandler)}
        className='space-y-4'
      >
        <Input
          id='email'
          type='email'
          label={t(activeLanguage, 'forgotPasswordPage.emailInput.label')}
          register={register}
          registerOptions={{ required: true }}
          errors={errors}
          isRequired={true}
          placeholder={t(activeLanguage, 'forgotPasswordPage.emailInput.placeholder')}
        />

        <button
          type='submit'
          className={`p-3 !mt-5 border-[1px] border-slate-500 rounded-md hover:enabled:bg-white hover:enabled:bg-opacity-20 w-full`}
        >
          {t(activeLanguage, 'forgotPasswordPage.submitBtn')}
        </button>
      </form>
    </div>
  )
}
