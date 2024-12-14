import React, { useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const Home = () => {
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
                <title>adultbeauty@erossuccess.com</title>
                <link rel="shortcut icon" href="/images/favicon.png" />
                <link rel="stylesheet" href="/css/vendor/aos.css?ver=2023102401" />
                <link rel="stylesheet" href="/css/vendor/owl.carousel.css?ver=2023100726" />
                <link rel="stylesheet" href="/css/main.css?ver=2023102401" />
            </Head>
            <header>
                <div className="header-div">
                    <div className="outer-div">
                        <div className="brand">
                            <Link href="/">
                                <a>
                                    <img src="/images/header_logo.svg" alt="Header Logo" />
                                    <img src="/images/adult_beauty.svg" alt="Adult Beauty" />
                                </a>
                            </Link>
                        </div>
                        <div className="links">
                            <Link href="/login">
                                <a className="login">LOGIN</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main>
                <section className="section-home-banner">
                    <div className="outer-div">
                        <div className="owl-carousel owl-theme owl-home-banner">
                            <div className="item">
                                <div className="two-cols">
                                    <div className="col01">
                                        <div
                                            className="img"
                                            style={{ backgroundImage: 'url(/images/pexels-aryane-vilarim-2869078-1.png)' }}
                                        >
                                            <img src="/images/home_news_transparent.gif" alt="News" />
                                        </div>
                                    </div>
                                    <div className="col02">
                                        <a href="#">
                                            <h1>NEWS</h1>
                                            <p>內文內文內文內文 內文內文內文</p>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="item">
                                <div className="two-cols">
                                    <div className="col01">
                                        <div
                                            className="img"
                                            style={{ backgroundImage: 'url(/images/pexels-aryane-vilarim-2869078-1.png)' }}
                                        >
                                            <img src="/images/home_news_transparent.gif" alt="News" />
                                        </div>
                                    </div>
                                    <div className="col02">
                                        <a href="#">
                                            <h1>NEWS</h1>
                                            <p>內文內文內文內文 內文內文內文</p>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="section-home-search-news">
                    <div className="block-01">
                        <div className="outer-div">
                            <div className="two-cols">
                                <div className="col01">
                                    <img src="/images/home_img_01.svg" alt="Home Image 01" />
                                </div>
                                <div className="col02">
                                    <div className="links">
                                        <div className="item">
                                            <div className="action">
                                                <Link href="/search">
                                                    <a>Search</a>
                                                </Link>
                                            </div>
                                            <div className="info">
                                                <h3>一鍵SEARCH讓你到達</h3>
                                                <p>大家都在問</p>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="info">
                                                <h3>好 康 在 這 裡</h3>
                                            </div>
                                            <div className="action">
                                                <Link href="/promotions">
                                                    <a>點我看好康</a>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="block-02">
                        <div className="outer-div">
                            <h2>讓 Dr.告 訴 你</h2>
                            <div className="new-lists">
                                <div className="item">
                                    <Link href="/article_detail">
                                        <a><span>標題標題標題標題標題標題標題</span></a>
                                    </Link>
                                </div>
                                <div className="item">
                                    <Link href="/article_detail">
                                        <a><span>標題標題標題標題標題標題標題</span></a>
                                    </Link>
                                </div>
                                <div className="item">
                                    <Link href="/article_detail">
                                        <a><span>標題標題標題標題標題標題標題</span></a>
                                    </Link>
                                </div>
                                <div className="item">
                                    <Link href="/article_detail">
                                        <a><span>標題標題標題標題標題標題標題</span></a>
                                    </Link>
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

export default Home 