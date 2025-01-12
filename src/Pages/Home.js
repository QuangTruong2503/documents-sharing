import React from 'react'
import DocumentList from '../Component/Documents/DocumentList.tsx'

function Home() {
  const  documents = [
    {
      document_id: 1,
      full_name: "Trần Thái Sơn",
      title: "Đề cương Lịch sử Đảng Cộng sản Việt Nam",
      thumbnail_url:
        "https://res.cloudinary.com/brandocloud/image/upload/v1736424844/DocShare/%C4%90%E1%BB%81-c%C6%B0%C6%A1ng-L%E1%BB%8Bch-s%E1%BB%AD-%C4%90%E1%BA%A3ng-C%E1%BB%99ng-s%E1%BA%A3n-Vi%E1%BB%87t-Nam_vjgsda.jpg",
      like_count: 0,
      is_public: true,
    },
    {
      document_id: 2,
      full_name: "Trần Vũ Quang Trường",
      title: "Thực Tập Tốt Nghiệp",
      thumbnail_url:
        "https://res.cloudinary.com/brandocloud/image/upload/v1736227105/2100010231_TranVuQuangTruong_BaoCaoThucTap_UKI_jflvak.jpg",
      like_count: 0,
      is_public: true,
    },
    {
      document_id: 3,
      full_name: "Trần Thái Sơn",
      title: "Đề cương Lịch sử Đảng Cộng sản Việt Nam",
      thumbnail_url:
        "https://res.cloudinary.com/brandocloud/image/upload/v1736424844/DocShare/%C4%90%E1%BB%81-c%C6%B0%C6%A1ng-L%E1%BB%8Bch-s%E1%BB%AD-%C4%90%E1%BA%A3ng-C%E1%BB%99ng-s%E1%BA%A3n-Vi%E1%BB%87t-Nam_vjgsda.jpg",
      like_count: 0,
      is_public: true,
    },
    {
      document_id: 4,
      full_name: "Trần Vũ Quang Trường",
      title: "Thực Tập Tốt Nghiệp",
      thumbnail_url:
        "https://res.cloudinary.com/brandocloud/image/upload/v1736227105/2100010231_TranVuQuangTruong_BaoCaoThucTap_UKI_jflvak.jpg",
      like_count: 0,
      is_public: true,
    }
  ];
  return (
    <div>
      <DocumentList documents={documents}/>
    </div>
  )
}

export default Home