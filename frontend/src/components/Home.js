import React from 'react';
import { useNavigate } from 'react-router-dom';
import Rankings from './home/Rankings';
import News from './home/News.js';
import FeaturedMatches from './home/FeaturedMatches.js';
import Teams from './home/Teams.js';
import Players from './home/Players';
import Series from './home/Series';
import Videos from './home/Videos';
import './css/Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-section">
        <FeaturedMatches navigate={navigate} />
        <Series />
        <Rankings />
        <Videos />
        <Teams />
        <News />
        <Players />
      </div>
    </div>
  );
};

export default Home;
