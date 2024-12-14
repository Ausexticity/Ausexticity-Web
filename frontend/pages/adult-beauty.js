import React, { useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/AdultBeauty.module.css'

const AdultBeauty = () => {
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
                <title>Adult Beauty - adultbeauty@erossuccess.com</title>
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
                <section className="section-adult-beauty">
                    <div className="block-adult-beauty">
                        <div className="outer-div">
                            <div className="block-01">
                                <div className="owl-carousel owl-theme owl-welcome-banner">
                                    <div
                                        className="item"
                                        style={{ backgroundImage: 'url(/images/pexels-aryane-vilarim-2869078-2.png)' }}
                                    >
                                        <img src="/images/detail_banner_transparent.gif" alt="Banner" />
                                        <div className="info">
                                            <img src="/images/welcome.svg" alt="Welcome" />
                                        </div>
                                    </div>
                                    <div
                                        className="item"
                                        style={{ backgroundImage: 'url(/images/pexels-aryane-vilarim-2869078-2.png)' }}
                                    >
                                        <img src="/images/detail_banner_transparent.gif" alt="Banner" />
                                        <div className="info">
                                            <img src="/images/welcome.svg" alt="Welcome" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="block-02">
                                <h2>黃 懿 萱</h2>
                                <div className="link-lists">
                                    <div className="item">
                                        <a href="#">
                                            <img src="/images/link_article.svg" alt="Article Link" />
                                            <h3>點我看文章</h3>
                                        </a>
                                    </div>
                                    <div className="item">
                                        <a href="#">
                                            <img src="/images/link_medical_education.svg" alt="Medical Education Link" />
                                            <h3>成大醫學衛教</h3>
                                        </a>
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

export default AdultBeauty 