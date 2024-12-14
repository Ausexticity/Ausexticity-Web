import React, { useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/Login.module.css'

const Login = () => {
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
                <title>Login - adultbeauty@erossuccess.com</title>
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
                <section className="section-login">
                    <div className="block-login">
                        <div className="outer-div">
                            <div className="block-01">
                                <h2>Login</h2>
                                <div className="form-div">
                                    <div className="item">
                                        <input type="text" placeholder="User Name" />
                                    </div>
                                    <div className="item">
                                        <input type="password" placeholder="Password" />
                                    </div>
                                    <div className="item forgot">
                                        <Link href="/forgot_password">
                                            <a>Forgot Password</a>
                                        </Link>
                                    </div>
                                    <div className="item action">
                                        <button>Sign In</button>
                                    </div>
                                    <div className="item remark">
                                        Didn’t have any account? <Link href="/signup"><a>Sign Up here</a></Link>
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

export default Login 