import React from "react";

function FooterComponent() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-10">
      <div className="mx-auto max-w-[1280px] text-center">
        <a
          href="/"
          className="flex items-center justify-center font-display text-2xl font-bold tracking-[-0.03em] text-ink"
        >
          <img className="h-8" alt="DocShare Logo" src="/docshare-logo.png" />
          DocShare
        </a>
        <p className="my-6 text-sm text-ink-secondary">
          Dự án học tập chia sẻ tài liệu PDF của người dùng
        </p>
        <ul className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-ink-secondary">
          <li>
            <a href="/" className="hover:text-primary">
              About
            </a>
          </li>
          <li>
            <a href="/" className="hover:text-primary">
              Premium
            </a>
          </li>
          <li>
            <a href="/" className="hover:text-primary">
              Campaigns
            </a>
          </li>
          <li>
            <a href="/" className="hover:text-primary">
              Blog
            </a>
          </li>
          <li>
            <a href="/" className="hover:text-primary">
              Affiliate Program
            </a>
          </li>
          <li>
            <a href="/" className="hover:text-primary">
              FAQs
            </a>
          </li>
          <li>
            <a href="/" className="hover:text-primary">
              Contact
            </a>
          </li>
        </ul>
        <span className="text-sm text-neutral sm:text-center">
          © 2025{" "}
          <a href="/" className="hover:text-primary">
            T.V.Q.Trường
          </a>
          . All Rights Reserved.
        </span>
      </div>
    </footer>
  );
}

export default FooterComponent;
