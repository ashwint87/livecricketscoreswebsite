import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import googlePlayBadge from './images/google-play-store-badge.png';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-main">
        <div className="footer-column important-links">
          <h4>Important Links</h4>
          <Link to="/schedule">Schedule</Link>
          <Link to="/series">Series</Link>
          <Link to="/news">News</Link>
          <Link to="/rankings">Rankings</Link>
          <Link to="/player">Players</Link>
          <Link to="/teams">Teams</Link>
          <Link to="/stadiums">Stadiums</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
        <div className="footer-column footer-apps">
          <h4>Download our app on</h4>
          <div className="app-badges">
            <a
              href="https://play.google.com/store/apps/details?id=com.cricbud.android"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={googlePlayBadge}
                alt="Google Play"
                style={{ height: '30px' }}
              />
            </a>
          </div>
          <h4>Follow us on</h4>
          <div className="social-icons">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-x-twitter"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SaAsh Techs | All rights reserved.</p>
      </div>
    </footer>
  );
}
