// pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '../Component/PageTitle';

const NotFound: React.FC = () => {
  return (
    <>
      <PageTitle title="404 Not Found" description="Trang không tồn tại" />
      <div className="min-h-screen flex items-center justify-center ">
      <div className="text-center items-center flex flex-col">
        <img alt='Not Found' src={`https://res.cloudinary.com/brandocloud/image/upload/v1742615401/DocShare/images/l4mluc06tc4b3yk8jfiz.svg`}></img>
        <h2 className="text-3xl font-semibold text-gray-700 mt-4">Trang không tìm thấy</h2>
        <p className="text-gray-500 mt-2 mb-6">
          Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
        </p>
        <Link
          to="/"
          className="inline-block text-blue-500 underline font-semibold py-2 px-6 rounded"
        >
          Quay về trang chính
        </Link>
      </div>
    </div>
    </>
  );
};

export default NotFound;