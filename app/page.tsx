import React from 'react';
import Form from '../components/Form';

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-2xl font-bold text-center">Blog Details</h1>
        <Form collectionName='blogs'/>
      </div>
    </div>
  );
};

export default Home;
