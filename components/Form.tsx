"use client"
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db, storage } from '../config/firebase'; // Adjust the import path as needed
import { collection, addDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const Form = ({ collectionName }: { collectionName: string }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authorName: '',
    authorEmail: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const schema = yup.object().shape({
    title: yup.string().required('Title is a required field'),
    description: yup.string().required('Description is a required field'),
    authorName: yup.string().required('Author Name is a required field'),
    authorEmail: yup.string().email('Invalid email format').required('Author Email is a required field'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({
      ...formData,
      description: value,
    });
  };

  const handleImageUpload = async (file: File) => {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await schema.validate(formData, { abortEarly: false });

      const quillEditor = document.querySelector('.ql-editor');
      const images = quillEditor?.querySelectorAll('img') || [];
      const uploadPromises = Array.from(images).map((image) => {
        const file = image.src.split('base64,')[1];
        const blob = new Blob([file], { type: 'image/png' });
        const fileName = `image-${Date.now()}.png`;
        const fileObj = new File([blob], fileName, { type: 'image/png', lastModified: Date.now() });
        return handleImageUpload(fileObj).then((url) => {
          image.src = url;
        });
      });

      await Promise.all(uploadPromises);

      toast.promise(
        addDoc(collection(db, collectionName), {
          ...formData,
          description: quillEditor ? quillEditor.innerHTML : '',
        }),
        {
          pending: 'Creating your Project',
          success: 'Successfully Created 👌',
          error: 'Try Again 🤯',
        }
      )
        .then(() => {
          setFormData({
            title: '',
            description: '',
            authorName: '',
            authorEmail: '',
          });
        })
        .catch((error) => {
          console.error('Error adding document: ', error);
        });
    } catch (validationErrors) {
      const formattedErrors: { [key: string]: string } = {};
      (validationErrors as any).inner.forEach((error: any) => {
        formattedErrors[error.path] = error.message;
      });
      setErrors(formattedErrors);
    }
  };

  return (
    <div>
      <ToastContainer />
      <form onSubmit={onSubmit} className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <p className="text-red-300">{errors.title}</p>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <ReactQuill
            value={formData.description}
            onChange={handleDescriptionChange}
            className="mt-1"
            modules={{
              toolbar: [
                [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline'],
                ['link', 'image'],
                [{ 'align': [] }],
                ['clean'],
              ],
            }}
            formats={[
              'header', 'font', 'list', 'bullet', 'bold', 'italic', 'underline',
              'link', 'image', 'align',
            ]}
          />
          <p className="text-red-300">{errors.description}</p>
        </div>

       

        <button type="submit" className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Form;
