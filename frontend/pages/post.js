import React, { useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/Post.module.css'

const Post = () => {
    useEffect(() => {
        // 初始化 AOS
        if (typeof window !== 'undefined') {
            const AOS = require('aos');
            AOS.init();
        }
    }, []);

    return (
        <div className={styles.container}>
            <Head>
                <title>Post - adultbeauty@erossuccess.com</title>
                <link rel="shortcut icon" href="/images/favicon.png" />
                <link rel="stylesheet" href="/css/vendor/aos.css?ver=2023102401" />
                <link rel="stylesheet" href="/css/vendor/owl.carousel.css?ver=2023100726" />
                <link rel="stylesheet" href="/css/main.css?ver=2023102401" />
            </Head>
            <header>
                <div className="header-div">
                    <div className="outer-div">
                        <div className="links">
                            <Link href="/">
                                <a className="home">HOME</a>
                            </Link>
                        </div>
                        <div className="brand">
                            <Link href="/">
                                <a>
                                    <img src="/images/adult_beauty.svg" alt="Adult Beauty" />
                                </a>
                            </Link>
                        </div>
                        <div className="links">
                            <Link href="#">
                                <a className="account">MY ACCOUNT</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main>
                <section className="section-post">
                    <div className="block-post">
                        <div className="outer-div">
                            <div className="box-div">
                                <h2>Post</h2>
                                <div className="form-div">
                                    <div className="item">
                                        <div className="label">
                                            <h3>文章名稱</h3>
                                        </div>
                                        <div className="controller">
                                            <input type="text" placeholder="輸入文字" />
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="label">
                                            <h3>文章內容</h3>
                                        </div>
                                        <div className="controller">
                                            <textarea placeholder="輸入文字"></textarea>
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="label">
                                            <h3>文章類別</h3>
                                        </div>
                                        <div className="controller">
                                            <div className="checkbox-list">
                                                <div className="sub-item">
                                                    <label className="checkbox-container">
                                                        衛教知識
                                                        <input type="checkbox" />
                                                    </label>
                                                </div>
                                                <div className="sub-item">
                                                    <label className="checkbox-container">
                                                        樂趣玩法
                                                        <input type="checkbox" />
                                                    </label>
                                                </div>
                                                <div className="sub-item">
                                                    <label className="checkbox-container">
                                                        經驗分享
                                                        <input type="checkbox" />
                                                    </label>
                                                </div>
                                                <div className="sub-item">
                                                    <label className="checkbox-container">
                                                        其他
                                                        <input type="checkbox" />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="label">
                                            <h3>文章內容</h3>
                                        </div>
                                        <div className="controller">
                                            <div className="upload-list">
                                                <div className="sub-item">
                                                    <div className="box">
                                                        <div className="img">
                                                            <img src="/images/detail_img_01.png" alt="Detail Image 01" />
                                                        </div>
                                                        <button className="btn-close"></button>
                                                    </div>
                                                </div>
                                                <div className="sub-item">
                                                    <div className="box">
                                                        <div className="img">
                                                            <img src="/images/detail_img_01.png" alt="Detail Image 02" />
                                                        </div>
                                                        <button className="btn-close"></button>
                                                    </div>
                                                </div>
                                                <div className="sub-item">
                                                    <div className="box">
                                                        <div className="img">
                                                            <img src="/images/detail_img_01.png" alt="Detail Image 03" />
                                                        </div>
                                                        <button className="btn-close"></button>
                                                    </div>
                                                </div>
                                                <div className="sub-item">
                                                    <div className="box">
                                                        <div className="img">
                                                            <img src="/images/detail_img_01.png" alt="Detail Image 04" />
                                                        </div>
                                                        <button className="btn-close"></button>
                                                    </div>
                                                </div>
                                                <div className="sub-item">
                                                    <div className="box">
                                                        <div className="img">
                                                            <img src="/images/detail_img_01.png" alt="Detail Image 05" />
                                                        </div>
                                                        <button className="btn-close"></button>
                                                    </div>
                                                </div>
                                                <div className="sub-item">
                                                    <div className="box img-upload">
                                                        <input type="file" onChange={() => { /* 處理檔案上傳 */ }} />
                                                        <div className="img">
                                                            <img id="upload01" src="/images/detail_img_01.png" alt="Upload Image" />
                                                        </div>
                                                        <button className="btn-close"></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="item action">
                                        <button className="btn-review">預覽</button>
                                        <button type="submit" className="btn-submit">Submit</button>
                                        <button type="reset" className="btn-cancel">取消</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="block-contact">
                        <div className="outer-div">
                            <div className="title">
                                <img src="/images/footer_title_contact.svg" alt="Contact Title" />
                            </div>
                            <div className="info">
                                <p>adultbeauty@erossuccess.com</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <div className="overlay"></div>
            <script src="/js/jquery.min.js"></script>
            <script src="/js/aos.js?ver=2023102401"></script>
            <script src="/js/owl.carousel.js?ver=2023100726"></script>
            <script src="/js/script.js?ver=2023102401"></script>
            <script>
                {`AOS.init();`}
            </script>
        </div>
    )
}

export default Post 