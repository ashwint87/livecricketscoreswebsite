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
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SaAsh Techs | All rights reserved.</p>
      </div>
    </footer>
  );
}
