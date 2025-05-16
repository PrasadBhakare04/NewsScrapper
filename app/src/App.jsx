import { Routes, Route, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { motion } from 'framer-motion';

// Pages
function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3000/');
    socket.on('getNews', (news) => {
      setNews(news);
      setLoading(false);
    });
    socket.on('error', (error) => {
      setError(error);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading News</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <motion.div className="news-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="app-header">
        <h1>Latest News</h1>
        <p className="subtitle">Stay updated with the latest headlines</p>
      </header>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading latest news...</p>
        </div>
      ) : (
        <div className="news-grid">
          {Array.isArray(news) && news.length > 0 ? (
            news.map((article) => (
              <article key={uuid()} className="news-card">
                <div className="news-image-container">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="news-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image">No Image Available</div>
                  )}
                </div>
                <div className="news-content">
                  <h2 className="news-title">{article.title}</h2>
                  <p className="news-description">{article.description}</p>
                  <div className="news-meta">
                    <span className="news-source">{article.source_id}</span>
                    <span className="news-date">
                      {new Date(article.pubDate).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more"
                  >
                    Read More
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="no-news">
              <h2>No News Available</h2>
              <p>Please try again later</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    setError('');
    if (type === 'signup') {
      // Sign up: POST /api/user/profile
      try {
        const res = await fetch('http://localhost:8080/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        });
        if (!res.ok) {
          throw new Error('Sign up failed');
        }
        const data = await res.json();
        setUser(data);
        setIsLoggedIn(true);
      } catch (err) {
        setError('Sign up failed. Try a different email.');
      }
    } else {
      // Sign in: POST /api/user/login
      try {
        const res = await fetch('http://localhost:8080/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        if (!res.ok) {
          throw new Error('Invalid credentials');
        }
        const data = await res.json();
        setUser(data);
        setIsLoggedIn(true);
      } catch (err) {
        setError('Invalid email or password.');
      }
    }
  };

  if (isLoggedIn) {
    return (
      <motion.div className="profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="app-header">
          <h1>Welcome, {user?.username || 'User'}!</h1>
          <p className="subtitle">Manage your profile and preferences</p>
        </header>
        <div className="profile-container">
          <div className="news-section">
            <h2>Your News Feed</h2>
            <p>Your personalized news feed will appear here.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="app-header">
        <h1>Welcome to RealKhabr</h1>
        <p className="subtitle">{showSignup ? 'Create an account to get started' : 'Sign in to your account'}</p>
      </header>
      <div className="profile-container">
        <div className="auth-forms" style={{maxWidth: 400, margin: '0 auto'}}>
          {!showSignup ? (
            <form className="auth-form" onSubmit={(e) => handleSubmit(e, 'signin')}>
              <div className="auth-error">{error || ''}</div>
              <h2>Sign In</h2>
              <div className="form-group">
                <label htmlFor="signin-email">Email</label>
                <input
                  type="email"
                  id="signin-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signin-password">Password</label>
                <input
                  type="password"
                  id="signin-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className="auth-button">Sign In</button>
              <div style={{marginTop: '1rem', textAlign: 'center'}}>
                <span style={{color: '#666'}}>Don't have an account?{' '}
                  <button type="button" style={{background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 600}} onClick={() => setShowSignup(true)}>Sign up</button>
                </span>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={(e) => handleSubmit(e, 'signup')}>
              <div className="auth-error">{error || ''}</div>
              <h2>Sign Up</h2>
              <div className="form-group">
                <label htmlFor="signup-username">Username</label>
                <input
                  type="text"
                  id="signup-username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  type="password"
                  id="signup-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className="auth-button">Sign Up</button>
              <div style={{marginTop: '1rem', textAlign: 'center'}}>
                <span style={{color: '#666'}}>Already have an account?{' '}
                  <button type="button" style={{background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 600}} onClick={() => setShowSignup(false)}>Sign in</button>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NotFound() {
  return (
    <motion.div className="notfound-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="app-header">
        <h1>404</h1>
        <p className="subtitle">Page Not Found</p>
      </header>
    </motion.div>
  );
}

export default function App() {
  return (
    <div className="app-container vibrant-bg">
      <nav className="navbar">
        <NavLink to="/" className="nav-logo">
          <span>Realkhabr</span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Profile</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
