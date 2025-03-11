import React from 'react'
import DocumentList from '../Component/Documents/DocumentList.tsx'

function Home() {
  const  documents = [
    {
      "document_id": 186738948,
      "full_name": "Trần Thái Sơn",
      "title": "Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1736729823/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_w5sg5w.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 351127819,
      "full_name": "Trần Thái Sơn",
      "title": "549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1736729336/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_sxfcr4.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 381705215,
      "full_name": "Trần Thái Sơn",
      "title": "file",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/raw/upload/v1736727535/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_vfp9hp.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 446161162,
      "full_name": "Trần Thái Sơn",
      "title": "https://res.cloudinary.com/brandocloud/raw/upload/v1736727447/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_qdvveh",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/raw/upload/v1736727447/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_qdvveh.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 162215341,
      "full_name": "Trần Thái Sơn",
      "title": "162215341-549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1736834775/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_tfcqw9.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 204864224,
      "full_name": "Trần Thái Sơn",
      "title": "204864224-TH_Buoi03",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1741591811/DocShare/Documents/TH_Buoi03_nixbpn.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 230671972,
      "full_name": "Trần Thái Sơn",
      "title": "230671972-549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1736830741/DocShare/Documents/549982598-Đề-cương-Lịch-sử-Đảng-Cộng-sản.D-Việt-Nam_des825.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 259099823,
      "full_name": "Trần Thái Sơn",
      "title": "259099823-TranVuQuangTruong_PhieuNhiemVuKLTN",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1736837423/DocShare/Documents/TranVuQuangTruong_PhieuNhiemVuKLTN_n95evk.jpg",
      "like_count": 0,
      "is_public": true
    },
    {
      "document_id": 309489269,
      "full_name": "Trần Thái Sơn",
      "title": "TranVuQuangTruong_PhieuDangKyKLTN",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1736837016/DocShare/Documents/TranVuQuangTruong_PhieuDangKyKLTN_ujerzj.jpg",
      "like_count": 0,
      "is_public": false
    },
    {
      "document_id": 458480220,
      "full_name": "Trần Thái Sơn",
      "title": "TH_Buoi03",
      "thumbnail_url": "https://res.cloudinary.com/brandocloud/image/upload/v1741590330/DocShare/Documents/TH_Buoi03_bu51md.jpg",
      "like_count": 0,
      "is_public": true
    }
  ];
  return (
    <div>
      <DocumentList documents={documents}/>
    </div>
  )
}

export default Home