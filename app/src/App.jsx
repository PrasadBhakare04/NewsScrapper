import { useEffect, useState, useRef } from 'react';
import './App.css';
import { motion } from 'framer-motion';
import { FaBars, FaUserCircle } from 'react-icons/fa';

const NEWS_CATEGORIES = [
  'World', 'Business', 'Technology', 'Sports', 'Entertainment', 'Health', 'Science', 'Politics', 'Travel', 'Food'
];

function Header({ onCategorySelect, selectedCategory, showCategories, setShowCategories, isLoggedIn, onProfileClick, showProfileMenu, setShowProfileMenu, onLogout, onSignInClick }) {
  const profileMenuRef = useRef();
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, setShowProfileMenu]);

  return (
    <nav className="navbar">
      <button className="categories-toggle" onClick={() => setShowCategories(v => !v)}>
        <FaBars size={22} />
        <span className="nav-logo-text">Realkhabr</span>
      </button>
      {showCategories && (
        <div className="categories-dropdown">
          {NEWS_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-chip${selectedCategory === cat ? ' selected' : ''}`}
              onClick={() => { onCategorySelect(cat); setShowCategories(false); }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <div style={{marginLeft: 'auto'}}>
        {!isLoggedIn ? (
          <button className="auth-button" style={{padding: '0.5em 1.2em', fontSize: '1rem'}} onClick={onSignInClick}>Sign In</button>
        ) : (
          <div className="profile-avatar-container" ref={profileMenuRef}>
            <button className="icon-btn" onClick={() => setShowProfileMenu(v => !v)} title="Profile">
              <FaUserCircle size={28} />
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <button className="dropdown-item" onClick={onProfileClick}>Profile</button>
                <button className="dropdown-item">Settings</button>
                <button className="dropdown-item" onClick={onLogout}>Log Out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(NEWS_CATEGORIES[0]);
  const [showCategories, setShowCategories] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileSection, setShowProfileSection] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Always fetch news for selected category
  useEffect(() => {
    setNewsLoading(true);
    setNewsError('');
    fetch(`http://localhost:3000/news?category=${encodeURIComponent(selectedCategory)}`)
      .then(res => res.json())
      .then(data => {
        setNews(Array.isArray(data) ? data : (data.results || []));
        setNewsLoading(false);
      })
      .catch(err => {
        setNews([]);
        setNewsError('Failed to load news.');
        setNewsLoading(false);
      });
  }, [selectedCategory]);

  // Auth handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e, type) => {
    e.preventDefault();
    setError('');
    if (type === 'signup') {
      try {
        const res = await fetch('http://localhost:8081/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        });
        if (!res.ok) throw new Error('Sign up failed');
        const data = await res.json();
        setUser(data);
        setIsLoggedIn(true);
        setShowAuthModal(false);
      } catch {
        setError('Sign up failed. Try a different email.');
      }
    } else {
      try {
        const res = await fetch('http://localhost:8081/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        if (!res.ok) throw new Error('Invalid credentials');
        const data = await res.json();
        setUser(data);
        setIsLoggedIn(true);
        setShowAuthModal(false);
      } catch {
        setError('Invalid email or password.');
      }
    }
  };

  // Log out handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setShowProfileMenu(false);
    setShowProfileSection(false);
  };

  // Main content logic
  return (
    <div className="app-container vibrant-bg">
      <Header
        onCategorySelect={cat => setSelectedCategory(cat)}
        selectedCategory={selectedCategory}
        showCategories={showCategories}
        setShowCategories={setShowCategories}
        isLoggedIn={isLoggedIn}
        onProfileClick={() => setShowProfileSection(true)}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        onLogout={handleLogout}
        onSignInClick={() => setShowAuthModal(true)}
      />
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <motion.div className="auth-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <header className="app-header">
              <h1>Welcome to RealKhabr</h1>
              <p className="subtitle">{showSignup ? 'Create an account to get started' : 'Sign in to your account'}</p>
            </header>
            <div className="profile-container">
              <div className="auth-forms" style={{maxWidth: 400, margin: '0 auto'}}>
                {!showSignup ? (
                  <form className="auth-form" onSubmit={e => handleSubmit(e, 'signin')}>
                    <div className="auth-error">{error || ''}</div>
                    <h2>Sign In</h2>
                    <div className="form-group">
                      <label htmlFor="signin-email">Email</label>
                      <input type="email" id="signin-email" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="signin-password">Password</label>
                      <input type="password" id="signin-password" name="password" value={formData.password} onChange={handleInputChange} required />
                    </div>
                    <button type="submit" className="auth-button">Sign In</button>
                    <div style={{marginTop: '1rem', textAlign: 'center'}}>
                      <span style={{color: '#666'}}>Don't have an account?{' '}
                        <button type="button" style={{background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 600}} onClick={() => setShowSignup(true)}>Sign up</button>
                      </span>
                    </div>
                  </form>
                ) : (
                  <form className="auth-form" onSubmit={e => handleSubmit(e, 'signup')}>
                    <div className="auth-error">{error || ''}</div>
                    <h2>Sign Up</h2>
                    <div className="form-group">
                      <label htmlFor="signup-username">Username</label>
                      <input type="text" id="signup-username" name="username" value={formData.username} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="signup-email">Email</label>
                      <input type="email" id="signup-email" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="signup-password">Password</label>
                      <input type="password" id="signup-password" name="password" value={formData.password} onChange={handleInputChange} required />
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
        </div>
      )}
      {showProfileSection && isLoggedIn && (
        <motion.div className="profile-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="profile-card">
            <h2>Profile</h2>
            <div><b>Username:</b> {user?.username}</div>
            <div><b>Email:</b> {user?.email}</div>
            <button className="auth-button" style={{marginTop: 16}} onClick={() => setShowProfileSection(false)}>Back to News</button>
          </div>
        </motion.div>
      )}
      <motion.div className="home-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="profile-container">
          <h2 style={{marginBottom: 24}}>Welcome{user ? `, ${user.username}` : ''}!</h2>
          <div className="news-section">
            <h3>{selectedCategory} News</h3>
            {newsLoading ? (
              <div style={{textAlign:'center', color:'#888'}}>Loading...</div>
            ) : newsError ? (
              <div style={{textAlign:'center', color:'#ff6b6b'}}>{newsError}</div>
            ) : (
              <div className="news-grid">
                {news.map(article => (
                  <div className="news-card" key={article.link || article.id}>
                    <h4 className="news-title">{article.title}</h4>
                    <p className="news-description">{article.description || article.content || ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
