import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '../components/input'
import { XCircleIcon } from '@heroicons/react/24/outline'
// redux
import { useDispatch, useSelector } from 'react-redux'
import { setProfilePic } from '../store/authSlice'

const MAX_FILE_SIZE = 500000
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

const validationSchema = z
  .object({
    userName: z
      .string()
      .min(1, { message: 'Username is required' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{5,10}$/, {
        message: '5-10 upper and lowercase letters, and digits',
      }),
    firstName: z
      .string()
      .min(1, { message: 'First Name is required' })
      .max(30, { message: 'Maximum 30 characters' })
      .regex(/^(?=.*[^\W_])[\w ]*$/, { message: 'Only letters and space' }),
    lastName: z
      .string()
      .min(1, { message: 'Last Name is required' })
      .max(30, { message: 'Maximum 30 characters' })
      .regex(/^(?=.*[^\W_])[\w ]*$/, { message: 'Only letters and space' }),
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Must be a valid email' }),
    profilePic: z
      .any()
      .refine(
        (files) => files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
        `Max image size is 5MB.`
      )
      .refine(
        (files) => files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        'Only .jpg, .jpeg, .png and .webp formats are supported.'
      ),
  })

export default function ProfilePage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    mode: 'all',
    resolver: zodResolver(validationSchema),
  })
  const { accessToken, uid, isLoggedIn } = useSelector(slices => slices.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  React.useEffect(() => {
    if (!isLoggedIn) navigate('/', { replace: true })

    async function getProfile() {
      const response = await fetch(`/api/users/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        }
      })
      // console.log(response) // testing
      const data = await response.json()
      if (response.ok) {
        // console.log(data.user) // testing
        setValue('userName',  data.user.username)
        setValue('firstName', data.user.firstname)
        setValue('lastName',  data.user.lastname)
        setValue('email',     data.user.email)
      } else {
        console.log(data) // testing
      }
    }
    getProfile()
  }, [])

  async function submitHandler(data) {
    // console.log(data) // testing
    const formData = new FormData()
    formData.append('userName', data.userName)
    formData.append('firstName', data.firstName)
    formData.append('lastName', data.lastName)
    formData.append('email', data.email)

    /* If the user added a profile picture, 'data.profilePic' is a FileList 
      array (truthy value). Otherwise it's a falsey empty string. */
    if (data.profilePic) {
      // Add the profile pic at the end of the form.
      formData.append('profilePic', data.profilePic[0])
      // console.log(data.profilePic[0]) // testing
    }
    
    const response = await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    })
    const parsed = await response.json()
    if (parsed.error) {
      console.log(`profile update failed: ${JSON.stringify(parsed.error)}`) // show some feedback in modal bro!!!
    } else {
      console.log(`profile update OK: ${JSON.stringify(parsed)}`) // show some feedback in modal bro!!!

      // update the profile pic (if there was any in the response)
      if (parsed.profilePicUrl) dispatch(setProfilePic(parsed.profilePicUrl))

      // and redirect
      navigate('/', { replace: true })
    }
  }

  return (
    <div className='text-white max-w-4xl mx-auto pt-10 pb-20 px-2'>
      <h1 className='text-2xl text-center pb-8'>Profile Settings</h1>

      <form
        onSubmit={handleSubmit(submitHandler)}
        className='space-y-4'
      >
        <Input
          id='userName'
          type='text'
          label='Username'
          register={register}
          registerOptions={{ required: true }}
          errors={errors}
          isRequired={true}
        />

        <Input
          id='firstName'
          type='text'
          label='First Name'
          register={register}
          registerOptions={{ required: false }}
          errors={errors}
          isRequired={false}
        />

        <Input
          id='lastName'
          type='text'
          label='Last Name'
          register={register}
          registerOptions={{ required: false }}
          errors={errors}
          isRequired={false}
        />

        <Input
          id='email'
          type='email'
          label='Email'
          register={register}
          registerOptions={{ required: true }}
          errors={errors}
          isRequired={true}
        />

        <div className='relative'>
          <Input
            id='profilePic'
            type='file'
            label='Profile Picture'
            register={register}
            registerOptions={{ required: false }}
            errors={errors}
            isRequired={false}
          />
          <button
            className='absolute top-2 right-4 text-gray-400'
            onClick={(e) => {
              e.preventDefault()
              setValue('profilePic', '')
            }}
          >
            <div className='group'>
              <XCircleIcon className='inline w-4 mx-1 -mt-1 group-hover:text-red-500' />
              <span className='group-hover:text-white'>clear pic</span>
            </div>
          </button>
        </div>

        <button
          type='submit'
          className={`p-3 border-[1px] border-slate-500 rounded-md hover:enabled:bg-white hover:enabled:bg-opacity-20 w-full`}
        >
          Submit
        </button>
      </form>
    </div>
  )
}